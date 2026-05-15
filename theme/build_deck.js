/**
 * build_deck.js — Agent-optimized "golden copy" of the Publicis Sapient deck theme.
 *
 * Usage: node build_deck.js
 * Output: output.pptx
 *
 * This is a stripped-down version of the full PS template. It preserves the
 * visual identity (logos, palette, typography, spacing, layout helpers) and a
 * catalog of reusable layouts with placeholder copy, so an agent can use it as
 * a reference when generating new PS-themed decks. Brand-guideline pages,
 * product showcases (Bodhi/Slingshot/Sustain), case studies, and template
 * instructions have been removed. For the full human-facing template, see
 * build_deck_human.js.
 */

const PptxGenJS = require("pptxgenjs");
const fs = require("fs");
const path = require("path");
const T = require("./index.js");

const {
  RED, RED_DARK, PINK, BLACK, WHITE, GRAY_MID, GRAY_LIGHT, CHART_GRAY,
  FONT_TITLE, FONT_BODY, FONT_MONO, FONT_MONO_LIGHT,
  W, H, MARGIN_L, MARGIN_R, CONTENT_W,
  LOGO_X, LOGO_Y, LOGO_W, LOGO_H,
  FOOTER_X, FOOTER_Y, FOOTER_W, FOOTER_H,
  PAGE_X, PAGE_Y, PAGE_W, PAGE_H,
  LOGO_WHITE, LOGO_COLOR, LOGO_BLACK, MEDIA,
  addLogo, addFooter, addSubheadTag, addH1, addBody,
} = T;

// ─── Build ───────────────────────────────────────────────────────────────────
const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";
pres.title  = "Presentation template";

// Slide 1 — Cover (red)
{
  const s = pres.addSlide();
  s.background = { color: RED };
  s.addImage({ path: LOGO_WHITE, x: LOGO_X, y: LOGO_Y, w: 0.78, h: 0.424 });
  s.addText("Presentation template", {
    x: 0.667, y: 3.0, w: 12.0, h: 1.5,
    fontFace: FONT_TITLE, fontSize: 72, color: WHITE, bold: true,
    margin: 0, valign: "middle", charSpacing: -1, lineSpacingMultiple: 1.0,
  });
  addFooter(s, { color: WHITE });
}

// Slide 2 — Overview of slide layouts
{
  const s = pres.addSlide();
  addH1(s, "Overview of slide layouts", { y: 0.7, w: 12.0, h: 1.0, fontSize: 38 });
  if (fs.existsSync(MEDIA("image15.png"))) {
    s.addImage({ path: MEDIA("image15.png"), x: 0.68, y: 1.79, w: 11.97, h: 4.82 });
  } else {
    const cols = 6, rows = 4, gx = 0.5, gy = 2.0, cw = 2.0, ch = 1.15, gap = 0.08;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isRed = (r + c) % 2 === 0;
        s.addShape("rect", { x: gx + c * (cw + gap), y: gy + r * (ch + gap), w: cw, h: ch,
          fill: { color: isRed ? RED : WHITE }, line: { color: GRAY_LIGHT, width: 0.75 } });
      }
    }
  }
  addFooter(s, { pageNum: 2 });
}

// Slide 3 — Sample Slides section divider (white bg, centered red title)
{
  const s = pres.addSlide();
  s.addText("Sample Slides", {
    x: 0, y: 0, w: W, h: H,
    fontFace: FONT_TITLE, fontSize: 72, color: RED, bold: true,
    align: "center", valign: "middle", margin: 0, charSpacing: -0.5,
  });
  addFooter(s);
}

// Slide 4 — Cover 2 lines
{
  const s = pres.addSlide();
  s.background = { color: RED };
  addLogo(s, WHITE);
  addH1(s, "Presentation\ntitle in two lines", { x: 0.667, y: 2.602, w: 8.27, h: 2.295, fontSize: 66, color: WHITE });
  addFooter(s, { color: WHITE });
}

