const axios = require('axios');
const prisma = require('../db');
const { normalize, dedupKey } = require('../lib/normalizer');
const { decrypt } = require('../lib/crypto');
const { upsertArticles } = require('./currents');
const env = require('../env');

/**
 * Syncs Feedbin subscriptions and entries for a given user.
 * Uses HTTP Basic auth and ETag caching.
 * @param {string} userId
 */
async function syncFeedbinForUser(userId) {
  const account = await prisma.feedbinAccount.findUnique({ where: { userId } });
  if (!account) return;

  const feedbinEmail = account.feedbinEmail;
  const feedbinPassword = decrypt(account.feedbinPasswordEncrypted, env.FEEDBIN_ENCRYPTION_KEY);

  const auth = {
    username: feedbinEmail,
    password: feedbinPassword,
  };

  console.log(`[Feedbin] Syncing user ${userId}...`);

  try {
    // Fetch subscriptions
    const subsResp = await axios.get('https://api.feedbin.com/v2/subscriptions.json', {
      auth,
      timeout: 15000,
    });

    const subscriptions = subsResp.data || [];
    console.log(`[Feedbin] ${subscriptions.length} subscriptions`);

    // Upsert each subscription as a source
    for (const sub of subscriptions) {
      await prisma.source.upsert({
        where: { provider_providerSourceId: { provider: 'feedbin', providerSourceId: String(sub.feed_id) } },
        create: {
          provider: 'feedbin',
          providerSourceId: String(sub.feed_id),
          name: sub.title || sub.site_url || `Feed ${sub.feed_id}`,
          url: sub.site_url,
        },
        update: {
          name: sub.title || sub.site_url,
        },
      });
    }

    // Fetch recent entries using ETag caching
    const headers = {};
    if (account.lastEtag) headers['If-None-Match'] = account.lastEtag;

    const entriesResp = await axios.get('https://api.feedbin.com/v2/entries.json', {
      auth,
      headers,
      params: { per_page: 100 },
      timeout: 20000,
      validateStatus: s => [200, 304].includes(s),
    });

    if (entriesResp.status === 304) {
      console.log('[Feedbin] No new entries (304 Not Modified)');
    } else {
      const entries = entriesResp.data || [];
      const newEtag = entriesResp.headers['etag'] || null;
      console.log(`[Feedbin] ${entries.length} entries`);

      await upsertArticles(entries, 'feedbin');

      await prisma.feedbinAccount.update({
        where: { userId },
        data: { lastSyncAt: new Date(), lastEtag: newEtag },
      });
    }
  } catch (err) {
    if (err.response?.status === 401) {
      console.error(`[Feedbin] Invalid credentials for user ${userId}`);
    } else {
      console.error(`[Feedbin] Error for user ${userId}:`, err.message);
    }
  }
}

/**
 * Sync all Feedbin accounts.
 */
async function syncAllFeedbinUsers() {
  const accounts = await prisma.feedbinAccount.findMany();
  for (const acc of accounts) {
    await syncFeedbinForUser(acc.userId);
  }
}

module.exports = { syncFeedbinForUser, syncAllFeedbinUsers };
