# Deferred Attention

Deferred Attention (“Later”) is a personal **save it now, come back when I have attention** inbox.

Its defining product rule is simple:

> **The cost of capturing something must approach the cost of sending it to myself on WhatsApp.**

The application is being built in small vertical slices with behavioral acceptance criteria, a cumulative executable test suite, and a reflection after each slice.

## What works today

The current application includes:

- Supabase authentication and user-owned data;
- URL and plain-text capture;
- one server-backed inbox across clients;
- reverse-chronological inbox ordering;
- Done and Keep lifecycle actions;
- an installable PWA;
- Android Web Share Target support;
- preservation of a pending Android share through login;
- instant Android capture: choosing **Later** in the Share Sheet saves automatically;
- a lightweight Saved/failure result;
- DB-backed health checks and an automated production deployment pipeline.

Desktop one-click capture, the iOS fallback, search, notes, deletion, grouping, and link enrichment remain future work. See [`BACKLOG.md`](./BACKLOG.md).

## Technology

- Next.js + TypeScript
- React
- Supabase Postgres
- Supabase Auth
- Vercel
- Vitest
- GitHub Actions

## Repository guide

- [`SPEC.md`](./SPEC.md) — current product requirements and non-goals
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — current technical design
- [`SETUP.md`](./SETUP.md) — local, Preview and Production setup
- [`PRINCIPLES.md`](./PRINCIPLES.md) — development process and documentation rules
- [`BACKLOG.md`](./BACKLOG.md) — done, possible next work, deferred/rejected ideas
- [`docs/reflections/`](./docs/reflections/) — historical slice reflections and Gherkin
- [`tests/`](./tests/) — cumulative executable test suite

Historical acceptance criteria are kept with each slice reflection. They are not the current executable test suite.

## Local development

```bash
npm install
cp .env.example .env.local
# fill the required Supabase values
npm run dev
```

See [`SETUP.md`](./SETUP.md) for the complete environment configuration.

## Validation

Useful commands:

```bash
npm run typecheck
npm test
npm run test:repo
npm run build
npm run check
```

`npm run check` is the normal local completion gate:

```text
typecheck → tests → repository checks → production build
```

A deployed health acceptance test can also be run manually:

```bash
ACCEPTANCE_BASE_URL=https://your-deployment.example npm run test:acceptance
```

## Deployment model

Production deployment is controlled through GitHub Actions:

```text
main
  → validate
  → apply changed Supabase migrations
  → Vercel production deploy
  → live acceptance check
```

Feature branches can use Vercel Preview deployments for real-device and integration testing before merge.

Preview and Production are separate Vercel environments. Required runtime variables must be configured in each environment in which the app is expected to work.

## Current Android capture flow

```text
source app
  → Share
  → Later
  → automatically saved
  → Saved
  → Android Back gesture/button
```

The PWA cannot reliably dismiss itself and return to the originating Android application, so the final Back gesture/button is currently unavoidable.

## Security

Never commit real environment values.

`SUPABASE_SECRET_KEY` is server-only and must never be exposed through a `NEXT_PUBLIC_` variable.

The repository is public; committed fixtures/data must remain synthetic and contain no personal inbox content.
