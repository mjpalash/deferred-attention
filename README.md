# Deferred Attention

A personal “save it for later, with zero friction” inbox. This repository currently contains **Slice 0 only**: the deployable technical skeleton and its health/CI/CD checks. Product behavior starts in Slice 1.

See [`SPEC.md`](./SPEC.md) for the product specification and [`tests/features/slice-0.feature`](./tests/features/slice-0.feature) for the Slice 0 acceptance criteria.

## Slice 0 stack

- Next.js + TypeScript
- Vercel production hosting
- Supabase Postgres
- Vitest for focused unit tests
- GitHub Actions for pre-deploy validation, migrations, deployment, and post-deploy acceptance

The health endpoint is `GET /api/health`. It performs a **read-only** count query against `public.healthcheck`. The health endpoint never creates, updates, or deletes database data.

Healthy response:

```json
{
  "status": "ok",
  "database": {
    "status": "ok",
    "check": "healthcheck_count",
    "result": 1
  }
}
```

If the database query fails, the endpoint returns HTTP 503 with a generic response and no internal connection details.

## Local setup

1. Install Node.js 22 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local`.
5. Provision the database migration using Supabase CLI or the production pipeline.
6. Run `npm run dev`.
7. Open `http://localhost:3000/api/health`.

Useful commands:

```bash
npm run typecheck
npm test
npm run build
npm run check
```

To run the live acceptance test manually against a deployed environment:

```bash
ACCEPTANCE_BASE_URL=https://your-deployment.example npm run test:acceptance
```

## Secrets

Never commit real values from `.env.local`. `SUPABASE_SECRET_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix.

The GitHub production workflow needs these encrypted GitHub Actions secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Vercel itself needs these production environment variables for the running Next.js application:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

## Production pipeline

A push to `main` performs:

1. TypeScript validation, unit tests, and a production build.
2. Detection of changes under `supabase/migrations/`.
3. Supabase migration deployment only when migration files changed (or when manually dispatched).
4. Vercel production deployment.
5. Live acceptance testing against the deployed HTTPS health endpoint.
6. A red GitHub Actions run if any stage fails. There is deliberately **no automatic rollback** in Slice 0.

## Scope boundary

Slice 0 does not implement capture, inbox, Done/Keep, search, Android sharing, desktop capture, or the iOS fallback. Those are later slices defined in the build plan and product spec.
