# Visual QA — fresh-eyes pass

Visually inspect these slides. **Assume there are issues — find them.** Your first render is almost never correct; if you find zero issues, you weren't looking hard enough.

## Look for

**Layout / general:**
- Overlapping elements (text through shapes, lines through words, stacked elements)
- Text overflow or content cut off at box/slide edges
- Decorative lines/shapes positioned for single-line text but title wrapped to two
- Footers/page numbers colliding with content above
- Insufficient margins (< 0.5") or uneven gaps between blocks
- Low-contrast text (light gray on cream, dark on dark, white on light)
- Text boxes too narrow causing excessive wrapping
- Leftover placeholder content (Lorem, XXXX, TBD, "this layout")

**PS-brand hard failures (flag explicitly):**
- Any color outside the PS palette: RED #E90130, RED_DARK #AE0021, PINK #FA8C9A, BLACK, WHITE, GRAY_MID #6B6B6B, GRAY_LIGHT #D9D9D9, CHART_GRAY #BBBBBB (chart middle series only)
- Any font other than Lexend Deca SemiBold, Roboto, Roboto Mono Medium, or Roboto Mono Light
- Non-cover/non-end-card slide missing the standard footer (© Publicis Sapient + date + page number)
- Accent lines under titles (forbidden in PS template)
- Custom bullet markers (▶ ● ✓) — PS uses bare numbered/lettered styles
- Logo and subhead tag both present on the same slide (they overlap)

## Slides to review

1. /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/qa-report/slide-1.jpg (Expected: (no extractable title — inspect carefully))
2. /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/qa-report/slide-2.jpg (Expected: (unknown))
3. /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/qa-report/slide-3.jpg (Expected: (unknown))
4. /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/qa-report/slide-4.jpg (Expected: (unknown))
5. /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/qa-report/slide-5.jpg (Expected: (unknown))
6. /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/qa-report/slide-6.jpg (Expected: (unknown))

## Output format

For each slide list ALL issues, including minor ones. Group by slide:

```
Slide N — [headline]:
  - [issue 1]
  - [issue 2]
```

End with a count of hard failures vs minor issues. **Do not declare success on the first pass.**
