const prisma = require('../db');

async function articlesRoutes(fastify) {
  const authed = { preHandler: [fastify.authenticate] };

  // GET /articles/:id
  fastify.get('/articles/:id', async (request, reply) => {
    const article = await prisma.article.findUnique({
      where: { id: request.params.id },
      include: { source: true },
    });
    if (!article) return reply.status(404).send({ error: 'Article not found' });
    return reply.send(article);
  });

  // POST /articles/:id/read
  fastify.post('/articles/:id/read', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const articleId = request.params.id;

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return reply.status(404).send({ error: 'Article not found' });

    await prisma.userArticleState.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId, isRead: true },
      update: { isRead: true },
    });

    return reply.send({ ok: true });
  });

  // POST /saved/:articleId
  fastify.post('/saved/:articleId', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const articleId = request.params.articleId;

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return reply.status(404).send({ error: 'Article not found' });

    await prisma.userArticleState.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId, isSaved: true },
      update: { isSaved: true },
    });

    return reply.status(201).send({ ok: true });
  });

  // DELETE /saved/:articleId
  fastify.delete('/saved/:articleId', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const articleId = request.params.articleId;

    await prisma.userArticleState.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId, isSaved: false },
      update: { isSaved: false },
    });

    return reply.send({ ok: true });
  });

  // POST /articles/:id/hide
  fastify.post('/articles/:id/hide', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const articleId = request.params.id;

    await prisma.userArticleState.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId, isHidden: true },
      update: { isHidden: true },
    });

    return reply.send({ ok: true });
  });

  // GET /saved — get all saved articles for authenticated user
  fastify.get('/saved', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const states = await prisma.userArticleState.findMany({
      where: { userId, isSaved: true },
      include: { article: { include: { source: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return reply.send({ articles: states.map(s => s.article) });
  });
}

module.exports = articlesRoutes;
