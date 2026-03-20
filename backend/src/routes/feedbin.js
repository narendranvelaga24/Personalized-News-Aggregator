const { z } = require('zod');
const prisma = require('../db');
const { encrypt } = require('../lib/crypto');
const { syncFeedbinForUser } = require('../workers/feedbin');
const env = require('../env');

const connectSchema = z.object({
  feedbinEmail: z.string().email(),
  feedbinPassword: z.string().min(1),
});

async function feedbinRoutes(fastify) {
  const authed = { preHandler: [fastify.authenticate] };

  // POST /feeds/feedbin/connect — store encrypted credentials and kick off first sync
  fastify.post('/feeds/feedbin/connect', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const parsed = connectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { feedbinEmail, feedbinPassword } = parsed.data;
    const encryptedPassword = encrypt(feedbinPassword, env.FEEDBIN_ENCRYPTION_KEY);

    await prisma.feedbinAccount.upsert({
      where: { userId },
      create: { userId, feedbinEmail, feedbinPasswordEncrypted: encryptedPassword },
      update: { feedbinEmail, feedbinPasswordEncrypted: encryptedPassword, lastEtag: null, lastSyncAt: null },
    });

    // Kick off first sync asynchronously
    syncFeedbinForUser(userId).catch(err =>
      console.error('[Feedbin] Initial sync error:', err.message)
    );

    return reply.status(201).send({ ok: true, message: 'Feedbin connected. Initial sync started.' });
  });

  // POST /feeds/feedbin/sync — manually trigger sync for authenticated user
  fastify.post('/feeds/feedbin/sync', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const account = await prisma.feedbinAccount.findUnique({ where: { userId } });
    if (!account) {
      return reply.status(404).send({ error: 'No Feedbin account connected. Use /feeds/feedbin/connect first.' });
    }

    syncFeedbinForUser(userId).catch(err =>
      console.error('[Feedbin] Manual sync error:', err.message)
    );

    return reply.send({ ok: true, message: 'Feedbin sync started.' });
  });

  // GET /feeds/feedbin/status — view connection status
  fastify.get('/feeds/feedbin/status', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const account = await prisma.feedbinAccount.findUnique({ where: { userId } });
    if (!account) return reply.send({ connected: false });
    return reply.send({
      connected: true,
      feedbinEmail: account.feedbinEmail,
      lastSyncAt: account.lastSyncAt,
    });
  });
}

module.exports = feedbinRoutes;
