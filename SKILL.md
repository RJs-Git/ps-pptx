---
name: ps-pptx
description: Use when creating, editing, or generating any Publicis Sapient (PS) presentation, deck, or slides — including client decks, internal PS presentations, PS-branded pitch decks, capability decks, or any .pptx that should reflect the Publicis Sapient brand. Triggers on mentions of "Publicis Sapient", "PS deck", "PS slides", "PS template", or any request to make slides "in PS style", "on-brand", or "in our template".
---

# ps-pptx Skill

PS-themed deck generation. **Fundamentals are rigid; layout composition is yours.**

The brand fundamentals below — colors, fonts, margins, title sizes, title placement, header (logo + subhead tag), footer — are **non-negotiable**. Inside those rails, you are expected to design slide layouts that fit the content, not pick from a fixed catalog. Use this skill's tokens and helpers for everything that touches the brand surface.

This skill is the **single point of entry** for PS-branded `.pptx` work — creating from scratch, editing existing decks, reading/extracting content, and visual QA.

---

## Fundamentals (rigid — do not deviate)

### 1. Colors — only these hex codes anywhere in deck code

| Token | Hex | Use |
|-------|-----|-----|
| `RED` | `E90130` | Primary brand red |
| `RED_DARK` | `AE0021` | Darker red, sparingly |
| `PINK` | `FA8C9A` | Borders on red backgrounds |
| `BLACK` | `000000` | Body text on white |
| `WHITE` | `FFFFFF` | Body text on red |
| `GRAY_MID` | `6B6B6B` | Muted secondary text |
| `GRAY_LIGHT` | `D9D9D9` | Image placeholders |
| `CHART_GRAY` | `BBBBBB` | Middle series in 3-series bar chart **only** |

No alternative palettes. No "topic-informed colors". No gradients. Backgrounds are `WHITE`, `RED`, or `BLACK` only.

### 2. Fonts — only these four

- `FONT_TITLE` (`Lexend Deca SemiBold`) — titles, headlines, large display text
- `FONT_BODY` (`Roboto`) — body copy, table cells, captions
- `FONT_MONO` (`Roboto Mono Medium`) — footers, subhead tags, agenda numerals, stat labels
- `FONT_MONO_LIGHT` (`Roboto Mono Light`) — section-divider numerals, oversized display numerals

Always reference via token, never the string literal.

### 3. Geometry & margins

- 16:9 wide: `W = 13.333"`, `H = 7.5"` (`pres.layout = "LAYOUT_WIDE"`).
- L/R margin: `MARGIN_L = MARGIN_R = 0.667"`. Content width: `CONTENT_W = 12.0"`.
- **Nothing crosses the L/R margin** except a deliberate full-bleed image or full-bleed colored band.
- Top safe zone above the title: `0.667"` (the logo / subhead-tag band).
- Bottom safe zone below content: `0.625"` (the footer band, baseline at `y = 6.875`).

### 4. Header band — logo and subhead tag are mutually exclusive

The logo and the subhead tag occupy the same top-left region and **must never appear on the same slide**. They collide: the subhead tag sits at `y=0.483`, the logo at `y=0.667` (height `0.624`), and the H1 at `y=0.758`, all sharing `x=0.667`. Putting both on one slide overlaps the logo with the subhead and title — a visible brand defect.

- **Content slides** (anything with a title + body — the vast majority): use **`addSubheadTag(slide, text, color?)`** only. **Do NOT call `addLogo` on content slides.** Mono 10pt at `(0.667, 0.483)`. The subhead tag is optional; if omitted, the slide simply has no top-band element. The PS brand is carried by the footer (`© Publicis Sapient`) and the title color/typeface, not a per-slide logo.
- **Covers, section dividers, "Thank you" closer, and end-card logo slides**: use **`addLogo(slide, variant)`** only — never paired with a subhead tag. Always at `(0.667, 0.667)`, size `1.149 × 0.624`. Variants: `"color"` on white, `"white"` on red/black, `"black"` for mono-on-white.

If you catch yourself adding both to the same slide, stop — pick one based on the slide's role above.

### 5. Title placement & sizing

Title baseline (`y`) and box are fixed by `addH1`'s defaults: `x = 0.667, y = 0.758, w = 12.0, h = 1.21`. Override `y/h` only for the canonical roles below. **`x` and `w` do not change** unless the title is paired with a half-width column (then `w` shrinks but `x` stays at the left margin or moves to the column's left edge).

