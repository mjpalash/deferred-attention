# Deferred Attention — Current Architecture

This document describes the current technical design. For product behavior and constraints, see [`SPEC.md`](./SPEC.md). Historical decisions and learning belong under [`docs/reflections/`](./docs/reflections/).

## System shape

Deferred Attention is a single Next.js + TypeScript application deployed on Vercel, backed by Supabase Postgres and Supabase Auth.

```text
Browser / installed PWA
        │
        ├── normal inbox/manual capture
        │
        └── Android Web Share Target
                    │
                    v
              Next.js application
                    │
          authenticate / validate
                    │
                    v
             capture/domain logic
                    │
                    v
              Supabase Postgres
```

The same server-backed inbox is used across clients.

## Core design invariant: save first

Capture must keep the critical path small:

```text
receive content
  → authenticate
  → validate
  → persist
  → acknowledge
```

Metadata enrichment, preview generation, scraping, summaries, images, favicons, or other optional work must not be required for persistence to succeed.

Saving the same URL more than once is valid. Do not deduplicate by URL or text.

Exactly-once capture machinery should be added only if real use demonstrates a meaningful duplicate-save problem.

## Data model

The core persisted entity is an item owned by a user.

Conceptually an item contains:
- identity;
- `user_id`;
- optional URL;
- raw shared text;
- optional title/source/note metadata;
- lifecycle status (`inbox`, `done`, `kept`);
- created/updated timestamps.

The database schema and row-level security enforce user ownership. The inbox is server-backed rather than device-local.

## Authentication

Supabase Auth provides the user session.

Browser-facing auth uses:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only health/database administration uses:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

The secret key must never be exposed to browser code.

Pending shared content must survive the authentication flow so a logged-out share is not lost.

## Inbox behavior

The normal application shows the user's inbox items in reverse chronological order.

Items share the same model regardless of whether they were entered manually or received through Android sharing.

Current lifecycle operations include:
- create;
- mark Done;
- mark Keep.

## Android capture

The application exposes an installable web app manifest with an Android Web Share Target.

Current Android flow:

```text
source app
  → Share
  → Later
  → content is saved automatically
  → lightweight Saved state
  → user uses Android Back gesture/button
```

Choosing Later is the save action; there is no second Save confirmation.

A PWA cannot reliably dismiss itself like a native Android Activity after receiving a Web Share Target. Returning automatically to the originating app is therefore not part of the current PWA behavior.

## Deployment architecture

Production deployment is owned by GitHub Actions:

```text
push/merge to main
      ↓
typecheck + tests + repository checks + production build
      ↓
apply changed Supabase migrations
      ↓
deploy to Vercel production
      ↓
live acceptance check
```

Feature branches may be deployed by Vercel as Preview deployments for real-device/integration testing before merge.

Preview and Production are separate Vercel environments and each needs the runtime environment variables required by the application.

## Health contract

`GET /api/health` performs a read-only database-backed health check.

It must:
- return success when the application and database are healthy;
- fail clearly when the database cannot be checked;
- never create/repair database objects;
- never expose credentials or internal connection details.

## Testing architecture

The cumulative executable test suite lives under `tests/` and is organized by test type, including unit, repository/contract, and live acceptance tests.

Historical slice Gherkin does not define the current executable suite. It is preserved with slice reflections under `docs/reflections/`.

Some platform behavior—especially the real Android Share Sheet experience—requires deployed manual acceptance testing.

## Current boundaries

Deferred Attention is intentionally not an offline-first synchronization system.

It does not require:
- CRDT/conflict-resolution machinery;
- mandatory metadata enrichment;
- URL deduplication;
- native mobile clients;
- embedded readers;
- folders/tags/priorities/reminders.

Future work should preserve the product law in `SPEC.md`: capture friction is more important than feature richness.
