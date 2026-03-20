const axios = require('axios');
const prisma = require('../db');
const { normalize, dedupKey } = require('../lib/normalizer');
const env = require('../env');

/**
 * Fetches latest news from Currents API and upserts into DB.
 */
async function fetchCurrents() {
  console.log('[Currents] Starting fetch...');
  try {
    const resp = await axios.get('https://api.currentsapi.services/v1/latest-news', {
      params: {
        apiKey: env.CURRENTS_API_KEY,
        language: 'en',
        page_size: 200,
      },
      timeout: 15000,
    });

    const articles = resp.data?.news || [];
    console.log(`[Currents] Fetched ${articles.length} articles`);

    await upsertArticles(articles, 'currents');
  } catch (err) {
    if (err.response?.status === 429) {
      const retryAfter = err.response.headers?.['retry-after'];
      console.warn(
        `[Currents] Rate limited (429).${retryAfter ? ` Retry after ${retryAfter}s.` : ''}`
      );
      return;
    }
    console.error('[Currents] Error:', err.message);
  }
}

async function upsertArticles(rawArticles, provider) {
  let saved = 0;
  for (const raw of rawArticles) {
    try {
      const norm = normalize(raw, provider);
      const canonicalUrl = dedupKey(norm);
      if (!canonicalUrl) continue;

      // Ensure source exists
      let source = null;
      if (norm.sourceName) {
        source = await prisma.source.upsert({
          where: { provider_providerSourceId: { provider, providerSourceId: norm.sourceName } },
          create: { provider, providerSourceId: norm.sourceName, name: norm.sourceName },
          update: {},
        });
      }

      await prisma.article.upsert({
        where: { canonicalUrl },
        create: {
          canonicalUrl,
          title: norm.title,
          description: norm.summary,
          content: norm.content,
          imageUrl: norm.imageUrl,
          publishedAt: norm.publishedAt,
          provider,
          sourceId: source?.id || null,
          tags: norm.tags,
          rawPayload: norm.rawPayload,
        },
        update: {
          title: norm.title,
          description: norm.summary,
          imageUrl: norm.imageUrl,
        },
      });
      saved++;
    } catch (e) {
      // Skip duplicates and invalid articles silently
    }
  }
  console.log(`[${provider}] Saved ${saved} articles`);
}

module.exports = { fetchCurrents, upsertArticles };
