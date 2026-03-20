# Backend Documentation

Fastify + Prisma backend for Personalized News Aggregator.

## Run Locally

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Default local API base URL: `http://localhost:3001`

## Environment Variables

See `.env.example`.

Required keys:

- `DATABASE_URL`
- `JWT_SECRET`
- `FEEDBIN_ENCRYPTION_KEY`
- `ADMIN_TOKEN`
- `CURRENTS_API_KEY`
- `GNEWS_API_KEY`
- `NEWSDATA_API_KEY`
- `PORT` (default `3001`)
- `NODE_ENV`

## API

Detailed endpoint reference is available in:

- `API_DOCUMENTATION.md`

Recent additions:

- `GET /feed/home` and `GET /feed/latest` accept optional `refresh=true` to trigger on-demand provider fetch before returning results.
- `POST /admin/test/articles` creates synthetic articles for local testing (requires `X-Admin-Token`).

## Scheduler

Background jobs started by backend:

- Currents: every 15 minutes
- GNews: every 7 minutes
- Feedbin sync: every 20 minutes
- NewsData: on-demand only

## Data Model

Prisma schema path:

- `prisma/schema.prisma`

Core models:

- `User`
- `UserPreference`
- `Source`
- `Article`
- `UserArticleState`
- `FeedbinAccount`
