/**
 * ps_theme.js — Canonical Publicis Sapient deck theme.
 *
 * Single source of truth for the PS-branded color palette, typography,
 * layout geometry, and reusable placement helpers (logo, footer, H1, body,
 * subhead tag). Both `build_deck.js` (the golden reference) and any deck
 * generated under the ps-pptx skill MUST `require('./ps_theme.js')` and use
 * these tokens/helpers — never inline hex codes or font strings.
 *
 * Helpers throw on brand violations (palette, fonts, title sizes, logo/tag
 * collision, layout bounds). This is intentional: invalid decks should fail
 * at `node your_deck.js` rather than slip past visual QA.
 */

const path = require("path");
const layout = require("./layout.js");

// ─── Brand tokens — the ONLY colors permitted in PS decks ────────────────────
const RED        = "E90130";
const RED_DARK   = "AE0021";
const PINK       = "FA8C9A";
const BLACK      = "000000";
const WHITE      = "FFFFFF";
const GRAY_MID   = "6B6B6B";
const GRAY_LIGHT = "D9D9D9";
const CHART_GRAY = "BBBBBB"; // middle series in 3-series PS bar chart only

const ALLOWED_COLORS = [RED, RED_DARK, PINK, BLACK, WHITE, GRAY_MID, GRAY_LIGHT, CHART_GRAY];
const ALLOWED_COLORS_SET = new Set(ALLOWED_COLORS.map(c => c.toUpperCase()));

// ─── Typography — the ONLY fonts permitted in PS decks ───────────────────────
const FONT_TITLE      = "Lexend Deca SemiBold";
const FONT_BODY       = "Roboto";
const FONT_MONO       = "Roboto Mono Medium";
const FONT_MONO_LIGHT = "Roboto Mono Light";

const ALLOWED_FONTS = [FONT_TITLE, FONT_BODY, FONT_MONO, FONT_MONO_LIGHT];
const ALLOWED_FONTS_SET = new Set(ALLOWED_FONTS);

// ─── Layout geometry — 16:9 widescreen 13.333" × 7.5" ────────────────────────
const W = 13.333;
const H = 7.5;
const MARGIN_L = 0.667;
const MARGIN_R = 0.667;
const CONTENT_W = W - MARGIN_L - MARGIN_R; // 12.0

const TITLE_BAND_TOP = 0.758;
const TITLE_BAND_BOTTOM = 1.97;
const FOOTER_BAND_TOP = 6.75; // footer text top at 6.875; leave 0.125" gap above it

// Master placeholder positions (from slideMaster1.xml, EMU → inches)
const LOGO_X = 0.667, LOGO_Y = 0.667, LOGO_W = 1.149, LOGO_H = 0.624;
const FOOTER_X = 0.667, FOOTER_Y = 6.875, FOOTER_W = 5.795, FOOTER_H = 0.18;
const PAGE_X = 12.038, PAGE_Y = 6.875, PAGE_W = 0.625, PAGE_H = 0.18;

// ─── Asset paths ─────────────────────────────────────────────────────────────
const LOGO_WHITE = path.join(__dirname, "assets", "logos", "ps-logo-white.png");
const LOGO_COLOR = path.join(__dirname, "assets", "logos", "ps-logo-color.png");
const LOGO_BLACK = path.join(__dirname, "assets", "logos", "ps-logo-black.png");
const MEDIA = (n) => path.join(__dirname, "assets", "media", n);

// ─── Title-size whitelist (§5 of SKILL.md) ────────────────────────────────────
const TITLE_SIZES = new Set([26, 32, 36, 38, 54, 56, 66, 72, 96]);

// ─── Title-fit measurement ───────────────────────────────────────────────────
// Approximate average glyph width for Lexend Deca SemiBold, expressed in em.
// Mixed-case English text averages near 0.55em; we absorb residual error via
// a 5% slack on the totalHeight ≤ boxH check.
const LEXEND_AVG_CHAR_WIDTH_EM = 0.55;