// Slide 5 — Cover 3 lines
{
  const s = pres.addSlide();
  s.background = { color: RED };
  addLogo(s, WHITE);
  s.addText("Presentation title\nin three lines lorem\nipsum dolor", {
    x: 0.667, y: 2.4, w: 12.0, h: 3.0,
    fontFace: FONT_TITLE, fontSize: 54, color: WHITE, bold: true,
    margin: 0, valign: "middle", charSpacing: -1, lineSpacingMultiple: 1.05,
  });
  addFooter(s, { color: WHITE });
}

// Slide 6 — Agenda red
{
  const s = pres.addSlide();
  s.background = { color: RED };
  s.addText("Agenda", { x: 0.667, y: 0.5, w: 6, h: 0.3, fontFace: FONT_MONO, fontSize: 10, color: WHITE, margin: 0, charSpacing: -0.5 });
  const items = ["01 Section title", "02 Section title", "03 Section title", "04 Section title", "05 Section title", "06 Section title"];
  s.addText(items.map((t, i) => ({ text: t, options: { breakLine: i < items.length - 1 } })),
    { x: 0.667, y: 0.758, w: 12, h: 5.5, fontFace: FONT_MONO_LIGHT, fontSize: 36, color: WHITE, margin: 0, lineSpacingMultiple: 1.15, charSpacing: -0.5, valign: "top" });
  addFooter(s, { color: WHITE, pageNum: 6 });
}

// Slide 7 — Contents white
{
  const s = pres.addSlide();
  s.addText("Contents", { x: 0.667, y: 0.5, w: 6, h: 0.3, fontFace: FONT_MONO, fontSize: 10, color: RED, margin: 0, charSpacing: -0.5 });
  const items = ["01 Section title", "02 Section title", "03 Section title", "04 Section title", "05 Section title", "06 Section title"];
  s.addText(items.map((t, i) => ({ text: t, options: { breakLine: i < items.length - 1 } })),
    { x: 0.667, y: 0.758, w: 12, h: 5.5, fontFace: FONT_MONO_LIGHT, fontSize: 36, color: RED, margin: 0, lineSpacingMultiple: 1.15, charSpacing: -0.5, valign: "top" });
  addFooter(s, { pageNum: 7 });
}

// Slide 8 — Subhead intro red
{
  const s = pres.addSlide();
  s.background = { color: RED };
  s.addText("Subhead", { x: 0.667, y: 0.483, w: 6, h: 0.3, fontFace: FONT_MONO, fontSize: 10, color: WHITE, margin: 0 });
  s.addShape("roundRect", { x: 0.667, y: 1.1, w: 12.0, h: 5.4, fill: { color: RED }, line: { color: WHITE, width: 1 }, rectRadius: 0.15 });
  s.addText("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    { x: 1.2, y: 1.5, w: 10.95, h: 4.6, fontFace: FONT_MONO_LIGHT, fontSize: 28, color: WHITE, margin: 0, valign: "middle", lineSpacingMultiple: 1.2, charSpacing: -0.5 });
  addFooter(s, { color: WHITE, pageNum: 8 });
}

// Slide 9 — Subhead intro white
{
  const s = pres.addSlide();
  s.addText("Subhead", { x: 0.667, y: 0.483, w: 6, h: 0.3, fontFace: FONT_MONO, fontSize: 10, color: RED, margin: 0 });
  s.addShape("roundRect", { x: 0.667, y: 1.1, w: 12.0, h: 5.4, fill: { color: WHITE }, line: { color: RED, width: 1 }, rectRadius: 0.15 });
  s.addText("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    { x: 1.2, y: 1.5, w: 10.95, h: 4.6, fontFace: FONT_MONO_LIGHT, fontSize: 28, color: RED, margin: 0, valign: "middle", lineSpacingMultiple: 1.2, charSpacing: -0.5 });
  addFooter(s, { pageNum: 9 });
}

// Section title slides — red w/ "Section title" + index
function sectionTitle(num, pageNum) {
  const s = pres.addSlide();
  s.background = { color: RED };
  addH1(s, "Section title", { x: 0.667, y: 0.5, w: 11.0, h: 1.6, fontSize: 96, color: WHITE });
  s.addText(num, { x: 10.5, y: 5.0, w: 2.166, h: 1.875, fontFace: FONT_MONO_LIGHT, fontSize: 130, color: WHITE, align: "right", margin: 0, valign: "bottom", charSpacing: -0.5 });
  addFooter(s, { color: WHITE, pageNum });
  return s;
}

// Slide 10 — Section title 01
sectionTitle("01", 10);

// Slide 11 — Section title 02
sectionTitle("02", 11);

// Slide 12 — Section title 03
sectionTitle("03", 12);

// Slide 13 — One-column content
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Headline one column content");
  const lorem = "One column text slide lorem dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
  addBody(s, lorem, { x: 0.667, y: 2.8, w: 5.9, h: 3.3, fontSize: 11 });
  addFooter(s, { pageNum: 13 });
}

// Slide 14 — Two-column content
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Headline two column content");
  const leftLorem = "Two column text slide ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
  const rightLorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
  addBody(s, leftLorem, { x: 0.667, y: 2.8, w: 5.8, h: 3.3, fontSize: 11 });
  addBody(s, rightLorem, { x: 6.867, y: 2.8, w: 5.8, h: 3.3, fontSize: 11 });
  addFooter(s, { pageNum: 14 });
}

