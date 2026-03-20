# Personalized News Aggregator API Documentation

## Overview
This document describes the backend HTTP API for the Personalized News Aggregator app.

- Runtime: Fastify (Node.js)
- Auth: JWT bearer token for user routes
- Admin auth: static `X-Admin-Token` header for ingest routes
- Default local base URL: `http://localhost:3001`
- Frontend proxy base URL: `/api` (frontend forwards to backend)

Health check:
- `GET /health`

---

## Authentication Model

### User JWT (Bearer token)
After successful register/login, the API returns:

```json
{
  "token": "<jwt>",
  "userId": "<user-id>"
}
```

Send the token in authenticated requests:

```http
Authorization: Bearer <jwt>
```

### Admin token
Admin ingest endpoints are protected by a static secret header:

```http
X-Admin-Token: <ADMIN_TOKEN>
```

This is separate from user JWT auth.

---

## Response and Error Conventions

### Success
- Most write endpoints return:

```json
{ "ok": true }
```

- Collection endpoints commonly return:

```json
{
  "page": 1,
  "limit": 20,
  "articles": []
}
```

### Common status codes
- `200` OK
- `201` Created
- `400` Validation or malformed input
- `401` Unauthorized (missing/invalid JWT)
- `403` Forbidden (missing/invalid admin token)
- `404` Resource not found
- `409` Conflict (duplicate email)

Validation errors are returned from Zod flatten output shape, for example:

```json
{
  "error": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Invalid email"]
    }
  }
}
```

---

## Data Shapes

### Source
```json
{
  "id": "src_123",
  "provider": "gnews",
  "providerSourceId": "optional-provider-id",
  "name": "Example Source",
  "url": "https://example.com",
  "country": "us",
  "language": "en",
  "category": "technology",
  "createdAt": "2026-03-20T09:00:00.000Z"
}
```

### Article
```json
{
  "id": "art_123",
  "canonicalUrl": "https://example.com/story",
  "title": "Story title",
  "description": "Summary",
  "content": "Optional full text",
  "imageUrl": "https://example.com/image.jpg",
  "author": "Author Name",
  "publishedAt": "2026-03-20T08:00:00.000Z",
  "sourceId": "src_123",
  "provider": "currents",
  "rawPayload": {},
  "tags": ["ai", "startup"],
  "createdAt": "2026-03-20T08:01:00.000Z",
  "source": {
    "id": "src_123",
    "name": "Example Source",
    "provider": "currents"
  },
  "_score": 12.34,
  "_avgScore": 7.2
}
```

Notes:
- `_score` appears in personalized feed responses.
- `_avgScore` appears in trending feed responses.
- Some nullable fields may be `null`.

### Preferences
```json
{
  "id": "pref_123",
  "userId": "user_123",
  "preferredLanguages": ["en"],
  "preferredCategories": ["technology"],
  "preferredSources": ["TechCrunch"],
  "preferredKeywords": ["ai", "robotics"],
  "blockedKeywords": ["celebrity"],
  "country": "us",
  "updatedAt": "2026-03-20T09:30:00.000Z"
}
```

---

## Endpoints

## 1) Health

### GET /health
Returns service health and timestamp.

Auth: none

Response `200`:
```json
{
  "status": "ok",
  "timestamp": "2026-03-20T09:30:00.000Z"
}
```

---

## 2) Auth

### POST /auth/register
Create a user and return JWT.

Auth: none

Request body:
```json
{
  "email": "user@example.com",
  "password": "min-8-characters"
}
```

Response `201`:
```json
{
  "token": "<jwt>",
  "userId": "<user-id>"
}
```

Errors:
- `400` invalid email/password
- `409` email already registered

### POST /auth/login
Authenticate user and return JWT.

Auth: none

Request body:
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response `200`:
```json
{
  "token": "<jwt>",
  "userId": "<user-id>"
}
```

Errors:
- `400` invalid request body
- `401` invalid credentials

---

## 3) Feed

### GET /feed/home
Personalized feed. Scored per user preferences and user article state.

Auth: required (Bearer JWT)

