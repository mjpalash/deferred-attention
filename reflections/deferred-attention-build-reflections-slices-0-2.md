# Deferred Attention --- Build Reflections After Slices 0--2

**Date:** 10 August 2026\
**Status:** Slice 0, Slice 1, and Slice 2 implemented; Slice 3 is next.

## Why I am writing this

I started this project because my need is not really "read it later." It
is closer to: **put this somewhere with almost no effort, so I can come
back to it when I have attention for it.** My current habit of sending
things to myself on WhatsApp works because capture is nearly
frictionless. The app has to compete with that, not with the feature
lists of bookmarking products.

The product specification therefore has one unusually strong design law:

> **The cost of capturing something must approach WhatsApp's cost.**

This document is a record of what I learned while actually building the
first three slices with AI assistance. It is deliberately not just a
technical changelog. I want to remember where my mental model was wrong,
what failed, how we diagnosed it, what the AI got wrong or discovered
only through implementation, and what remains before the original
specification can honestly be called complete.

------------------------------------------------------------------------

## 1. The build approach that emerged

We deliberately did **not** ask AI to build the whole product in one
shot. The technical plan divided the work into small vertical slices,
with each slice ending in a runnable application:

-   **Slice 0 --- Skeleton:** Next.js/TypeScript, GitHub, Vercel,
    Supabase, CI, environment handling, deployed health check.
-   **Slice 1 --- Core product:** item creation, server-backed inbox,
    reverse chronological pile, Done/Keep, authentication and database
    policies.
-   **Slice 2 --- Android capture:** PWA manifest and Web Share Target
    so Android can share URL/text into the app.
-   **Slice 3 --- Desktop/web capture:** one-click browser capture.
-   **Slice 4 --- iOS fallback:** Shortcut/share-sheet fallback.
-   **Slice 5 --- Finish v1:** search, enrichment, notes, deletion, day
    grouping, auth polish and important edge cases.

The process that worked best was:

1.  Agree what the slice means.
2.  Write behavioral/contract tests first.
3.  See the tests fail for the expected reason.
4.  Add the minimum implementation.
5.  Run typecheck, tests, repository safety tests and production build.
6.  Use the feature manually.
7.  Fix integration/environment problems that unit tests did not expose.
8.  Commit a known-working branch.
9.  Merge to `main`, allowing the production pipeline to exercise
    deployment.
10. Only then move to the next slice.

This has been one of the most important lessons of the project. AI can
generate a lot of code quickly, but **small slices make its mistakes
observable**.

------------------------------------------------------------------------

## 2. Slice 0 --- I learned that "deployment" is a system, not a button

Slice 0 looked simple: get a skeleton Next.js app deployed and connected
to Supabase. It ended up teaching me a large amount about GitHub
Actions, Vercel, Supabase, secrets and deployment boundaries.

### Git and generated/local files

Early `git status` output showed modified/generated files such as:

-   `lib/env.ts`
-   `next-env.d.ts`
-   `tsconfig.json`
-   `package-lock.json`
-   `tsconfig.tsbuildinfo`

This forced me to distinguish three categories that previously felt
similar:

1.  **Source files that belong in Git.**
2.  **Generated files that tools rewrite and generally should not be
    treated as intentional feature changes.**
3.  **Local secret/environment files that must never be committed.**

That distinction returned later when Next.js automatically changed
`next-env.d.ts` from `.next/dev/types/...` references to
`.next/types/...` after a production build. The correct response was not
"commit whatever changed"; it was to inspect the diff and restore
unrelated generated noise.

### GitHub Actions became concrete

I learned to read a GitHub Actions pipeline as a dependency graph rather
than as one long script.

Our production flow became approximately:

``` text
validate
   |
   v
deploy_supabase
   |
   v
deploy_vercel
   |
   v
acceptance
```

The `needs:` relationships and `if:` conditions matter. A job being
**skipped** is different from it failing. We encountered this directly
when Supabase migration-related jobs were skipped and had to determine
whether that was intentional or whether our conditions had accidentally
prevented database setup.

I also learned that CI success is not the same as application success.
We added a **post-deployment acceptance test** so the pipeline does not
stop at "Vercel accepted the deployment"; it asks the live application
whether it and its database are actually healthy.

### Secrets vs variables

This became a practical distinction rather than an abstract GitHub
feature.

Things such as:

