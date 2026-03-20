const axios = require('axios');
const { upsertArticles } = require('./currents');
const env = require('../env');

/**
 * Fetches top headlines and searches from GNews API.
 */
async function fetchGNews() {
  console.log('[GNews] Starting fetch...');
  try {
    // Top headlines
    const topResp = await axios.get('https://gnews.io/api/v4/top-headlines', {
      params: {
        apikey: env.GNEWS_API_KEY,
        lang: 'en',
        max: 100,
        nullable: 'description,content',
      },
      timeout: 15000,
    });

    const topArticles = topResp.data?.articles || [];
    console.log(`[GNews] Fetched ${topArticles.length} top headlines`);
    await upsertArticles(topArticles, 'gnews');

    // Search for trending tech / world news
    const searchResp = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        apikey: env.GNEWS_API_KEY,
        q: 'technology OR science OR world',
        lang: 'en',
        max: 100,
        nullable: 'description,content',
      },
      timeout: 15000,
    });

    const searchArticles = searchResp.data?.articles || [];
    console.log(`[GNews] Fetched ${searchArticles.length} search articles`);
    await upsertArticles(searchArticles, 'gnews');
  } catch (err) {
    console.error('[GNews] Error:', err.message);
  }
}

module.exports = { fetchGNews };
