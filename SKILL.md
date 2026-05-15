---
name: ps-pptx
description: Use when creating, editing, or generating any Publicis Sapient (PS) presentation, deck, or slides — including client decks, internal PS presentations, PS-branded pitch decks, capability decks, or any .pptx that should reflect the Publicis Sapient brand. Triggers on mentions of "Publicis Sapient", "PS deck", "PS slides", "PS template", or any request to make slides "in PS style", "on-brand", or "in our template".
---

# ps-pptx Skill

PS-themed deck generation. **Fundamentals are rigid; layout composition is yours.**

The brand fundamentals below — colors, fonts, margins, title sizes, title placement, header (logo + subhead tag), footer — are **non-negotiable**. Inside those rails, you are expected to design slide layouts that fit the content, not pick from a fixed catalog. Use the `pptx` skill's design intuition to compose; use this skill's tokens and helpers for everything that touches the brand surface.

**REQUIRED BACKGROUND:** Use the `pptx` skill for non-design workflows (reading content, image conversion, the visual-QA subagent loop). **`ps-pptx` OVERRIDES `pptx`'s "Color Palettes", "Typography", and "Design Ideas" sections in their entirety.**

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

### 4. Header band (top of every non-cover/non-end-card slide)

- **Logo**: always at `(0.667, 0.667)`, size `1.149 × 0.624`. Placed via `addLogo(slide, variant)`.
  - `"color"` on white backgrounds, `"white"` on red/black backgrounds, `"black"` for mono-on-white.
- **Subhead tag** (optional but encouraged on content slides): mono 10pt at `(0.667, 0.483)`, placed via `addSubheadTag(slide, text, color?)`.

Logo and subhead tag positions never move on a content slide.

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
  addLogo, addFooter, addSubheadTag, addH1, addBody,
} = T;
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

For inspiration and worked examples (43 reference compositions used in the canonical PS deck), see `reference/layouts.md`. **Treat that file as a gallery to remix, not a menu to pick from.** If a reference composition is a perfect fit, copy it. Otherwise, take what's useful (column proportions, type hierarchy, callout shape) and compose.

---

## Workflow

1. **Plan the deck.** Outline slides with content + intent (what is this slide *doing*?). For each, decide the role: cover, section divider, content, callout, image, table, chart, closer.
2. **Compose layouts.** For each slide, design a composition that serves the content. Skim `reference/layouts.md` for inspiration; copy a block from `theme/build_deck.js` if a reference fits exactly. Otherwise compose using helpers + tokens. Helper API: `reference/helpers.md`.
3. **Write the script** using the imports block above. Title sizes must come from the §5 table; colors from §1; fonts from §2.
4. **Run**: `node your_deck.js` → produces `.pptx`.
5. **QA**: load `reference/qa.md` and run every check. Mandatory.

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
- `reference/qa.md` — QA procedure. **Step 5.**

Runtime (never read as docs):
- `theme/` — `require()` target. Contains `index.js` (tokens + helpers), `build_deck.js` (golden reference deck; `node theme/build_deck.js` regenerates `theme/output.pptx`), and `assets/` (logos + media). Treat the directory as opaque from the agent's perspective — only `index.js`'s exports matter.