-   `VERCEL_TOKEN`
-   `VERCEL_ORG_ID`
-   `VERCEL_PROJECT_ID`
-   `SUPABASE_ACCESS_TOKEN`
-   `SUPABASE_DB_PASSWORD`

have different sensitivity and usage characteristics. Credentials belong
in secrets. Non-secret identifiers can be variables where appropriate.

More importantly, I learned that **the same-looking configuration exists
in several different places**:

``` text
My Mac
  └── .env.local

GitHub Actions
  ├── Secrets
  └── Variables

Vercel project
  └── Environment Variables

Supabase
  └── project credentials / database / auth configuration
```

A value existing in one of these places does not magically make it
available in the others.

### The Vercel token problem

The deployment initially failed with:

``` text
Error: You defined "--token", but it's missing a value
```

That told us the shell variable was empty: GitHub Actions was not
receiving the expected `VERCEL_TOKEN`.

After creating/configuring the token, another failure appeared:

``` text
Could not retrieve Project Settings
```

The surprising part was that a token scoped only to the particular
Vercel project did not work for the CLI workflow, whereas changing the
token scope to all projects did.

That taught me an important practical lesson: **a permission that sounds
sufficient conceptually may not cover all API calls a CLI makes while
resolving team/project context.** Vercel CLI did more than simply deploy
to the named project; it needed enough scope to retrieve/link project
settings in the team context.

We also discovered that modern Vercel linking did not necessarily
produce the `.vercel/project.json` file we expected from older
assumptions. We saw `.vercel/repo.json` instead, and
`npx vercel project inspect deferred-attention` plus
`npx vercel whoami`/`teams ls` gave us a more reliable view of the
actual project/team relationship.

That was a useful correction to the AI's initial assumption:
**documentation and tool behavior evolve, so inspect what the current
CLI actually created instead of insisting that an older file must
exist.**

### Local Vercel vs CI Vercel

Another small but useful lesson:

``` bash
vercel
```

did not work locally because the CLI was not globally installed, while:

``` bash
npx vercel
```

did.

The CI pipeline explicitly installs the CLI globally, so the command
available in CI and the command available on my laptop need not be
identical.

### Supabase migration deployment

The Supabase job initially failed with:

``` text
Access token not provided.
```

Again, the problem was not migration SQL. It was environment
propagation.

This reinforced a debugging pattern I want to remember:

> When an external CLI says a credential is missing, first verify the
> execution environment and secret wiring before changing application
> code.

We changed the pipeline so migrations are applied as a normal part of
production deployment. That matters because an application deployment
without its required schema is not a valid deployment.

### A subtle npm mistake

At one point the Vercel CLI installation step used:

``` text
npm ci --global vercel@latest
```

which failed because `npm ci` is for reproducible installation from a
lockfile and does not work for global packages. The correct command was:

``` bash
npm install --global vercel@latest
```

This was a good example of a tiny command-level error that can make an
entire deployment look broken.

### Node.js 20 warnings

GitHub began warning that some third-party Actions targeted deprecated
Node.js 20 runtimes and were being forced onto Node.js 24.

Initially we upgraded our own `setup-node` configuration, but that did
**not** remove every warning because some warnings came from the
internals of third-party actions, particularly `supabase/setup-cli@v1`.

This distinction matters:

-   `actions/setup-node` controls the Node version available to **our
    subsequent shell steps**.
-   A JavaScript GitHub Action declares its **own runtime**.
-   We cannot fix a third-party action's runtime merely by setting our
    application Node version.

The warning therefore did not necessarily mean our Next.js application
was running on Node 20.

------------------------------------------------------------------------

## 3. Slice 1 --- The core product exposed the difference between "code exists" and "system works"

Slice 1 introduced the actual item model, authentication, Supabase
persistence and inbox lifecycle.

### Accidentally replacing rather than adding files

The largest procedural mistake happened when I copied the Slice 1 files
into the repository and unintentionally removed existing Slice 0
files/folders.

Symptoms included:

``` text
Cannot find module ... tests/repository/slice0-repository.mjs
```

and the repository test folder was unexpectedly empty.

The right response was to reset the Slice 1 branch to the known-good
state and reapply Slice 1 carefully.

This was probably the strongest Git lesson so far:

> **A branch is a cheap recovery point.**

Because Slice 0 had been committed and the Slice 1 work was isolated on
its own branch, we could reset without losing the known-good
application.

