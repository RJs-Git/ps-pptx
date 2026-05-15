# ps-pptx QA reference

QA for ps-pptx decks runs through three independent gates. **All three are mandatory.** Skipping any of them is the failure mode that lets visibly broken decks ship.

## Gate 1 — Runtime guards (build-time)

Triggered automatically when you run `node your_deck.js`. The helpers in `theme/index.js` throw on:

| Check | Helper(s) | Error fragment |
|---|---|---|
| Off-palette `color` / `fill` / `line` | all | `color "<hex>" is not in the PS palette` |
| Off-table title size | `addH1` | `fontSize <n> is not in the §5 title-size table` |
| H1 / footer color outside RED/WHITE/BLACK | `addH1`, `addFooter` | `color must be RED, WHITE, or BLACK` |
| Body fontSize outside 10–12pt | `addBody` | `outside the body range 10–12pt` (pass `{ display: true }` for oversized stats) |
| Off-margin or off-slide box | `addBody`, `addBox` | `crosses left/right margin`, `extends off the slide` |
| Footer-band collision | `addBody`, `addBox` | `crosses the footer band (>6.75)` |
| Logo + subhead tag on same slide | `addLogo`, `addSubheadTag` | `Logo and subhead tag overlap` |
| Missing footer on a content slide | `writeDeck` | `slide N: missing addFooter` |

If a guard fires:
- **Fix the deck**, not the guard. The thresholds reflect the brand spec; loosening them creates the inconsistencies this skill exists to prevent.
- If you genuinely need a layout exception (e.g., a full-bleed image), pass `{ fullBleed: true }` to `addBox`. Document why in a comment.
- For non-content slides (covers, dividers, "Thank you", end cards), call `markRole(slide, "cover" | "section-divider" | "thank-you" | "end-card")` to exempt them from the footer requirement.

The deck **must build cleanly** before moving to gate 2.

## Gate 2 — Static lint (qa.js)

```bash
node ~/.claude/skills/ps-pptx/theme/qa.js your_deck.js your_deck.pptx
```

What it checks (beyond the runtime guards, since some violations live in raw `addText` / `addShape` calls that bypass the helpers):

- **Palette**: any 6-digit hex literal not in the PS palette.
- **Fonts**: any `fontFace:` set to a string literal instead of a `FONT_*` token.
- **Logo / subhead-tag collision**: scans each `pres.addSlide()` block.
- **Footer count vs slide count**: warns if the gap exceeds 4 slides.
- **Forbidden patterns**: gradients, custom bullet markers (▶ ● ✓), drop shadows.

Outputs:
- `qa-report/slide-NN.jpg` — one JPG per slide at 150 DPI.
- `qa-report/SUBAGENT_PROMPT.md` — pre-filled fresh-eyes prompt with auto-extracted per-slide "Expected:" lines.
- Exits non-zero on any lint failure.

If the JPG render fails, qa.js reports a warning (not an error). Install LibreOffice + poppler, or re-run the conversion manually:

```bash
python3 ~/.claude/skills/pptx/scripts/office/soffice.py --headless --convert-to pdf --outdir qa-report your_deck.pptx
pdftoppm -jpeg -r 150 qa-report/your_deck.pdf qa-report/slide
```

## Gate 3 — Visual QA via fresh-eyes subagent (mandatory)

You have been staring at the code; you will see what you expect, not what's there. The subagent reads the slides cold.

Dispatch a `general-purpose` subagent with the contents of `qa-report/SUBAGENT_PROMPT.md`. The prompt is already filled in — slide paths, expected descriptions, and the full "Look for" / "PS-brand hard failures" checklist.

When the subagent reports:
1. Treat any "hard failure" (palette, font, footer, accent line, bullet marker, logo+tag collision) as blocking.
2. Treat layout/contrast issues as blocking unless you can justify a deliberate exception.
3. Fix → re-run `node your_deck.js` → re-run `qa.js` → re-dispatch the subagent on the affected slides.
4. **Do not declare success on the first pass.** A clean first dispatch usually means the subagent didn't look hard enough — re-prompt with "look again, more critically" before accepting it.

## Why three gates

- **Runtime guards** catch most violations the moment the deck is written, with a stack trace pointing at the offending line. They cannot be skipped.
- **Static lint** catches violations that bypass the helpers (raw `s.addText` / `s.addShape` calls, hex literals in comments-turned-code, etc.).
- **Visual QA** catches everything geometric or perceptual that lint cannot see: text overflow, awkward wrapping, low-contrast pairings, alignment drift, decorative elements positioned for the wrong title length.

Each layer catches what the others miss. Skipping any one leaves a class of defects undetected.
