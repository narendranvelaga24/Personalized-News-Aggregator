const axios = require('axios');
const { upsertArticles } = require('./currents');
const env = require('../env');

/**
 * Fetches articles from NewsData API.
 *
 * This worker is intentionally NOT called on a global cron schedule.
 * Reasons:
 *   1. The NewsData free tier has a hard daily request cap.
 *   2. A generic global pull produces low-relevance results for most users.
 *   3. It is better to fetch against a specific preference profile.
 *
 * Usage patterns (choose based on quota):
 *   A. On-demand: call when a user opens the app and their feed is stale.
 *   B. Per-profile batch: call once per unique preference fingerprint and cache.
 *   C. Topic cron: call a few times/day for the N most popular topic clusters.
 *
 * The scheduler (`scheduler.js`) does NOT register a cron for this worker.
 * Call it explicitly from the /admin/ingest/newsdata route or from a future
 * per-user preference-driven trigger.
 *
 * @param {object} options - { keywords, category, language, country }
 */
async function fetchNewsData(options = {}) {
  console.log('[NewsData] Fetching with options:', options);
  try {
    const params = {
      apikey: env.NEWSDATA_API_KEY,
      language: options.language || 'en',
    };
    if (options.keywords) params.q = options.keywords;
    if (options.category) params.category = options.category;
    if (options.country) params.country = options.country;

    const resp = await axios.get('https://newsdata.io/api/1/news', {
      params,
      timeout: 15000,
    });

    const articles = resp.data?.results || [];
    console.log(`[NewsData] Fetched ${articles.length} articles`);
    await upsertArticles(articles, 'newsdata');
    return articles.length;
  } catch (err) {
    console.error('[NewsData] Error:', err.message);
    return 0;
  }
}

/**
 * Fetches NewsData articles tailored to a user's preference profile.
 * Derives keywords and category from the stored UserPreference.
 *
 * @param {import('@prisma/client').UserPreference} prefs
 */
async function fetchNewsDataForPreferences(prefs) {
  if (!prefs) return;
  const keywords = (prefs.preferredKeywords || []).slice(0, 5).join(' ');
  const category = (prefs.preferredCategories || [])[0] || undefined;
  const language = (prefs.preferredLanguages || ['en'])[0];
  const country = prefs.country || undefined;
  await fetchNewsData({ keywords: keywords || undefined, category, language, country });
}

module.exports = { fetchNewsData, fetchNewsDataForPreferences };
