# Slice 3 — Instant Share Capture

## Goal

Make saving from Android's Share Sheet as fast and frictionless as possible.

Choosing **Later** from the Share Sheet is itself the user's save action. The app must save the shared content automatically, without requiring a second confirmation tap.

## Core user flow

```text
Source app
  → Share
  → Later
  → Saved
```

The user should not need to press **Save**, choose metadata, or wait for link enrichment.

## In scope

- Automatically save content received through the Android Web Share Target.
- Remove the current Save/Cancel confirmation step from the normal share flow.
- Support both:
  - URLs
  - plain text
- Preserve shared content across authentication when the user is not already signed in.
- Give minimal success or failure feedback.
- Keep metadata enrichment completely outside the critical save path.
- Structure capture so that persistence is owned by a reusable server-side/API boundary rather than by PWA-specific UI logic.
- Avoid intentional client-side double submission where practical, but do not add network hops or schema complexity for perfect idempotency.

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

In particular, preview metadata such as image, description, site name, favicon, Open Graph data, or content summaries must not be fetched before the item has been persisted.

## Duplicate handling

Fast save takes precedence over perfect exactly-once semantics.

A single share action should normally create one item. The implementation should avoid obvious duplicate submission caused by its own UI or control flow, but it must not add an extra redirect, deduplication lookup, or database idempotency key to the critical path.

If rare duplicate saves are later observed in real use, handle them as a separate problem based on evidence.

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

These belong to later slices or will be added only if real use shows they are needed.

## Definition of success

From a source app such as X:

1. Tap **Share**.
2. Tap **Later**.
3. Take no further action.
4. The shared item is saved and appears in the Later inbox.

Failure or slowness in any later metadata-enrichment work must never prevent or delay the initial save.