// Slide 15 — Long headline + 3 columns subhead
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Long headline lorem ipsum dolor sit amet, consectetur adipiscing a elit, sed do eiusmod tempor theis incididunt ut labore", { fontSize: 26 });
  const COL_X = [MARGIN_L, MARGIN_L + 4.15, MARGIN_L + 8.3];
  const COL_W = 3.7;
  ["Subhead lorem ipsum dolor sit amet", "Subhead lorem ipsum dolor sit amet", "Subhead lorem ipsum dolor sit amet"].forEach((sh, i) => {
    s.addText(sh, { x: COL_X[i], y: 4.35, w: COL_W, h: 0.35, fontFace: FONT_BODY, fontSize: 11, color: BLACK, margin: 0 });
  });
  const para = "Two column text slide ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
  for (let i = 0; i < 3; i++) {
    addBody(s, para, { x: COL_X[i], y: 4.85, w: COL_W, h: 1.9, fontSize: 11 });
  }
  addFooter(s, { pageNum: 15 });
}

// Slide 16 — Table on white
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Table styling example");
  const headerRow = ["", "Column name", "Column name", "Column name", "Column name"].map(t => ({
    text: t, options: { bold: true, color: BLACK, fontFace: FONT_BODY, fontSize: 11, valign: "middle", border: [{ type: "none" }, { type: "none" }, { type: "solid", color: RED, pt: 1 }, { type: "none" }], margin: 0.1 },
  }));
  const rows = [headerRow];
  for (let r = 0; r < 6; r++) {
    rows.push([
      { text: "Row name", options: { bold: true, color: BLACK, fontFace: FONT_BODY, fontSize: 10, valign: "middle", border: [{ type: "none" }, { type: "none" }, { type: "solid", color: GRAY_LIGHT, pt: 0.75 }, { type: "none" }], margin: 0.1 } },
      ...Array(4).fill(0).map(() => ({ text: "Content", options: { color: BLACK, fontFace: FONT_BODY, fontSize: 10, valign: "middle", border: [{ type: "none" }, { type: "none" }, { type: "solid", color: GRAY_LIGHT, pt: 0.75 }, { type: "none" }], margin: 0.1 } })),
    ]);
  }
  rows[rows.length - 1] = rows[rows.length - 1].map(c => ({ ...c, options: { ...c.options, border: [{ type: "none" }, { type: "none" }, { type: "solid", color: RED, pt: 1 }, { type: "none" }] } }));
  s.addTable(rows, { x: 0.667, y: 2.5, w: 12.0, colW: [2.4, 2.4, 2.4, 2.4, 2.4], rowH: 0.55 });
  addFooter(s, { pageNum: 16 });
}