function _wrapLines(text, fontSize, boxW) {
  const charW = (fontSize / 72) * LEXEND_AVG_CHAR_WIDTH_EM; // inches per char
  const maxCharsPerLine = Math.max(1, Math.floor(boxW / charW));
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lines: 0, maxCharsPerLine };
  let lines = 1;
  let lineLen = 0;
  for (const w of words) {
    const wLen = w.length;
    if (lineLen === 0) {
      lineLen = wLen;
      if (wLen > maxCharsPerLine) {
        // unbreakable word: count as its own line
        lines += 1;
        lineLen = 0;
      }
    } else if (lineLen + 1 + wLen <= maxCharsPerLine) {
      lineLen += 1 + wLen;
    } else {
      lines += 1;
      lineLen = wLen > maxCharsPerLine ? 0 : wLen;
      if (wLen > maxCharsPerLine) lines += 1;
    }
  }
  return { lines, maxCharsPerLine };
}

/**
 * Measure whether `text` at `fontSize` fits inside a box of `boxW` × `boxH`
 * (inches). Returns:
 *   { lines, lineHeightIn, totalHeightIn, fits, overflowIn, maxCharsPerLine }
 *
 * `fits` allows 5% slack on boxH to absorb glyph-width approximation noise.
 */
function _measureTitleFit(text, fontSize, boxW, boxH) {
  const { lines, maxCharsPerLine } = _wrapLines(text, fontSize, boxW);
  const lineHeightIn = (fontSize * 1.05) / 72;
  const totalHeightIn = lines * lineHeightIn;
  const slackedBoxH = boxH * 1.05;
  const fits = totalHeightIn <= slackedBoxH;
  const overflowIn = fits ? 0 : totalHeightIn - boxH;
  return { lines, lineHeightIn, totalHeightIn, fits, overflowIn, maxCharsPerLine };
}

/**
 * Suggest 2-3 named alternatives when a title doesn't fit. Three levers:
 *   - rewrite-shorter: keep size+box, report char budget for the current box
 *   - step-down-size:  next-smaller whitelist size + min `h` that fits text
 *   - dense-size:      smallest dense size (26pt) at the current box
 *
 * Returned shape: [{ kind, fontSize?, h?, maxChars?, note }]
 */
function _titleFitSuggestions(text, currentFontSize, boxW, boxH) {
  const out = [];

  // 1) rewrite-shorter: how many chars fit in the current box × current size?
  const cur = _measureTitleFit("x", currentFontSize, boxW, boxH);
  const lineCapacity = Math.max(1, Math.floor((boxH * 1.05) / cur.lineHeightIn));
  const maxChars = lineCapacity * cur.maxCharsPerLine;
  out.push({
    kind: "rewrite-shorter",
    fontSize: currentFontSize,
    maxChars,
    note: `Rewrite to ≤ ${maxChars} chars at ${currentFontSize}pt to fit ${lineCapacity} line(s) in the current box.`,
  });

  // 2) step-down-size: pick next-smaller content-tier size (26/32/36/38 only —
  //    cover sizes 54+ are role-bound and not appropriate as a step-down).
  const contentTier = [38, 36, 32, 26];
  const idx = contentTier.indexOf(currentFontSize);
  let smaller = null;
  if (idx >= 0 && idx < contentTier.length - 1) {
    smaller = contentTier[idx + 1];
  } else if (idx < 0) {
    // Caller is at a non-content size (cover etc.); offer the largest content size.
    smaller = contentTier[0];
  }
  if (smaller != null) {
    const m = _measureTitleFit(text, smaller, boxW, 1000); // unbounded h to count lines
    const minH = +(m.totalHeightIn).toFixed(2);
    out.push({
      kind: "step-down-size",
      fontSize: smaller,
      h: minH,
      note: `Drop to ${smaller}pt and widen the H1 box to h≈${minH}in to fit the current title.`,
    });
  }

  // 3) dense-size: smallest dense size at current box. Skip if step-down already
  //    chose 26pt (avoid duplicate).
  if (smaller !== 26) {
    const denseFits = _measureTitleFit(text, 26, boxW, boxH);
    out.push({
      kind: "dense-size",
      fontSize: 26,
      h: boxH,
      note: denseFits.fits
        ? `Use 26pt at the current box (${boxH}in) — fits as-is.`
        : `Even 26pt overflows the current box; rewrite or split the title.`,
    });
  }

  return out;
}

// ─── Per-slide tracking via symbols ──────────────────────────────────────────
const SLIDE_META = Symbol.for("ps-pptx.slide-meta");
const PRES_REGISTRY = Symbol.for("ps-pptx.pres-registry");

