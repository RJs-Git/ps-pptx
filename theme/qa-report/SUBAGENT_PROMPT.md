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

1. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-01.jpg (Expected: Cover (red))
2. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-02.jpg (Expected: Overview of slide layouts)
3. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-03.jpg (Expected: Sample Slides section divider (white bg, centered red title))
4. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-04.jpg (Expected: Cover 2 lines)
5. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-05.jpg (Expected: Cover 3 lines)
6. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-06.jpg (Expected: Agenda red)
7. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-07.jpg (Expected: Contents white)
8. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-08.jpg (Expected: Subhead intro red)
9. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-09.jpg (Expected: Subhead intro white)
10. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-10.jpg (Expected: Section title 01)
11. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-11.jpg (Expected: Section title 03)
12. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-12.jpg (Expected: Two-column content)
13. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-13.jpg (Expected: Long headline + 3 columns subhead)
14. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-14.jpg (Expected: Table on white)
15. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-15.jpg (Expected: Table on red)
16. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-16.jpg (Expected: Bar chart)
17. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-17.jpg (Expected: Headline only)
18. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-18.jpg (Expected: (no extractable title — inspect carefully))
19. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-19.jpg (Expected: Headline + right placeholder (no image))
20. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-20.jpg (Expected: Headline + right placeholder (no image))
21. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-21.jpg (Expected: Title + large image left)
22. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-22.jpg (Expected: Title + image bleeding right)
23. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-23.jpg (Expected: Headline + 1 tall image + 2 stacked images)
24. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-24.jpg (Expected: Title left, body top-right, full-width image bottom)
25. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-25.jpg (Expected: Image right small)
26. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-26.jpg (Expected: Long headline + 3 column body)
27. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-27.jpg (Expected: Long headline left (4 lines), body right column)
28. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-28.jpg (Expected: 2x3 numbered list)
29. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-29.jpg (Expected: callout grid white)
30. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-30.jpg (Expected: callout grid solid red cards)
31. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-31.jpg (Expected: red bg with white wordmark)
32. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-32.jpg (Expected: white bg, color wordmark)
33. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-33.jpg (Expected: black bg, white wordmark)
34. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-34.jpg (Expected: (unknown))
35. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-35.jpg (Expected: (unknown))
36. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-36.jpg (Expected: (unknown))
37. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-37.jpg (Expected: (unknown))
38. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-38.jpg (Expected: (unknown))
39. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-39.jpg (Expected: (unknown))
40. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-40.jpg (Expected: (unknown))
41. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-41.jpg (Expected: (unknown))
42. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-42.jpg (Expected: (unknown))
43. /Users/rjjain/Documents/GitHub/ps-pptx/theme/qa-report/slide-43.jpg (Expected: (unknown))

## Output format

For each slide list ALL issues, including minor ones. Group by slide:

```
Slide N — [headline]:
  - [issue 1]
  - [issue 2]
```

End with a count of hard failures vs minor issues. **Do not declare success on the first pass.**
