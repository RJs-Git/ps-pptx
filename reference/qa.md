# ps-pptx QA

All checks are mandatory. Any failure → fix and re-run. Run all of them, even when you "know" it's fine.

## 1. Brand lint — colors

Find any hex literal in your script that isn't a PS-allowed color or a token reference:

```bash
grep -nE '"[0-9A-Fa-f]{6}"' your_deck.js \
  | grep -viE 'E90130|AE0021|FA8C9A|000000|FFFFFF|6B6B6B|D9D9D9|BBBBBB'
```

Must return zero lines. If you see hits, replace the literal with the matching token (`RED`, `WHITE`, `CHART_GRAY`, etc.).

## 2. Brand lint — fonts

Every `fontFace` must reference a token, never a string literal:

```bash
grep -nE 'fontFace\s*:' your_deck.js \
  | grep -viE 'FONT_TITLE|FONT_BODY|FONT_MONO|FONT_MONO_LIGHT'
```

Must return zero lines.

## 3. Footer presence

```bash
slides=$(grep -c 'pres\.addSlide()' your_deck.js)
footers=$(grep -c 'addFooter(' your_deck.js)
echo "slides=$slides footers=$footers"
```

`footers` should be within 3–4 of `slides` (covers + end cards are the only legitimate omissions). If the gap is larger, you're missing footers on content slides.

## 4. Content QA (extraction)

Same as parent `pptx` skill:

```bash
python -m markitdown your_deck.pptx
python -m markitdown your_deck.pptx | grep -iE 'xxxx|lorem|ipsum|TBD|placeholder'
```

The grep must return zero lines (no leftover scaffolding text).

## 5. Visual QA

Convert and inspect (per parent `pptx` skill):

```bash
python ~/.claude/skills/pptx/scripts/office/soffice.py --headless --convert-to pdf your_deck.pptx
pdftoppm -jpeg -r 150 your_deck.pdf slide
```

Then dispatch a fresh-eyes subagent with this prompt (PS-specific additions in **bold**):

```
Visually inspect these slides. Assume there are issues — find them.

Look for:
- Overlapping elements, text overflow, cut-off content
- Decorative lines positioned for single-line text but title wrapped
- Footers/page numbers colliding with content
- Insufficient margins (< 0.5") or uneven gaps
- Low-contrast text (light gray on cream, dark on dark)
- Leftover placeholder content (Lorem, XXXX, TBD)

**Hard failures (PS-specific — flag these explicitly):**
- **Any color outside the PS palette: RED #E90130, RED_DARK #AE0021,
  PINK #FA8C9A, black, white, GRAY_MID #6B6B6B, GRAY_LIGHT #D9D9D9,
  CHART_GRAY #BBBBBB (chart middle series only).**
- **Any font other than Lexend Deca SemiBold, Roboto, Roboto Mono Medium,
  or Roboto Mono Light.**
- **Any non-cover/non-end-card slide missing the standard footer
  (© Publicis Sapient + date + page number).**
- **Accent lines under titles (forbidden in the PS template).**
- **Custom bullet markers (▶ ● ✓) — PS uses bare numbered/lettered styles.**

For each slide, list issues. Report ALL, including minor.

Read and analyze:
1. /path/to/slide-01.jpg (Expected: [brief description])
2. /path/to/slide-02.jpg (Expected: [brief description])
…
```

## 6. Verification loop

1. Lint (1–3) → fix → re-lint
2. Render → visual QA (5) → fix → re-render affected slides
3. Repeat until a full pass finds no new issues

Do not declare success until at least one full fix-and-verify cycle has completed.
