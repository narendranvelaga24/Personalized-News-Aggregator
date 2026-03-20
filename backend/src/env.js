require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),

  // Must be a base64-encoded 32-byte key (44 base64 chars).
  // Generate with: openssl rand -base64 32
  // Validated at use-time in lib/crypto.js (loadKey checks decoded length === 32).
  FEEDBIN_ENCRYPTION_KEY: z.string().min(44),

  // Shared secret for admin ingest endpoints.
  // Generate with: openssl rand -hex 32
  ADMIN_TOKEN: z.string().min(32),

  CURRENTS_API_KEY: z.string().min(1),
  GNEWS_API_KEY: z.string().min(1),
  NEWSDATA_API_KEY: z.string().min(1),
  PORT: z.string().default('3001'),
  NODE_ENV: z.string().default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.format());
  process.exit(1);
}

module.exports = _env.data;