// Slide 17 — Table on red
{
  const s = pres.addSlide();
  s.background = { color: RED };
  addSubheadTag(s, "Subhead", WHITE);
  addH1(s, "Table styling example on red", { color: WHITE });
  const headerRow = ["", "Column name", "Column name", "Column name", "Column name"].map(t => ({
    text: t, options: { bold: true, color: WHITE, fontFace: FONT_BODY, fontSize: 11, valign: "middle", border: [{ type: "none" }, { type: "none" }, { type: "solid", color: WHITE, pt: 1 }, { type: "none" }], margin: 0.1 },
  }));
  const rows = [headerRow];
  for (let r = 0; r < 6; r++) {
    rows.push([
      { text: "Row name", options: { bold: true, color: WHITE, fontFace: FONT_BODY, fontSize: 10, valign: "middle", border: [{ type: "none" }, { type: "none" }, { type: "solid", color: PINK, pt: 0.75 }, { type: "none" }], margin: 0.1 } },
      ...Array(4).fill(0).map(() => ({ text: "Content", options: { color: WHITE, fontFace: FONT_BODY, fontSize: 10, valign: "middle", border: [{ type: "none" }, { type: "none" }, { type: "solid", color: PINK, pt: 0.75 }, { type: "none" }], margin: 0.1 } })),
    ]);
  }
  rows[rows.length - 1] = rows[rows.length - 1].map(c => ({ ...c, options: { ...c.options, border: [{ type: "none" }, { type: "none" }, { type: "solid", color: WHITE, pt: 1 }, { type: "none" }] } }));
  s.addTable(rows, { x: 0.667, y: 2.5, w: 12.0, colW: [2.4, 2.4, 2.4, 2.4, 2.4], rowH: 0.55 });
  addFooter(s, { color: WHITE, pageNum: 17 });
}

// Slide 18 — Bar chart
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Chart title");
  const data = [
    { name: "Series 1", labels: ["Category 1", "Category 2", "Category 3", "Category 4"], values: [4.3, 2.5, 3.5, 4.5] },
    { name: "Series 2", labels: ["Category 1", "Category 2", "Category 3", "Category 4"], values: [2.4, 4.4, 1.8, 2.8] },
    { name: "Series 3", labels: ["Category 1", "Category 2", "Category 3", "Category 4"], values: [2.0, 2.0, 3.0, 5.0] },
  ];
  const CX = 0.667, CY = 2.6, CW = 12.0, CH = 3.6;
  s.addChart(pres.ChartType.bar, data, {
    x: CX, y: CY, w: CW, h: CH,
    barDir: "bar", barGrouping: "percentStacked",
    barGapWidthPct: 150,
    chartColors: [RED, CHART_GRAY, BLACK],
    showLegend: false,
    catAxisLabelFontFace: FONT_MONO, catAxisLabelFontSize: 9,
    valAxisLabelFontFace: FONT_MONO, valAxisLabelFontSize: 9,
    showCatAxisTitle: false, showValAxisTitle: false,
    valAxisLabelFormatCode: "0%",
  });
  const LX = 9.6, LY = 1.05, LW = 2.55, LH = 1.05;
  s.addShape("roundRect", {
    x: LX, y: LY, w: LW, h: LH,
    fill: { color: WHITE }, line: { color: GRAY_LIGHT, width: 0.75 }, rectRadius: 0.08,
  });
  const rowH = 0.28, swW = 0.45, swH = 0.18;
  const swX = LX + 0.18, txX = LX + 0.78;
  const rowY = (i) => LY + 0.12 + i * rowH;
  s.addShape("rect", { x: swX, y: rowY(0) + 0.04, w: swW, h: swH, fill: { color: RED }, line: { type: "none" } });
  s.addShape("rect", { x: swX, y: rowY(1) + 0.04, w: swW, h: swH, fill: { color: CHART_GRAY }, line: { type: "none" } });
  s.addShape("rect", { x: swX, y: rowY(2) + 0.04, w: swW, h: swH, fill: { color: BLACK }, line: { type: "none" } });
  ["Series 1", "Series 2", "Series 3"].forEach((t, i) => {
    s.addText(t, {
      x: txX, y: rowY(i), w: LW - (txX - LX) - 0.1, h: rowH,
      fontFace: FONT_MONO, fontSize: 11, color: BLACK, valign: "middle", margin: 0,
    });
  });
  addFooter(s, { pageNum: 18 });
}