It also changed how we transferred AI-generated code. A ZIP that
represents "the files for this slice" must be treated as an **overlay**,
not as a replacement project tree.

### `git status` became a safety tool

Before accepting a slice, we started using `git status` not merely to
see what to commit but to ask:

-   Are the files I expected modified?
-   Are the new directories expected?
-   Are any old files shown as deleted?
-   Did a generated file change?
-   Did a secret/environment file appear?

This is a simple habit, but it prevented us from repeating the
destructive copy problem.

### Local environment variables were not the same as Vercel variables

When the application first ran locally, Supabase failed with:

``` text
Your project's URL and Key are required to create a Supabase client!
```

Yet the Vercel project already had Supabase environment variables.

The reason was straightforward in hindsight: **Vercel production
environment variables exist on Vercel, not on my Mac.**

`npx vercel` pulled only the development environment into `.env.local`,
and initially that contained essentially a Vercel OIDC token rather than
the Supabase values the application expected.

This clarified another important boundary:

``` text
Production works on Vercel
        ≠
Local development is configured
```

For local execution, the required `NEXT_PUBLIC_SUPABASE_*` values must
be available locally.

### Environment-variable names matter exactly

The application expected names such as:

``` text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

while earlier infrastructure used names such as `SUPABASE_URL` and
`SUPABASE_SECRET_KEY` for server/CI purposes.

This was not merely naming style. `NEXT_PUBLIC_` has semantic meaning in
Next.js: those values may be made available to browser-side code. A
Supabase secret/service-role key must **not** be exposed this way.

This is one of the security lessons worth remembering:

> "The app needs a Supabase key" is not precise enough. Which key, for
> which execution context, with what exposure?

### Missing root layout

When we first got the login UI to render locally, Next.js reported:

``` text
Missing <html> and <body> tags in the root layout.
```

There was no `layout.tsx`.

This was another integration issue that isolated unit tests did not
catch. Adding the required App Router root layout fixed the runtime.

The lesson is not "remember `layout.tsx`." The broader lesson is:

> Framework contracts live above business logic. Passing domain tests
> does not prove the application is structurally runnable.

### Stale `.next` generated types

TypeScript later complained:

``` text
Cannot find module '../../../app/api/health/route.js'
```

from `.next/types/validator.ts`.

That came from generated Next.js state referring to a route that had
changed/disappeared. Generated build state can become stale and produce
errors that look like source-code errors.

This reinforced the need to distinguish **source-of-truth code** from
`.next` output.

### Repository safety tests were valuable

The Slice 0 repository tests caught a real problem after Slice 1:

``` text
✗ No real .env file is present in the repository scaffold
```

The test suite was not only testing application behavior; it was
enforcing repository hygiene such as:

-   environment files ignored,
-   `.env.example` allowed,
-   no real secret values committed,
-   no database connection string committed,
-   server secrets not marked public.

That is exactly the sort of invariant AI-assisted development can
accidentally violate. It was worth encoding as tests.

------------------------------------------------------------------------

## 4. Slice 2 --- Platform integration revealed assumptions that unit tests could not

Slice 2 turned the app into a PWA share target for Android.

### Manifest and installability

Chrome showed an "Install app" option once the application had the
appropriate web app manifest/PWA characteristics. Firefox behaved
differently.

This helped separate two concepts I had previously blurred:

-   A website can have a manifest.
-   A browser decides whether/how to expose PWA installation and
    share-target behavior.

Platform/browser support is part of the product, not just the code.

### Share capture contract

We added tests for:

-   the share-target manifest,
-   parsing URL/text/title shared into `/share`,
-   the capture contract,
-   preserving zero-friction behavior.

The Android target sends parameters such as:

``` text
/share?title=...&text=...&url=...
```

The app then uses the same core item/capture logic rather than creating
a second Android-specific data path. This follows the architecture
principle that all capture surfaces should converge on one
application/API.

### The authentication edge case was discovered through use

When I manually opened:

``` text
/share?url=https%3A%2F%2Fexample.com
```

I saw the login page.

That was technically expected because the local browser had no
authenticated Supabase session, but it exposed a product problem: **if
Android shares something while I am logged out, logging in must not lose
what I was trying to save.**

The original implementation redirected:

``` text
/share → /login → /
```

which could lose the pending share.

We changed the intended flow to:

``` text
/share?url=...&text=...
        |
        | unauthenticated
        v
