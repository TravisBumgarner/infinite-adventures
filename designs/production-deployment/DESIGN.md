# Production Deployment — Infinite Adventures

## Overview

Deploy the infinite-adventures app to Heroku with production-grade infrastructure: AWS CDK infra package for S3 (dev + prod), Heroku PostgreSQL, Cloudflare Turnstile, rate limiting, CSP headers, PostHog analytics (replacing Sentry), CI/CD, and an alpha banner.

## Current State

- **Database**: PostgreSQL 16 via Docker Compose (local only, port 5434)
- **Photo storage**: Local disk (`uploads/photos/`) via Multer memory storage + Sharp processing
- **Auth**: Supabase (optional in dev, no bot protection)
- **Security**: No rate limiting, no Turnstile, no CSP headers, CORS wide open
- **Error tracking**: Sentry (both frontend and backend) — to be replaced with PostHog
- **Analytics**: None
- **Deployment**: None — no Procfile, Dockerfile, app.json, or CI/CD
- **Frontend serving**: Vite dev server only, not served from Express in production
- **Infrastructure**: No infra package, no AWS resources

## What Needs to Be Built

### 1. Infra Package (AWS CDK)

New `infra/` workspace package following the just-recordings pattern. Provisions S3 resources for both dev and production environments.

**Resources to provision:**

**S3 Storage Bucket** (`infinite-adventures-<environment>`):
- Private (block all public access)
- S3-managed encryption
- Versioning enabled
- SSL enforced
- CORS: PUT + GET from allowed origins (localhost for dev, production URL for prod)
- Exposed headers: `ETag`
- Lifecycle: abort incomplete multipart uploads after 24 hours
- Server access logging to logs bucket
- Removal policy: RETAIN

**S3 Logs Bucket** (`infinite-adventures-logs-<environment>`):
- Private, encrypted, SSL enforced
- 90-day log retention lifecycle
- Removal policy: RETAIN

**IAM Runtime User** (`infinite-adventures-s3-<environment>`):
- Minimal S3 permissions: PutObject, GetObject, DeleteObject
- Access key output as CloudFormation outputs (AccessKeyId, SecretAccessKey, BucketName, Region)

**Budget & Cost Controls:**
- $100/month budget with alerts at $5, $10, $15, $20, $25
- Cost kill switch: auto-deny S3 access at $100 spend
- SNS topic for billing alerts with email subscriber

**Package structure:**
```
infra/
├── bin/infra.ts
├── lib/storage-stack.ts
├── cdk.json
├── package.json
└── tsconfig.json
```

**Scripts:** deploy/diff/synth/destroy for dev and production, all using `--profile infinite-adventures`.

### 2. S3 Photo Storage with Presigned URLs

Replace local disk storage with S3. Used in both dev and production — no local disk fallback.

**New backend dependencies:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`

**New backend config vars:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`

**Remove:** `UPLOADS_DIR` from config

**New S3 client (`backend/src/lib/s3.ts`):**
- `generatePresignedPutUrl(key, contentType)` — 15 min expiry
- `generatePresignedGetUrl(key)` — 1 hour expiry
- `deleteObject(key)`, `getObject(key)`

**Updated photo flow:**
1. Client → `POST /api/items/:itemId/photos/presign` → gets `{ uploadUrl, key, photoId }`
2. Client → PUT file to S3 via presigned URL
3. Client → `POST /api/items/:itemId/photos/confirm` → backend downloads from S3, processes blurhash, creates DB record

**Remove:** Multer, local file storage, `uploads/` directory usage

### 3. Heroku Deployment Config

- `Procfile` with `web` and `release` commands
- `app.json` with env vars, `heroku-postgresql` add-on, buildpack
- Root `build:heroku` and `heroku-postbuild` scripts
- Serve frontend static files from Express in production (SPA fallback)
- `FRONTEND_URL` for CORS, `DATABASE_SSL_REJECT_UNAUTHORIZED` for Heroku Postgres

### 4. Replace Sentry with PostHog

Remove all Sentry integration and replace with PostHog for both error tracking and analytics.

**Remove:**
- `@sentry/node` from backend
- `@sentry/react` from frontend
- Sentry.init() calls in `backend/src/index.ts` and `frontend/src/main.tsx`
- Sentry error handler in `backend/src/index.ts`
- Sentry imports in both logger files

**Add backend (`posthog-node`):**
- Config vars: `POSTHOG_API_KEY`, `POSTHOG_HOST`
- Initialize PostHog client
- Update `backend/src/lib/logger.ts`: replace Sentry calls with PostHog capture
- Add shutdown hook to flush PostHog on process exit

**Add frontend (`posthog-js`):**
- Config vars: `VITE_POSTHOG_API_KEY`, `VITE_POSTHOG_HOST`
- Initialize PostHog in `main.tsx`
- Update `frontend/src/lib/logger.ts`: replace Sentry calls with PostHog capture
- Page view tracking via React Router integration
- User identification on login

### 5. CSP Headers (Helmet)

Add `helmet` middleware to Express for security headers including Content Security Policy.

- `helmet()` with CSP directives appropriate for the app (allow Supabase, PostHog, Cloudflare Turnstile origins)
- Disable `X-Powered-By`

### 6. Rate Limiting

`express-rate-limit` with three tiers:
- `standardRateLimit`: 100 req/min per user
- `strictRateLimit`: 30 req/min per user
- `publicRateLimit`: 60 req/min per IP

Trust proxy enabled for Heroku.

### 7. Cloudflare Turnstile

**Backend:** Middleware to verify `cf-turnstile-token` header against Cloudflare API.
**Frontend:** Component to render widget, pass token on requests.
Apply to unauthenticated/public routes.

### 8. CI/CD (GitHub Actions)

**Test + Lint workflow** (on PR):
- Run `npm test` and `npx biome check .`
- Node 22.x, PostgreSQL service container for backend tests

**Deploy workflow** (manual trigger or on merge to main):
- Build and push to Heroku via `git push heroku`

### 9. Alpha Banner

MUI `Chip` with label "Alpha" in `TopBar.tsx`, always visible.