// Slide 19 — Headline only
{
  const s = pres.addSlide();
  s.addText("Subhead", {
    x: LOGO_X, y: 0.483, w: 6, h: 0.184, fontFace: FONT_MONO, fontSize: 10,
    color: RED, bold: true, charSpacing: -0.5, margin: 0, valign: "bottom",
  });
  addH1(s, "Headline only");
  s.addText(
    [
      { text: "© Publicis Sapient", options: {} },
      { text: "\t\t", options: {} },
      { text: "XX.2026", options: {} },
    ],
    {
      x: FOOTER_X, y: FOOTER_Y, w: FOOTER_W, h: FOOTER_H,
      fontFace: FONT_MONO, fontSize: 8, color: RED, bold: true,
      charSpacing: -0.5, margin: 0, valign: "middle",
    }
  );
  s.addText("19", {
    x: PAGE_X, y: PAGE_Y, w: PAGE_W, h: PAGE_H,
    fontFace: FONT_MONO, fontSize: 8, color: RED, bold: true,
    align: "right", charSpacing: -0.5, margin: 0, valign: "middle",
  });
}

// Slides 20-24 — Headline over image (full bleed)
const imageSlides = [
  { num: 20, img: "image2.png", title: "Headline or section\ntitle over image 01" },
  { num: 21, img: "image3.png", title: "Headline or section\ntitle over image 02" },
  { num: 22, img: "image4.png", title: "Headline or section\ntitle over image 03" },
  { num: 23, img: "image5.png", title: "Headline or section\ntitle over image 04", titleColor: BLACK },
  { num: 24, img: "image6.png", title: "Headline or section\ntitle over image 05", titleX: 1.3 },
];
imageSlides.forEach(it => {
  const s = pres.addSlide();
  if (fs.existsSync(MEDIA(it.img))) {
    s.addImage({ path: MEDIA(it.img), x: 0, y: 0, w: W, h: H });
  } else {
    s.background = { color: BLACK };
  }
  addSubheadTag(s, "Subhead", it.titleColor ?? WHITE);
  addH1(s, it.title, { x: it.titleX ?? 0.7, y: 3.0, w: 7, h: 1.8, fontSize: 36, color: it.titleColor ?? WHITE });
  addFooter(s, { color: it.titleColor ?? WHITE, pageNum: it.num });
});

// Slides 25-27 — Headline + image-right
const halfImageSlides = [
  { num: 25, img: "image7.png" },
  { num: 26, img: "image8.png" },
  { num: 27, img: "image9.png" },
];
halfImageSlides.forEach(it => {
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Headline or title");
  s.addText("Subhead lorem ipsum", { x: 0.667, y: 3.05, w: 6, h: 0.4, fontFace: FONT_BODY, fontSize: 11, color: BLACK, margin: 0 });
  const lorem = "One column text slide lorem dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
  addBody(s, lorem, { x: 0.667, y: 3.5, w: 5.9, h: 3.25, fontSize: 11 });
  if (fs.existsSync(MEDIA(it.img))) {
    s.addImage({ path: MEDIA(it.img), x: 7.6, y: 0, w: W - 7.6, h: H });
  } else {
    s.addShape("rect", { x: 7.6, y: 0, w: W - 7.6, h: H, fill: { color: GRAY_LIGHT }, line: { type: "none" } });
  }
  addFooter(s, { pageNum: it.num });
});

// Slide 28 — Headline + right placeholder (no image)
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Headline or title");
  s.addShape("rect", { x: 6.8, y: 0.667, w: 5.866, h: 5.95, fill: { color: GRAY_LIGHT }, line: { type: "none" } });
  s.addText("Subhead lorem ipsum", { x: 0.667, y: 3.05, w: 6, h: 0.4, fontFace: FONT_BODY, fontSize: 11, color: BLACK, margin: 0 });
  addBody(s, "One column text slide lorem dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    { x: 0.667, y: 3.5, w: 5.9, h: 3.25, fontSize: 11 });
  addFooter(s, { pageNum: 28 });
}