Allowed title sizes — pick the one that matches the role; no arbitrary values:

| Role | `fontSize` | Color | Notes |
|------|------------|-------|-------|
| Content slide title (1–2 lines) | `38` | `RED` (white bg) / `WHITE` (red bg) | Default |
| Long content headline (3–4 lines) | `32` | same | When 38pt would wrap to >2 lines |
| Dense / multi-line headline | `26` | same | Three-up explainers, sidebar layouts |
| Cover, 1-line | `72` | `WHITE` | Red background |
| Cover, 2-line | `66` | `WHITE` | Red background |
| Cover, 3-line | `54` | `WHITE` | Red background |
| Section divider headline | `96` | `WHITE` | Paired with giant `FONT_MONO_LIGHT` numeral |
| "Thank you" closer | `56` | `WHITE` | |

If your headline doesn't fit any of these roles, the headline is wrong — rewrite it, don't invent a size.

### 6. Footer (mandatory on every slide except covers, "Thank you", and end-card logo slides)

`addFooter(slide, { color, pageNum, dateText })` renders `© Publicis Sapient` + date at `(0.667, 6.875)` and the page number at `(12.038, 6.875)`. Color: `WHITE` on red backgrounds, `RED` on white. Mono 8pt, fixed.

### 7. Required imports

```js
const PptxGenJS = require("pptxgenjs");
const path = require("path");
const T = require(path.join(require("os").homedir(), ".claude/skills/ps-pptx/theme"));
const {
  RED, RED_DARK, PINK, BLACK, WHITE, GRAY_MID, GRAY_LIGHT, CHART_GRAY,
  FONT_TITLE, FONT_BODY, FONT_MONO, FONT_MONO_LIGHT,
  W, H, MARGIN_L, MARGIN_R, CONTENT_W,
  LOGO_WHITE, LOGO_COLOR, LOGO_BLACK, MEDIA,
  addLogo, addFooter, addSubheadTag, addH1, addBody, addBox,
  instrument, markRole, writeDeck,
} = T;

const pres = instrument(new PptxGenJS()); // enables per-slide validation
pres.layout = "LAYOUT_WIDE";
// …build slides…
await writeDeck(pres, "deck.pptx"); // throws if any slide is non-compliant
```

Node resolves `theme/` to `theme/index.js` automatically.

### 8. Helpers — never inline equivalents

| Element | Helper |
|---------|--------|
| Logo | `addLogo(slide, "white"\|"color"\|"black")` |
| Subhead tag | `addSubheadTag(slide, text, color?)` |
| H1 / page title | `addH1(slide, text, opts?)` |
| Body | `addBody(slide, text, opts?)` |
| Footer | `addFooter(slide, { color?, pageNum?, dateText? })` |
| Custom card / shape | `addBox(slide, { x, y, w, h, shape?, fill?, line?, text?, textOpts? })` |
| Mark non-content slide role | `markRole(slide, "cover"\|"section-divider"\|"thank-you"\|"end-card")` |
| Layout primitives | `row`, `column`, `grid`, `stack` — see "Layout primitives" below |
| Validate + write | `await writeDeck(pres, "out.pptx")` |

**The helpers throw on brand violations at `node your_deck.js` time.** Off-palette colors, off-table title sizes, logo+subhead collisions, off-margin boxes, missing footers (for non-cover slides) — all fail the build with a specific error pointing at the line. **Do not catch or work around these errors — fix the deck.** If a helper rejects something you genuinely need, the right move is almost always to redesign the slide, not bypass the helper.

Helper signatures + opts: load `reference/helpers.md` when writing the calls.

### 9. Forbidden, period

Accent lines under titles. Custom palettes (even "PS-adjacent"). Non-PS fonts. Custom bullet markers (▶ ● ✓). Drop shadows, glows, gradients. Skipping the footer "because it's internal". Title sizes outside the table above. Logos or subhead tags moved off their canonical positions.

---

## Composition (flexible — your job)

Inside the rails above, **design the layout the content needs.** You don't pick from a fixed catalog. Two/three-column splits, image grids, callout walls, framework diagrams, stat boards, mixed copy + chart layouts — compose them.

