# Deferred Attention — Backlog

This is a living inventory of work, not a fixed roadmap or commitment. Ordering within a section does not automatically define slice order.

For detailed history of completed work, see `docs/reflections/`.

## Done

### Foundation
- [x] Next.js + TypeScript application skeleton
- [x] Supabase Postgres integration
- [x] DB-backed read-only health endpoint
- [x] GitHub Actions production pipeline
- [x] Vercel production deployment
- [x] Post-deployment health acceptance check
- [x] Secret/environment handling baseline

### Core inbox
- [x] Multi-user-aware item model
- [x] Supabase authentication
- [x] User ownership / RLS model
- [x] Save URL
- [x] Save plain text
- [x] Reverse-chronological inbox
- [x] Done lifecycle
- [x] Keep lifecycle
- [x] Manual capture
- [x] Same server-backed data across clients

### Android capture
- [x] Installable PWA manifest
- [x] Android Web Share Target
- [x] URL and plain-text share parsing
- [x] Preserve pending share through authentication
- [x] Instant capture: choosing Later automatically saves
- [x] Lightweight Saved/failure state
- [x] Later L + bookmark application icon

## Backlog

### Capture surfaces
- [ ] Desktop/browser one-click capture
- [ ] iOS share-sheet fallback, preferably an iOS Shortcut
- [ ] Manual quick-add polish where useful

### Return / inbox
- [ ] Search across title, raw text and note
- [ ] Notes
- [ ] Delete
- [ ] Day grouping (Today / Yesterday / older)
- [ ] Kept-items view
- [ ] Text-only item expansion/polish

### Link presentation
- [ ] Best-effort background link metadata enrichment
- [ ] Richer preview cards using stored metadata
- [ ] Graceful fallback when enrichment fails

### Performance / PWA
- [ ] Measure real app-open/capture latency
- [ ] Improve PWA startup/caching if measurements show it matters

### Auth / edge cases
- [ ] Authentication polish
- [ ] Important capture/inbox edge cases discovered through use

## Needs evidence

- Perfect capture idempotency / capture keys
- Additional deduplication machinery
- Offline-first synchronization
- Native Android/iOS application

These may become worthwhile, but should not enter the critical path without observed need.

## Explicitly not planned unless the product requirement changes

- Folders, collections, tags or categories
- Priorities and due dates
- Reading schedules/reminders
- Streaks or backlog-pressure notifications
- Social features
- Mandatory AI summarization
- Mandatory metadata entry
- Forced embedded readers/players

## Choosing the next slice

Before beginning a slice:

1. Review `SPEC.md`, `ARCHITECTURE.md`, `PRINCIPLES.md`, and this backlog.
2. Select a small coherent outcome, not simply the next unchecked task.
3. Define the slice scope and write its Gherkin acceptance criteria before implementation.
4. Re-order or defer backlog items when real use provides better evidence.
