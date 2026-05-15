/**
 * ps_theme.js — Canonical Publicis Sapient deck theme.
 *
 * Single source of truth for the PS-branded color palette, typography,
 * layout geometry, and reusable placement helpers (logo, footer, H1, body,
 * subhead tag). Both `build_deck.js` (the golden reference) and any deck
 * generated under the ps-pptx skill MUST `require('./ps_theme.js')` and use
 * these tokens/helpers — never inline hex codes or font strings.
 */

const path = require("path");

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

// ─── Typography — the ONLY fonts permitted in PS decks ───────────────────────
const FONT_TITLE      = "Lexend Deca SemiBold";
const FONT_BODY       = "Roboto";
const FONT_MONO       = "Roboto Mono Medium";
const FONT_MONO_LIGHT = "Roboto Mono Light";

const ALLOWED_FONTS = [FONT_TITLE, FONT_BODY, FONT_MONO, FONT_MONO_LIGHT];

// ─── Layout geometry — 16:9 widescreen 13.333" × 7.5" ────────────────────────
const W = 13.333;
const H = 7.5;
const MARGIN_L = 0.667;
const MARGIN_R = 0.667;
const CONTENT_W = W - MARGIN_L - MARGIN_R; // 12.0

// Master placeholder positions (from slideMaster1.xml, EMU → inches)
const LOGO_X = 0.667, LOGO_Y = 0.667, LOGO_W = 1.149, LOGO_H = 0.624;
const FOOTER_X = 0.667, FOOTER_Y = 6.875, FOOTER_W = 5.795, FOOTER_H = 0.18;
const PAGE_X = 12.038, PAGE_Y = 6.875, PAGE_W = 0.625, PAGE_H = 0.18;

// ─── Asset paths ─────────────────────────────────────────────────────────────
const LOGO_WHITE = path.join(__dirname, "assets", "logos", "ps-logo-white.png");
const LOGO_COLOR = path.join(__dirname, "assets", "logos", "ps-logo-color.png");
const LOGO_BLACK = path.join(__dirname, "assets", "logos", "ps-logo-black.png");
const MEDIA = (n) => path.join(__dirname, "assets", "media", n);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function addLogo(slide, variant = "white") {
  const v = String(variant).toLowerCase();
  const file =
    v === "color" || v === "split" ? LOGO_COLOR :
    v === "black" || v === "000000" ? LOGO_BLACK :
    LOGO_WHITE;
  slide.addImage({ path: file, x: LOGO_X, y: LOGO_Y, w: LOGO_W, h: LOGO_H });
}

function addFooter(slide, opts = {}) {
  const color = opts.color || RED;
  const dateText = opts.dateText || "XX.2026";
  const pageNum = opts.pageNum;
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
  if (pageNum != null) {
    slide.addText(String(pageNum), {
      x: PAGE_X, y: PAGE_Y, w: PAGE_W, h: PAGE_H,
      fontFace: FONT_MONO, fontSize: 8, color, align: "right", charSpacing: -0.5, margin: 0, valign: "middle"
    });
  }
}

function addSubheadTag(slide, text, color = RED) {
  slide.addText(text, {
    x: LOGO_X, y: 0.483, w: 6, h: 0.184, fontFace: FONT_MONO, fontSize: 10,
    color, charSpacing: -0.5, margin: 0, valign: "bottom",
  });
}

function addH1(slide, text, opts = {}) {
  slide.addText(text, {
    x: opts.x != null ? opts.x : MARGIN_L,
    y: opts.y != null ? opts.y : 0.758,
    w: opts.w != null ? opts.w : CONTENT_W,
    h: opts.h != null ? opts.h : 1.21,
    fontFace: FONT_TITLE,
    fontSize: opts.fontSize || 38,
    color: opts.color || RED,
    bold: true,
    margin: 0,
    valign: "top",
    lineSpacingMultiple: 1.05,
    charSpacing: -0.5,
  });
}

function addBody(slide, text, opts = {}) {
  slide.addText(text, {
    x: opts.x != null ? opts.x : MARGIN_L,
    y: opts.y != null ? opts.y : 3.4,
    w: opts.w != null ? opts.w : CONTENT_W,
    h: opts.h != null ? opts.h : 3.2,
    fontFace: FONT_BODY,
    fontSize: opts.fontSize || 12,
    color: opts.color || BLACK,
    margin: 0,
    valign: "top",
    paraSpaceAfter: opts.paraSpaceAfter || 8,
    lineSpacingMultiple: 1.25,
  });
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
  // assets
  LOGO_WHITE, LOGO_COLOR, LOGO_BLACK, MEDIA,
  // helpers
  addLogo, addFooter, addSubheadTag, addH1, addBody,
};
