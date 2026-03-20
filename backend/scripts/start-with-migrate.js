require('dotenv').config();
const { spawnSync } = require('node:child_process');

// Normalize DB URL for Prisma/Prisma config across hosts.
const resolvedDbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!resolvedDbUrl) {
  console.error('[startup] Missing database URL. Set one of: DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL');
  process.exit(1);
}

process.env.DATABASE_URL = resolvedDbUrl;

console.log('[startup] Running prisma migrate deploy...');
const migrate = spawnSync('npx', ['prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts'], {
  stdio: 'inherit',
  env: process.env,
});

if (migrate.status !== 0) {
  console.error(`[startup] Migration failed with exit code ${migrate.status}`);
  process.exit(migrate.status || 1);
}

console.log('[startup] Starting API server...');
const server = spawnSync('node', ['src/index.js'], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(server.status || 0);
