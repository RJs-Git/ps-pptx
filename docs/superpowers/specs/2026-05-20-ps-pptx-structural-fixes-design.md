# Design: ps-pptx Structural & Directional Fixes (2026-05-20)

## Source of truth

The full spec lives at [`docs/fix-plan-structural-2026-05-20.md`](../../fix-plan-structural-2026-05-20.md). This document is a thin wrapper that records brainstorming-pass decisions and adjustments on top of that spec. Read the source plan first; the items below are deltas.

## Scope confirmation

Verified against current code (commit `ed0bbf3`). All references in the source plan are accurate:

- `overFooter` flag exists at `theme/index.js:229` and `theme/layout.js:38-39, 241`.
- `checkColor` (`theme/index.js:203-212`) uses `String(val).toUpperCase()`, which produces `"[OBJECT OBJECT]"` on object input.
- `addBody` enforces 10–12pt strictly at `theme/index.js:351`.
- Balance heuristics in `theme/layout.js:251-294` are a single `balance` bucket emitted as warnings only.
- `addFooter` defaults `dateText = "XX.2026"` at `theme/index.js:260`.
- `heatmap.js` has no legend; `matrix2x2.js` accepts a single `highlight` key without per-quadrant severity.
- `reference/patterns/index.js` does not export `anchorStat` or `stackCommentary`.

## Adjustments to the source plan

1. **Hard-cut `overFooter` → `bottomBandPolicy`.** The source plan calls for a deprecation period. Adjusted: replace directly, migrate the two internal call sites in `theme/index.js` (`addFooter` recordPlacement). No console-warn shim. Reason: callers are entirely internal; deprecation cycle adds code without benefit.

2. **Cross-cutting items deferred.** `theme/contract.md`, `theme/lint.js`, and inline JSDoc `@throws` are out of scope for this pass. The paired Deck Studio P2-6 is being handled by another agent; coupling work here risks entangling the two efforts.

3. **P2-10 ordering made explicit.** P1 patterns ship without `parityGroup`; P2-10 retrofits `parityGroup` onto the relevant patterns (`scqa3col`, `beforeAfter`) after they are known-good.

## Execution order

1. P0-1 — Footer-band collision (`bottomBandPolicy`)
2. P0-2 — Severe balance → error (split density / center-of-mass, tier severity)
3. P1-7 — Color type-guard at API boundary
4. P1-9 — `addBodyDense` + better `addBody` error
5. P1-3 — `heatmap` legend + sizing throw
6. P1-4 — `matrix2x2` per-quadrant severity + uniform-severity throw
7. P1-5 — New `anchorStat` pattern
8. P1-6 — New `stackCommentary` pattern
9. P1-8 — Cover-slide date default to current `MM.YYYY`
10. P2-10 — `parityGroup` opt + retrofit `scqa3col` and `beforeAfter`

## Per-fix acceptance

For every fix:

- Code change as described in the source plan (with the adjustments above).
- Unit-test coverage in `theme/layout.test.js` or a new pattern-specific test file.
- `node theme/layout.test.js` passes.
- `node reference/patterns/smoke.test.js` passes (validateDeck-clean).
- One commit per fix; commit message names the P-number and the change. No push.

## Stop conditions

If at any fix the source plan turns out to be stale (e.g., a referenced line has already moved, a referenced API has changed), stop and report rather than improvise.
