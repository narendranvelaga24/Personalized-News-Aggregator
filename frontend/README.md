# Frontend Documentation

Next.js frontend for Personalized News Aggregator.

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

App runs at: `http://localhost:3000`

If port `3000` is occupied, Next.js will auto-select another port (shown in terminal output).

## Environment

The frontend API client calls the backend directly using a public runtime variable.

Required variable in `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

Production value example:

```bash
NEXT_PUBLIC_BACKEND_URL=https://personalized-news-aggregator-7rv1.onrender.com
```

## Main Routes

- `/` - marketing landing page
- `/for-you` - personalized feed (authenticated)
- `/latest` - latest stories
- `/trending` - trending stories
- `/search` - article search
- `/saved` - saved stories (authenticated)
- `/settings` - preferences (authenticated)
- `/login`, `/register` - auth pages

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - lint source
- `npm run e2e` - run Playwright E2E tests
- `npm run e2e:headed` - run Playwright in headed mode

## Testing

E2E tests are in:

- `tests/smoke.spec.ts`
- `tests/auth-flow.spec.ts`

Playwright config path:

- `playwright.config.ts`
