# PS Layout Gallery (Inspiration, Not a Menu)

This is a **reference gallery** of 43 compositions implemented in `theme/build_deck.js` — the canonical PS deck. Use it two ways:

1. **Copy when a composition fits exactly.** Open the file at the listed line and copy the slide block; adapt only the text/image content, never the geometry, fonts, or colors.
2. **Remix when nothing fits exactly.** Take what's useful — column proportions, callout shapes, type hierarchy — and compose a new layout using the helpers and tokens, staying inside the rigid fundamentals in `SKILL.md` (margins, title sizes, header/footer bands, palette, fonts).

You are **not** restricted to the layouts below. If the content needs a layout that isn't here, design one. The fundamentals are the rails; composition is yours.

| # | Layout | When to use | Helpers used | Source |
|---|--------|-------------|--------------|--------|
| 1 | Cover (red bg, 1-line title, 72pt) | Opening slide | `addImage` (white logo), `addFooter` w/ WHITE | theme/build_deck.js:37 |
| 2 | Overview of slide layouts | Internal nav of decks | `addH1`, `addImage`/grid fallback, `addFooter` | theme/build_deck.js:50 |
| 3 | Section divider, centered title (white bg) | "Sample Slides" type intro | `addText` centered, `addFooter` | theme/build_deck.js:69 |
| 4 | Cover (red, 2-line title, 66pt) | Opening with longer title | `addLogo`, `addH1`, `addFooter` | theme/build_deck.js:80 |
| 5 | Cover (red, 3-line title, 54pt) | Opening with 3-line title | `addLogo`, `addText`, `addFooter` | theme/build_deck.js:89 |
| 6 | Agenda — red bg | Numbered agenda on red | `addText` (mono numerals), `addFooter` w/ WHITE | theme/build_deck.js:102 |
| 7 | Contents — white bg | Numbered agenda on white | `addText` (mono numerals in RED), `addFooter` | theme/build_deck.js:113 |
| 8 | Subhead intro — red bg, rounded card | Pull quote on red | `addShape` roundRect, large mono-light text, `addFooter` | theme/build_deck.js:123 |
| 9 | Subhead intro — white bg, red outline | Pull quote on white | `addShape` roundRect outlined RED, `addFooter` | theme/build_deck.js:134 |
| 10–12 | Section divider — red, big numeral (01/02/03) | Between major sections | `addH1` (96pt WHITE), giant mono-light numeral, `addFooter` | theme/build_deck.js:145 (`sectionTitle()`); invoked at 154/157/160 |
| 13 | One-column content | Long-form prose | `addSubheadTag`, `addH1`, `addBody`, `addFooter` | theme/build_deck.js:163 |
| 14 | Two-column content | Compare/contrast paragraphs | `addSubheadTag`, `addH1`, two `addBody`, `addFooter` | theme/build_deck.js:173 |
| 15 | Long headline + 3 column subheads | Three-up explainer | `addSubheadTag`, `addH1` (26pt), 3× subhead+`addBody`, `addFooter` | theme/build_deck.js:185 |
| 16 | Table — white bg | Data table on white | `addSubheadTag`, `addH1`, `addTable` w/ RED top/bottom borders, `addFooter` | theme/build_deck.js:202 |
| 17 | Table — red bg | Data table on red | red bg, WHITE/PINK borders, `addFooter` w/ WHITE | theme/build_deck.js:222 |
| 18 | Bar chart with custom legend card | % stacked bar | `addChart` (RED/CHART_GRAY/BLACK), legend roundRect, `addFooter` | theme/build_deck.js:243 |
| 19 | Headline only | Bold standalone statement | `addText` subhead, `addH1`, manual footer | theme/build_deck.js:293 |
| 20–24 | Headline over full-bleed image | Image-driven section opener | `addImage` full-bleed, `addSubheadTag`, `addH1` 36pt, `addFooter` | theme/build_deck.js:321 (`imageSlides[]`) |
| 25–27 | Headline + image right-half | Text + visual | `addSubheadTag`, `addH1`, `addBody`, right-half `addImage`, `addFooter` | theme/build_deck.js:341 (`halfImageSlides[]`) |
| 28 | Headline + right placeholder rect | Text + image well | as above with `addShape` rect placeholder | theme/build_deck.js:361 |
| 29 | Title + large image left | Hero image w/ caption right | left placeholder, right-side `addH1`+subhead+`addBody` | theme/build_deck.js:373 |
| 30 | Title + image bleeding right | Hero image w/ caption left | left `addH1`+subhead+`addBody`, right placeholder | theme/build_deck.js:385 |
| 31 | Headline + 1 tall + 2 stacked images | Image grid | `addH1`+`addBody` left, 3 image rects right | theme/build_deck.js:397 |
| 32 | Title left, body top-right, full-bleed image bottom | Mixed | `addH1`, `addBody`, full-width bottom rect | theme/build_deck.js:411 |
| 33 | Image right small | Caption-style with sidebar image | `addH1`+subhead+`addBody`, right rect | theme/build_deck.js:422 |
| 34 | Long headline + 3-column body | 3-up detail | `addH1` (3 lines), 3× subhead+`addBody` | theme/build_deck.js:434 |
| 35 | Long headline left + body right | Sidebar | left `addH1` (4 lines), right subhead+`addBody` | theme/build_deck.js:449 |
| 36 | 2×3 numbered list | Process steps / framework points | mono-light "01"…"06", `addText` titles, `addText` body | theme/build_deck.js:460 |
| 37 | Callout grid — white bg, red outlines | Stat/callout dashboard | `calloutGrid(num, "white")` | theme/build_deck.js:481 (`calloutGrid()`); invoked at 531 |
| 38 | Callout grid — red bg, white outlines | Stat/callout on red | `calloutGrid(num, "red-bg")` | theme/build_deck.js:533 |
| 39 | Callout grid — solid red cards | Stat/callout solid red | `calloutGrid(num, "red-cards")` | theme/build_deck.js:535 |
| 40 | Thank you (red) | Closer slide | `addLogo`, `addH1` 56pt WHITE, `addFooter` w/ WHITE | theme/build_deck.js:538 |
| 41 | End card — red bg, white wordmark | Final brand frame | centered `addImage` LOGO_WHITE | theme/build_deck.js:551 |
| 42 | End card — white bg, color wordmark | Final brand frame | centered `addImage` LOGO_COLOR | theme/build_deck.js:558 |
| 43 | End card — black bg, white wordmark | Final brand frame | centered `addImage` LOGO_WHITE on BLACK | theme/build_deck.js:564 |

