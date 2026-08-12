# Deferred-Attention Inbox — Build Specification

## 1. One-line summary
A personal "save it for later, with zero friction" inbox that replaces sending
links to yourself on WhatsApp. Capture asks no unnecessary questions.
Return is a single reverse-chronological list. Nothing else.

## 2. Design law (apply to every decision below)
**The cost of capturing something must approach WhatsApp's cost.** If a
feature adds a decision, a field, a screen, or avoidable delay at capture
time, cut it or make it optional and hidden by default. When in doubt, do less.

## 3. Users & accounts
- Single user today (the builder), but **design the data model and auth for
  multiple users from day one** — every saved item belongs to a `user_id`.
- Auth can be minimal. No social features, no sharing between users, no admin
  UI needed now — just don't hardcode a single-user assumption into the
  schema.

## 4. Platforms & capture mechanisms
Two capture surfaces are required. Technology/hosting/stack may evolve, but
the platform behavior below is a product constraint.

### Web (desktop/laptop)
- A one-click "Later" action while browsing (browser extension, bookmarklet,
  or another low-friction mechanism) that captures the current page's URL +
  title without turning capture into a multi-step workflow.

### Mobile
- **Android**: implement as a PWA registered as a Web Share Target
  (`share_target` in the manifest).
- Choosing **Later** from Android's native Share Sheet is itself the save
  action. The user should not be asked to press a second Save button.
- Because a PWA cannot reliably dismiss itself like a native Android Activity,
  a lightweight Saved state may remain visible and the user may need to use
  Android's Back button/gesture to return to the source app. No further save
  action should be required.
- **iOS**: Web Share Target for receiving shares is not supported by
  Safari/iOS. Implement a fallback capture path instead, in order of
  preference:
  1. an iOS Shortcut added to the Share Sheet that sends the shared URL/text
     to the app's capture endpoint;
  2. a bookmarklet or "paste a link" quick-add screen as a manual fallback.
- Document the iOS limitation rather than silently implying native Share Sheet
  receiving works when it does not.

### Optional add without extra friction
- If trivially cheap to add, an optional single-field note at capture time —
  never required and never blocking save.

## 5. Core data model
An **item**:

| Field | Notes |
|---|---|
| `id` | item identity |
| `user_id` | user ownership |
| `url` | nullable; plain-text-only captures are allowed |
| `title` | supplied or best-effort metadata; capture must not depend on enrichment |
| `raw_text` | whatever was actually shared |
| `source_type` | best-effort cosmetic metadata only |
| `note` | optional, freeform |
| `status` | `inbox` (default) / `done` / `kept` |
| `created_at` | drives default chronological sort |
| `updated_at` | last update |

No folders, tags, categories, priorities, or due dates in the schema merely
"for later."

## 6. Capture flow requirements
- Default Android path: **Share → Later → automatically saved.**
- Choosing Later is an intentional save action; do not add another required
  confirmation.
- No required screen asking for a folder, tag, title, content type, reminder,
  reason, or note.
- Capture must work for links and plain text with no URL.
- Validation and persistence are on the critical path.
- Metadata enrichment is not on the critical path. Slow, missing, or invalid
  metadata must not prevent the original shared content from being saved.
- Duplicate URLs are allowed. Saving the same URL again later may be
  intentional.
- If the user must authenticate, preserve the pending shared content through
  authentication and complete the save without asking for a second
  confirmation.

## 7. Inbox / return experience
- Opening the app shows **the pile** — a single reverse-chronological list of
  all `status = inbox` items, grouped loosely by day (Today / Yesterday /
  older) for scanability only, not as a functional filter.
- No dashboard, stats, recommendations, or unread counts framed as debt.
- Each item shows title/source, a snippet or raw text, note if present, and
  time saved.
- Tapping a URL item opens the original URL outside an embedded reader.
  Text-only items can expose their full text.
- Lightweight lifecycle actions:
  - **Done** — dealt with; remove from inbox.
  - **Keep** — still relevant but no longer inbox.
  - deletion should also be possible, but is not the primary action.
- No swipe-to-triage gamification, streaks, or "clear your inbox" nudges.

## 8. Search
- Simple text search over `title`, `raw_text`, and `note`.
- Search is available for retrieval, not the primary daily interface.
- No saved searches, smart filters, or AI-curated views required.

## 9. Explicit non-goals
Do not build unless the user later asks for it directly or real use provides a
clear reason:
- folders, collections, tags, categories;
- priorities, due dates, reading schedules, reminders;
- streaks, backlog notifications, unread-pressure mechanics;
- content recommendations or "for you" feeds;
- social features;
- mandatory AI summarization;
- mandatory metadata entry;
- forced embedded readers/players;
- speculative offline-first synchronization complexity;
- speculative exactly-once/idempotency machinery that slows capture.

Test for any proposed feature: **does this make capturing or returning to
something easier, or is it turning this into an information-management
system?** If the latter, cut it.

## 10. Sync / continuity
Whatever is saved on one device must appear on another on next load. One
server-backed inbox is sufficient for v1; offline-first/CRDT complexity is
not required.

## 11. Tone / non-functional requirements
- No push notifications about backlog size.
- No gamification or engagement mechanics.
- Capture should feel immediate.
- Reliability of the original source content is out of scope; Later is not an
  archiving service.

## 12. Success criteria for v1
Build is done when:
1. Web/desktop capture is low-friction and does not become a multi-step form.
2. Android Share Sheet capture saves when the user chooses Later, without a
   second Save confirmation.
3. iOS has a documented working fallback that takes under 10 seconds.
4. Opening the app shows a clean reverse-chronological pile.
5. Items can be marked Done or Kept, deleted, and searched by text.
6. The same items appear across authenticated clients.
7. Optional metadata/enrichment never becomes a prerequisite for capture.
