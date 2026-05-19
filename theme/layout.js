/**
 * layout.js — Placement registry, layout primitives, and geometric validation.
 *
 * Decks built from theme/index.js helpers (addH1, addBody, addBox, addLogo,
 * addFooter, addSubheadTag) record every rect they place into a per-slide
 * placement registry. Layout primitives (row, column, grid, stack) compute
 * cell rects automatically and pass them to render callbacks, which in turn
 * call the helpers — so primitive-built layouts populate the same registry.
 *
 * validateLayout() walks the registry and flags collisions, reserved-zone
 * intrusions, and balance issues. Called from validateDeck() in index.js.
 */

const PLACEMENT_REGISTRY = Symbol.for("ps-pptx.placement-registry");

function placements(slide) {
  if (!slide[PLACEMENT_REGISTRY]) slide[PLACEMENT_REGISTRY] = [];
  return slide[PLACEMENT_REGISTRY];
}

/**
 * Record a placed rect on a slide.
 *   kind: "h1" | "body" | "box" | "logo" | "footer" | "subhead-tag" | "page-num" | "shape" | "image" | "primitive-cell"
 *   name: human-readable identifier (e.g., "addH1", "row.item[2]")
 *   opts: { allowOverlap?: boolean, reserved?: "title-band" | "footer-band" | "logo" | "page-num", overFooter?: boolean, fullBleed?: boolean }
 */
function recordPlacement(slide, kind, name, x, y, w, h, opts = {}) {
  if (!slide || x == null || y == null || w == null || h == null) return;
  placements(slide).push({
    kind,
    name,
    x: +x,
    y: +y,
    w: +w,
    h: +h,
    allowOverlap: !!opts.allowOverlap,
    reserved: opts.reserved || null,
    overFooter: !!opts.overFooter,
    fullBleed: !!opts.fullBleed,
    fontSize: opts.fontSize != null ? +opts.fontSize : null,
    text: opts.text != null ? String(opts.text) : null,
  });
}

// ─── Layout primitives ───────────────────────────────────────────────────────
//
// Each primitive resolves cell rects from a parent rect + item flex weights /
// column-row coordinates, then invokes each item's render(rect) callback. The
// render callback typically calls addH1/addBody/addBox with the cell's rect.

function _resolveItemFlex(items, total, gap) {
  const n = items.length;
  if (n === 0) return [];
  const gapTotal = gap * Math.max(0, n - 1);
  const avail = total - gapTotal;
  if (avail <= 0) {
    throw new Error(`[ps-pptx] layout: gap (${gap} × ${n - 1}) consumes all available space (${total}). Reduce gap or item count.`);
  }
  const weights = items.map((it) => (it && it.flex != null ? +it.flex : 1));
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) throw new Error(`[ps-pptx] layout: total flex weight is 0`);
  return weights.map((w) => (w / sum) * avail);
}

function _renderItem(slide, item, rect, fallbackName) {
  if (!item || typeof item.render !== "function") {
    throw new Error(`[ps-pptx] layout: item "${fallbackName}" missing render(rect) function`);
  }
  // Tag any placement made inside this render call with the cell rect, so
  // collision detection treats the cell as the bounding box for content
  // smaller than the cell. We do this by recording the cell itself as a
  // primitive-cell placement (allowOverlap with its own children) — but the
  // simplest approach: just let the helpers record their own rects. The cell
  // itself is *not* recorded; primitives are pure layout, not painted.
  item.render(rect);
}

/**
 * row(slide, { x, y, w, h, gap, items, ... })
 *
 * Lays items left-to-right inside the given rect. Each item's width is
 * proportional to its `flex` weight (default 1). Each item must provide a
 * `render({ x, y, w, h })` callback that places content using addH1/addBody/
 * addBox into the resolved rect.
 */
function row(slide, opts) {
  if (!opts || opts.x == null || opts.y == null || opts.w == null || opts.h == null) {
    throw new Error(`[ps-pptx] row: requires { x, y, w, h, items }`);
  }
  const items = opts.items || [];
  const gap = opts.gap != null ? +opts.gap : 0.25;
  const widths = _resolveItemFlex(items, opts.w, gap);
  let cx = opts.x;
  items.forEach((item, i) => {
    const rect = { x: cx, y: opts.y, w: widths[i], h: opts.h };
    _renderItem(slide, item, rect, `row.item[${i}]`);
    cx += widths[i] + gap;
  });
}

/**
 * column(slide, { x, y, w, h, gap, items, ... })
 *
 * Top-to-bottom analogue of row.
 */
