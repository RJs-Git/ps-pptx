# Fix Plan — ps-pptx Structural & Directional Fixes (2026-05-20)

## Context

Live end-to-end deck generation through Deck Studio (project `6ebaef49-...`, "The Rise of Small Language Models in 2026") produced an on-brand 16-slide deck that passed `qa.js` with `ok: true` but still shipped with **visible layout defects** and a **fragile build loop** that cost two failed `node build_deck.js` runs before producing valid output.

The defects fall into two buckets:

1. **Things `qa.js` saw and warned about but didn't block** — 8 of 16 slides flagged for "balance" (>85% content fill or center-of-mass off). Warnings, not errors, so the QA gate passed.
2. **Things the runtime guards in `theme/index.js` didn't see at all** — patterns that produce poor output but stay inside the palette/font/bounds rules.

This plan addresses ps-pptx structurally so the next agent that builds a deck through this theme is **less likely** to produce these weaknesses, and **more likely** to fail loudly when it does. The Deck-Studio-side fixes (prompt tightening, pre-execution lint) are in the sibling plan at `~/Documents/GitHub/Deck Studio/docs/fix-plan-e2e-qa-2026-05-20.md`.

## Observed weaknesses, mapped to slides

| Slide | Pattern | Defect |
|---|---|---|
| 6 | Anchor stat layout | Hero numeral "~90%" overflows visually relative to subtitle; the three sub-stats below feel decoupled from the headline (no visual binding). |
| 8 | `heatmap` | No legend. Red/pink/gray cells render without a key — the matrix is decorative rather than informative. |
| 11 | Stack + commentary | Right-column commentary uses `—` prefixes as pseudo-bullets; loosely connected to the left stack; orphaned quote band at bottom. |
| 12 | `matrix2x2` | Only one quadrant highlighted in pink; other three are uniformly gray. Axis labels read but the quadrant-severity signal is wasted. |
| 14 | Two-question pattern | Footer-band overlap; italic note clipped behind the page-number band. |
| 15 | Sources / appendix | Footer overlaps the bottom row of bullets. **This is a real layout bug, not a balance warning.** |
| Cover | Date placeholder | "XX.2026" leaked through — template placeholder, not filled by the builder. |
| 3 | SCQA 2-column | Asymmetric vertical fill — left grey box has dead space, right column is full. Visually unbalanced. |

Plus one cross-cutting symptom from the build process:

- **Two failed `node build_deck.js` runs** before success. First on `fontSize: 9` (theme min is 10). Second on a color value that arrived as `[object Object]` — meaning a pattern helper or builder passed an object where a hex string was expected, and the throw happened deep inside `addBox`.

## Defects, ordered by leverage

| # | Severity | Title | Owns |
|---|---|---|---|
| 1 | P0 | Footer-band collision is silent at runtime — `qa.js` only flags it as a warning | `theme/layout.js`, `theme/qa.js` |
| 2 | P0 | "Balance" warnings should block when severe | `theme/qa.js` |
| 3 | P1 | `heatmap` pattern produces a legend-less matrix | `reference/patterns/heatmap.js` |
| 4 | P1 | `matrix2x2` defaults make wasted-quadrant outputs easy | `reference/patterns/matrix2x2.js` |
| 5 | P1 | Hero-stat slide has no canonical pattern — every deck reinvents it | new `reference/patterns/anchorStat.js` |
| 6 | P1 | "Stack + commentary" pattern is missing — slide 11 reinvented it badly | new `reference/patterns/stackCommentary.js` |
| 7 | P1 | Color-arg type confusion (`[object Object]`) throws deep, not at the API boundary | `theme/index.js` (`checkColor`) |
| 8 | P2 | Cover-slide date placeholder relies on every builder remembering to fill it | `theme/index.js` (`addCover`), `reference/layouts.md` |
| 9 | P2 | Body-fontSize lower bound (10pt) is brittle for two-column dense content | `theme/index.js`, brand-spec review |
| 10 | P2 | No "two-column with parity" guard — left vs right fill imbalance is invisible | `theme/qa.js` |