Query params:
- `page` (optional, default `1`)
- `limit` (optional, default `20`)
- `refresh` (optional, `true|false`, default `false`)

Notes:
- When `refresh=true`, backend triggers on-demand Currents + GNews fetch before querying feed results.
- Refresh wait is bounded (about 10s timeout) so responses are not blocked indefinitely.

Response `200`:
```json
{
  "page": 1,
  "limit": 20,
  "articles": [
    {
      "id": "art_123",
      "title": "...",
      "provider": "gnews",
      "source": { "id": "src_1", "name": "Source", "provider": "gnews" },
      "_score": 15.2
    }
  ]
}
```

### GET /feed/latest
Most recent articles. No personalization.

Auth: none

Query params:
- `page` (optional, default `1`)
- `limit` (optional, default `20`)
- `refresh` (optional, `true|false`, default `false`)

Notes:
- When `refresh=true`, backend triggers on-demand Currents + GNews fetch before returning latest items.

Response `200`: same paging shape with `articles`.

### GET /feed/trending
Articles ranked by average user score.

Auth: none

Query params:
- `page` (optional, default `1`)
- `limit` (optional, default `20`)

Response `200`:
```json
{
  "page": 1,
  "limit": 20,
  "articles": [
    {
      "id": "art_123",
      "title": "...",
      "_avgScore": 8.4,
      "source": { "id": "src_1", "name": "Source", "provider": "currents" }
    }
  ]
}
```

### GET /feed/search
Simple substring search (not full-text search).

Auth: none

Query params:
- `q` (required)
- `page` (optional, default `1`)
- `limit` (optional, default `20`)

Response `200`:
```json
{
  "page": 1,
  "limit": 20,
  "q": "ai",
  "searchType": "substring",
  "articles": []
}
```

Errors:
- `400` when `q` is missing or blank

### GET /feed/sources
List all known sources sorted by name.

Auth: none

Response `200`:
```json
{
  "sources": [
    {
      "id": "src_1",
      "provider": "feedbin",
      "providerSourceId": "123",
      "name": "Example Feed",
      "url": "https://example.com",
      "country": "us",
      "language": "en",
      "category": "technology",
      "createdAt": "2026-03-20T09:00:00.000Z"
    }
  ]
}
```

---

## 4) Articles and Saved State

### GET /articles/:id
Get one article by ID.

Auth: none

Response `200`: article object (includes `source`)

Errors:
- `404` article not found

### POST /articles/:id/read
Mark article as read for current user.

Auth: required (Bearer JWT)

Response `200`:
```json
{ "ok": true }
```

Errors:
- `404` article not found

### POST /articles/:id/hide
Hide article for current user.

Auth: required (Bearer JWT)

Response `200`:
```json
{ "ok": true }
```

### POST /saved/:articleId
Save article for current user.

Auth: required (Bearer JWT)

Response `201`:
```json
{ "ok": true }
```

Errors:
- `404` article not found

### DELETE /saved/:articleId
Unsave article for current user.

Auth: required (Bearer JWT)

Response `200`:
```json
{ "ok": true }
```

### GET /saved
Get current user's saved articles.

Auth: required (Bearer JWT)

Response `200`:
```json
{
  "articles": [
    {
      "id": "art_123",
      "title": "Saved story",
      "source": { "id": "src_1", "name": "Source", "provider": "gnews" }
    }
  ]
}
```

---

## 5) Preferences

### GET /preferences
Get current user's preferences.

Auth: required (Bearer JWT)

Response `200`: preferences object

Errors:
- `404` when no preferences record exists

### POST /preferences
Create or update preferences.

Auth: required (Bearer JWT)

Request body (all fields optional):
```json
{
  "preferredLanguages": ["en"],
  "preferredCategories": ["technology"],
  "preferredSources": ["The Verge"],
  "preferredKeywords": ["ai", "edge"],
  "blockedKeywords": ["rumor"],
  "country": "us"
}
```

Response `200`: updated preferences object

Notes:
- Score recomputation is triggered asynchronously after update.

Errors:
- `400` invalid payload shape

---

