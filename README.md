# Personalized News Aggregator

A full-stack news app that ingests stories from multiple providers, ranks content for each user, and provides a modern feed experience.

## Stack

- Backend: Fastify, Prisma, PostgreSQL, JWT auth, scheduled ingestion workers
- Frontend: Next.js App Router, React, Tailwind CSS
- Testing: Playwright end-to-end smoke/auth flows

## Repository Layout

- `backend` - API server, DB schema, ingestion workers
- `frontend` - web app UI and E2E tests

## Quick Start

## 1) Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Set values in `.env`, then run:

```bash
npm run db:migrate
npm run dev
```

Backend default URL: `http://localhost:3001`

## 2) Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend URL: `http://localhost:3000`

## 3) Open app

- Landing: `http://localhost:3000/`
- Personalized feed: `http://localhost:3000/for-you`

## Scripts

## Backend (`backend/package.json`)

- `npm run dev` - start backend with file watch
- `npm start` - start backend
- `npm run db:migrate` - run Prisma migrations
- `npm run db:generate` - generate Prisma client
- `npm run db:studio` - open Prisma Studio

## Frontend (`frontend/package.json`)

- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint frontend
- `npm run e2e` - run Playwright tests
- `npm run e2e:headed` - run Playwright in headed mode

## Documentation

- Backend guide: `backend/README.md`
- Frontend guide: `frontend/README.md`
- API reference: `backend/API_DOCUMENTATION.md`

## CI/CD (GitHub Actions)

Two workflows are included:

- `.github/workflows/ci.yml`: runs on PRs and pushes to `main`
  - Backend: install deps, generate Prisma client, syntax check
  - Frontend: install deps, lint, build
- `.github/workflows/deploy.yml`: runs on push to `main` (and manual trigger)
  - Deploy frontend to Vercel
  - Trigger backend deploy via Render deploy hook

Configure these GitHub repository secrets before enabling CD:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RENDER_DEPLOY_HOOK_URL`

Suggested hosting:

- Frontend: Vercel
- Backend: Render (Web Service)
- Database: Neon Postgres

## Troubleshooting

- If frontend API calls fail with connection errors, ensure backend runs on port `3001` and frontend `.env.local` has:
  - `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`
- If backend startup fails with `EADDRINUSE` on port `3001`, stop the process using that port or set a different `PORT` in `backend/.env`.
- If frontend reports port `3000` in use, Next.js will automatically choose the next available port (for example `3001`).
- If a provider image fails to load, card falls back to placeholder automatically.
- If ingestion hits rate limits (e.g. Currents 429), wait for quota reset or reduce polling frequency.
- If Render startup fails with Prisma advisory lock timeout (`P1002`), increase retry env vars on backend service:
  - `MIGRATE_MAX_ATTEMPTS`
  - `MIGRATE_RETRY_DELAY_MS`
