require('dotenv').config();
const { spawnSync } = require('node:child_process');

const MIGRATE_MAX_ATTEMPTS = Number(process.env.MIGRATE_MAX_ATTEMPTS || 4);
const MIGRATE_RETRY_DELAY_MS = Number(process.env.MIGRATE_RETRY_DELAY_MS || 6000);

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

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

let migrateSucceeded = false;
for (let attempt = 1; attempt <= MIGRATE_MAX_ATTEMPTS; attempt += 1) {
  console.log(`[startup] Running prisma migrate deploy (attempt ${attempt}/${MIGRATE_MAX_ATTEMPTS})...`);
  const migrate = spawnSync('npx', ['prisma', 'migrate', 'deploy', '--config', 'prisma.config.js'], {
    stdio: 'pipe',
    env: process.env,
    timeout: 120000,
    encoding: 'utf8',
  });

  if (migrate.stdout) process.stdout.write(migrate.stdout);
  if (migrate.stderr) process.stderr.write(migrate.stderr);

  if (migrate.error) {
    if (migrate.error.code === 'ETIMEDOUT') {
      console.error('[startup] Migration timed out after 120s. Check DB connectivity / SSL settings.');
    } else {
      console.error(`[startup] Migration process error: ${migrate.error.message}`);
    }
    process.exit(1);
  }

  if (migrate.status === 0) {
    migrateSucceeded = true;
    break;
  }

  const combinedOutput = `${migrate.stdout || ''}\n${migrate.stderr || ''}`;
  const advisoryLockTimeout = combinedOutput.includes('Timed out trying to acquire a postgres advisory lock');

  if (advisoryLockTimeout && attempt < MIGRATE_MAX_ATTEMPTS) {
    console.warn(`[startup] Advisory lock busy. Retrying in ${MIGRATE_RETRY_DELAY_MS}ms...`);
    sleep(MIGRATE_RETRY_DELAY_MS);
    continue;
  }

  if (migrate.signal) {
    console.error(`[startup] Migration terminated by signal ${migrate.signal}`);
  }
  console.error(`[startup] Migration failed with exit code ${migrate.status}`);
  process.exit(migrate.status || 1);
}

if (!migrateSucceeded) {
  console.error('[startup] Migration could not complete after retries.');
  process.exit(1);
}

console.log('[startup] Starting API server...');
const server = spawnSync('node', ['src/index.js'], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(server.status || 0);
