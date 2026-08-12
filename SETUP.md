# Development and Deployment Setup

This document describes the current setup for local development, Vercel Preview deployments, and Production.

## 1. Local prerequisites

Install:
- Node.js 22 or later;
- npm;
- Git.

Clone the repository and install dependencies:

```bash
npm install
cp .env.example .env.local
```

Fill the required Supabase values in `.env.local`.

## 2. Runtime environment variables

The application currently uses two kinds of Supabase credentials.

### Browser/auth configuration

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

These are used by the Supabase authentication/session client and are intentionally browser-visible.

### Server-only configuration

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
```

`SUPABASE_SECRET_KEY` is privileged and must never be exposed to browser code or given a `NEXT_PUBLIC_` prefix.

### Manual deployed acceptance test

```text
ACCEPTANCE_BASE_URL
```

This is only needed when manually running the live health acceptance command. CI receives the deployment URL from the deployment step.

## 3. Supabase

The project uses Supabase Postgres and Supabase Auth.

Database changes are versioned under:

```text
supabase/migrations/
```

Production migrations are applied through the GitHub Actions deployment flow when migration files have changed (or when deliberately triggered).

Do not put production credentials or personal data into committed files.

## 4. Vercel environments

Vercel has separate environment scopes, notably:

- Development
- Preview
- Production

This distinction matters.

A feature branch deployed as a Vercel Preview does **not** automatically inherit variables that exist only in Production.

For environments where the full application should work, configure:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_SECRET_KEY
```

At minimum, ensure both **Preview** and **Production** contain the variables required by the deployed application.

After changing Vercel environment variables, redeploy the affected deployment. Existing deployments do not retroactively acquire the new configuration.

## 5. GitHub Actions secrets

The production workflow requires encrypted GitHub Actions secrets for deployment.

### Supabase deployment

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
SUPABASE_PROJECT_ID
```

### Vercel deployment

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

These are deployment credentials and should not be committed.

## 6. Local verification

Run:

```bash
npm run typecheck
npm test
npm run test:repo
npm run build
```

Or run the complete local gate:

```bash
npm run check
```

Start the application:

```bash
npm run dev
```

Then open the local application in the browser.

The health endpoint is:

```text
/api/health
```

## 7. Branch and Preview workflow

The preferred development flow is:

```text
feature branch
      ↓
local checks
      ↓
push to GitHub
      ↓
Vercel Preview
      ↓
manual/integration/device verification
      ↓
merge to main when satisfied
```

Preview deployments are especially useful for behavior that cannot be proven locally, such as the real Android PWA/share-sheet interaction.

If a Preview fails while local or Production works, check:
1. whether the expected code was deployed;
2. deployment/runtime logs;
3. Preview environment variables;
4. external-service connectivity;
5. Vercel deployment-protection/auth settings;
6. other environment-specific configuration.

## 8. Production deployment

GitHub Actions owns the intended production ordering:

```text
push/merge main
      ↓
typecheck + automated tests + repository checks + production build
      ↓
apply changed Supabase migrations
      ↓
Vercel production deployment
      ↓
live acceptance check
```

Avoid configuring a second independent production deployment path that can bypass these pre-deploy checks.

There is currently no automatic rollback.

## 9. Live acceptance test

Against a deployed environment:

```bash
ACCEPTANCE_BASE_URL=https://your-deployment.example npm run test:acceptance
```

This checks the deployed application over HTTPS and validates the database-backed health endpoint.

## 10. Android/PWA verification

Automated tests can verify the manifest contract and capture logic, but they cannot prove the complete Android Share Sheet experience.

For Android-related slices, final verification should include a deployed Preview or Production build on an Android device:
- install/open the PWA as appropriate;
- share URL/plain text from a real source app;
- choose Later;
- verify the intended capture behavior;
- confirm the saved item appears in the normal inbox.
