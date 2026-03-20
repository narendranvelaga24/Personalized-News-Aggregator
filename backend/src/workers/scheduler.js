const cron = require('node-cron');
const { fetchCurrents } = require('./currents');
const { fetchGNews } = require('./gnews');
const { syncAllFeedbinUsers } = require('./feedbin');

/**
 * Registers all background ingestion crons and runs an initial fetch on startup.
 *
 * Schedule:
 *   Currents  — every 15 min (keeps within stricter free-tier limits)
 *   GNews     — every 7 min  (100 req/day free; 7-min gives ~200 req/day, use cautiously)
 *   Feedbin   — every 20 min per-user (rate respectful to their server)
 *
 *   NewsData  — NOT scheduled here. It is called on-demand:
 *               • POST /admin/ingest/newsdata (manual trigger)
 *               • Or via fetchNewsDataForPreferences(prefs) in a future
 *                 user-triggered flow. See workers/newsdata.js for rationale.
 *
 * ⚠️ MVP limitation: all jobs run in-process with node-cron. For production,
 * consider moving to a separate worker process with a Redis-backed job queue
 * (e.g. BullMQ) so ingestion doesn't compete with API request handling and
 * jobs survive server restarts (idempotent re-runs via known-articles table).
 */
function startScheduler() {
  console.log('[Scheduler] Starting ingestion schedules...');

  // Every 15 minutes: Currents
  cron.schedule('*/15 * * * *', async () => {
    await fetchCurrents().catch(err => console.error('[Scheduler:Currents]', err.message));
  });

  // Every 7 minutes: GNews
  cron.schedule('*/7 * * * *', async () => {
    await fetchGNews().catch(err => console.error('[Scheduler:GNews]', err.message));
  });

  // Every 20 minutes: Feedbin per-user
  cron.schedule('*/20 * * * *', async () => {
    await syncAllFeedbinUsers().catch(err => console.error('[Scheduler:Feedbin]', err.message));
  });

  console.log('[Scheduler] Registered: Currents(15min), GNews(7min), Feedbin(20min).');
  console.log('[Scheduler] NewsData: on-demand only (see /admin/ingest/newsdata or workers/newsdata.js).');

  // Initial fetch 3s after startup — avoids blocking server boot
  setTimeout(async () => {
    console.log('[Scheduler] Running initial ingest...');
    await Promise.allSettled([
      fetchCurrents(),
      fetchGNews(),
      syncAllFeedbinUsers(),
    ]);
    console.log('[Scheduler] Initial ingest complete.');
  }, 3000);
}

module.exports = { startScheduler };