/login?next=<encoded original share URL>
        |
        | successful login
        v
/share?url=...&text=...
        |
        v
Save
```

We first wrote a test for this behavior and deliberately got a RED test
because the expected helper did not yet exist:

``` text
Cannot find module '../../lib/auth/return-path'
```

Then we added `buildShareReturnPath()` and `safeNextPath()`.

`safeNextPath()` also guards against an **open redirect**. We must not
allow:

``` text
/login?next=https://malicious.example
```

to send an authenticated user to an arbitrary external site.

This was a good example of TDD doing more than confirming
implementation: the test forced us to make the redirect behavior
explicit and reusable.

### We accidentally left old and new implementations in the same file

While wiring the helper into `app/share/page.tsx`, old inline
`URLSearchParams` code remained below the new `buildShareReturnPath()`
implementation.

The result was a malformed file containing both approaches, including
references to a `query` variable that no longer existed.

The fix was to replace the file with one coherent implementation rather
than patching individual lines.

Lesson for AI-assisted editing:

> When replacing an approach, inspect the whole affected function/file
> for remnants of the old approach. AI instructions like "replace this
> block" can easily leave logically dead or broken fragments around it.

### Hydration mismatch: server locale vs browser locale

Manual use then exposed a React hydration error in the inbox.

The server rendered a timestamp like:

``` text
10/8/2026, 12:43:28 am
```

while the browser rendered:

``` text
8/10/2026, 12:43:28 AM
```

The code used:

``` ts
new Date(item.createdAt).toLocaleString()
```

during rendering. The server and browser had different locale
conventions, so they produced different HTML for the same timestamp.

We fixed this with a small client-side `LocalTime` component: the server
and initial client render the same placeholder, then the browser formats
the date after hydration.

This is a useful Next.js/React lesson:

> Anything rendered on both server and client must be deterministic
> across those environments. Locale, timezone, current time, random
> values and browser-only state are common hydration traps.

We deliberately did **not** use `suppressHydrationWarning`, because that
would hide the mismatch rather than remove its cause.

### React type evolution

The editor also warned that `FormEvent` was deprecated in the current
React type definitions and suggested more specific event types /
`SyntheticEvent`.

This was not causing the hydration bug, but it showed another reality of
working with current frameworks: even code that is conceptually familiar
may acquire new type-system guidance as libraries evolve.

------------------------------------------------------------------------

## 5. What I learned about debugging

Several debugging patterns repeated enough that I want to keep them.

### Read the first meaningful error, not the final "exit code 1"

GitHub often ends with:

``` text
Process completed with exit code 1.
```

That is not the diagnosis.

The useful line is usually earlier:

``` text
--token is missing a value
Access token not provided
npm ci does not work for global packages
Health endpoint returned HTTP 401
Cannot find module ...
```

The discipline is: **find the first concrete failure and reason from
there.**

### Identify the layer before changing code

Failures came from very different layers:

``` text
Git repository
GitHub Actions
Vercel CLI / project permissions
Supabase CLI / credentials
Next.js framework structure
TypeScript/generated types
React hydration
Application/domain behavior
Browser/PWA behavior
```

Changing application code in response to a CI secret problem would only
create more problems.

A useful question is:

> Which layer produced this error, and what information crosses into
> that layer?

### Local, CI and production are three different environments

Something can:

-   work locally and fail in CI,
-   pass CI build and fail in production acceptance,
-   work in production while local development lacks the necessary
    environment variables.

I should stop treating "the app" as one execution environment.

### Manual testing is not optional for integration slices

The tests did not discover:

-   the login interruption of a pending share,
-   the hydration locale mismatch,
-   browser-specific PWA behavior,
-   whether the capture interaction actually feels low-friction.

The technical plan explicitly calls for a small number of end-to-end
tests plus real-device testing for Android/iOS. That now makes much more
sense to me.

------------------------------------------------------------------------

## 6. What I learned about Git and branches

My mental model is now roughly:

``` text
main
  |
  | known-good Slice 0
  |
  +---- slice-1
  |       develop/test/fix
  |       commit
  |       push
  |       merge
  |
  +---- slice-2
          develop/test/fix
          commit
          push
          merge
