const { z } = require('zod');
const prisma = require('../db');
const { recomputeScoresForUser } = require('../lib/scorer');

const prefsSchema = z.object({
  preferredLanguages: z.array(z.string()).optional(),
  preferredCategories: z.array(z.string()).optional(),
  preferredSources: z.array(z.string()).optional(),
  preferredKeywords: z.array(z.string()).optional(),
  blockedKeywords: z.array(z.string()).optional(),
  country: z.string().optional(),
});

async function preferencesRoutes(fastify) {
  const authed = { preHandler: [fastify.authenticate] };

  // GET /preferences
  fastify.get('/preferences', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const prefs = await prisma.userPreference.findUnique({ where: { userId } });
    if (!prefs) return reply.status(404).send({ error: 'No preferences found' });
    return reply.send(prefs);
  });

  // POST /preferences (create or update)
  fastify.post('/preferences', { ...authed }, async (request, reply) => {
    const userId = request.user.userId;
    const parsed = prefsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const data = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) data[k] = v;
    }

    const prefs = await prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    // Async score recomputation — don't await so response is fast
    recomputeScoresForUser(userId).catch(err =>
      console.error('[Scorer] Recompute error:', err.message)
    );

    return reply.send(prefs);
  });
}

module.exports = preferencesRoutes;
