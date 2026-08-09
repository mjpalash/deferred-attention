# Technical plan

## Decisions

- **Application:** Next.js + TypeScript, one codebase for UI and API.
- **Hosting:** Vercel.
- **Database:** Supabase Postgres.
- **Authentication:** Supabase Auth when authentication is implemented; not part of Slice 0.
- **Repository:** Public GitHub repository. Code and migrations are public; credentials and personal data are not.
- **Development:** Small vertical slices with focused TDD/BDD.

## CI/CD contract

`push main → pre-deploy validation → apply changed Supabase migrations → deploy Vercel → live acceptance tests → PASS/FAIL`

No automatic rollback is implemented yet.

## Slice plan

- **Slice 0:** project skeleton, deployment, DB-backed read-only health, tests, CI/CD, secret handling.
- **Slice 1:** capture API, items data model, pile UI, Done/Keep.
- **Slice 2:** Android PWA Web Share Target.
- **Slice 3:** desktop/browser capture.
- **Slice 4:** iOS Shortcut fallback.
- **Slice 5:** search, enrichment, notes, deletion, grouping, auth polish and edge cases.

If this file conflicts with `SPEC.md` about product behavior or scope, `SPEC.md` wins.
