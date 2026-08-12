# Slice 3 — Instant Share Capture

## Goal

Make saving from Android's Share Sheet as fast and frictionless as possible.

Choosing **Later** from the Share Sheet is itself the user's save action. The app saves the shared content automatically, without requiring a second confirmation tap.

## Core user flow

```text
Source app
  → Share
  → Later
  → Saved confirmation
  → Back button / gesture
  → Source app
```

The user does not need to press **Save**, choose metadata, or wait for link enrichment.

Because Android Web Share Target launches the PWA, the web app cannot reliably dismiss itself back to the originating app. The success screen therefore tells the user to use the phone Back button or gesture.

## In scope

- Automatically save content received through the Android Web Share Target.
- Remove the previous Save/Cancel confirmation step.
- Support both URLs and plain text.
- Preserve shared content across authentication when the user is not already signed in.
- After a successful save, show:
  - a clear **Saved** confirmation;
  - the URL or text that was saved;
  - a short instruction to use the phone Back button/gesture to return.
- Give a lightweight failure state if persistence fails.
- Keep metadata enrichment completely outside the critical save path.
- Structure capture around reusable server-side capture logic rather than PWA-specific UI logic.
- Avoid intentional double submission where practical without adding latency-producing idempotency machinery.
- Replace the old generic app icon with the Later **L + bookmark** mark.

## Performance rule

The critical path is:

```text
receive share
  → authenticate
  → validate
  → persist
  → acknowledge saved
```

Nothing else may block this path.

Preview metadata such as image, description, site name, favicon, Open Graph data, or summaries must not be fetched before persistence succeeds.

## Duplicate handling

Fast save takes precedence over perfect exactly-once semantics.

A single share action should normally create one item. The implementation does not add an extra redirect, deduplication lookup, URL hash, or database idempotency key to the critical path.

Saving the same URL again later is a valid new capture and must not be silently deduplicated.

If real-world use later reveals meaningful duplicate-save problems, solve them separately using observed evidence.

## Testing approach

Slice 3 tests protect behavior and important contracts rather than incidental source-code structure.

Examples of useful tests:
- authenticated share → capture is attempted automatically;
- unauthenticated share → content survives login;
- URL and plain-text shares are persisted correctly;
- persistence failure → success is not reported;
- Android manifest exposes the required Web Share Target contract.

Tests that merely assert imports, component/function names, exact object key sets, query-parameter order, or forbidden words in source code are intentionally avoided.

## Out of scope

- Open Graph / link metadata fetching
- preview images and excerpts
- rich preview cards
- inbox redesign
- normal app startup optimisation
- service-worker or offline caching work
- native Android/iOS share extensions
- perfect idempotency guarantees
- database capture-key schema changes
- automatically returning to the originating Android app

These belong to later slices or will be added only if real use shows they are needed.

## Acceptance / definition of success

From a source app such as X:

1. Tap **Share**.
2. Tap **Later**.
3. Take no further save action.
4. The content is persisted automatically.
5. Later shows **Saved** plus the saved URL/text.
6. Later tells the user to use the phone Back button/gesture to return.
7. The item appears in the Later inbox.

Additional acceptance cases:
- plain-text shares work;
- a logged-out user can authenticate without losing the pending share;
- failed persistence does not falsely display success;
- metadata/enrichment work does not participate in the save path.

## Completion status

**Code complete and local checks green.**

Final branch closure should include deployed Android acceptance testing and then merge to `main`.