function column(slide, opts) {
  if (!opts || opts.x == null || opts.y == null || opts.w == null || opts.h == null) {
    throw new Error(`[ps-pptx] column: requires { x, y, w, h, items }`);
  }
  const items = opts.items || [];
  const gap = opts.gap != null ? +opts.gap : 0.2;
  const heights = _resolveItemFlex(items, opts.h, gap);
  let cy = opts.y;
  items.forEach((item, i) => {
    const rect = { x: opts.x, y: cy, w: opts.w, h: heights[i] };
    _renderItem(slide, item, rect, `column.item[${i}]`);
    cy += heights[i] + gap;
  });
}

/**
 * grid(slide, { x, y, w, h, cols, rows, gap, items })
 *
 * Fixed cell grid. items[] entries are { col, row, colSpan?, rowSpan?, render }.
 * `gap` may be a number or { x, y } for separate column/row gaps.
 */
function grid(slide, opts) {
  if (!opts || opts.x == null || opts.y == null || opts.w == null || opts.h == null) {
    throw new Error(`[ps-pptx] grid: requires { x, y, w, h, cols, rows, items }`);
  }
  const cols = opts.cols | 0;
  const rows = opts.rows | 0;
  if (cols < 1 || rows < 1) throw new Error(`[ps-pptx] grid: cols and rows must be ≥ 1`);
  const gx = typeof opts.gap === "object" ? +opts.gap.x : (opts.gap != null ? +opts.gap : 0.25);
  const gy = typeof opts.gap === "object" ? +opts.gap.y : (opts.gap != null ? +opts.gap : 0.2);
  const cellW = (opts.w - gx * (cols - 1)) / cols;
  const cellH = (opts.h - gy * (rows - 1)) / rows;
  if (cellW <= 0 || cellH <= 0) {
    throw new Error(`[ps-pptx] grid: gaps consume all available space (cellW=${cellW}, cellH=${cellH})`);
  }
  const items = opts.items || [];
  items.forEach((item, i) => {
    if (item == null) return;
    const c = item.col | 0;
    const r = item.row | 0;
    const cs = (item.colSpan | 0) || 1;
    const rs = (item.rowSpan | 0) || 1;
    if (c < 0 || r < 0 || c + cs > cols || r + rs > rows) {
      throw new Error(`[ps-pptx] grid.item[${i}]: cell (${c},${r}) span (${cs}x${rs}) is outside ${cols}x${rows} grid`);
    }
    const rect = {
      x: opts.x + c * (cellW + gx),
      y: opts.y + r * (cellH + gy),
      w: cellW * cs + gx * (cs - 1),
      h: cellH * rs + gy * (rs - 1),
    };
    _renderItem(slide, item, rect, `grid.item[${i}]`);
  });
}

/**
 * stack(slide, { x, y, w, h, items })
 *
 * Z-stacked (all children share the same rect). Use sparingly for badges,
 * overlays, or banner-on-image patterns. Items can opt into overlap via
 * { allowOverlap: true } on whatever they record into the placement registry.
 */
function stack(slide, opts) {
  if (!opts || opts.x == null || opts.y == null || opts.w == null || opts.h == null) {
    throw new Error(`[ps-pptx] stack: requires { x, y, w, h, items }`);
  }
  const items = opts.items || [];
  items.forEach((item, i) => {
    const rect = { x: opts.x, y: opts.y, w: opts.w, h: opts.h, allowOverlap: true };
    _renderItem(slide, item, rect, `stack.item[${i}]`);
  });
}

// ─── Validation ──────────────────────────────────────────────────────────────

function _intersect(a, b, eps = 0.02) {
  return (
    a.x + a.w > b.x + eps &&
    b.x + b.w > a.x + eps &&
    a.y + a.h > b.y + eps &&
    b.y + b.h > a.y + eps
  );
}

