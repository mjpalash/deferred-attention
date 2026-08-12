# Working Principles

This file defines how Deferred Attention is built and how its repository documentation is maintained.

## Product principle

**Save first. Everything else later.**

The cost of capturing something should approach the cost of sending it to myself on WhatsApp. If a feature adds a decision, field, screen, network dependency, or delay to the capture path, it needs a strong reason to exist.

Prefer the smallest design that makes capturing something or returning to it easier. Do not gradually turn Later into a general information-management system.

## Development process

Work in small slices. Each slice should leave the application in a coherent, testable state.

The default sequence is:

```text
Define slice scope
      ↓
Write Gherkin acceptance criteria
      ↓
Translate acceptance criteria into executable tests
      ↓
Run the new tests and confirm they fail for the expected reason
      ↓
Write the minimum code needed to satisfy them
      ↓
Run the cumulative test suite
      ↓
Adjust/refactor implementation and tests where implementation teaches us something
      ↓
Manually verify behavior that automated tests cannot prove
      ↓
Update current-state documentation
      ↓
Update BACKLOG.md
      ↓
Write/finalize the slice reflection and preserve its Gherkin as history
```

TDD/BDD guides the work; it does not freeze our thinking. Initial Gherkin and initial tests are hypotheses about the desired behavior. If implementation or real-world use reveals a bad assumption, revise the current requirement and cumulative tests deliberately, and record why in the slice reflection.

A test should fail because behavior, security, or a public contract broke—not because code was renamed, rearranged, or extended.

## Current truth versus history

Different repository documents answer different questions:

- `SPEC.md` — What should the product do now?
- `ARCHITECTURE.md` — How is the system designed now?
- `README.md` — What should someone know when arriving at the repository now?
- `SETUP.md` — How do I set up, run, preview, and deploy the system now?
- `BACKLOG.md` — What has been done, what may be done next, and what has been deferred/rejected?
- `docs/reflections/` — How did our thinking and implementation evolve?
- `tests/` — What must the current system continue to satisfy?

Current-state documents should not preserve obsolete behavior merely for history. History belongs in reflections.

## Slice reflections

Each new slice gets its own folder under `docs/reflections/`, for example:

```text
docs/reflections/
  slice-03/
    reflection.md
    acceptance.feature
```

The slice's Gherkin is historical: it records the acceptance thinking for that slice at that time. Once the slice is complete, do not rewrite it merely to make it agree with later behavior.

The reflection records:
- intended scope;
- what was actually implemented;
- changes to earlier behavior or assumptions;
- why those changes were made;
- problems encountered;
- technical/product lessons;
- manual or deployment verification performed;
- the plan for future work as understood at that time.

Reflections are historical records. Except for obvious corrections, do not rewrite old reflections when later slices change direction.

The project predates this convention, so the original combined Slice 0–2 reflection may remain as a preserved historical exception rather than being artificially rewritten into three documents.

## Test suite

The test suite is cumulative and represents current executable expectations.

It may contain several kinds of tests:

```text
tests/
  unit/
  repository/
  acceptance/
  ...future integration/platform tests
```

`tests/unit/` is intentionally named `unit`; it is one part of the larger test suite.

When later work changes required behavior, update earlier executable tests where necessary. Historical Gherkin is preserved unchanged in the relevant slice reflection folder.

Some behavior—especially real Android Share Sheet behavior and deployed environment behavior—requires manual or live acceptance verification because unit tests cannot prove the complete platform interaction.

## Documentation discipline

At the end of every slice, review all current-state documents. A slice does not need to edit every document, but it must check whether each has become stale.

Review:
- `SPEC.md`
- `ARCHITECTURE.md`
- `README.md`
- `SETUP.md`
- `PRINCIPLES.md`
- `BACKLOG.md`

If a document is unchanged, that should be because it is still accurate, not because it was forgotten.

## Backlog discipline

`BACKLOG.md` is not a commitment or a fixed sequence.

Items may be:
- Done
- Active / next
- Backlog
- Deferred
- Needs evidence
- Rejected

Keep completed work at a high level so the backlog also provides a compact map of product evolution. Detailed history belongs in reflections.

Do not add complexity merely because an idea appears in the backlog.

## Architecture discipline

`SPEC.md` and `ARCHITECTURE.md` are parallel current-state documents and should agree.

The spec describes behavior and constraints without requiring readers to understand the implementation. Architecture describes the technical design used to satisfy that behavior.

Historical architectural reasoning belongs in slice reflections. `ARCHITECTURE.md` should state the design we believe is correct today.

## Definition of slice complete

A slice is complete when:

1. its intended behavior has been clarified;
2. acceptance criteria have been written;
3. relevant executable tests have been added/updated;
4. the cumulative test suite is green;
5. behavior that needs manual/platform verification has been checked;
6. current-state documentation is accurate;
7. `BACKLOG.md` is updated; and
8. the slice reflection and historical Gherkin are preserved.