---

## P0-1: Footer-band collision is silent at runtime — `qa.js` only flags it as a warning

### Symptom

Slide 15 of the produced deck has the footer ("© Publicis Sapient   XX.2026   15") *overlapping* the last row of source bullets. This is reproducible: running the builder again produces the same overlap. The runtime guards in `theme/index.js` *do* check `crosses the footer band (>6.75)`, but `qa.js` flagged it only as a `footer` warning ("16 slides but only 10 addFooter calls (gap 6)") — the gap-count check, not the overlap check.

### Root cause

The runtime guard uses `addBody`'s and `addBox`'s `y + h <= 6.75` invariant, but **only when `opts.overFooter !== true`**. Slide 15's bullets are likely emitted via a pattern (or directly via `addBox`) with `overFooter: true` set defensively to avoid an unrelated false positive — once `overFooter` is set, the bound check is skipped and overlap is allowed.

`overFooter` is too coarse a flag. It exists for full-bleed images and section dividers that genuinely *do* extend to the bottom edge. It shouldn't grant permission to overlap the footer **band where text lives**.

### Fix

Split `overFooter` into two narrower flags and harden the check.

In `theme/layout.js` and `theme/index.js`:
- Replace `overFooter: boolean` with `bottomBandPolicy: 'enforce' | 'fullBleed' | 'sectionDivider'`. Default `'enforce'`.
- `'enforce'`: `y + h <= FOOTER_BAND_TOP` (6.75 today). Throws on violation.
- `'fullBleed'`: allows `y + h <= H` (the page bottom). Used for cover slides and full-bleed images. **Forbids any text element.**
- `'sectionDivider'`: allows `y + h <= H`. **Allows text but only if `markRole(slide, 'section-divider')` is set.**

Migrate existing `overFooter: true` call-sites by reading what they're doing — most are full-bleed images and should be `'fullBleed'`. Deprecate `overFooter` for one minor version with a console warning, then remove.

In `theme/qa.js`, promote a literal-overlap finding (any text element whose y+h > footer-band top, regardless of policy) to **error**, not warning. The current "missing addFooter" gap-count warning stays as-is.

### Verification

- Vitest in `theme/layout.test.js`: case where `addBody` with `bottomBandPolicy: 'enforce'` throws on overlap; `'fullBleed'` allows non-text only; `'sectionDivider'` requires `markRole`.
- Snapshot test: re-run the smoke fixture (`reference/patterns/smoke.test.js`) and verify no diff.
- Manual: rebuild the SLM deck against the fixed theme — slide 15 must throw at build time, not produce silent overlap.

### Blast radius

API change with deprecation period. Builders using `overFooter: true` will see a deprecation warning for one release, then have to migrate. The migration is mechanical (`overFooter: true` → `bottomBandPolicy: 'fullBleed'` for images, → throw + fix layout for text).

---

## P0-2: "Balance" warnings should block when severe

### Symptom

`qa.js` produced 8 "balance" warnings on the SLM deck (>85% content fill or center-of-mass off). Run still passed because they're warnings. **Five of those slides have visibly cramped or off-center output** that a senior consultant would reject. The QA gate doesn't reflect what a human sees.

### Root cause