Principles when composing:

- **Stay inside `MARGIN_L → W - MARGIN_R`** for all non-bleed content.
- **Respect the header and footer bands.** Content body lives between roughly `y = 1.97` (below the title block) and `y = 6.75` (above the footer). Push the title down only if the slide has no title; never overlap.
- **Use the tokens for every surface.** A new layout you invent must still source colors from the palette, fonts from the four faces, and titles via `addH1` at one of the canonical sizes.
- **Use `addBody` for any prose**, even in a column you've invented. Pass `x/y/w/h` to fit your composition; keep `fontSize` between `10` and `12` unless it's a display stat.
- **Display numerals / oversized stats**: `FONT_MONO_LIGHT` for thin display, `FONT_TITLE` bold for emphatic.
- **Image placeholders**: `GRAY_LIGHT` filled rect when no asset; full-bleed images only when intentional.
- **Whitespace beats density.** If a layout feels crowded, it is — split, drop content, or rewrite.

### Layout primitives — prefer these over hand-typed coordinates

The theme exports four layout primitives. Each takes a parent rect and an `items[]` list of `{ flex?, render(rect) }` entries; the primitive computes each cell's `{ x, y, w, h }` and invokes `render(rect)`, which calls `addH1`/`addBody`/`addBox` with the resolved coordinates. **The primitive guarantees cells don't overlap and don't exceed the parent rect.**

- `T.row(slide, { x, y, w, h, gap, items })` — left-to-right; cell widths from `flex` weights (default equal).
- `T.column(slide, { x, y, w, h, gap, items })` — top-to-bottom analogue.
- `T.grid(slide, { x, y, w, h, cols, rows, gap, items })` — fixed `cols × rows` grid; items carry `{ col, row, colSpan?, rowSpan?, render }`.
- `T.stack(slide, { x, y, w, h, items })` — z-stacked (all items share the rect). Use sparingly for badges or banner-on-image overlays.

Mandate: **for any region that contains two or more content elements, use a primitive.** Raw `addBox`/`addBody` with hand-typed coordinates is allowed only for one-off elements (a single full-width body block, a hero stat). When you do use raw coordinates, leave a one-line `// reason: ...` comment.

```js
T.row(s, {
  x: T.MARGIN_L, y: 2.4, w: T.CONTENT_W, h: 4.0, gap: 0.3,
  items: [
    { render: (r) => T.addBody(s, "Left column…",  { x: r.x, y: r.y, w: r.w, h: r.h, fontSize: 11 }) },
    { render: (r) => T.addBody(s, "Right column…", { x: r.x, y: r.y, w: r.w, h: r.h, fontSize: 11 }) },
  ],
});
```

### Pattern library — start here when building common slides

Before composing from primitives, check `reference/patterns/` for a pre-built pattern that matches the slide's intent:

- `scqa3col`     — Situation / Complication / Question three-column
- `matrix2x2`    — 2x2 matrix with axis labels and quadrant boxes
- `kpiTree`      — One headline KPI feeding a row of supporting KPIs
- `beforeAfter`  — Two-column before/after comparison
- `journeyMap`   — Horizontal step sequence with labels and notes
- `heatmap`      — Capability heatmap (rows × cols, scored)

Each pattern is a function `(slide, T, content)`. Pass your content object and the pattern produces a validated layout:

```js
const patterns = require("./reference/patterns");
patterns.scqa3col(s, T, {
  subhead: "Situation analysis",
  title: "Why we must act now",
  columns: [
    { label: "SITUATION",    body: "..." },
    { label: "COMPLICATION", body: "..." },
    { label: "QUESTION",     body: "..." },
  ],
  pageNum: 4,
});
```

If no pattern fits, compose with primitives. Compose from raw coordinates only as a last resort.

For inspiration and worked examples (43 reference compositions used in the canonical PS deck), see `reference/layouts.md`. **Treat that file as a gallery to remix, not a menu to pick from.** If a reference composition is a perfect fit, copy it. Otherwise, take what's useful (column proportions, type hierarchy, callout shape) and compose.

---

## Workflows

Pick the workflow that matches the task. All paths share the same brand fundamentals above.

### A. Creating a new PS deck from scratch

