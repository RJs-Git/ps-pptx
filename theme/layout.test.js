#!/usr/bin/env node
/**
 * Self-contained tests for theme/layout.js.
 *
 * Run: node theme/layout.test.js
 *
 * No test framework — exits 0 on success, non-zero with a count on failure.
 * Each `t(name, fn)` either returns silently (pass), throws (fail), or
 * fn calls `expectThrow(...)` to assert a throw.
 */

const layout = require("./layout.js");
const T = require("./index.js");

let passed = 0;
let failed = 0;
const failures = [];

function t(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, err: e });
    console.log(`  FAIL ${name}: ${e.message}`);
  }
}

function eq(a, b, msg = "") {
  if (Math.abs(a - b) > 1e-9) throw new Error(`${msg} expected ${b}, got ${a}`);
}
function near(a, b, eps = 1e-6, msg = "") {
  if (Math.abs(a - b) > eps) throw new Error(`${msg} expected ≈${b}, got ${a}`);
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function expectThrow(fn, pattern) {
  try { fn(); } catch (e) {
    if (pattern && !pattern.test(e.message)) throw new Error(`threw, but message "${e.message}" did not match ${pattern}`);
    return;
  }
  throw new Error("expected throw, got none");
}

function mockSlide() { return {}; }

// ─── _resolveItemFlex ─────────────────────────────────────────────────────────
t("flex: equal weights split evenly", () => {
  const r = layout._resolveItemFlex([{}, {}, {}], 12, 0);
  eq(r[0], 4); eq(r[1], 4); eq(r[2], 4);
});
t("flex: gaps reduce available space", () => {
  const r = layout._resolveItemFlex([{}, {}, {}], 12, 0.25);
  // 12 - 0.5 = 11.5, /3 = 3.833...
  near(r[0], (12 - 0.5) / 3);
});
t("flex: weighted distribution", () => {
  const r = layout._resolveItemFlex([{ flex: 1 }, { flex: 3 }], 8, 0);
  eq(r[0], 2); eq(r[1], 6);
});
t("flex: throws when gaps consume all space", () => {
  expectThrow(() => layout._resolveItemFlex([{}, {}, {}], 0.4, 0.25), /consumes all/);
});
t("flex: throws on zero total weight", () => {
  expectThrow(() => layout._resolveItemFlex([{ flex: 0 }, { flex: 0 }], 10, 0), /flex weight is 0/);
});

// ─── row / column ─────────────────────────────────────────────────────────────
t("row: places items left-to-right with correct rects", () => {
  const slide = mockSlide();
  const rects = [];
  layout.row(slide, {
    x: 1, y: 2, w: 10, h: 3, gap: 0,
    items: [
      { render: (r) => rects.push(r) },
      { render: (r) => rects.push(r) },
    ],
  });
  eq(rects.length, 2);
  eq(rects[0].x, 1); eq(rects[0].w, 5);
  eq(rects[1].x, 6); eq(rects[1].w, 5);
  eq(rects[0].y, 2); eq(rects[0].h, 3);
});

t("row: respects gap", () => {
  const slide = mockSlide();
  const rects = [];
  layout.row(slide, {
    x: 0, y: 0, w: 10, h: 1, gap: 1,
    items: [{ render: (r) => rects.push(r) }, { render: (r) => rects.push(r) }],
  });
  // Available 10 - 1 = 9, each = 4.5
  eq(rects[0].w, 4.5);
  eq(rects[1].x, 5.5);
});

t("column: places items top-to-bottom", () => {
  const slide = mockSlide();
  const rects = [];
  layout.column(slide, {
    x: 0, y: 0, w: 5, h: 6, gap: 0,
    items: [
      { render: (r) => rects.push(r) },
      { render: (r) => rects.push(r) },
      { render: (r) => rects.push(r) },
    ],
  });
  eq(rects[0].y, 0); eq(rects[0].h, 2);
  eq(rects[1].y, 2);
  eq(rects[2].y, 4);
});

t("row: throws if item missing render", () => {
  expectThrow(() => layout.row(mockSlide(), {
    x: 0, y: 0, w: 10, h: 1, items: [{ flex: 1 }],
  }), /render/);
});

// ─── grid ─────────────────────────────────────────────────────────────────────
t("grid: 2x2 with no gap places cells correctly", () => {
  const slide = mockSlide();
  const rects = [];
  layout.grid(slide, {
    x: 0, y: 0, w: 4, h: 4, cols: 2, rows: 2, gap: 0,
    items: [
      { col: 0, row: 0, render: (r) => rects.push({ k: "tl", ...r }) },
      { col: 1, row: 0, render: (r) => rects.push({ k: "tr", ...r }) },
      { col: 0, row: 1, render: (r) => rects.push({ k: "bl", ...r }) },
      { col: 1, row: 1, render: (r) => rects.push({ k: "br", ...r }) },
    ],
  });
  eq(rects.length, 4);
  const tl = rects.find(r => r.k === "tl");
  const br = rects.find(r => r.k === "br");
  eq(tl.x, 0); eq(tl.y, 0); eq(tl.w, 2); eq(tl.h, 2);
  eq(br.x, 2); eq(br.y, 2); eq(br.w, 2); eq(br.h, 2);
});

t("grid: colSpan widens cell across gap", () => {
  const slide = mockSlide();
  const rects = [];
  layout.grid(slide, {
    x: 0, y: 0, w: 6.5, h: 1, cols: 3, rows: 1, gap: { x: 0.25, y: 0 },
    items: [{ col: 0, row: 0, colSpan: 2, render: (r) => rects.push(r) }],
  });
  // cellW = (6.5 - 0.5)/3 = 2; spanned = 2*2 + 0.25 = 4.25
  near(rects[0].w, 4.25);
});

t("grid: out-of-bounds cell throws", () => {
  expectThrow(() => layout.grid(mockSlide(), {
    x: 0, y: 0, w: 4, h: 4, cols: 2, rows: 2,
    items: [{ col: 2, row: 0, render: () => {} }],
  }), /outside/);
});

// ─── _intersect ───────────────────────────────────────────────────────────────
t("intersect: separated rects do not collide", () => {
  assert(!layout._intersect({ x: 0, y: 0, w: 1, h: 1 }, { x: 2, y: 0, w: 1, h: 1 }), "should not intersect");
});
t("intersect: touching edges (within eps) do not collide", () => {
  assert(!layout._intersect({ x: 0, y: 0, w: 1, h: 1 }, { x: 1, y: 0, w: 1, h: 1 }), "edge-touching should not collide");
});
t("intersect: clearly overlapping rects collide", () => {
  assert(layout._intersect({ x: 0, y: 0, w: 2, h: 2 }, { x: 1, y: 1, w: 2, h: 2 }), "should intersect");
});

// ─── recordPlacement / validateLayout ─────────────────────────────────────────
const GEOM = {
  W: 13.333, H: 7.5, MARGIN_L: 0.667, MARGIN_R: 0.667,
  TITLE_BAND_TOP: 0.758, TITLE_BAND_BOTTOM: 1.97, FOOTER_BAND_TOP: 6.75,
  LOGO_X: 0.667, LOGO_Y: 0.667, LOGO_W: 1.149, LOGO_H: 0.624,
  FOOTER_X: 0.667, FOOTER_Y: 6.875, FOOTER_W: 5.795, FOOTER_H: 0.18,
  PAGE_X: 12.038, PAGE_Y: 6.875, PAGE_W: 0.625, PAGE_H: 0.18,
};

t("validateLayout: clean slide produces no errors", () => {
  const s = mockSlide();
  layout.recordPlacement(s, "h1", "addH1", 0.667, 0.758, 12, 1.21);
  layout.recordPlacement(s, "body", "addBody", 0.667, 2.5, 12, 3);
  const r = layout.validateLayout({}, [s], GEOM);
  eq(r.errors.length, 0, "errors: " + r.errors.join(" | "));
});

t("validateLayout: overlapping pair produces collision error", () => {
  const s = mockSlide();
  layout.recordPlacement(s, "body", "left", 1, 2, 6, 3);
  layout.recordPlacement(s, "body", "right", 4, 2, 6, 3);
  const r = layout.validateLayout({}, [s], GEOM);
  assert(r.errors.length >= 1, "expected collision error");
  assert(/collision.*left.*right|collision.*right.*left/.test(r.errors[0]), "error mentions both elements");
});

t("validateLayout: allowOverlap suppresses collision", () => {
  const s = mockSlide();
  layout.recordPlacement(s, "body", "a", 1, 2, 6, 3);
  layout.recordPlacement(s, "box", "b", 4, 2, 6, 3, { allowOverlap: true });
  const r = layout.validateLayout({}, [s], GEOM);
  eq(r.errors.length, 0);
});

t("validateLayout: content past footer band errors", () => {
  const s = mockSlide();
  layout.recordPlacement(s, "body", "tall", 0.667, 5, 12, 2);
  const r = layout.validateLayout({}, [s], GEOM);
  assert(r.errors.some((e) => /footer band/.test(e)), "expected footer-band error: " + r.errors.join(" | "));
});

t("validateLayout: chrome (logo, footer, page-num) is excluded from collision pairs", () => {
  const s = mockSlide();
  s[Symbol.for("ps-pptx.slide-meta")] = { role: "content" };
  // Default H1 rect geometrically overlaps logo bbox in the PS template.
  // The validator must not flag this because the rendered logo is smaller
  // than its reserved rect and the template intentionally coexists.
  layout.recordPlacement(s, "logo", "addLogo", 0.667, 0.667, 1.149, 0.624, { reserved: "logo" });
  layout.recordPlacement(s, "h1", "addH1", 0.667, 0.758, 12, 1.21);
  layout.recordPlacement(s, "footer", "addFooter", 0.667, 6.875, 5.795, 0.18, { reserved: "footer", overFooter: true });
  const r = layout.validateLayout({}, [s], GEOM);
  eq(r.errors.length, 0, "chrome should not collide with content: " + r.errors.join(" | "));
});

t("validateLayout: balance warns when content concentrated in top-left quadrant", () => {
  const s = mockSlide();
  s[Symbol.for("ps-pptx.slide-meta")] = { role: "content" };
  layout.recordPlacement(s, "h1", "addH1", 0.667, 0.758, 4, 1);
  layout.recordPlacement(s, "body", "blob", 0.667, 2, 3, 1.5);
  const r = layout.validateLayout({}, [s], GEOM);
  assert(r.warnings.some((w) => /center-of-mass|empty/.test(w)), "expected balance warning: " + r.warnings.join(" | "));
});

t("validateLayout: cover slide skips balance warnings", () => {
  const s = mockSlide();
  s[Symbol.for("ps-pptx.slide-meta")] = { role: "cover" };
  layout.recordPlacement(s, "h1", "addH1", 0.667, 0.758, 4, 1);
  const r = layout.validateLayout({}, [s], GEOM);
  // No balance warnings for cover
  assert(!r.warnings.some((w) => /balance/.test(w)), "cover should skip balance: " + r.warnings.join(" | "));
});

t("primitives populate placement registry on slide", () => {
  const slide = mockSlide();
  layout.row(slide, {
    x: 0.667, y: 2, w: 12, h: 3,
    items: [
      { render: (r) => layout.recordPlacement(slide, "body", "left", r.x, r.y, r.w, r.h) },
      { render: (r) => layout.recordPlacement(slide, "body", "right", r.x, r.y, r.w, r.h) },
    ],
  });
  const recs = layout.placements(slide);
  eq(recs.length, 2);
  // The two cells should not collide
  const v = layout.validateLayout({}, [slide], GEOM);
  eq(v.errors.length, 0, "primitive cells should not collide: " + v.errors.join(" | "));
});

// ─── _measureTitleFit ─────────────────────────────────────────────────────────
t("measureTitleFit: short title fits at default 38pt × 1.21in box", () => {
  const r = T._measureTitleFit("Why we must act now", 38, 12.0, 1.21);
  assert(r.fits === true, "short title should fit: " + JSON.stringify(r));
  eq(r.lines, 1);
});

t("measureTitleFit: long sentence-headline overflows at 38pt × 1.21in box", () => {
  // The exact slide-2 title from issue #11 evidence
  const text = "Winners industrialize a few reengineered journeys on a governed, model-agnostic foundation — before the EU AI Act forces laggards to retrofit.";
  const r = T._measureTitleFit(text, 38, 12.0, 1.21);
  assert(r.fits === false, "long title should overflow at 38pt: " + JSON.stringify(r));
  assert(r.lines >= 3, "expected >=3 wrapped lines, got " + r.lines);
  assert(r.overflowIn > 0, "overflowIn should be positive");
});

t("measureTitleFit: cover-2line geometry at 66pt with two-line title fits", () => {
  // Cover slides use 66pt for 2-line headlines and a taller box (~2.4in).
  const r = T._measureTitleFit("A short two-line cover headline goes here", 66, 12.0, 2.4);
  assert(r.fits === true, "cover-2line should fit: " + JSON.stringify(r));
});

t("measureTitleFit: lineHeight matches addH1's lineSpacingMultiple of 1.05", () => {
  const r = T._measureTitleFit("Hi", 38, 12.0, 1.21);
  near(r.lineHeightIn, 38 * 1.05 / 72, 1e-9);
});

t("measureTitleFit: 5% slack on box height absorbs glyph-measure noise", () => {
  // Construct a title whose totalHeight lands within 5% of boxH — should still fit.
  // 1 line at 38pt = 0.554in. Box = 0.55in (just under). 0.554 / 0.55 = 1.0073,
  // within the 1.05 slack → fits.
  const r = T._measureTitleFit("Short", 38, 12.0, 0.55);
  assert(r.fits === true, "within slack should fit: " + JSON.stringify(r));
});

// ─── _titleFitSuggestions ─────────────────────────────────────────────────────
t("titleFitSuggestions: returns rewrite-shorter, step-down-size, dense-size", () => {
  const text = "Winners industrialize a few reengineered journeys on a governed, model-agnostic foundation — before the EU AI Act forces laggards to retrofit.";
  const out = T._titleFitSuggestions(text, 38, 12.0, 1.21);
  assert(Array.isArray(out), "should return an array");
  assert(out.length >= 2 && out.length <= 3, "expected 2-3 suggestions, got " + out.length);
  const kinds = out.map((s) => s.kind);
  assert(kinds.includes("rewrite-shorter"), "missing rewrite-shorter: " + kinds.join(","));
  assert(kinds.includes("step-down-size"), "missing step-down-size: " + kinds.join(","));
});

t("titleFitSuggestions: rewrite-shorter reports maxChars budget at current size+box", () => {
  const out = T._titleFitSuggestions("xxx", 38, 12.0, 1.21);
  const rewrite = out.find((s) => s.kind === "rewrite-shorter");
  assert(rewrite && typeof rewrite.maxChars === "number" && rewrite.maxChars > 0, "rewrite suggestion missing maxChars: " + JSON.stringify(rewrite));
  // At 38pt × 12in box × 1.21in tall, ~2 lines fit; budget should be ~2 × maxCharsPerLine
  assert(rewrite.maxChars < 200, "maxChars sanity (got " + rewrite.maxChars + ")");
});

t("titleFitSuggestions: step-down-size picks the next-smaller whitelist size that fits", () => {
  const text = "Winners industrialize a few reengineered journeys on a governed, model-agnostic foundation — before the EU AI Act forces laggards to retrofit.";
  const out = T._titleFitSuggestions(text, 38, 12.0, 1.21);
  const stepDown = out.find((s) => s.kind === "step-down-size");
  assert(stepDown, "missing step-down-size");
  assert([26, 32, 36].includes(stepDown.fontSize), "step-down should be smaller content size, got " + stepDown.fontSize);
  assert(typeof stepDown.h === "number" && stepDown.h > 1.21, "step-down should widen h to fit, got " + stepDown.h);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  • ${f.name}\n    ${f.err.stack || f.err.message}`));
  process.exit(1);
}