// Slide 29 — Title + large image left
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  s.addShape("rect", { x: MARGIN_L, y: 0.85, w: 7.5, h: 5.8, fill: { color: GRAY_LIGHT }, line: { type: "none" } });
  addH1(s, "Headline or\ntitle in three\nlines", { x: 8.5, w: 4.166, h: 2.4, fontSize: 32 });
  s.addText("Subhead lorem ipsum", { x: 8.5, y: 4.85, w: 4.166, h: 0.4, fontFace: FONT_TITLE, fontSize: 11, bold: true, color: BLACK, margin: 0 });
  addBody(s, "One column text slide lorem dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliqui.",
    { x: 8.5, y: 5.25, w: 4.166, h: 1.5, fontSize: 11 });
  addFooter(s, { pageNum: 29 });
}

// Slide 30 — Title + image bleeding right
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  s.addShape("rect", { x: 5.166, y: 0.85, w: 7.5, h: 5.8, fill: { color: GRAY_LIGHT }, line: { type: "none" } });
  addH1(s, "Headline or\ntitle in three\nlines", { w: 4, h: 2.8, fontSize: 32 });
  s.addText("Subhead lorem ipsum", { x: 0.667, y: 4.4, w: 4.0, h: 0.4, fontFace: FONT_BODY, fontSize: 11, color: BLACK, margin: 0 });
  addBody(s, "One column text slide lorem dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex.",
    { x: 0.667, y: 4.85, w: 4.0, h: 1.9, fontSize: 11 });
  addFooter(s, { pageNum: 30 });
}

// Slide 31 — Headline + 1 tall image + 2 stacked images
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Headline or title");
  s.addText("Subhead lorem ipsum", { x: 0.667, y: 3.0, w: 4.0, h: 0.4, fontFace: FONT_BODY, fontSize: 11, bold: false, color: BLACK, margin: 0 });
  addBody(s, "One column text slide lorem dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    { x: 0.667, y: 3.4, w: 4.0, h: 3.35, fontSize: 11 });
  s.addShape("rect", { x: 5.96, y: 0.99, w: 3.25, h: 5.52, fill: { color: GRAY_LIGHT }, line: { type: "none" } });
  s.addShape("rect", { x: 9.41, y: 0.97, w: 3.26, h: 2.70, fill: { color: GRAY_LIGHT }, line: { type: "none" } });
  s.addShape("rect", { x: 9.41, y: 3.86, w: 3.26, h: 2.63, fill: { color: GRAY_LIGHT }, line: { type: "none" } });
  addFooter(s, { pageNum: 31 });
}

// Slide 32 — Title left, body top-right, full-width image bottom
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Headline or title", { fontSize: 26 });
  addBody(s, "One column text slide lorem dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in.",
    { x: 5.68, y: 0.85, w: 6.65, h: 1.5, fontSize: 11 });
  s.addShape("rect", { x: 0.667, y: 2.8, w: 11.95, h: 3.65, fill: { color: GRAY_LIGHT }, line: { type: "none" } });
  addFooter(s, { pageNum: 32 });
}

// Slide 33 — Image right small
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Headline or title");
  s.addText("Subhead lorem ipsum", { x: 0.667, y: 2.5, w: 5.8, h: 0.35, fontFace: FONT_TITLE, fontSize: 11, bold: true, color: BLACK, margin: 0 });
  addBody(s, "One column text slide lorem dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    { x: 0.667, y: 2.9, w: 5.8, h: 3.5, fontSize: 11 });
  s.addShape("rect", { x: 6.867, y: 2.5, w: 5.8, h: 3.9, fill: { color: GRAY_LIGHT }, line: { type: "none" } });
  addFooter(s, { pageNum: 33 });
}

// Slide 34 — Long headline + 3 column body
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Headline lorem ipsum cillum dolore\neu fugiat nulla pariatur excepteur\nsint occaecat", { w: 9.7, h: 2.4 });
  ["Subhead", "Subhead", "Subhead"].forEach((sh, i) => {
    s.addText(sh, { x: 0.667 + i * 4.15, y: 4.4, w: 3.7, h: 0.4, fontFace: FONT_BODY, fontSize: 11, color: BLACK, margin: 0 });
  });
  const para = "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
  for (let i = 0; i < 3; i++) {
    addBody(s, para, { x: 0.667 + i * 4.15, y: 4.85, w: 3.7, h: 1.9, fontSize: 11 });
  }
  addFooter(s, { pageNum: 34 });
}

