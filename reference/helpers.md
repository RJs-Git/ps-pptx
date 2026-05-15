# theme/ — Helper API

Imported via `require(".../skills/ps-pptx/theme")`. Resolves to `theme/index.js`. Logo and media paths resolve internally — never reference `theme/assets/` directly.

All helpers take a `slide` (from `pres.addSlide()`) as their first argument. All defaults match the canonical PS layouts; override only what `theme/build_deck.js` overrides for the layout you're using.

## `addLogo(slide, variant = "white")`

Places the PS logo at the master position (`x=0.667, y=0.667, 1.149 × 0.624`).

| Variant | Asset | Use on |
|---------|-------|--------|
| `"white"` (default) | `ps-logo-white.png` | red or black backgrounds |
| `"color"` / `"split"` | `ps-logo-color.png` | white backgrounds |
| `"black"` / `"000000"` | `ps-logo-black.png` | white backgrounds (mono) |

Covers, "Thank you", and end-card slides override size — see those layouts in `theme/build_deck.js`.

## `addSubheadTag(slide, text, color = RED)`

Mono-font tag at the top of content slides. Pass `WHITE` on red backgrounds. Position is fixed: `x=0.667, y=0.483, w=6, h=0.184, fontSize=10`.

## `addH1(slide, text, opts = {})`

Page title in `FONT_TITLE`, default 38pt RED bold.

Defaults: `x=MARGIN_L (0.667), y=0.758, w=CONTENT_W (12.0), h=1.21`.

`opts` accepted: `x`, `y`, `w`, `h`, `fontSize`, `color`. Common overrides:
- Cover (1-line): `fontSize: 72, color: WHITE` + custom `x/y/w/h`
- Cover (2-line): `fontSize: 66, color: WHITE`
- Section divider: `fontSize: 96, color: WHITE`
- Long headline: `fontSize: 26` or `32`
- "Thank you": `fontSize: 56, color: WHITE`

## `addBody(slide, text, opts = {})`

Body paragraph in `FONT_BODY`, default 12pt BLACK.

Defaults: `x=MARGIN_L, y=3.4, w=CONTENT_W, h=3.2, paraSpaceAfter=8, lineSpacingMultiple=1.25`.

`opts`: `x`, `y`, `w`, `h`, `fontSize` (often `10` or `11`), `color`, `paraSpaceAfter`. On red backgrounds pass `color: WHITE`.

## `addFooter(slide, opts = {})`

Renders `© Publicis Sapient` + tab + date at `(0.667, 6.875)` and (if `pageNum` provided) the page number at `(12.038, 6.875)`. Uses `FONT_MONO` 8pt.

| Option | Default | Notes |
|--------|---------|-------|
| `color` | `RED` | Pass `WHITE` on red backgrounds |
| `pageNum` | `undefined` | Set to the slide's page number; covers/end-cards omit |
| `dateText` | `"XX.2026"` | Replace with actual `MM.YYYY` for the deck |

## Tokens (also from `T`)

Colors: `RED RED_DARK PINK BLACK WHITE GRAY_MID GRAY_LIGHT CHART_GRAY`
Fonts: `FONT_TITLE FONT_BODY FONT_MONO FONT_MONO_LIGHT`
Geometry: `W H MARGIN_L MARGIN_R CONTENT_W LOGO_X LOGO_Y LOGO_W LOGO_H FOOTER_X FOOTER_Y FOOTER_W FOOTER_H PAGE_X PAGE_Y PAGE_W PAGE_H`
Assets: `LOGO_WHITE LOGO_COLOR LOGO_BLACK MEDIA(filename)`

`MEDIA(name)` returns the absolute path to a file in the skill's bundled image folder (`theme/assets/media/`). Use this for placeholder imagery; for client-supplied images pass an explicit path. Never reference `theme/assets/...` directly in deck code.

## Skeleton

```js
const PptxGenJS = require("pptxgenjs");
const path = require("path");
const T = require(path.join(require("os").homedir(), ".claude/skills/ps-pptx/theme"));
const {
  RED, WHITE, BLACK, FONT_TITLE, FONT_BODY, FONT_MONO,
  W, H, MARGIN_L, CONTENT_W,
  addLogo, addFooter, addSubheadTag, addH1, addBody,
} = T;

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";

// Cover
{
  const s = pres.addSlide();
  s.background = { color: RED };
  addLogo(s, "white");
  addH1(s, "Title goes here", { y: 3.0, fontSize: 72, color: WHITE });
  addFooter(s, { color: WHITE, dateText: "05.2026" });
}

// Content slide
{
  const s = pres.addSlide();
  addSubheadTag(s, "Section");
  addH1(s, "Headline goes here");
  addBody(s, "Body copy…");
  addFooter(s, { pageNum: 2, dateText: "05.2026" });
}

pres.writeFile({ fileName: "deck.pptx" }).then(console.log);
```