```

A feature branch gives me a safe place to make mistakes. `main` should
represent a known-working state.

The workflow I want to keep:

``` bash
git status
# inspect before staging

npm run typecheck
npm test
npm run test:repo
npm run build

git status
git diff

git add ...
git status
git commit -m "..."
git push -u origin <branch>
```

Then merge through GitHub and let the production pipeline validate the
integrated result.

I also learned not to confuse:

-   **local branch exists**
-   **branch has commits**
-   **branch has been pushed to GitHub**
-   **branch has been merged into main**
-   **main has successfully deployed**

Those are five separate states.

------------------------------------------------------------------------

## 7. What I learned about AI-assisted development

This project has been useful precisely because the AI did **not** always
get everything right.

### AI is much better with a constrained slice

"Build Slice 2 only" worked better than "build my app."

The product specification and technical plan act as persistent
constraints. Without them, an AI assistant has a strong temptation to
add reasonable-sounding features that violate the core product idea.

### Tests are a contract with the AI

The tests make the desired behavior concrete before implementation. This
is especially valuable when AI is writing code because I can ask:

``` text
Did the implementation make these agreed behaviors pass?
```

rather than:

``` text
Does this large amount of generated code look plausible?
```

### AI-generated ZIPs/files need human integration discipline

The Slice 1 accidental deletion showed that generated artifacts can be
dangerous if copied wholesale.

The AI should provide additive, clearly scoped changes; I should inspect
`git status` immediately after applying them.

### The AI must update its model when reality disagrees

Examples:

-   expecting `.vercel/project.json` when the current Vercel CLI
    produced different linkage metadata;
-   initially treating environment configuration too generically;
-   leaving obsolete share-page code after introducing a helper;
-   only discovering the logged-out capture problem through manual use.

A productive relationship is not "AI knows the answer." It is:

``` text
hypothesis
   ↓
small change
   ↓
test / inspect real tool behavior
   ↓
correct mental model
   ↓
next change
```

### A lesson for the AI

For future slices, the assistant should:

-   ask itself what existing files a generated overlay might replace;
-   provide **deltas** rather than whole project trees where practical;
-   explicitly distinguish local/Vercel/GitHub/Supabase environment
    configuration;
-   avoid assuming current CLI filesystem behavior from older
    conventions;
-   include authentication interruption in capture-flow tests;
-   consider SSR/hydration determinism when generating Next.js client
    components;
-   use manual acceptance checks for platform UX, not only unit tests;
-   keep the specification's "zero friction" rule visible while making
    technical choices.

------------------------------------------------------------------------

## 8. Product decisions that became clearer through implementation

The specification says capture should ask no questions and should
support URL or plain text. It also says an optional note can exist only
if it adds essentially no friction.

During Slice 2 I asked why I did not see a text field alongside the URL.
This exposed an important distinction:

-   **shared text** is content coming from Android and should be
    preserved;
-   an **editable note field** is an additional user action and is not
    required for Slice 2.

We chose not to pull note editing into the Android slice merely because
it was nearby technically. That was the right scope decision.

Similarly, the app should not become a folder/tag/priority/reminder
system. The spec explicitly rejects those. The point is to externalize
deferred attention, not create a second job of organizing the deferred
items.

------------------------------------------------------------------------

## Reflection: Debugging the Vercel Preview "Internal Server Error"

While testing branch deployments, I ran into an **Internal Server Error on the Vercel Preview deployment**, even though the production deployment was working correctly. This was initially confusing because the same application code worked in production.

### What was wrong

The problem helped me understand that Vercel has three distinct environment-variable scopes:

- **Development**
- **Preview**
- **Production**

My public Supabase variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

had been configured for Development and Production, but **not for Preview**.

Therefore, when Vercel automatically deployed my feature branch as a Preview deployment, the application did not have all the environment variables that the Supabase client expected. This resulted in the application failing with an **Internal Server Error**.

### A debugging detour: Deployment Protection

There was an additional debugging detour around **Vercel Deployment Protection**.

Preview deployments can be protected by Vercel Authentication. We therefore first had to distinguish between two possible problems:

1. Vercel was preventing access to the deployment.
2. The deployment was accessible, but the application itself was crashing.

This reinforced an important debugging lesson: **an error visible in the browser does not immediately tell me which layer of the system caused it.**

### The fix

I edited the Vercel environment-variable configuration so that the required Supabase variables were available to **Preview** as well as Production.

Conceptually, the configuration became:

```text
NEXT_PUBLIC_SUPABASE_URL
    Production + Preview

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    Production + Preview

