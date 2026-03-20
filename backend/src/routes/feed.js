const prisma = require('../db');
const { computeScore, applyDiversityPenalty } = require('../lib/scorer');

async function feedRoutes(fastify) {
  const authed = { preHandler: [fastify.authenticate] };

  // Helper: trigger on-demand fetch and wait for completion with timeout
  const triggerFreshContent = async (waitForResults = true) => {
    try {
      const { fetchCurrents } = require('../workers/currents');
      const { fetchGNews } = require('../workers/gnews');
      
      if (waitForResults) {
        // Wait for fetches to complete (with 10s timeout)
        await Promise.race([
          Promise.allSettled([fetchCurrents(), fetchGNews()]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Refresh timeout')), 10000)
          ),
        ]);
        console.log('[feedRoutes] Refresh completed successfully');
      } else {
        // Non-blocking background fetch
        Promise.allSettled([fetchCurrents(), fetchGNews()]).catch(() => {});
      }
    } catch (err) {
      console.error('[feedRoutes] Error triggering refresh:', err.message);
    }
  };

  // GET /feed/home — personalized scored feed with source diversity
  fastify.get('/feed/home', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);
    const skip = (page - 1) * limit;
    const refresh = request.query.refresh === 'true';

    // If refresh requested, wait for workers to fetch fresh content
    if (refresh) {
      await triggerFreshContent(true);
    }

    const [prefs, articles, states] = await Promise.all([
      prisma.userPreference.findUnique({ where: { userId } }),
      prisma.article.findMany({
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
        take: 200, // over-fetch: score on this window, then paginate
      }),
      prisma.userArticleState.findMany({ where: { userId } }),
    ]);

    const stateMap = {};
    for (const s of states) stateMap[s.articleId] = s;

    // Score → filter hidden → sort
    let scored = articles
      .map(a => ({ ...a, _score: computeScore(a, prefs, stateMap[a.id] || null) }))
      .filter(a => !stateMap[a.id]?.isHidden)
      .sort((a, b) => b._score - a._score);

    // Apply source diversity penalty so no single outlet dominates the feed
    scored = applyDiversityPenalty(scored, { maxPerSource: 3, windowSize: 50 });

    const page_articles = scored.slice(skip, skip + limit);
    return reply.send({ page, limit, articles: page_articles });
  });

  // GET /feed/latest — most recent articles (no personalization, no auth required)
  fastify.get('/feed/latest', async (request, reply) => {
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);
    const refresh = request.query.refresh === 'true';

    // If refresh requested, wait for workers to fetch fresh content
    if (refresh) {
      await triggerFreshContent(true);
    }

    const articles = await prisma.article.findMany({
      include: { source: true },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return reply.send({ page, limit, articles });
  });

  // GET /feed/trending — ranked by average user score across all users
  fastify.get('/feed/trending', async (request, reply) => {
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);

    const trending = await prisma.userArticleState.groupBy({
      by: ['articleId'],
      _avg: { score: true },
      orderBy: { _avg: { score: 'desc' } },
      skip: (page - 1) * limit,
      take: limit,
    });

    const articleIds = trending.map(t => t.articleId);
    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      include: { source: true },
    });

    const articleMap = {};
    for (const a of articles) articleMap[a.id] = a;

    const result = trending
      .map(t => ({ ...articleMap[t.articleId], _avgScore: t._avg.score }))
      .filter(a => a.id);

    return reply.send({ page, limit, articles: result });
  });

  /**
   * GET /feed/search?q=
   *
   * ⚠️  IMPLEMENTATION NOTE:
   * This uses Prisma's `contains` (SQL ILIKE '%q%'). This is basic substring
   * matching, NOT full-text search. It has no stemming, no ranking, and will
   * do sequential scans on large tables.
   *
   * For real full-text search, migrate to one of:
   *   • PostgreSQL tsvector + GIN index (via Prisma raw query or migration)
   *   • A dedicated search index (MeiliSearch, Typesense, Elastic)
   *
   * This is intentionally kept simple for MVP. The response schema will not
   * change when FTS is added — only the query implementation.
   */
  fastify.get('/feed/search', async (request, reply) => {
    const q = (request.query.q || '').trim();
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);

    if (!q) return reply.status(400).send({ error: 'Query param q is required' });

    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tags: { has: q } },
        ],
      },
      include: { source: true },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return reply.send({
      page,
      limit,
      q,
      searchType: 'substring', // not full-text search — see comment above
      articles,
    });
  });

  // GET /feed/sources — list all known sources
  fastify.get('/feed/sources', async (request, reply) => {
    const sources = await prisma.source.findMany({ orderBy: { name: 'asc' } });
    return reply.send({ sources });
  });

  // POST /admin/test/articles — insert test articles (for debugging refresh)
  const adminGuard = { preHandler: [fastify.requireAdmin] };
  fastify.post('/admin/test/articles', adminGuard, async (request, reply) => {
    try {
      const testArticles = [
        {
          canonicalUrl: `https://example.com/test-${Date.now()}-1`,
          title: `Breaking: Test Article ${new Date().toLocaleTimeString()}`,
          description: "This is a test article to verify refresh functionality.",
          content: "Full content of test article.",
          imageUrl: null,
          provider: 'test',
          tags: ['test', 'refresh'],
          publishedAt: new Date(),
        },
        {
          canonicalUrl: `https://example.com/test-${Date.now()}-2`,
          title: `Latest: Another Test Post ${new Date().toLocaleTimeString()}`,
          description: "Verifying that new articles appear after refresh.",
          content: "More test content here.",
          imageUrl: null,
          provider: 'test',
          tags: ['test', 'demo'],
          publishedAt: new Date(),
        },
      ];

      const created = await Promise.all(
        testArticles.map(article =>
          prisma.article.create({ data: article })
        )
      );

      return reply.send({
        ok: true,
        message: `Created ${created.length} test articles`,
        articles: created.map(a => ({ id: a.id, title: a.title })),
      });
    } catch (err) {
      return reply.status(400).send({ error: err.message });
    }
  });
}

module.exports = feedRoutes;