## Starting points by content type

Use these as a first look — copy if a row fits, remix if it almost fits, compose from scratch if it doesn't.

| Content type | Reference compositions |
|--------------|------------------------|
| Title slide | 1, 4, 5 |
| Agenda | 6 (red), 7 (white) |
| Section divider | 10–12 (numbered) or 3 (centered) |
| Pull quote / framing statement | 8, 9 |
| Long prose | 13 |
| Side-by-side comparison | 14, 35 |
| Three points / framework | 15, 34, 36 |
| Data table | 16 (white), 17 (red) |
| Chart | 18 |
| Big visual statement | 19 |
| Image-driven section | 20–24 (full bleed), 25–27 (half), 29–33 |
| KPIs / callouts / stats | 37, 38, 39 |
| Closer | 40 + (41 \| 42 \| 43) |

## When you compose a new layout

Stay inside the rails defined in `SKILL.md`:

- Title via `addH1` at one of the canonical sizes (38 / 32 / 26 / 72 / 66 / 54 / 96 / 56). Default position unless paired with a column.
- Logo and subhead tag in their fixed positions (or omit entirely on covers/end-cards).
- Footer on every content slide via `addFooter`.
- All x-positions and widths inside `[MARGIN_L, W - MARGIN_R]` unless full-bleed.
- Body content lives roughly between `y ≈ 1.97` and `y ≈ 6.75`.
- Colors from the palette only; fonts from the four faces only.

If your composition would break any of those, the composition is wrong — not the rule.
