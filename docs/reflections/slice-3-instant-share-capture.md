# Reflection — Slice 3: Instant Share Capture

## What changed

This slice started from several days of real phone use rather than from a speculative feature request. The most important observation was that sharing to Later still felt like a mini workflow: Android opened the PWA, Later showed a preview, and I had to press **Save** again. That contradicted the product's central design law: capture should approach the friction of sharing something to myself on WhatsApp.

The resulting change was conceptual as much as technical: **choosing Later in the Android Share Sheet is itself the save action**. The confirmation form was removed and the share flow now persists immediately. The success page exists only to provide confidence that the operation happened; it shows **Saved**, the URL/text that was saved, and a short instruction to use the phone Back button or gesture to return to the originating app.

## Architecture lesson: optimize the critical path

A major design decision was to separate **capture** from everything that can happen later.

The desired critical path is deliberately small:

```text
receive share
  → authenticate
  → validate
  → persist
  → acknowledge
```

Future metadata work—title enrichment, Open Graph image, description, site name, favicon, summaries—must happen after persistence and must never be capable of delaying or breaking capture.

This led to a useful architecture direction for Later:

```text
thin capture client
      ↓
reusable capture logic
      ↓
server-backed persistence
      ↓
optional enrichment later
```

This is also valuable if Later eventually gets a native Android/iOS client. Most of the capture/domain/backend logic remains reusable; only the platform-specific entry mechanism changes.

## Idempotency: choosing the product trade-off

We initially considered adding a generated capture key and database uniqueness constraint so repeated execution of one share could never create two items.

That would have required an extra redirect or extra machinery before persistence. Since there is no unique identifier supplied by Android for a Web Share Target event, deduplicating by URL or text would also have been wrong: saving the same link twice at different times can be intentional.

We therefore chose the product-appropriate trade-off:

> **Fast save is more important than perfect exactly-once semantics.**

The implementation should avoid obvious self-generated double submission, but it should not add latency merely to defend against an unobserved edge case. If duplicate saves become a real problem, solve that problem later based on evidence.

This was a useful reminder not to optimize theoretical correctness at the expense of the product's defining property.

## PWA limitation discovered

The desired mobile experience would ideally be:

```text
X
  → Share
  → Later
  → save
  → Later closes
  → back to X
```

The PWA Web Share Target cannot reliably dismiss itself and return control to the originating Android application. Android launches the PWA at the share target URL, and the web application does not receive a dependable equivalent of a native Android Activity `finish()` operation.

For now the UX is therefore:

```text
X
  → Share
  → Later
  → save
  → Saved + URL/text
  → user presses Back
```

This is acceptable for the PWA, but it is an important future-native-app requirement. A native Android share receiver would be able to save and immediately finish, returning the user to the source app.

## Testing lesson: tests should protect behavior, not syntax

During this slice we discovered that several existing tests were checking implementation shape rather than useful behavior.

Examples included assertions that:
- a particular component name did not appear in a source file;
- a specific function name was imported;
- query parameters appeared in one exact order;
- an object had exactly a certain set of keys;
- certain non-goal words never appeared in migration SQL.

One test failed even though the behavior was correct because `handleShareCapture` happened to contain the substring `ShareCapture`. That was a clear signal that the test was protecting syntax rather than behavior.

We reviewed the suite and removed or rewrote these brittle tests.

The principle going forward is:

> **A test should fail because behavior, security, or a public contract broke—not because code was renamed, rearranged, or extended.**

Test count itself is not a useful goal. A smaller suite of meaningful tests provides more confidence and creates less refactoring friction.

There are legitimate structural contract tests. For example, the PWA manifest test is useful because Android depends on the externally visible `share_target` configuration. Likewise, database/RLS behavior is important, although eventually it would be better tested against a real database than by searching SQL source strings.

## TDD process

The slice followed the intended workflow:

```text
clarify scope
  → write Gherkin
  → add failing tests
  → implement minimum behavior
  → clean tests
  → add regression coverage
  → run full project checks
```

An important process lesson was that the red tests themselves also deserve review. TDD does not mean every test written during the red phase is automatically worth preserving forever.

Some tests are scaffolding for thinking. Once the design is clearer, weak tests should be removed rather than fossilized.

## Tooling and patch workflow lessons

A few generated patches failed because they assumed exact local file contents. Since my local working tree was ahead of the pushed GitHub branch, reconstructed patches could become brittle.

The useful rule is:

- GitHub is the source of truth for pushed code.
- Local uncommitted code is newer when explicitly stated.
- Use exact local contents before generating a context-sensitive patch.
- For tiny changes, a clear manual edit can be safer than an unnecessarily clever patch.

We also again saw `next-env.d.ts` change automatically between Next.js dev/build modes. That generated change was unrelated to Slice 3, so it was restored rather than included in the feature commit.

## Full verification

The project's `npm run check` command is a useful final local gate:

```text
typecheck
  → unit tests
  → repository checks
  → production build
```

Having all four green provides much stronger confidence than unit tests alone.

However, Android Share Sheet behavior is inherently platform behavior. Unit tests cannot prove the complete real interaction, so the final acceptance gate remains testing the deployed Preview on a phone.

## Visual identity

The old app icon was an unexplained **E**, which made the application look accidental. During this slice we selected a simple **L + bookmark** mark: a light L on a dark rounded square with a small lavender bookmark.

The icon intentionally avoids a clock, because Later is not fundamentally a reminder/scheduling app. It also avoids looking purely like a reading application, because the product can save links and plain text from many sources.

## What I would remember from this slice

The biggest lesson is that the best architecture followed directly from the product priority:

> **Save first. Everything else later.**

That principle simplified the flow, rejected unnecessary idempotency machinery, established a reusable capture boundary, clarified where enrichment belongs, and even helped decide which tests were worth keeping.
