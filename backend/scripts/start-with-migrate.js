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

let dbHost = 'unknown';
try {
  dbHost = new URL(resolvedDbUrl).host;
} catch {
  // Keep unknown if URL parsing fails.
}

console.log(`[startup] Using database host: ${dbHost}`);

console.log('[startup] Running prisma migrate deploy...');
const migrate = spawnSync('npx', ['prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts'], {
  stdio: 'inherit',
  env: process.env,
  timeout: 120000,
});

if (migrate.error) {
  if (migrate.error.code === 'ETIMEDOUT') {
    console.error('[startup] Migration timed out after 120s. Check DB connectivity / SSL settings.');
  } else {
    console.error(`[startup] Migration process error: ${migrate.error.message}`);
  }
  process.exit(1);
}

if (migrate.status !== 0) {
  if (migrate.signal) {
    console.error(`[startup] Migration terminated by signal ${migrate.signal}`);
  }
  console.error(`[startup] Migration failed with exit code ${migrate.status}`);
  process.exit(migrate.status || 1);
}

console.log('[startup] Starting API server...');
const server = spawnSync('node', ['src/index.js'], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(server.status || 0);