1. **Plan the deck.** Outline slides with content + intent (what is this slide *doing*?). For each, decide the role: cover, section divider, content, callout, image, table, chart, closer.
2. **Compose layouts.** For each slide, design a composition that serves the content. Skim `reference/layouts.md` for inspiration; copy a block from `theme/build_deck.js` if a reference fits exactly. Otherwise compose using helpers + tokens. Helper API: `reference/helpers.md`.
3. **Write the script** using the imports block above. Title sizes must come from the §5 table; colors from §1; fonts from §2. Wrap `pres = instrument(new PptxGenJS())` and end with `await writeDeck(pres, …)` so per-slide validation runs. Tag covers / section dividers / "Thank you" / end-cards via `markRole(slide, …)` so they are exempted from the footer requirement.
4. **Build**: `node your_deck.js`. The helpers throw on brand violations — if it errors, fix the offending call (the message names the file, line, and rule). Re-run until the build succeeds.
5. **QA**: `node ~/.claude/skills/ps-pptx/theme/qa.js your_deck.js your_deck.pptx`. This is **the** QA command for decks built via this skill — runs all static lints, renders per-slide JPGs into `qa-report/`, and writes a pre-filled fresh-eyes prompt at `qa-report/SUBAGENT_PROMPT.md`. Exits non-zero on lint failure. Reference: `reference/qa.md`.
6. **Visual QA — mandatory.** See §"Visual QA" below.

### B. Editing an existing PS deck (XML route)

Use this when the user gives you an existing `.pptx` and wants edits — content updates, slide reorders, deletions, or adding slides duplicated from existing layouts. For wholesale redesigns, prefer workflow A (rebuild from scratch).

1. **Survey the deck**: render thumbnails and extract text in parallel.
   ```bash
   python ~/.claude/skills/ps-pptx/scripts/thumbnail.py input.pptx
   python -m markitdown input.pptx
   ```
2. **Plan the changes** against the thumbnails + text. Identify which slides to keep, duplicate, reorder, delete, or edit.
3. **Unpack**: `python ~/.claude/skills/ps-pptx/scripts/office/unpack.py input.pptx unpacked/`
4. **Structural changes first** (do these yourself, not via subagents):
   - Delete: remove `<p:sldId>` from `ppt/presentation.xml` → `<p:sldIdLst>`.
   - Duplicate: `python ~/.claude/skills/ps-pptx/scripts/add_slide.py unpacked/ slideN.xml` — prints the `<p:sldId>` to insert.
   - Reorder: rearrange `<p:sldId>` elements in `<p:sldIdLst>`.
5. **Edit content** in each `slide{N}.xml` using the `Edit` tool (not sed/Python). Subagents are useful here — slides are independent files. Formatting rules:
   - Bold headers/labels: `b="1"` on `<a:rPr>`.
   - Smart quotes in new text: use XML entities (`&#x201C;` `&#x201D;` `&#x2018;` `&#x2019;`) — the Edit tool flattens unicode quotes.
   - Multi-item content: separate `<a:p>` per item, copying `<a:pPr>` from the original to preserve spacing. Never concatenate.
   - Leading/trailing whitespace in `<a:t>`: add `xml:space="preserve"`.
   - **Brand check**: any color/font/size you introduce must come from §1, §2, §5. If a placeholder used an off-brand value, fix it.
6. **Clean**: `python ~/.claude/skills/ps-pptx/scripts/clean.py unpacked/` (drops orphaned slides/media/rels).
7. **Pack**: `python ~/.claude/skills/ps-pptx/scripts/office/pack.py unpacked/ output.pptx --original input.pptx`
8. **Verify content**: `python -m markitdown output.pptx` — check for missing edits, leftover placeholders (`grep -iE "xxxx|lorem|ipsum|placeholder"`).
9. **Visual QA — mandatory.** See §"Visual QA" below.

### C. Reading / extracting from a PS deck

```bash
python -m markitdown deck.pptx                                   # full text dump
python ~/.claude/skills/ps-pptx/scripts/thumbnail.py deck.pptx   # visual grid (thumbnails.jpg)
python ~/.claude/skills/ps-pptx/scripts/office/unpack.py deck.pptx unpacked/  # raw XML
```

Use markitdown first; only unpack when you need XML structure (rare for read-only tasks).

### Visual QA (applies to all workflows)