function meta(slide) {
  if (!slide[SLIDE_META]) slide[SLIDE_META] = { logo: false, tag: false, footer: false, role: null };
  return slide[SLIDE_META];
}

function registerSlide(pres, slide) {
  if (!pres[PRES_REGISTRY]) pres[PRES_REGISTRY] = [];
  if (!pres[PRES_REGISTRY].includes(slide)) pres[PRES_REGISTRY].push(slide);
}

/**
 * Tag a slide's role so writeDeck/validateDeck knows whether to require a footer.
 *   "cover" | "section-divider" | "thank-you" | "end-card"
 * All other slides are treated as "content" and MUST have a footer.
 */
function markRole(slide, role) {
  const valid = ["cover", "section-divider", "thank-you", "end-card", "content"];
  if (!valid.includes(role)) {
    throw new Error(`[ps-pptx] markRole: role must be one of ${valid.join(", ")}, got "${role}"`);
  }
  meta(slide).role = role;
}

function checkColor(name, val) {
  if (val == null) return;
  const v = String(val).replace(/^#/, "").toUpperCase();
  if (!ALLOWED_COLORS_SET.has(v)) {
    throw new Error(
      `[ps-pptx] ${name}: color "${val}" is not in the PS palette. ` +
      `Allowed: RED(E90130) RED_DARK(AE0021) PINK(FA8C9A) BLACK WHITE GRAY_MID(6B6B6B) GRAY_LIGHT(D9D9D9) CHART_GRAY(BBBBBB).`
    );
  }
}

function checkFont(name, val) {
  if (val == null) return;
  if (!ALLOWED_FONTS_SET.has(val)) {
    throw new Error(
      `[ps-pptx] ${name}: fontFace "${val}" is not in the PS type system. ` +
      `Use one of FONT_TITLE | FONT_BODY | FONT_MONO | FONT_MONO_LIGHT.`
    );
  }
}

function checkBounds(name, x, y, w, h, opts = {}) {
  const policy = opts.bottomBandPolicy || (opts.fullBleed ? "fullBleed" : "enforce");
  const eps = 0.01;
  if (policy !== "fullBleed") {
    if (x < MARGIN_L - eps) throw new Error(`[ps-pptx] ${name}: x=${x} crosses left margin (${MARGIN_L}). Pass { bottomBandPolicy: "fullBleed" } for full-bleed images.`);
    if (x + w > W - MARGIN_R + eps) throw new Error(`[ps-pptx] ${name}: x+w=${(x + w).toFixed(3)} crosses right margin (${(W - MARGIN_R).toFixed(3)}).`);
  } else {
    if (x < 0 - eps) throw new Error(`[ps-pptx] ${name}: x=${x} extends off the slide.`);
    if (x + w > W + eps) throw new Error(`[ps-pptx] ${name}: x+w=${(x + w).toFixed(3)} extends past the slide width (${W}).`);
  }
  if (policy === "enforce") {
    if (y + h > FOOTER_BAND_TOP + eps) {
      throw new Error(`[ps-pptx] ${name}: y+h=${(y + h).toFixed(3)} crosses the footer band (>${FOOTER_BAND_TOP}). The footer text sits at y=6.875; content past that collides with it. For full-bleed images use { bottomBandPolicy: "fullBleed" }; for section-divider text use { bottomBandPolicy: "sectionDivider" } and markRole(slide, "section-divider").`);
    }
  } else if (policy === "fullBleed" || policy === "sectionDivider") {
    if (y + h > H + eps) {
      throw new Error(`[ps-pptx] ${name}: y+h=${(y + h).toFixed(3)} extends past the slide bottom (${H}).`);
    }
  } else {
    throw new Error(`[ps-pptx] ${name}: unknown bottomBandPolicy "${policy}". Allowed: "enforce" | "fullBleed" | "sectionDivider".`);
  }
  if (y < 0 - eps) {
    throw new Error(`[ps-pptx] ${name}: box y=${y} extends above the slide.`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function addLogo(slide, variant = "white") {
  const v = String(variant).toLowerCase();
  const file =
    v === "color" || v === "split" ? LOGO_COLOR :
    v === "black" || v === "000000" ? LOGO_BLACK :
    LOGO_WHITE;
  const m = meta(slide);
  if (m.tag) {
    throw new Error(`[ps-pptx] addLogo: this slide already has addSubheadTag. Logo and subhead tag overlap (both at x=0.667, y≈0.5–1.3) and must not coexist. Use addLogo on covers/dividers/end-cards; use addSubheadTag on content slides.`);
  }
  m.logo = true;
  slide.addImage({ path: file, x: LOGO_X, y: LOGO_Y, w: LOGO_W, h: LOGO_H });
  layout.recordPlacement(slide, "logo", "addLogo", LOGO_X, LOGO_Y, LOGO_W, LOGO_H, { reserved: "logo" });
}

function addFooter(slide, opts = {}) {
  const color = opts.color || RED;
  checkColor("addFooter", color);
  const cu = color.replace(/^#/, "").toUpperCase();
  if (cu !== RED && cu !== WHITE && cu !== BLACK) {
    throw new Error(`[ps-pptx] addFooter: color must be RED, WHITE, or BLACK. Got ${color}.`);
  }
  const dateText = opts.dateText || "XX.2026";
  const pageNum = opts.pageNum;
  meta(slide).footer = true;
  slide.addText(
    [
      { text: "© Publicis Sapient", options: {} },
      { text: "\t\t", options: {} },
      { text: dateText, options: {} },
    ],
    {
      x: FOOTER_X, y: FOOTER_Y, w: FOOTER_W, h: FOOTER_H,
      fontFace: FONT_MONO, fontSize: 8, color, charSpacing: -0.5, margin: 0, valign: "middle"
    }
  );
  layout.recordPlacement(slide, "footer", "addFooter", FOOTER_X, FOOTER_Y, FOOTER_W, FOOTER_H, { reserved: "footer", bottomBandPolicy: "fullBleed" });
  if (pageNum != null) {
    slide.addText(String(pageNum), {
      x: PAGE_X, y: PAGE_Y, w: PAGE_W, h: PAGE_H,
      fontFace: FONT_MONO, fontSize: 8, color, align: "right", charSpacing: -0.5, margin: 0, valign: "middle"
    });
    layout.recordPlacement(slide, "page-num", "addFooter.pageNum", PAGE_X, PAGE_Y, PAGE_W, PAGE_H, { reserved: "page-num", bottomBandPolicy: "fullBleed" });
  }
}

function addSubheadTag(slide, text, color = RED) {
  checkColor("addSubheadTag", color);
  const m = meta(slide);
  if (m.logo) {
    throw new Error(`[ps-pptx] addSubheadTag: this slide already has addLogo. They overlap and must not coexist. Remove the addLogo call or move it to a cover/divider/end-card slide.`);
  }
  m.tag = true;
  slide.addText(text, {
    x: LOGO_X, y: 0.483, w: 6, h: 0.184, fontFace: FONT_MONO, fontSize: 10,
    color, charSpacing: -0.5, margin: 0, valign: "bottom",
  });
  // Subhead tag occupies the same slot as the logo (mutually exclusive),
  // so mark it reserved=logo to avoid spurious collisions with title content.
  layout.recordPlacement(slide, "subhead-tag", "addSubheadTag", LOGO_X, 0.483, 6, 0.184, { reserved: "logo" });
}

function addH1(slide, text, opts = {}) {
  const fontSize = opts.fontSize || 38;
  const color = opts.color || RED;
  checkColor("addH1", color);
  const cu = color.replace(/^#/, "").toUpperCase();
  if (cu !== RED && cu !== WHITE && cu !== BLACK) {
    throw new Error(`[ps-pptx] addH1: title color must be RED, WHITE, or BLACK. Got ${color}.`);
  }
  if (!TITLE_SIZES.has(fontSize)) {
    throw new Error(
      `[ps-pptx] addH1: fontSize ${fontSize} is not in the §5 title-size table. ` +
      `Allowed: 26 (dense), 32 (long), 36 (card/in-image headline), 38 (default), 54 (cover-3line), 56 (thank-you), 66 (cover-2line), 72 (cover-1line), 96 (section-divider). ` +
      `If the headline doesn't fit one of these roles, rewrite the headline — don't invent a size.`
    );
  }
  const _h1w = opts.w != null ? opts.w : CONTENT_W;
  const _h1h = opts.h != null ? opts.h : 1.21;
  const _fit = _measureTitleFit(text, fontSize, _h1w, _h1h);
  if (!_fit.fits) {
    const suggestions = _titleFitSuggestions(text, fontSize, _h1w, _h1h);
    const lines = suggestions.map((s) => `  - ${s.kind}: ${s.note}`).join("\n");
    throw new Error(
      `[ps-pptx] addH1: title does not fit the H1 box at fontSize=${fontSize}pt. ` +
      `Measured ${_fit.lines} line(s) × ${_fit.lineHeightIn.toFixed(2)}in = ` +
      `${_fit.totalHeightIn.toFixed(2)}in vs box h=${_h1h}in (overflow ${_fit.overflowIn.toFixed(2)}in). ` +
      `Pick one:\n${lines}`
    );
  }
  const h1x = opts.x != null ? opts.x : MARGIN_L;
  const h1y = opts.y != null ? opts.y : 0.758;
  const h1w = _h1w;
  const h1h = _h1h;
  slide.addText(text, {
    x: h1x, y: h1y, w: h1w, h: h1h,
    fontFace: FONT_TITLE,
    fontSize,
    color,
    bold: true,
    align: opts.align,
    valign: opts.valign || "top",
    margin: 0,
    lineSpacingMultiple: 1.05,
    charSpacing: -0.5,
  });
  layout.recordPlacement(slide, "h1", "addH1", h1x, h1y, h1w, h1h, { allowOverlap: !!opts.allowOverlap, fontSize, text });
}

function addBody(slide, text, opts = {}) {
  const fontSize = opts.fontSize || 12;
  const color = opts.color || BLACK;
  checkColor("addBody", color);
  if (!opts.display && (fontSize < 10 || fontSize > 12)) {
    throw new Error(`[ps-pptx] addBody: fontSize ${fontSize} is outside the body range 10–12pt. For oversized stats/numerals, pass { display: true } and consider using FONT_MONO_LIGHT or FONT_TITLE directly via addBox.`);
  }
  const x = opts.x != null ? opts.x : MARGIN_L;
  const y = opts.y != null ? opts.y : 3.4;
  const w = opts.w != null ? opts.w : CONTENT_W;
  const h = opts.h != null ? opts.h : 3.2;
  if (!opts.skipBoundsCheck) checkBounds("addBody", x, y, w, h, opts);
  layout.recordPlacement(slide, "body", opts.name || "addBody", x, y, w, h, { allowOverlap: !!opts.allowOverlap, bottomBandPolicy: opts.bottomBandPolicy || (opts.fullBleed ? "fullBleed" : "enforce") });
  slide.addText(text, {
    x, y, w, h,
    fontFace: opts.fontFace || FONT_BODY,
    fontSize,
    color,
    bold: !!opts.bold,
    italic: !!opts.italic,
    align: opts.align,
    valign: opts.valign || "top",
    margin: 0,
    paraSpaceAfter: opts.paraSpaceAfter || 8,
    lineSpacingMultiple: opts.lineSpacingMultiple || 1.25,
  });
}

/**
 * Bounds-checked text/shape wrapper. Use for any element you compose by hand
 * (callout cards, oversized display stats, sidebar columns) so the layout
 * still gets margin/title-band/footer-band validation. For text, pass
 * `text` and `textOpts`; for a filled shape, pass `shape` ("rect", "ellipse", …)
 * and `shapeOpts`.
 */
function addBox(slide, opts) {
  if (!opts || opts.x == null || opts.y == null || opts.w == null || opts.h == null) {
    throw new Error(`[ps-pptx] addBox: requires { x, y, w, h }.`);
  }
  checkBounds("addBox", opts.x, opts.y, opts.w, opts.h, opts);
  layout.recordPlacement(slide, "box", opts.name || "addBox", opts.x, opts.y, opts.w, opts.h, { allowOverlap: !!opts.allowOverlap, bottomBandPolicy: opts.bottomBandPolicy || (opts.fullBleed ? "fullBleed" : "enforce") });
  if (opts.fill) checkColor("addBox.fill", opts.fill.color || opts.fill);
  if (opts.line) checkColor("addBox.line", opts.line.color || opts.line);
  if (opts.shape) {
    slide.addShape(opts.shape, {
      x: opts.x, y: opts.y, w: opts.w, h: opts.h,
      fill: opts.fill, line: opts.line,
    });
  }
  if (opts.text != null) {
    const t = opts.textOpts || {};
    checkFont("addBox.fontFace", t.fontFace);
    checkColor("addBox.text.color", t.color);
    slide.addText(opts.text, {
      x: opts.x, y: opts.y, w: opts.w, h: opts.h,
      fontFace: t.fontFace || FONT_BODY,
      fontSize: t.fontSize || 12,
      color: t.color || BLACK,
      bold: !!t.bold,
      italic: !!t.italic,
      align: t.align,
      valign: t.valign || "top",
      margin: t.margin != null ? t.margin : 0,
      paraSpaceAfter: t.paraSpaceAfter,
      lineSpacingMultiple: t.lineSpacingMultiple || 1.25,
      charSpacing: t.charSpacing,
    });
  }
}

/**
 * Wrap pres.addSlide so every slide auto-registers in pres[PRES_REGISTRY].
 * Call once after `new PptxGenJS()`. Idempotent.
 */
function instrument(pres) {
  if (pres.__psInstrumented) return pres;
  const orig = pres.addSlide.bind(pres);
  pres.addSlide = function (...args) {
    const s = orig(...args);
    registerSlide(pres, s);
    return s;
  };
  pres.__psInstrumented = true;
  return pres;
}

/**
 * Validate every registered slide. Throws on any failure with a list of
 * offending slide indices. Call before pres.writeFile, or use writeDeck.
 */
function validateDeck(pres, opts = {}) {
  const slides = pres[PRES_REGISTRY] || [];
  const errors = [];
  slides.forEach((s, i) => {
    const m = meta(s);
    const idx = i + 1;
    if (m.logo && m.tag) errors.push(`slide ${idx}: addLogo and addSubheadTag both used (overlap)`);
    const skipsFooter = m.role === "cover" || m.role === "thank-you" || m.role === "end-card";
    if (!skipsFooter && !m.footer) {
      errors.push(`slide ${idx}: missing addFooter (mark covers/closers via markRole(slide, "cover"|"thank-you"|"end-card") if intentional)`);
    }
  });

  const geom = {
    W, H, MARGIN_L, MARGIN_R,
    TITLE_BAND_TOP, TITLE_BAND_BOTTOM, FOOTER_BAND_TOP,
    LOGO_X, LOGO_Y, LOGO_W, LOGO_H,
    FOOTER_X, FOOTER_Y, FOOTER_W, FOOTER_H,
    PAGE_X, PAGE_Y, PAGE_W, PAGE_H,
  };
  const layoutResult = layout.validateLayout(pres, slides, geom);
  errors.push(...layoutResult.errors);

  if (layoutResult.warnings.length && !opts.silent) {
    layoutResult.warnings.forEach((w) => console.warn(`[ps-pptx] warn: ${w}`));
  }

  if (errors.length) {
    throw new Error(`[ps-pptx] validateDeck failed:\n  ${errors.join("\n  ")}`);
  }
  return { warnings: layoutResult.warnings };
}

/**
 * Validate then write. Preferred over pres.writeFile for PS decks.
 */
async function writeDeck(pres, fileName) {
  validateDeck(pres);
  return pres.writeFile({ fileName });
}

module.exports = {
  // tokens
  RED, RED_DARK, PINK, BLACK, WHITE, GRAY_MID, GRAY_LIGHT, CHART_GRAY, ALLOWED_COLORS,
  FONT_TITLE, FONT_BODY, FONT_MONO, FONT_MONO_LIGHT, ALLOWED_FONTS,
  // geometry
  W, H, MARGIN_L, MARGIN_R, CONTENT_W,
  LOGO_X, LOGO_Y, LOGO_W, LOGO_H,
  FOOTER_X, FOOTER_Y, FOOTER_W, FOOTER_H,
  PAGE_X, PAGE_Y, PAGE_W, PAGE_H,
  TITLE_BAND_TOP, TITLE_BAND_BOTTOM, FOOTER_BAND_TOP,
  // assets
  LOGO_WHITE, LOGO_COLOR, LOGO_BLACK, MEDIA,
  // helpers
  addLogo, addFooter, addSubheadTag, addH1, addBody, addBox,
  // measurement (exported for qa.js + tests)
  _measureTitleFit, _titleFitSuggestions,
  // layout primitives
  row: layout.row,
  column: layout.column,
  grid: layout.grid,
  stack: layout.stack,
  // deck-level
  markRole, instrument, validateDeck, writeDeck,
};
