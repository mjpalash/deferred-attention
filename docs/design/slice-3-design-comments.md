# Design Comments — Slice 3 and Forward Architecture

## 1. Capture is a platform adapter around a shared core

The PWA should remain a thin entry point.

```text
Android Web Share Target
        ↓
parse share
        ↓
authenticate
        ↓
shared capture/domain logic
        ↓
Supabase
```

A future native Android client should be able to replace only the first/platform layer while continuing to use the same persistence and domain behavior.

## 2. Save and enrich are separate operations

Do not evolve capture into:

```text
receive URL
  → fetch page
  → parse metadata
  → build preview
  → save
```

The intended architecture is:

```text
receive URL
  → save immediately
  → acknowledge
          ↓
     enrich asynchronously
```

This separation is the main architectural invariant created by Slice 3.

## 3. Metadata belongs to the saved item, not to capture UI state

The next enrichment slice can add persistent preview fields such as:

- `description`
- `preview_image_url`
- `site_name`

The data should be fetched once/best-effort and stored with the item. Inbox rendering should consume stored metadata rather than re-scraping every URL whenever the pile is opened.

Metadata failure must degrade gracefully to the original URL/title/raw text.

## 4. Native mobile remains compatible with this direction

Most of the work from Slice 3 and the future metadata slice is reusable in a native app:

- Supabase/data model
- authentication model
- capture/domain rules
- metadata enrichment
- inbox semantics
- search/status model

Platform-specific work that would be replaced includes:

- Web Share Target manifest entry
- PWA launch/dismiss behavior
- PWA caching/service worker choices

A particularly valuable native improvement would be Android share-receiver dismissal: save, call `finish()`, and immediately return the user to the originating app.

## 5. Do not overbuild offline behavior

Fast PWA startup is still important, but avoid turning Later into an offline-first synchronization system. The product spec only requires one server-backed inbox that appears on another device on next load.

A lightweight cached shell/pile plus background refresh may be worthwhile later; CRDT/offline conflict machinery is not.

## 6. Idempotency remains evidence-driven

Do not introduce URL deduplication.

Two captures of the same URL at different times can be intentional.

Do not add an extra network hop or database uniqueness key merely to guarantee exactly-once semantics unless real usage demonstrates duplicate capture is a meaningful problem.

## 7. Testing philosophy

Prefer:

```text
input/event
  → observable behavior
```

over:

```text
source code
  → expected string/import/function name
```

Structural tests are appropriate only when the structure is itself externally meaningful, such as:
- manifest contracts consumed by Android;
- security boundaries;
- database constraints/policies;
- stable public APIs.

Where possible, eventually replace SQL-text RLS checks with real database integration tests.

## 8. Slice 3 leaves a clean sequence for the next work

Recommended order:

```text
Slice 3 — Instant Share Capture       DONE
        ↓
Slice 4 — Background Link Enrichment
        ↓
Slice 5 — Rich Preview Cards
        ↓
Slice 6 — Fast App Open / PWA caching
```

This ordering keeps the product's defining operation—capture—independent of richer return-time experiences.