// Slide 35 — Long headline left (4 lines), body right column
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Headline lorem ipsum\ncillum dolore sit amet\nfugiat nulla pariatur\nexcepteur sint", { w: 5.7, h: 3.6, fontSize: 32 });
  s.addText("Subhead", { x: 6.867, y: 4.2, w: 4, h: 0.3, fontFace: FONT_TITLE, fontSize: 11, bold: true, color: BLACK, margin: 0 });
  addBody(s, "One column text slide lorem dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    { x: 6.867, y: 4.65, w: 5.8, h: 2.1, fontSize: 11 });
  addFooter(s, { pageNum: 35 });
}

// Slide 36 — 2x3 numbered list
{
  const s = pres.addSlide();
  addSubheadTag(s, "Subhead");
  addH1(s, "Headline or title", { fontSize: 26, h: 0.8 });
  const items = [
    "Point one lorem", "Point two lorem", "Point three lorem",
    "Point four lorem", "Point five lorem", "Point six lorem",
  ];
  const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  items.forEach((it, i) => {
    const r = Math.floor(i / 3), c = i % 3;
    const x = 0.667 + c * 4.25, y = 2.05 + r * 2.3;
    s.addText(String(i + 1).padStart(2, "0"), { x, y, w: 1.5, h: 0.55, fontFace: FONT_MONO_LIGHT, fontSize: 26, color: BLACK, margin: 0 });
    s.addText(it, { x, y: y + 0.6, w: 3.5, h: 0.28, fontFace: FONT_TITLE, fontSize: 11, bold: true, color: BLACK, margin: 0 });
    s.addText(lorem, { x, y: y + 0.92, w: 3.3, h: 1.2, fontFace: FONT_BODY, fontSize: 10, color: BLACK, margin: 0, lineSpacingMultiple: 1.3 });
  });
  addFooter(s, { pageNum: 36 });
}