SUPABASE_URL
    Production + Preview

SUPABASE_SECRET_KEY
    Production + Preview
```

I then **redeployed the Preview deployment**.

The application worked.

### What I learned

The larger lesson is that **deployment environments are genuinely different environments, even when they deploy exactly the same repository and code**.

Code is only one part of a working application. Configuration, secrets, authentication settings, databases, environment variables, and deployment permissions are also part of the system.

I now have a clearer mental model:

```text
Local development
        ↓
Development environment variables


Feature branch pushed to GitHub
        ↓
Vercel Preview deployment
        ↓
Preview environment variables
        ↓
Temporary test URL


Merge/push to main
        ↓
GitHub production pipeline
        ↓
Production environment variables
        ↓
Production application
```

I also learned that changing environment variables does **not repair an already-created deployment**. The application needs to be redeployed so that the new configuration becomes part of that deployment.

### A useful debugging habit

When something works locally or in production but fails in another deployment environment, I should not immediately assume that the code is wrong.

A useful debugging sequence is:

```text
Is the correct code deployed?
        ↓
What do the deployment/runtime logs say?
        ↓
Are the required environment variables present?
        ↓
Can the application reach external services?
        ↓
Are authentication/protection settings interfering?
        ↓
Is there environment-specific configuration?
```

### Why this was useful beyond fixing the error

This incident also validated the development workflow I wanted.

I can now work like this:

```text
Feature branch
      ↓
Push to GitHub
      ↓
Automatic Vercel Preview
      ↓
Test the deployed application
      ↓
Satisfied?
      ↓
Merge into main
      ↓
Production pipeline
```

This means **production is no longer my first opportunity to test deployed code**.

A feature branch gives me a real deployed version of the application that I can test on different devices before promoting the code to `main`. This is a much safer and more understandable development workflow.


## 9. Current state after Slice 2

At this point we have built the foundation and core product, and the
Android/PWA capture mechanism is implemented at the application level.

### What exists

-   Next.js + TypeScript application.
-   Git/GitHub repository with slice-based branch workflow.
-   Automated validation/typechecking/tests/build.
-   Repository safety tests for secrets/environment hygiene.
-   GitHub Actions production pipeline.
-   Supabase project, authentication and Postgres persistence.
-   Supabase migrations applied through CI.
-   Vercel production deployment.
-   Post-deployment health/acceptance check.
-   Server-backed item model with per-user ownership.
-   Inbox/pile in reverse chronological order.
-   Done and Keep lifecycle behavior.
-   PWA manifest and Android Web Share Target.
-   URL/text/title share parsing.
-   Logged-out share preservation across login.
-   Redirect safety check.
-   Fix for locale-dependent hydration of saved timestamps.

### What still needs real-world confirmation for Slice 2

The product requirement is not merely "the manifest contains
`share_target`." The actual success criterion is that **Android's native
Share Sheet can capture in approximately the intended two-tap flow**.

Therefore Slice 2 is technically implemented, but before v1 success we
still need to verify on a real Android device:

1.  Install the production PWA.
2.  Open a real source such as Chrome, YouTube or another share-capable
    app.
3.  Tap Share.
4.  Confirm Deferred Attention appears as a share target.
5.  Share a URL.
6.  Confirm the item is saved correctly.
7.  Test shared text as well as a URL.
8.  Confirm authentication behavior is acceptable if the session has
    expired.
9.  Judge the actual perceived friction against WhatsApp, not merely
    whether it functions.

This manual platform test is explicitly part of the technical plan.

------------------------------------------------------------------------

## 10. What remains before the original specification is successful

The product specification gives five concrete v1 success criteria. We
should declare success against those, not against "all slices have
code."

### Slice 3 --- Desktop/web one-click capture

Required behavior:

``` text
Browsing a page
     ↓
one-click Later action
     ↓
current URL + title captured
     ↓
