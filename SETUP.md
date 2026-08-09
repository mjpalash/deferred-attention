# Slice 0 setup checklist

This scaffold is designed so **GitHub Actions is the production deployer**. That preserves the agreed ordering:

`push main → validate → migrate if needed → deploy → live acceptance tests`

## 1. GitHub

Create a public repository and copy this scaffold into it. Commit the generated `package-lock.json` after your first successful `npm install`.

Add these repository Actions secrets under **Settings → Secrets and variables → Actions**:

### Supabase deployment secrets
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`

### Vercel deployment secrets
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Do not store these values in files committed to Git.

## 2. Supabase

Create one Supabase project for now. Slice 0 does not need a separate staging project.

The first migration creates `public.healthcheck` and one seed row. The health endpoint itself is read-only and never repairs or writes to this table.

Create/copy a Supabase **secret key** (`sb_secret_...`) for the server-side Vercel runtime. Do not use it in browser code and do not commit it.

## 3. Vercel

Create a Vercel project for the app and obtain its project/team IDs and a deployment token for GitHub Actions.

**Important:** do not also enable an independent automatic production deployment from the Vercel Git integration unless you deliberately reconfigure the pipeline. Otherwise a push to `main` can create a Vercel deployment before the GitHub pre-deploy checks finish. In this Slice 0 design, GitHub Actions owns production deployment through the Vercel CLI.

Add these Vercel **Production Environment Variables**:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

The health route reads them only on the server.

## 4. First local verification

```bash
npm install
cp .env.example .env.local
# fill SUPABASE_URL and SUPABASE_SECRET_KEY
npm run typecheck
npm test
npm run test:repo
npm run build
```

If you have Supabase CLI configured locally, you can apply the migration locally/against a linked development project before the first production push. Otherwise the GitHub production workflow will apply it when `main` is pushed.

## 5. First production push

Push the scaffold to `main`. GitHub Actions should:

1. validate TypeScript;
2. run unit tests;
3. run repository safety checks;
4. produce a Next.js production build;
5. detect that the initial Supabase migration is new and apply it;
6. deploy the application to Vercel;
7. call the deployed `/api/health` endpoint over HTTPS;
8. report green only if the app and database both respond correctly.

There is no automated rollback in Slice 0.