For decks built via workflow A, `theme/qa.js` already renders slides and writes a pre-filled subagent prompt to `qa-report/SUBAGENT_PROMPT.md`. For decks edited via workflow B (or any arbitrary `.pptx`), render slides manually:

```bash
python ~/.claude/skills/ps-pptx/scripts/office/soffice.py --headless --convert-to pdf output.pptx
pdftoppm -jpeg -r 150 output.pdf slide   # produces slide-01.jpg, slide-02.jpg, …
```

To re-render only changed slides after a fix: `pdftoppm -jpeg -r 150 -f N -l N output.pdf slide-fixed`.

**Dispatch a fresh-eyes subagent (general-purpose).** You have been staring at the code/XML; you will see what you expect, not what's there. Prompt the subagent to inspect each rendered JPG and flag:

- Brand violations: off-palette colors, non-PS fonts, title sizes outside §5, accent lines under titles, gradients/shadows.
- Logo + subhead tag on the same slide (forbidden — see §4).
- Missing footer on a content slide (allowed only on covers / section dividers / "Thank you" / end-cards).
- Content crossing the L/R margin (`0.667"` either side) or colliding with the header (`y < 1.97`) or footer (`y > 6.75`) bands.
- Overlapping elements, text overflow, cut-off text, low contrast, leftover placeholder content (`xxxx`, `lorem`, `Click to add…`).
- Uneven gaps, columns not aligned, cramped vs. empty regions.

Have the subagent list every issue found, even minor ones. Fix → re-render the affected slides → re-dispatch. **Do not declare success until at least one full fix-and-verify cycle reports no new issues.**

### Dependencies

- `pip install "markitdown[pptx]"` — text extraction
- `pip install Pillow` — thumbnail grids
- `npm install -g pptxgenjs` — used by workflow A
- LibreOffice (`soffice`) — PDF conversion (auto-configured via `scripts/office/soffice.py`)
- Poppler (`pdftoppm`) — PDF → JPG

## Red flags — STOP if you catch yourself thinking…

| Thought | Reality |
|---------|---------|
| "A subtle gradient would look nicer here" | Forbidden. Solid PS colors only. |
| "Let me pick a color that matches the topic" | Forbidden. PS palette only. |
| "I'll use 42pt for this title — it just feels right" | Forbidden. Title sizes are the §5 table, full stop. |
| "I'll nudge the logo down a bit for balance" | Forbidden. Logo position is fixed. |
| "I'll skip the footer for the cover-style content slide" | Only true covers and end-cards skip the footer. |
| "I'll use Calibri because the system might not have Lexend Deca" | Use the PS fonts. Missing fonts are a deployment problem, not a design decision. |
| "The reference catalog doesn't have this layout, so I can't make this slide" | Compose one. The catalog is inspiration, not a menu. |
| "I'll widen the content past the margin to fit everything" | Forbidden. Cut content or rebreak the layout. |

## Files

Always loaded:
- `SKILL.md` — this file.

Load on demand (read only when the workflow step calls for it):
- `reference/layouts.md` — composition gallery / inspiration. **Step 2.**
- `reference/helpers.md` — helper API. **Steps 2–3.**
- `reference/qa.md` — QA reference (interprets `qa.js` output). **Step 5+.**

Runtime (never read as docs):
- `theme/` — `require()` target. Contains `index.js` (tokens + helpers + runtime guards), `build_deck.js` (golden reference deck; `node theme/build_deck.js` regenerates `theme/output.pptx`), `qa.js` (the QA runner — invoked via `node theme/qa.js …`, never required), and `assets/` (logos + media). Treat the directory as opaque from the agent's perspective — only `index.js`'s exports matter.
- `scripts/` — Python helpers for editing, reading, and rendering arbitrary `.pptx` files. Invoke directly as commands (see workflows B, C, and Visual QA); never read their source as docs.
  - `scripts/thumbnail.py` — visual grid of slides (template/deck survey).
  - `scripts/add_slide.py` — duplicate a slide or instantiate from a layout.
  - `scripts/clean.py` — drop orphaned slides, media, and rels after structural edits.
  - `scripts/office/unpack.py` — extract `.pptx` to pretty-printed XML.
  - `scripts/office/pack.py` — repack edited XML into a valid `.pptx`.
  - `scripts/office/soffice.py` — sandbox-safe LibreOffice wrapper (used for PDF conversion in Visual QA).
