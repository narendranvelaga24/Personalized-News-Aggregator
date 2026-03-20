const Fastify = require('fastify');
require('./env'); // Validate env on startup

const env = require('./env');
const authRoutes = require('./routes/auth');
const feedRoutes = require('./routes/feed');
const articlesRoutes = require('./routes/articles');
const preferencesRoutes = require('./routes/preferences');
const feedbinRoutes = require('./routes/feedbin');
const { startScheduler } = require('./workers/scheduler');

async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development',
  });

  // CORS
  await app.register(require('@fastify/cors'), {
    origin: true,
    credentials: true,
  });

  // JWT plugin
  await app.register(require('@fastify/jwt'), {
    secret: env.JWT_SECRET,
  });

  /**
   * Decorator: verifies a valid JWT from the Authorization header.
   * Use as preHandler for user-authenticated routes.
   */
  app.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  /**
   * Decorator: verifies the static ADMIN_TOKEN shared secret.
   * Use as preHandler for admin-only endpoints.
   *
   * Clients must send:  X-Admin-Token: <value of ADMIN_TOKEN env var>
   *
   * This is intentionally a simple token check rather than a role field in the
   * User table. Rationale: admin operations (manual ingest) are internal tooling
   * used by the developer, not by end users. A shared secret is sufficient for
   * MVP and avoids a DB schema change.
   *
   * Production upgrade: replace with a role check on the JWT payload
   * (e.g. request.user.role === 'admin') after adding role to the User model.
   */
  app.decorate('requireAdmin', async function (request, reply) {
    const token = request.headers['x-admin-token'];
    if (!token || token !== env.ADMIN_TOKEN) {
      reply.status(403).send({ error: 'Forbidden: admin token required' });
    }
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // ------------------------------------------------------------------
  // Admin: manual ingest triggers
  // Protected by ADMIN_TOKEN header, not by user JWT.
  // Regular authenticated users cannot trigger these.
  // ------------------------------------------------------------------
  const adminGuard = { preHandler: [app.requireAdmin] };

  app.post('/admin/ingest/currents', adminGuard, async (_req, reply) => {
    const { fetchCurrents } = require('./workers/currents');
    fetchCurrents().catch(err => app.log.error('[admin/ingest/currents]', err.message));
    return reply.send({ ok: true, message: 'Currents ingest started' });
  });

  app.post('/admin/ingest/gnews', adminGuard, async (_req, reply) => {
    const { fetchGNews } = require('./workers/gnews');
    fetchGNews().catch(err => app.log.error('[admin/ingest/gnews]', err.message));
    return reply.send({ ok: true, message: 'GNews ingest started' });
  });

  app.post('/admin/ingest/newsdata', adminGuard, async (req, reply) => {
    const { fetchNewsData } = require('./workers/newsdata');
    const opts = req.body || {};
    fetchNewsData(opts).catch(err => app.log.error('[admin/ingest/newsdata]', err.message));
    return reply.send({ ok: true, message: 'NewsData ingest started' });
  });

  // User-facing routes
  await app.register(authRoutes);
  await app.register(feedRoutes);
  await app.register(articlesRoutes);
  await app.register(preferencesRoutes);
  await app.register(feedbinRoutes);

  return app;
}

async function main() {
  const app = await buildApp();
  startScheduler();
  const port = parseInt(env.PORT, 10);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 Server running on http://localhost:${port}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