// ─── Helper for callout grid slides ──────────────────────────────────────────
function calloutGrid(num, mode) {
  // mode: 'white' (red outlines), 'red-bg' (red bg + white outlines), 'red-cards' (white bg, solid red cards)
  const s = pres.addSlide();
  if (mode === "red-bg") s.background = { color: RED };
  const subColor = (mode === "red-bg") ? WHITE : RED;

  const isSolidRed = mode === "red-cards";
  const isRedBg = mode === "red-bg";
  const cardFill = isSolidRed ? RED : WHITE;
  const cardLine = isRedBg ? WHITE : RED;
  const titleColor = isSolidRed ? WHITE : RED;
  const bodyColor = isSolidRed ? WHITE : (isRedBg ? RED : BLACK);
  const numColor = isSolidRed ? WHITE : RED;

  const cards = [
    { t: "Callout one",  b: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",                                        x: 0.667, y: 0.87, w: 3.0,  h: 2.16 },
    { t: "Callout two",  b: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", x: 3.817, y: 0.87, w: 4.3,  h: 2.16 },
    { t: "Callout three", b: "",                                                                                                                                                    x: 8.267, y: 0.87, w: 1.5,  h: 3.91 },
    { t: "Callout four", b: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", x: 0.667, y: 3.23, w: 5.45, h: 3.37 },
  ];
  cards.forEach(c => {
    s.addShape("roundRect", { x: c.x, y: c.y, w: c.w, h: c.h, fill: { color: cardFill }, line: { color: cardLine, width: 1 }, rectRadius: 0.1 });
    s.addText(c.t, { x: c.x + 0.25, y: c.y + 0.25, w: c.w - 0.5, h: 0.35, fontFace: FONT_BODY, fontSize: 11, bold: false, color: titleColor, margin: 0, valign: "top" });
    if (c.b) {
      s.addText(c.b, { x: c.x + 0.25, y: c.y + 0.7, w: c.w - 0.5, h: c.h - 0.9, fontFace: FONT_BODY, fontSize: 10, color: bodyColor, margin: 0, lineSpacingMultiple: 1.4, valign: "top" });
    }
  });

  s.addShape("roundRect", { x: 6.267, y: 3.23, w: 1.85, h: 1.55, fill: { color: cardFill }, line: { color: cardLine, width: 1 }, rectRadius: 0.1 });

  const stats = [
    { num: "80%", label: "Stat or callout", x: 9.917, y: 0.87, w: 2.75, h: 1.81 },
    { num: "45%", label: "Stat or callout", x: 9.917, y: 2.90, w: 2.75, h: 1.88 },
  ];
  stats.forEach(st => {
    s.addShape("roundRect", { x: st.x, y: st.y, w: st.w, h: st.h, fill: { color: cardFill }, line: { color: cardLine, width: 1 }, rectRadius: 0.1 });
    s.addText(st.num,   { x: st.x, y: st.y + 0.25, w: st.w, h: 0.85, fontFace: FONT_MONO, fontSize: 32, color: numColor, align: "center", margin: 0 });
    s.addText(st.label, { x: st.x, y: st.y + 1.20, w: st.w, h: 0.4, fontFace: FONT_BODY, fontSize: 10, color: bodyColor, align: "center", margin: 0 });
  });

  s.addShape("roundRect", { x: 6.267, y: 4.98, w: 6.4, h: 1.62, fill: { color: cardFill }, line: { color: cardLine, width: 1 }, rectRadius: 0.1 });
  s.addText("20%", { x: 6.55, y: 5.20, w: 1.6, h: 0.85, fontFace: FONT_MONO, fontSize: 32, color: numColor, margin: 0 });
  s.addText("Stat or callout", { x: 6.55, y: 6.10, w: 1.8, h: 0.35, fontFace: FONT_BODY, fontSize: 10, color: bodyColor, margin: 0 });
  s.addText("Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet",
    { x: 8.4, y: 5.25, w: 4.0, h: 1.30, fontFace: FONT_BODY, fontSize: 10, color: bodyColor, margin: 0, lineSpacingMultiple: 1.4 });

  addFooter(s, { color: subColor, pageNum: num });
  return s;
}

// Slide 37 — callout grid white
calloutGrid(37, "white");
// Slide 38 — callout grid on red
calloutGrid(38, "red-bg");
// Slide 39 — callout grid solid red cards
calloutGrid(39, "red-cards");

// Slide 40 — Thank you
{
  const s = pres.addSlide();
  s.background = { color: RED };
  s.addImage({ path: LOGO_WHITE, x: LOGO_X, y: LOGO_Y, w: 0.82, h: 0.446 });
  addH1(s, "Thank you", { x: 0.667, y: 3.3, w: 11, h: 1.4, fontSize: 56, color: WHITE });
  addFooter(s, { color: WHITE });
}

// Slides 41-43 — full-bleed logo end cards (matched logo size, aspect-correct)
const LOGO_END_W = 2.0;
const LOGO_END_H = LOGO_END_W * (LOGO_H / LOGO_W); // preserve master aspect ratio

// Slide 41 — red bg with white wordmark
{
  const s = pres.addSlide();
  s.background = { color: RED };
  s.addImage({ path: LOGO_WHITE, x: (W - LOGO_END_W) / 2, y: (H - LOGO_END_H) / 2, w: LOGO_END_W, h: LOGO_END_H });
}

// Slide 42 — white bg, color wordmark
{
  const s = pres.addSlide();
  s.addImage({ path: LOGO_COLOR, x: (W - LOGO_END_W) / 2, y: (H - LOGO_END_H) / 2, w: LOGO_END_W, h: LOGO_END_H });
}

// Slide 43 — black bg, white wordmark
{
  const s = pres.addSlide();
  s.background = { color: BLACK };
  s.addImage({ path: LOGO_WHITE, x: (W - LOGO_END_W) / 2, y: (H - LOGO_END_H) / 2, w: LOGO_END_W, h: LOGO_END_H });
}

// Save
pres.writeFile({ fileName: path.join(__dirname, "output.pptx") }).then((fn) => {
  console.log("Wrote " + fn);
});