`balance` is a single bucket spanning two distinct phenomena:
- **Density** (% of content area filled) — high fill is sometimes correct (data-dense tables) and sometimes wrong (a few items with no breathing room, like slide 5's four cards).
- **Centering** (center-of-mass offset) — usually a real defect (slide 9 with -40% vertical offset = bottom-aligned content with empty top).

### Fix

1. Split `balance` into `density` and `center-of-mass`.
2. Tier severity by magnitude:
   - `density >= 95%`: error.
   - `density 85–94%`: warning *unless* `markRole(slide, 'data-dense')` is set, then info.
   - `centerOfMass.absVertical >= 30%` or `absHorizontal >= 30%`: error.
   - Lower offsets: warning.
3. Add a new role tag `markRole(slide, 'data-dense')` that exempts from density caps for legitimate cases (deployment tables, sources lists). Sources slide must still respect the footer band — that's P0-1.

### Verification

- Vitest the new severity tiers against fixtures.
- Re-run `qa.js` against the SLM deck — slides 14, 15 should now error (forcing a real fix), slide 9 should error (center-of-mass), slides 2/4/5/7/10 stay warnings.

### Blast radius

QA gate becomes stricter. Some existing decks may regress to `ok: false`. Acceptable — the goal is "QA pass means presentable."

---

## P1-3: `heatmap` pattern produces a legend-less matrix

### Symptom

Slide 8 ("Quality has commoditized — license, indemnity & distribution win") renders a 7×5 heatmap with red, pink, and gray cells. Without a legend, the reader can't tell what the colors mean. The footer note ("MLPerf signal: …") is unrelated to decoding the matrix.

### Root cause

`reference/patterns/heatmap.js` accepts `colHeaders`, `rowHeaders`, `scores` but provides no legend affordance. The pattern documents the score-to-fill mapping (`≥0.66 → RED`, etc.) in a comment, but doesn't *render* it.

### Fix

1. Make the legend mandatory in the pattern. Reserve a 0.6"-tall band at the bottom of the heatmap region (above the footer band) for a legend with three swatches: RED = "Strong / leader", PINK = "Partial / qualified", GRAY_LIGHT = "Weak / absent".
2. Allow customization via `content.legend = { strong: 'High', partial: 'Mid', weak: 'Low' }` — if absent, defaults render.
3. Throw at runtime if the resulting heatmap region (header rows + cells + legend) exceeds the available content area, instead of silently overflowing. Guide the agent toward fewer rows.
4. Add a `content.threshold = { strong: 0.66, partial: 0.33 }` knob so the deck author can tune buckets without forking the pattern.

### Verification

- Vitest: render heatmap fixture and assert legend swatches placed at the documented coordinates.
- Visual snapshot via the smoke test.

### Blast radius

Existing `heatmap` callers will see slightly less vertical room for cells. The legend takes 0.6" out of typical 4" region — ~15%. If a deck overflows, the new throw points the agent at the fix.

---

## P1-4: `matrix2x2` defaults make wasted-quadrant outputs easy

### Symptom

Slide 12 ("Governance must travel with the workload") renders a 2×2 with one quadrant pink and three quadrants identical gray. The quadrant-severity signal — the entire reason to use a 2×2 — is wasted.

### Root cause

`reference/patterns/matrix2x2.js` accepts `quadrants` (4 cells: `tl`, `tr`, `bl`, `br`) and renders all four with the same fill unless the caller sets per-quadrant fills. The caller didn't, and the pattern didn't push back.

### Fix

1. Require per-quadrant *severity* in the pattern signature: `quadrants: { tl: { label, body, severity }, tr: ..., bl: ..., br: ... }`. `severity ∈ { 'high', 'medium', 'low' }`. Pattern maps severity to fill (`high → PINK`, `medium → GRAY_LIGHT`, `low → WHITE`).
2. **Throw** if all four severities are equal — that's the misuse case slide 12 hit. Error message: "matrix2x2 with uniform severity defeats the visual signal — use a list pattern instead, or differentiate severity."
3. Optional: allow override via per-quadrant `fill` for hand-tuned cases, but then `severity` is required-but-ignored (we still record it for downstream tooling).

### Verification

- Vitest: uniform-severity fixture throws; differentiated fixture renders with three distinct fills.
- Visual snapshot.

### Blast radius

Breaking change to the pattern signature. Bump major in `patterns/index.js` exports if versioned, or update the small set of callers (this is internal).

---

## P1-5: Hero-stat slide has no canonical pattern

### Symptom

Slide 6 ("AT&T's SLM-first rebuild proves the architecture in production") is a hero-stat layout: one giant numeral (~90%) + supporting subtitle + three small sub-stats below. The builder hand-rolled this with `addBox` calls. The result has the giant numeral overflowing the subtitle's expected anchor, and the three sub-stats look detached.

### Root cause

Hero stats are a recurring consulting-deck pattern — every important pitch has at least one "this is the number" slide. ps-pptx has no canonical pattern for it, so every builder reinvents it from primitives, and most do it imperfectly.

### Fix

Add `reference/patterns/anchorStat.js`:

```js
// content = {
//   subhead?: string,
//   title: string,
//   stat: { value: string, unit?: string, caption: string },
//   subStats?: Array<{ value: string, caption: string }>, // 0–4
//   footnote?: string,
// }
module.exports = function anchorStat(slide, T, content) {
  // 1. Guards: stat.value must be ≤ 8 chars; subStats ≤ 4; title goes into addH1 with §5 size.
  // 2. Hero numeral: T.FONT_TITLE at 80–120pt (display: true), centered horizontally.
  //    Caption underneath in T.FONT_BODY at 12pt, single line, italic.
  // 3. Sub-stats: even-spaced row at y=5.0, each in a centered cell of width CONTENT_W/N.
  //    Stat in 28pt FONT_TITLE, caption in 10pt FONT_BODY.
  // 4. Footnote: 9pt italic GRAY_MID, anchored just above the footer band (y=6.55).
  // 5. Throw if subStats.length > 4 or stat.value contains a line-break.
  // 6. Always calls addFooter unless markRole-d as cover/divider.
}
```

Document in `reference/patterns/index.js` and `reference/layouts.md`. Add a smoke test fixture.

### Verification

Re-render the AT&T slide using `anchorStat` instead of hand-rolled `addBox`es. Compare to the original — should be tighter and more visually bound.

### Blast radius

Additive pattern. No existing caller affected.

---

## P1-6: "Stack + commentary" pattern is missing — slide 11 reinvented it badly

### Symptom

Slide 11 ("Margin migrates up the stack") is a left-column layered stack diagram + right-column commentary. The right column uses `—`-prefixed pseudo-paragraphs, loosely connected to the left-column layers. Plus an orphaned quote band at the bottom.

### Root cause

No canonical pattern for "diagram-on-left, structured commentary on-right". Builders fall back to two `addBody` calls and lose the visual link between stack rows and their explanations.

### Fix

Add `reference/patterns/stackCommentary.js`:

```js
// content = {
//   subhead?: string,
//   title: string,
//   stack: Array<{ label: string, fill: 'red'|'pink'|'gray-mid'|'gray-light', emphasis?: boolean }>,
//   commentary: Array<{ // exactly stack.length items
//     stackIndex: number, // which row this comments on; pattern draws a connector
//     text: string,
//   }>,
//   pullQuote?: { text: string, source?: string },
//   pageNum?: number,
// }
module.exports = function stackCommentary(slide, T, content) {
  // Guards:
  //   - stack.length === commentary.length (else throw — explicit pairing)
  //   - stack.length 3–6
  //   - emphasized rows ≤ 2
  // Layout:
  //   - Left 5" wide: stack rows, equal height, color-coded.
  //   - Right 4.5" wide: commentary, with a faint gray connector line from each
  //     row's right edge to its commentary's left edge.
  //   - pullQuote rendered as a band at y=6.0, 0.5" tall, full width, centered,
  //     italic in FONT_MONO_LIGHT.
}
```

The forced 1:1 pairing is the structural fix — it makes it impossible to write commentary that doesn't anchor to a stack row.

### Verification

Vitest + smoke. Re-render slide 11 using the pattern.

### Blast radius

Additive pattern.

---

## P1-7: Color-arg type confusion throws deep, not at the API boundary

### Symptom

Build attempt 2 failed with `color "[object Object]" is not in the PS palette`. The throw came from `theme/index.js:207`, deep inside `addBox`. The agent had to re-read the theme to figure out what call site passed an object.

### Root cause

`checkColor(name, color)` does `String(color).toUpperCase()` and pattern-matches the result against the palette. When `color` is an object (e.g., `{ color: 'E90130' }` instead of just `'E90130'` — a common mistake when the API in some contexts wants `{ fill: { color: '...' } }` and in others wants `{ fill: '...' }`), the stringification yields `'[object Object]'` and the message is unhelpful.

### Fix

1. In `checkColor`, **type-guard at the entry**. If `typeof color !== 'string'`, throw a more specific error: `addBox.fill: expected a hex string (e.g., "E90130"), got an object — did you mean { fill: { color: "E90130" } }?`.
2. **Unify the API.** Today `addBox` accepts `fill` as either `string` or `{ color, transparency? }`. The mixed shape is the cause. Pick one: prefer the object shape for `fill` and `line` (since transparency is sometimes wanted), and have `string` shorthand auto-promoted at the public-API boundary in `addBox`. Document in `reference/helpers.md`.
3. Add a TypeScript-style JSDoc declaration for `addBox` opts so editors and the calling agent see the expected shape inline.

### Verification

Vitest: passing an object where a string is expected throws the new helpful error; passing a string where an object is expected auto-promotes; passing a malformed object throws.

### Blast radius

`checkColor` becomes friendlier; no API break.

---

## P1-8: Cover-slide date placeholder relies on every builder remembering to fill it

### Symptom

The produced cover reads "Small language models in 2026" with a footer "© Publicis Sapient   XX.2026". The "XX.2026" is a template placeholder that the builder forgot to substitute.

### Root cause

`addFooter`'s default text is `"© Publicis Sapient   XX.YYYY"` (or similar). The builder is expected to override it with the actual date but typically doesn't on the cover.

### Fix

1. Make the date default to the current month/year at runtime: `XX.YYYY` → `MM.YYYY` from `new Date()`. Easy default that's always correct enough.
2. Allow override via `addFooter(slide, { date: 'May 2026' })` for explicit control.
3. Document in `reference/layouts.md` that `addCover` automatically calls `addFooter` with the runtime-derived date and the brand-spec layout.
4. Optional: introduce `addCover(slide, { title, subtitle, byline, date? })` that hides the wiring entirely. This raises the floor: every cover gets a consistent layout without per-deck reinvention.

### Verification

Run any existing builder; cover footer reads "05.2026" (or current month).

### Blast radius

Default change — old decks rebuilt today will pick up today's date, which is what the user wanted in the first place.

---

## P1-9: Body-fontSize lower bound (10pt) is brittle for two-column dense content

### Symptom

Build attempt 1 failed on `fontSize: 9` — the agent tried 9pt to fit dense content. The brand spec says 10pt minimum; the agent had to widen the column or rewrite to fit.

### Root cause

`addBody` enforces 10–12pt strictly. For two-column content with long bullets (slides 8, 9, 11, 15 in the SLM deck), 10pt is genuinely tight. The agent's instinct (drop to 9pt) is forbidden, and the alternative (widen / shorten) requires layout reasoning the agent often skips.

### Fix

This is part-spec, part-tooling. **Don't loosen the floor blindly** — 10pt is brand-correct. Instead:

1. Add a `addBodyDense(slide, text, opts)` helper that enforces 9–10pt **and** requires `markRole(slide, 'data-dense')`. Use only for sources lists, deployment tables, etc.
2. Improve the `addBody` error to point at the right escape hatch: `"...outside the body range 10–12pt. For data-dense slides (sources, tables), use addBodyDense + markRole(slide, 'data-dense'). For oversized stats, pass { display: true }."`
3. Document in `reference/helpers.md` when each is appropriate.

This separates the two legitimate cases (body text, dense reference text) without cracking the brand floor open.

### Verification

Vitest: `addBodyDense` requires the role tag; `addBody` error message updated.

### Blast radius

Additive helper + improved error message.

---

## P2-10: No "two-column with parity" guard

### Symptom

Slide 3 has a left grey column with dead space below four bullets; the right column is full to the bottom. Visually unbalanced. `qa.js` doesn't see this — its center-of-mass check is per-slide, not per-column.

### Root cause

When two visually parallel content boxes (e.g., SCQA "before/after") have very different fill ratios, the slide reads as half-finished. ps-pptx has no concept of "these two boxes are visually parallel."

### Fix

1. Add an optional `parityGroup` opt to `addBody` and `addBox`: `addBody(slide, text, { parityGroup: 'compare-2024-2026' })`.
2. `qa.js` checks: for any group with ≥2 elements, compute fill ratios; flag a **warning** if max-min > 30 percentage points. Tier to **error** if > 50 points.
3. Patterns like `scqa3col`, `beforeAfter`, etc. use `parityGroup` automatically for their parallel cells.

This makes the imbalance machine-detectable.

### Verification

Vitest with parity-group fixtures; visual smoke against slide-3-style fixture.

### Blast radius

Additive metadata. Existing decks unaffected unless they opt in (or use patterns that opt in).

---

## Cross-cutting: agent-experience fixes

Two changes that aren't bugs but reduce build-loop fragility (working with the Deck Studio prompt-tightening fix):

1. **Inline JSDoc with explicit `@throws` for every helper.** Today the throw conditions live in `reference/qa.md`. Putting them in the source ensures they appear in any IDE/agent context that reads source on the fly.

2. **A consolidated `theme/contract.md`** ≤2 KB summarizing every guard the agent will hit. Designed to be embedded as a system-prompt fragment by Deck Studio. Keep in sync via a small generator from the existing reference docs.

3. **A `theme/lint.js`** entry point (consumed by Deck Studio's pre-execution lint, P2-6 in the sibling plan) that statically analyzes a builder file and returns structured findings without running it. Catches the `fontSize: 9` and `[object Object]` mistakes before the agent burns a Bedrock round-trip.

---

## Order of operations

1. **P0-1** (footer-band collision) and **P0-2** (severe balance → error) — these block visibly broken decks from passing QA.
2. **P1-7** (color type-guard) and **P1-9** (`addBodyDense` + better error) — quick wins that immediately reduce build-loop failures.
3. **P1-3, 4, 5, 6** (heatmap legend, matrix2x2 severity, anchorStat, stackCommentary) — parallel work; each is a self-contained pattern change.
4. **P1-8** (cover date default) — trivial.
5. **P2-10** (parity group) — last; depends on patterns being updated to opt in.
6. **Cross-cutting** (`contract.md`, `lint.js`) — alongside Deck Studio's P2-6.

## Out of scope

- Brand-spec changes (palette, font sizes, margins) — would require sign-off from PS brand.
- Pattern additions beyond hero-stat and stack-commentary — wait for the next deck run to identify which others recur.
- LibreOffice-specific rendering quirks (we render PDFs through it); track separately.

## Validation strategy

After all P0/P1 changes land, re-run the SLM-deck E2E flow through Deck Studio with the existing prompt and content. Expected outcome:

- Build succeeds on first or second `node build_deck.js` (down from three attempts).
- `qa.js` returns `ok: true` only if slides 14 and 15 are actually fixed (not just warned).
- Slides 6, 8, 11, 12 are rendered via canonical patterns with no hand-rolled `addBox` arithmetic.
- The result reads cleaner on first review without manual touch-up.

Snapshot the resulting deck PDF as `reference/regression/slm-2026.pdf` so future structural changes have a known-good baseline.