remain on current page
```

The implementation can be a bookmarklet or small browser extension,
whichever actually meets the friction requirement most reliably.

The important constraint is **no navigation/new-tab capture flow**.

### Slice 4 --- iOS fallback

iOS cannot receive Web Share Targets in the same way Android can, so the
specification calls for a documented fallback, preferably an iOS
Shortcut available in the Share Sheet that POSTs shared URL/text to the
same capture API.

Success criterion: the working fallback should take **under 10
seconds**.

### Slice 5 --- Finish v1

Still required:

-   simple text search over `title`, `raw_text` and `note`;
-   best-effort title/source enrichment;
-   optional note editing;
-   deletion;
-   loose day grouping such as Today / Yesterday / older;
-   authentication polish;
-   important edge cases.

The technical plan says to stop after this rather than automatically
inventing more features.

### Cross-device continuity

We must explicitly demonstrate:

``` text
capture on phone
      ↓
open web app
      ↓
same item appears
```

and vice versa.

The architecture already supports server-backed continuity, but the
success criterion requires us to verify the actual journey.

### Final end-to-end journeys

Before declaring v1 done, the technical plan calls for a small set of
important end-to-end checks:

-   capture → inbox;
-   capture on one client → visible on another;
-   Done → removed from inbox;
-   search → previously saved item found;
-   Android Share Sheet manually on a real device;
-   iOS Shortcut manually on a real device.

------------------------------------------------------------------------

## 11. The actual definition of done

The original specification says v1 is complete only when all of these
are true:

-   **Web capture and Android Share Sheet capture both work in two
    taps.**
-   **iOS has a documented working fallback taking under 10 seconds.**
-   **Opening the app shows a clean reverse-chronological pile and no
    distracting dashboard.**
-   **Items can be marked Done or Kept and searched by text.**
-   **The same items appear whether captured on phone or web.**

That is a much better definition of success than "the CI pipeline is
green."

A green pipeline tells me the software passed the checks I encoded. The
specification tells me whether I solved the problem I started with.

------------------------------------------------------------------------

## 12. Questions for my own reflection

I want to revisit these after finishing v1:

1.  **Did the app actually replace sending links to myself on
    WhatsApp?** If not, where is the remaining friction?
2.  Which failures did I understand and diagnose myself, versus simply
    applying an AI-proposed fix?
3.  Can I now explain the path from `git push` to a live production
    deployment without looking it up?
4.  Can I explain where each secret/environment variable lives and why?
5.  Do I understand why a Vercel token can work locally but fail in
    GitHub Actions, or why scope matters?
6.  Can I explain the difference between a build passing and a
    production acceptance test passing?
7.  Can I explain why Supabase migrations belong in the deployment
    process?
8.  Can I explain why `.env.local` should remain local and why
    `.env.example` can be committed?
9.  Can I explain what caused the React hydration mismatch and why the
    `LocalTime` solution works?
10. Did TDD actually change my design, or did I merely write tests
    before code?
11. Where did the AI make assumptions that turned out to be wrong?
12. Did I catch those assumptions because I understood the system,
    because tests caught them, or because I manually used the product?
13. Which parts of this process would I be comfortable doing without AI
    next time?
14. Which parts do I want to deliberately practise again rather than
    outsource to AI?
15. Most importantly: **is the product still just a low-friction
    deferred-attention inbox, or have I started adding machinery because
    software makes it easy to add machinery?**

------------------------------------------------------------------------

## 13. A compact mental model I want to retain

``` text
                     PRODUCT SPEC
                "capture must be cheap"
                         |
                         v
                  SMALL BUILD SLICE
                         |
                  tests define contract
                         |
                         v
                  IMPLEMENT MINIMUM
                         |
            +------------+------------+
            |            |            |
        typecheck       tests        build
            |            |            |
            +------------+------------+
                         |
                         v
                    USE IT MYSELF
                         |
                  integration bugs
                         |
                         v
                 COMMIT KNOWN GOOD
                         |
                         v
                       GitHub
                         |
                  GitHub Actions
                         |
             +-----------+-----------+
             |                       |
       Supabase migration       Vercel deploy
                                     |
                                     v
                           production acceptance
                                     |
                                     v
                              REAL USER JOURNEY
                                     |
                                     v
                           SPEC SUCCESS CRITERIA
```

The central lesson so far is that **building software is not the act of
producing code**. It is maintaining a chain of evidence that the thing I
intended to build still exists after every change: specification → tests
→ code → build → deployment → real use.

AI has made producing the code dramatically cheaper. That makes the
other parts --- defining the problem, constraining scope, inspecting
changes, understanding environments, testing integration, and judging
the real experience --- more important, not less.