function _intersectArea(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

/**
 * Walk the placement registry on every slide and emit { errors, warnings }.
 * geom: { W, H, MARGIN_L, MARGIN_R, TITLE_BAND_TOP, TITLE_BAND_BOTTOM, FOOTER_BAND_TOP,
 *         LOGO_X, LOGO_Y, LOGO_W, LOGO_H, FOOTER_X, FOOTER_Y, FOOTER_W, FOOTER_H,
 *         PAGE_X, PAGE_Y, PAGE_W, PAGE_H }
 */
function validateLayout(pres, slides, geom) {
  const errors = [];
  const warnings = [];

  slides.forEach((slide, i) => {
    const idx = i + 1;
    const recs = placements(slide);
    if (recs.length === 0) return;

    // ── Collision detection (content vs content only) ──
    // Reserved chrome (logo, footer, page-num, subhead-tag) is excluded from
    // collision pairs. The PS template's H1 default rect geometrically
    // overlaps the LOGO_W/H bounding box even though the rendered logo image
    // is smaller, so flagging chrome-vs-content here would produce false
    // positives across every existing slide. Logo/subhead-tag mutual
    // exclusion is already enforced by addLogo/addSubheadTag themselves.
    for (let a = 0; a < recs.length; a++) {
      for (let b = a + 1; b < recs.length; b++) {
        const ra = recs[a];
        const rb = recs[b];
        if (ra.allowOverlap || rb.allowOverlap) continue;
        if (ra.reserved || rb.reserved) continue;
        if (_intersect(ra, rb)) {
          errors.push(
            `slide ${idx}: collision — "${ra.name}" (${_fmt(ra)}) overlaps "${rb.name}" (${_fmt(rb)})`
          );
        }
      }
    }

    // ── Footer-band overrun ──
    // Anything that extends past FOOTER_BAND_TOP without the overFooter
    // opt-in collides with the footer text. checkBounds in index.js catches
    // this for helpers that go through it, but raw shapes / primitives can
    // bypass; double-check here.
    recs.forEach((r) => {
      if (r.reserved || r.overFooter || r.fullBleed) return;
      if (r.y + r.h > geom.FOOTER_BAND_TOP + 0.02) {
        errors.push(`slide ${idx}: "${r.name}" extends past footer band (y+h=${(r.y + r.h).toFixed(2)} > ${geom.FOOTER_BAND_TOP})`);
      }
    });

    // ── Balance heuristics (warnings, not errors) ──
    // Skip cover/divider/thank-you/end-card; they're intentionally asymmetric.
    const role = (slide[Symbol.for("ps-pptx.slide-meta")] || {}).role;
    const skipBalance = role === "cover" || role === "section-divider" || role === "thank-you" || role === "end-card";
    if (!skipBalance) {
      const contentRect = {
        x: geom.MARGIN_L,
        y: geom.TITLE_BAND_TOP,
        w: geom.W - geom.MARGIN_L - geom.MARGIN_R,
        h: geom.FOOTER_BAND_TOP - geom.TITLE_BAND_TOP,
      };
      // Ignore chrome elements and overlay/decorative elements (allowOverlap)
      // for balance accounting — those would double-count area when stacked
      // on top of a primary content rect.
      const content = recs.filter((r) => !r.reserved && !r.allowOverlap);
      if (content.length > 0) {
        let filled = 0;
        let cxNum = 0, cyNum = 0, cWeight = 0;
        content.forEach((r) => {
          const a = _intersectArea(r, contentRect);
          if (a <= 0) return;
          filled += a;
          // Use rect center weighted by area for COM
          const cx = r.x + r.w / 2;
          const cy = r.y + r.h / 2;
          cxNum += cx * a;
          cyNum += cy * a;
          cWeight += a;
        });
        const contentArea = contentRect.w * contentRect.h;
        const fillRatio = filled / contentArea;
        if (fillRatio < 0.15) {
          warnings.push(`slide ${idx}: balance — content fills only ${(fillRatio * 100).toFixed(0)}% of the content area; slide looks empty`);
        } else if (fillRatio > 0.85) {
          warnings.push(`slide ${idx}: balance — content fills ${(fillRatio * 100).toFixed(0)}% of the content area; slide looks crowded`);
        }
        if (cWeight > 0) {
          const com = { x: cxNum / cWeight, y: cyNum / cWeight };
          const center = { x: contentRect.x + contentRect.w / 2, y: contentRect.y + contentRect.h / 2 };
          const dx = (com.x - center.x) / contentRect.w;
          const dy = (com.y - center.y) / contentRect.h;
          if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25) {
            warnings.push(
              `slide ${idx}: balance — content center-of-mass offset ${(dx * 100).toFixed(0)}% horizontally, ${(dy * 100).toFixed(0)}% vertically from content-area center`
            );
          }
        }
      }
    }
  });

  return { errors, warnings };
}

function _fmt(r) {
  return `x=${(+r.x).toFixed(2)} y=${(+r.y).toFixed(2)} w=${(+r.w).toFixed(2)} h=${(+r.h).toFixed(2)}`;
}

module.exports = {
  PLACEMENT_REGISTRY,
  placements,
  recordPlacement,
  row,
  column,
  grid,
  stack,
  validateLayout,
  // Exported for unit tests
  _intersect,
  _resolveItemFlex,
};
