const prisma = require('../db');

// ---------------------------------------------------------------------------
// Scoring weights — kept as named constants so they're easy to tune.
// ---------------------------------------------------------------------------
const W = {
  KEYWORD_MATCH:        3,   // Title contains a preferred keyword
  KEYWORD_BLOCKED:    -10,   // Title contains a blocked keyword
  CATEGORY_MATCH:       2,   // Article tag matches preferred category
  SOURCE_MATCH:         2,   // Article from a preferred source
  UNREAD_BOOST:         1,   // Article not yet read by this user
  SAVED_BOOST:          5,   // Article saved (signals strong interest)
  HIDDEN_PENALTY:     -20,   // Article hidden (hard filter in feed, but also scored low)
  RECENCY_DECAY_RATE: 0.1,   // Points lost per hour after the 24h freshness window
  RECENCY_MAX_DECAY:  10,    // Cap on recency decay penalty
  FRESH_SOURCE_BONUS:  1,    // Source has published in the last 2 hours
  DIVERSITY_PENALTY:  -2,    // Applied when same source appears >3 times in top-50
};

/**
 * Computes a personalization score for a given article against one user's preferences.
 *
 * Factors (in decreasing importance):
 *  - Blocked keyword match → hard negative (-10 per match, no cap)
 *  - Hidden state → hard negative (-20)
 *  - Saved state → strong positive (+5)
 *  - Preferred keyword match → positive (+3 per match)
 *  - Preferred category match → positive (+2 per match)
 *  - Preferred source → positive (+2)
 *  - Fresh source (published <2h ago) → bonus (+1)
 *  - Unread → small positive (+1)
 *  - Recency decay → negative after 24h (-0.1/hr, capped at -10)
 *
 * Source diversity is enforced at the feed level, not here.
 *
 * @param {object} article - Prisma Article (with optional .source relation)
 * @param {object|null} prefs - UserPreference, or null if not set
 * @param {object|null} state - UserArticleState, or null if never interacted
 * @returns {number} score (unbounded, higher = more relevant)
 */
function computeScore(article, prefs, state) {
  let score = 0;

  // User behavior (applies even without prefs)
  if (state) {
    if (state.isHidden) score += W.HIDDEN_PENALTY;
    if (state.isSaved) score += W.SAVED_BOOST;
    if (!state.isRead) score += W.UNREAD_BOOST;
  } else {
    score += W.UNREAD_BOOST; // new articles are unread by default
  }

  if (!prefs) return score;

  const titleLower = (article.title || '').toLowerCase();
  const tags = (article.tags || []).map(t => t.toLowerCase());

  // Blocked keywords — these dominate
  for (const kw of (prefs.blockedKeywords || [])) {
    if (titleLower.includes(kw.toLowerCase())) score += W.KEYWORD_BLOCKED;
  }

  // Preferred keywords
  for (const kw of (prefs.preferredKeywords || [])) {
    if (titleLower.includes(kw.toLowerCase())) score += W.KEYWORD_MATCH;
  }

  // Preferred categories (from tags)
  for (const cat of (prefs.preferredCategories || [])) {
    if (tags.includes(cat.toLowerCase())) score += W.CATEGORY_MATCH;
  }

  // Preferred source name
  if (article.source && (prefs.preferredSources || []).includes(article.source.name)) {
    score += W.SOURCE_MATCH;
  }

  // Source freshness bonus — article from a very recent publication (<2h)
  if (article.publishedAt) {
    const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / 3_600_000;
    if (ageHours < 2) {
      score += W.FRESH_SOURCE_BONUS;
    }
    // Recency decay after 24h
    if (ageHours > 24) {
      score -= Math.min((ageHours - 24) * W.RECENCY_DECAY_RATE, W.RECENCY_MAX_DECAY);
    }
  }

  return score;
}

/**
 * Applies a source-diversity penalty to an already-scored, sorted article list.
 * If any single source appears more than `maxPerSource` times in the first
 * `windowSize` results, every excess article from that source gets a penalty.
 *
 * This is called at the feed level, after scoring, to prevent one outlet
 * from flooding the personalized feed.
 *
 * @param {Array} scoredArticles - Articles sorted by _score descending, each with .source
 * @param {object} options
 * @param {number} [options.maxPerSource=3] - Max articles per source before penalty
 * @param {number} [options.windowSize=50]  - How many top articles to check
 * @returns {Array} Same array with _score possibly adjusted, re-sorted
 */
function applyDiversityPenalty(scoredArticles, { maxPerSource = 3, windowSize = 50 } = {}) {
  const sourceCounts = {};
  const result = scoredArticles.map((article, i) => {
    if (i >= windowSize) return article;
    const name = article.source?.name || article.sourceName || '__unknown';
    sourceCounts[name] = (sourceCounts[name] || 0) + 1;
    if (sourceCounts[name] > maxPerSource) {
      return { ...article, _score: article._score + W.DIVERSITY_PENALTY };
    }
    return article;
  });
  // Re-sort after adjustments
  return result.sort((a, b) => b._score - a._score);
}

/**
 * Computes and upserts scores for all articles for a given user.
 * Called asynchronously after preference updates — not on the hot path.
 *
 * @param {string} userId
 */
async function recomputeScoresForUser(userId) {
  const [prefs, articles] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId } }),
    prisma.article.findMany({ include: { source: true }, take: 500 }),
  ]);

  const states = await prisma.userArticleState.findMany({ where: { userId } });
  const stateMap = {};
  for (const s of states) stateMap[s.articleId] = s;

  const upserts = articles.map(article => {
    const state = stateMap[article.id] || null;
    const score = computeScore(article, prefs, state);
    return prisma.userArticleState.upsert({
      where: { userId_articleId: { userId, articleId: article.id } },
      create: { userId, articleId: article.id, score },
      update: { score },
    });
  });

  await Promise.all(upserts);
  console.log(`[Scorer] Recomputed scores for user ${userId} across ${articles.length} articles`);
}

module.exports = { computeScore, recomputeScoresForUser, applyDiversityPenalty, W };
