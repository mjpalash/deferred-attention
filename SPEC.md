# Deferred-Attention Inbox — Build Specification

## 1. One-line summary
A personal "save it for later, with zero friction" inbox that replaces sending
links to yourself on WhatsApp. Capture takes two taps and asks no questions.
Return is a single reverse-chronological list. Nothing else.

## 2. Design law (apply to every decision below)
**The cost of capturing something must approach WhatsApp's cost.** If a
feature adds a decision, a field, or a screen at capture time, cut it or make
it optional and hidden by default. When in doubt, do less.

## 3. Users & accounts
- Single user today (the builder), but **design the data model and auth for
  multiple users from day one** — every saved item belongs to a `user_id`.
- Auth can be minimal (e.g. passwordless email link / magic link, or a simple
  password). No social features, no sharing between users, no admin UI needed
  now — just don't hardcode a single-user assumption into the schema.

## 4. Platforms & capture mechanisms
Two capture surfaces are required. **Technology/hosting/stack are open —
choose what's simplest to build and run**, but the platform behavior below
is a hard constraint, not a preference:

### Web (desktop/laptop)
- A one-click "Later" action while browsing (browser extension, bookmarklet,
  or PWA share-target — implementer's choice) that captures the current
  page's URL + title without navigating away or opening a new tab flow.

### Mobile
- **Android**: implement as a PWA registered as a Web Share Target
  (`share_target` in the manifest). This lets the app appear directly in
  Android's native Share Sheet, same muscle memory as sharing to WhatsApp.
- **iOS**: Web Share Target for *receiving* shares is not supported by
  Safari/iOS (platform limitation, confirmed current as of 2026 — only
  outbound `navigator.share()` and Add-to-Home-Screen work). Implement a
  fallback capture path for iOS instead, in order of preference:
  1. An iOS Shortcut (added to the Share Sheet via "Add to Share Sheet")
     that POSTs the shared URL/text to the app's capture API — this gets you
     the closest thing to a native Share Sheet entry.
  2. A bookmarklet or "paste a link" quick-add screen in the PWA as a manual
     fallback.
  - Document this limitation to the user in-app rather than silently
    degrading — don't let them assume Share Sheet capture works on iOS if it
    doesn't.
- In all cases: after capture, the user is returned to what they were doing.
  No confirmation screen requiring further input, no forced app switch.

### Optional add without extra friction
- If trivially cheap to add, an optional single-field note at capture time
  (see §6) — never required, never blocking the save.

## 5. Core data model (conceptual — implementer picks exact schema)
An **item**:
| Field | Notes |
|---|---|
| `id` | |
| `user_id` | for future multi-user support |
| `url` | nullable — plain-text-only captures should be allowed |
| `title` | best-effort auto-fetched from the URL if not supplied; falls back to raw text/URL if fetch fails |
| `raw_text` | whatever was actually shared (may be just a URL, may be a thought with no link) |
| `source_type` | best-effort guess: linkedin / x / youtube / article / other — cosmetic only, never blocks capture, never requires user input |
| `note` | optional, freeform, editable any time, not just at capture |
| `status` | `inbox` (default) / `done` / `kept` — see §7 lifecycle |
| `created_at` | drives the default chronological sort |
| `updated_at` | |

No folders, tags, categories, priorities, or due dates in the schema. Do not
add fields "just in case" — see §9.

## 6. Capture flow requirements
- Default path: **Share → Save → Done.** Two intentional actions.
- No required screen asking for a folder, tag, title, content type,
  reminder, or reason.
- If a note field is shown, it must be optional and skippable with zero
  extra taps (e.g. pre-focused but not blocking submit on empty).
- Capture must work for: links (LinkedIn, X, YouTube, articles, arbitrary
  URLs), and plain text with no link at all.

## 7. Inbox / return experience
- Opening the app shows **the pile** — a single reverse-chronological list of
  all `status = inbox` items, grouped loosely by day (Today / Yesterday /
  older) for scanability only, not as a functional filter.
- No dashboard, no stats, no "recommended for you," no unread counts framed
  as debt.
- Each item shows: title/source, a snippet or the raw text, the note if
  present, and time saved.
- Tapping an item opens the original URL (in a new tab/browser, not
  embedded) or, for text-only items, expands the full text.
- From an item, two lightweight lifecycle actions are enough:
  - **Done** — I've dealt with this, remove from the inbox view.
  - **Keep** — still relevant but not "inbox" anymore, moves out of the pile
    without being deleted (a simple "kept" list, no further organization).
  - (Deleting entirely should also be possible, but is not the primary
    action.)
- No swipe-to-triage gamification, no streaks, no "clear your inbox" nudges.

## 8. Search
- A simple text search over `title`, `raw_text`, and `note`, available but
  **not the primary interface**. It exists for "I remember saving something
  about X a while back," not for daily use.
- No saved searches, no smart filters, no AI-curated views required.

## 9. Explicit non-goals
Do not build, even as a "nice to have," unless the user later asks for it
directly:
- folders, collections, tags, categories
- priorities, due dates, reading schedules, reminders
- streaks, backlog notifications, unread badges framed as pressure
- content recommendations, feeds, "for you"
- social features, sharing between users
- mandatory AI summarization, mandatory metadata entry
- embedded readers/players that replace opening the original source (a
  minimal inline preview is fine if trivial; forcing it is not)

Test for any proposed feature: **does this make capturing or returning to
something easier, or is it turning this into an information-management
system?** If the latter, cut it.

## 10. Sync / continuity
- Whatever is saved on one device (phone or web) must appear in the other
  immediately on next load — one inbox, not a per-device list. A simple
  server-backed store with each client fetching on load satisfies this; no
  offline-first/CRDT complexity is required for v1.

## 11. Tone / non-functional requirements
- No push notifications about backlog size or "you have N saved items."
- No gamification, streaks, or engagement mechanics.
- Fast: capture should feel instant (optimistic UI acceptable — show saved
  immediately, sync in background).
- Reliability of the *original* content is out of scope (if a source page
  disappears, that's expected and fine — this is not an archiving tool).

## 12. Success criteria for v1
Build is done when:
1. Capture from web and from Android's Share Sheet both work in two taps.
2. iOS has a documented working fallback (Shortcut or bookmarklet) that
   takes under 10 seconds.
3. Opening the app shows a clean reverse-chronological pile with no other
   default UI.
4. Items can be marked Done or Kept, and searched by text.
5. The same items show up whether captured on phone or web.