## 6) Feedbin Integration

### POST /feeds/feedbin/connect
Store encrypted Feedbin credentials and trigger initial sync.

Auth: required (Bearer JWT)

Request body:
```json
{
  "feedbinEmail": "user@example.com",
  "feedbinPassword": "your-feedbin-password"
}
```

Response `201`:
```json
{
  "ok": true,
  "message": "Feedbin connected. Initial sync started."
}
```

Errors:
- `400` invalid email/password

### POST /feeds/feedbin/sync
Trigger manual sync for current user.

Auth: required (Bearer JWT)

Response `200`:
```json
{
  "ok": true,
  "message": "Feedbin sync started."
}
```

Errors:
- `404` if user has not connected Feedbin yet

### GET /feeds/feedbin/status
Get Feedbin connection state.

Auth: required (Bearer JWT)

Response `200` (not connected):
```json
{ "connected": false }
```

Response `200` (connected):
```json
{
  "connected": true,
  "feedbinEmail": "user@example.com",
  "lastSyncAt": "2026-03-20T09:30:00.000Z"
}
```

---

## 7) Admin Ingest Endpoints

All endpoints in this section require `X-Admin-Token`.

### POST /admin/ingest/currents
Trigger Currents ingestion asynchronously.

Auth: required (`X-Admin-Token`)

Response `200`:
```json
{
  "ok": true,
  "message": "Currents ingest started"
}
```

### POST /admin/ingest/gnews
Trigger GNews ingestion asynchronously.

Auth: required (`X-Admin-Token`)

Response `200`:
```json
{
  "ok": true,
  "message": "GNews ingest started"
}
```

### POST /admin/ingest/newsdata
Trigger NewsData ingestion asynchronously.

Auth: required (`X-Admin-Token`)

Request body (all optional):
```json
{
  "keywords": "ai robotics",
  "category": "technology",
  "language": "en",
  "country": "us"
}
```

Response `200`:
```json
{
  "ok": true,
  "message": "NewsData ingest started"
}
```

Errors:
- `403` when admin token is missing or invalid

### POST /admin/test/articles
Insert two synthetic test articles. Useful in local development to verify refresh/loading behavior without waiting for upstream providers.

Auth: required (`X-Admin-Token`)

Response `200`:
```json
{
  "ok": true,
  "message": "Created 2 test articles",
  "articles": [
    { "id": "art_1", "title": "Breaking: Test Article ..." },
    { "id": "art_2", "title": "Latest: Another Test Post ..." }
  ]
}
```

Errors:
- `400` creation/validation failure
- `403` when admin token is missing or invalid

---

## Background Scheduling Notes
The backend starts ingestion scheduler on boot:

- Currents: every 15 minutes
- GNews: every 7 minutes
- Feedbin sync all users: every 20 minutes
- NewsData: not globally scheduled (manual/on-demand)

---

## Environment Variables (Backend)
Required variables:

- `DATABASE_URL`
- `JWT_SECRET` (minimum 32 chars)
- `FEEDBIN_ENCRYPTION_KEY` (base64-encoded 32-byte key)
- `ADMIN_TOKEN` (shared admin secret)
- `CURRENTS_API_KEY`
- `GNEWS_API_KEY`
- `NEWSDATA_API_KEY`
- `PORT` (default `3001`)
- `NODE_ENV` (default `development`)

See `.env.example` for sample values.

---

## Quick cURL Examples

### Register
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Personalized feed
```bash
curl "http://localhost:3001/feed/home?page=1&limit=20" \
  -H "Authorization: Bearer <jwt>"
```

### Personalized feed with on-demand refresh
```bash
curl "http://localhost:3001/feed/home?page=1&limit=20&refresh=true" \
  -H "Authorization: Bearer <jwt>"
```

### Update preferences
```bash
curl -X POST http://localhost:3001/preferences \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"preferredCategories":["technology"],"preferredKeywords":["ai"]}'
```

### Admin ingest
```bash
curl -X POST http://localhost:3001/admin/ingest/gnews \
  -H "X-Admin-Token: <admin-token>"
```
