# ps-pptx Structural & Directional Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden ps-pptx so the next generated deck is less likely to ship with silent layout defects (footer-band overlap, unbalanced fill, legend-less heatmaps, uniform-severity 2x2s) and the build loop fails loudly with actionable errors when it does.

**Architecture:** Strengthen runtime guards in `theme/index.js` and `theme/layout.js`, split QA `balance` into severity-tiered findings, replace the coarse `overFooter` flag with `bottomBandPolicy`, harden two existing patterns (`heatmap`, `matrix2x2`), add two new canonical patterns (`anchorStat`, `stackCommentary`), and add a `parityGroup` opt that QA checks for two-column fill imbalance.

**Tech Stack:** Node.js, pptxgenjs, no test framework (custom `t()` runner in `theme/layout.test.js`), smoke tests in `reference/patterns/smoke.test.js`.

**Source spec:** `docs/superpowers/specs/2026-05-20-ps-pptx-structural-fixes-design.md` (wraps `docs/fix-plan-structural-2026-05-20.md`).

---

## File map

**Modified:**
- `theme/index.js` — `checkColor`, `checkBounds`, `addBody`, `addBox`, `addFooter`, `addCover` (new), exports.
- `theme/layout.js` — `recordPlacement`, `validateLayout` (split balance, parity group, bottomBandPolicy enforcement).
- `theme/layout.test.js` — new tests for every behavior change.
- `theme/qa.js` — surface new finding kinds (`density`, `center-of-mass`, `parity`).
- `reference/patterns/heatmap.js` — mandatory legend, threshold knob, region overflow throw.
- `reference/patterns/matrix2x2.js` — per-quadrant `severity`, uniform-severity throw.
- `reference/patterns/scqa3col.js` — opt-in `parityGroup` on parallel cells.
- `reference/patterns/beforeAfter.js` — opt-in `parityGroup` on before/after cells.
- `reference/patterns/index.js` — export `anchorStat`, `stackCommentary`.
- `reference/patterns/smoke.test.js` — fixtures for new patterns and updated patterns.

**Created:**
- `reference/patterns/anchorStat.js`
- `reference/patterns/stackCommentary.js`

---

## Task 1: P0-1 — Replace `overFooter` with `bottomBandPolicy`

**Files:**
- Modify: `theme/index.js` (checkBounds, addBody, addBox, addFooter recordPlacement)
- Modify: `theme/layout.js` (recordPlacement, validateLayout)
- Test: `theme/layout.test.js`

- [ ] **Step 1: Add bottomBandPolicy validation in `checkBounds`**

In `theme/index.js`, replace the body of `checkBounds`:

```js
function checkBounds(name, x, y, w, h, opts = {}) {
  const policy = opts.bottomBandPolicy || (opts.fullBleed ? "fullBleed" : "enforce");
  const eps = 0.01;
  if (x < MARGIN_L - eps) throw new Error(`[ps-pptx] ${name}: x=${x} crosses left margin (${MARGIN_L}). Pass { bottomBandPolicy: "fullBleed" } for full-bleed images.`);
  if (x + w > W - MARGIN_R + eps) throw new Error(`[ps-pptx] ${name}: x+w=${(x + w).toFixed(3)} crosses right margin (${(W - MARGIN_R).toFixed(3)}).`);
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
```

- [ ] **Step 2: Migrate addBody and addBox call-sites**

In `theme/index.js`, find the `recordPlacement` call inside `addBody` (around line 359) and replace `overFooter: !!opts.overFooter, fullBleed: !!opts.fullBleed` with:

```js
bottomBandPolicy: opts.bottomBandPolicy || (opts.fullBleed ? "fullBleed" : "enforce"),
```

Same change inside `addBox` around line 387.

In `addFooter`, change the two `overFooter: true` recordPlacement options to `bottomBandPolicy: "fullBleed"`.

- [ ] **Step 3: Update layout.js recordPlacement and footer-band check**

In `theme/layout.js`, replace the recordPlacement function body (kind extension) so that records carry `bottomBandPolicy` instead of `overFooter`/`fullBleed`:

```js
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
    bottomBandPolicy: opts.bottomBandPolicy || (opts.fullBleed ? "fullBleed" : (opts.overFooter ? "fullBleed" : "enforce")),
    fontSize: opts.fontSize != null ? +opts.fontSize : null,
    text: opts.text != null ? String(opts.text) : null,
    parityGroup: opts.parityGroup || null,
  });
}
```

(The fallback from `overFooter` is a courtesy for any in-flight call sites; the compatibility layer goes away after Task 1 ships.)

In `validateLayout`, replace the footer-band overrun block with:

```js
recs.forEach((r) => {
  if (r.reserved) return;
  const policy = r.bottomBandPolicy || "enforce";
  if (policy === "enforce") {
    if (r.y + r.h > geom.FOOTER_BAND_TOP + 0.02) {
      errors.push(`slide ${idx}: "${r.name}" extends past footer band (y+h=${(r.y + r.h).toFixed(2)} > ${geom.FOOTER_BAND_TOP}). Set bottomBandPolicy: "fullBleed" for images or "sectionDivider" with markRole.`);
    }
  } else if (policy === "sectionDivider") {
    const role = (slide[Symbol.for("ps-pptx.slide-meta")] || {}).role;
    if (role !== "section-divider") {
      errors.push(`slide ${idx}: "${r.name}" uses bottomBandPolicy "sectionDivider" but slide is not markRole(slide, "section-divider").`);
    }
  }
});
```

- [ ] **Step 4: Add tests**

Append to `theme/layout.test.js`:

```js
t("bottomBandPolicy: enforce throws when y+h crosses footer band", () => {
  const slide = mockSlide();
  expectThrow(() => T.addBody(slide, "x", { x: 0.667, y: 6.0, w: 12, h: 1.5 }), /footer band/);
});

t("bottomBandPolicy: fullBleed allows extending to slide bottom", () => {
  const slide = { addText: () => {}, addImage: () => {}, addShape: () => {} };
  T.addBox(slide, { x: 0, y: 0, w: 13.333, h: 7.5, bottomBandPolicy: "fullBleed", shape: "rect", fill: T.GRAY_LIGHT, name: "bleed" });
});

t("bottomBandPolicy: sectionDivider requires markRole(section-divider)", () => {
  const s = mockSlide();
  layout.recordPlacement(s, "body", "divtxt", 0.667, 5, 12, 2, { bottomBandPolicy: "sectionDivider" });
  s[Symbol.for("ps-pptx.slide-meta")] = { role: "content" };
  const r = layout.validateLayout({}, [s], GEOM);
  assert(r.errors.some((e) => /sectionDivider.*not.*section-divider/.test(e)), "expected sectionDivider role error: " + r.errors.join(" | "));
});

t("bottomBandPolicy: sectionDivider with correct markRole passes", () => {
  const s = mockSlide();
  s[Symbol.for("ps-pptx.slide-meta")] = { role: "section-divider" };
  layout.recordPlacement(s, "body", "divtxt", 0.667, 5, 12, 2, { bottomBandPolicy: "sectionDivider" });
  const r = layout.validateLayout({}, [s], GEOM);
  assert(!r.errors.some((e) => /sectionDivider/.test(e)), "no sectionDivider error expected: " + r.errors.join(" | "));
});

t("bottomBandPolicy: unknown value throws", () => {
  const slide = { addText: () => {}, addImage: () => {}, addShape: () => {} };
  expectThrow(() => T.addBox(slide, { x: 0.667, y: 1, w: 4, h: 1, bottomBandPolicy: "loose", shape: "rect", fill: T.RED, name: "x" }), /unknown bottomBandPolicy/);
});
```

- [ ] **Step 5: Run tests**

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/theme/layout.test.js`
Expected: all tests pass (existing + 5 new).

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All 6 pattern slides validate cleanly.`

- [ ] **Step 6: Commit**

```bash
cd /Users/rjjain/Documents/GitHub/ps-pptx
git add theme/index.js theme/layout.js theme/layout.test.js
git commit -m "$(cat <<'EOF'
feat(theme): replace overFooter with bottomBandPolicy (P0-1)

Hard-cut overFooter boolean to a three-valued bottomBandPolicy
(enforce | fullBleed | sectionDivider). Footer-band overruns now
throw at runtime even on raw addBox calls; sectionDivider requires
the matching markRole.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: P0-2 — Split balance into density + center-of-mass with severity tiers

**Files:**
- Modify: `theme/index.js` (`markRole` accepts `data-dense`; `validateDeck` surfaces severities)
- Modify: `theme/layout.js` (`validateLayout` returns structured findings)
- Modify: `theme/qa.js` (consume new finding kinds)
- Test: `theme/layout.test.js`

- [ ] **Step 1: Extend markRole to accept data-dense as a tag (not a primary role)**

In `theme/index.js`, replace `markRole`:

```js
function markRole(slide, role) {
  const primaryRoles = ["cover", "section-divider", "thank-you", "end-card", "content"];
  const tagRoles = ["data-dense"];
  if (!primaryRoles.includes(role) && !tagRoles.includes(role)) {
    throw new Error(`[ps-pptx] markRole: role must be one of ${[...primaryRoles, ...tagRoles].join(", ")}, got "${role}"`);
  }
  const m = meta(slide);
  if (tagRoles.includes(role)) {
    m.tags = m.tags || new Set();
    m.tags.add(role);
  } else {
    m.role = role;
  }
}

function hasTag(slide, tag) {
  const m = slide[SLIDE_META];
  return !!(m && m.tags && m.tags.has(tag));
}
```

Add `hasTag` to the module exports at the bottom of `theme/index.js`.

- [ ] **Step 2: Rewrite balance validation in layout.js**

In `theme/layout.js`, replace the balance block inside `validateLayout` with:

```js
if (!skipBalance) {
  const contentRect = {
    x: geom.MARGIN_L,
    y: geom.TITLE_BAND_TOP,
    w: geom.W - geom.MARGIN_L - geom.MARGIN_R,
    h: geom.FOOTER_BAND_TOP - geom.TITLE_BAND_TOP,
  };
  const content = recs.filter((r) => !r.reserved && !r.allowOverlap);
  if (content.length > 0) {
    let filled = 0;
    let cxNum = 0, cyNum = 0, cWeight = 0;
    content.forEach((r) => {
      const a = _intersectArea(r, contentRect);
      if (a <= 0) return;
      filled += a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      cxNum += cx * a;
      cyNum += cy * a;
      cWeight += a;
    });
    const contentArea = contentRect.w * contentRect.h;
    const fillRatio = filled / contentArea;
    const dataDense = (slide[Symbol.for("ps-pptx.slide-meta")] || {}).tags &&
      (slide[Symbol.for("ps-pptx.slide-meta")].tags.has("data-dense"));
    if (fillRatio < 0.15) {
      warnings.push(`slide ${idx}: density — content fills only ${(fillRatio * 100).toFixed(0)}% of the content area; slide looks empty`);
    } else if (fillRatio >= 0.95) {
      if (dataDense) {
        warnings.push(`slide ${idx}: density — data-dense slide at ${(fillRatio * 100).toFixed(0)}% (info only)`);
      } else {
        errors.push(`slide ${idx}: density — content fills ${(fillRatio * 100).toFixed(0)}% of the content area (>=95%); slide is overstuffed. Trim content or markRole(slide, "data-dense") if intentional.`);
      }
    } else if (fillRatio > 0.85) {
      if (!dataDense) {
        warnings.push(`slide ${idx}: density — content fills ${(fillRatio * 100).toFixed(0)}% of the content area; slide looks crowded`);
      }
    }
    if (cWeight > 0) {
      const com = { x: cxNum / cWeight, y: cyNum / cWeight };
      const center = { x: contentRect.x + contentRect.w / 2, y: contentRect.y + contentRect.h / 2 };
      const dx = (com.x - center.x) / contentRect.w;
      const dy = (com.y - center.y) / contentRect.h;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx >= 0.30 || ady >= 0.30) {
        errors.push(`slide ${idx}: center-of-mass — offset ${(dx * 100).toFixed(0)}% horizontally, ${(dy * 100).toFixed(0)}% vertically; slide is severely off-center.`);
      } else if (adx > 0.25 || ady > 0.25) {
        warnings.push(`slide ${idx}: center-of-mass — offset ${(dx * 100).toFixed(0)}% horizontally, ${(dy * 100).toFixed(0)}% vertically from content-area center`);
      }
    }
  }
}
```

- [ ] **Step 3: Update qa.js to recognize new warning prefixes**

In `theme/qa.js`, replace the regex on line ~259 (`balance —`) so both `density —` and `center-of-mass —` are captured. Find:

```js
const m = /^slide\s+(\d+):\s+balance\s+—\s+(.*)$/.exec(w);
layoutFindings.push({ slide: m ? +m[1] : null, kind: "balance", message: m ? m[2] : w, severity: "warning" });
warnings.push("balance: " + w);
```

Replace with:

```js
const m = /^slide\s+(\d+):\s+(density|center-of-mass)\s+—\s+(.*)$/.exec(w);
const kind = m ? m[2] : "balance";
layoutFindings.push({ slide: m ? +m[1] : null, kind, message: m ? m[3] : w, severity: "warning" });
warnings.push(`${kind}: ` + w);
```

- [ ] **Step 4: Add tests**

Append to `theme/layout.test.js`:

```js
t("validateLayout: density >=95% errors when not data-dense", () => {
  const s = mockSlide();
  s[Symbol.for("ps-pptx.slide-meta")] = { role: "content" };
  layout.recordPlacement(s, "body", "fillA", 0.667, 1, 12, 5.7);
  const r = layout.validateLayout({}, [s], GEOM);
  assert(r.errors.some((e) => /density/.test(e)), "expected density error: " + r.errors.join(" | "));
});

t("validateLayout: density >=95% with data-dense tag warns only", () => {
  const s = mockSlide();
  const meta = { role: "content", tags: new Set(["data-dense"]) };
  s[Symbol.for("ps-pptx.slide-meta")] = meta;
  layout.recordPlacement(s, "body", "fillA", 0.667, 1, 12, 5.7);
  const r = layout.validateLayout({}, [s], GEOM);
  assert(!r.errors.some((e) => /density/.test(e)), "data-dense should not error: " + r.errors.join(" | "));
});

t("validateLayout: center-of-mass >=30% errors", () => {
  const s = mockSlide();
  s[Symbol.for("ps-pptx.slide-meta")] = { role: "content" };
  layout.recordPlacement(s, "body", "blob", 0.667, 5.5, 3, 1.0);
  const r = layout.validateLayout({}, [s], GEOM);
  assert(r.errors.some((e) => /center-of-mass/.test(e)), "expected center-of-mass error: " + r.errors.join(" | "));
});

t("markRole: accepts data-dense as a tag", () => {
  const s = mockSlide();
  T.markRole(s, "content");
  T.markRole(s, "data-dense");
  assert(T.hasTag(s, "data-dense"), "expected data-dense tag");
});
```

- [ ] **Step 5: Run tests**

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/theme/layout.test.js`
Expected: all tests pass.

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All 6 pattern slides validate cleanly.` (no new errors from balance retiering).

- [ ] **Step 6: Commit**

```bash
cd /Users/rjjain/Documents/GitHub/ps-pptx
git add theme/index.js theme/layout.js theme/qa.js theme/layout.test.js
git commit -m "$(cat <<'EOF'
feat(qa): tier balance into density + center-of-mass with severity (P0-2)

Replace single 'balance' warning with separate density and
center-of-mass findings. Tier severity by magnitude: density >=95%
is an error unless markRole(slide, 'data-dense') is set;
center-of-mass >=30% in either axis is an error. Adds hasTag()
helper and data-dense tag to markRole.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: P1-7 — Color-arg type-guard at API boundary

**Files:**
- Modify: `theme/index.js` (`checkColor`, `addBox` color normalization)
- Test: `theme/layout.test.js`

- [ ] **Step 1: Replace checkColor with type-guarded version**

In `theme/index.js`, replace `checkColor`:

```js
function checkColor(name, val) {
  if (val == null) return;
  if (typeof val !== "string") {
    throw new Error(
      `[ps-pptx] ${name}: expected a hex string (e.g., "E90130"), got ${typeof val} (${JSON.stringify(val).slice(0, 80)}). ` +
      `If you meant to set a fill object, pass { color: "E90130" } as the fill option, not as the color string itself.`
    );
  }
  const v = val.replace(/^#/, "").toUpperCase();
  if (!/^[0-9A-F]{6}$/.test(v)) {
    throw new Error(`[ps-pptx] ${name}: color "${val}" is not a 6-digit hex. Use a token (RED, RED_DARK, PINK, BLACK, WHITE, GRAY_MID, GRAY_LIGHT, CHART_GRAY).`);
  }
  if (!ALLOWED_COLORS_SET.has(v)) {
    throw new Error(
      `[ps-pptx] ${name}: color "${val}" is not in the PS palette. ` +
      `Allowed: RED(E90130) RED_DARK(AE0021) PINK(FA8C9A) BLACK WHITE GRAY_MID(6B6B6B) GRAY_LIGHT(D9D9D9) CHART_GRAY(BBBBBB).`
    );
  }
}
```

- [ ] **Step 2: Auto-promote string fill/line at addBox boundary**

In `theme/index.js`, replace the fill/line handling at the top of `addBox` (just before the `if (opts.fill) checkColor(...)` calls):

```js
function _normalizeColorArg(name, val) {
  if (val == null) return val;
  if (typeof val === "string") return { color: val };
  if (typeof val === "object" && typeof val.color === "string") return val;
  throw new Error(`[ps-pptx] ${name}: expected a hex string or { color, transparency? } object, got ${typeof val} (${JSON.stringify(val).slice(0, 80)}).`);
}
```

Then inside `addBox`, replace:

```js
if (opts.fill) checkColor("addBox.fill", opts.fill.color || opts.fill);
if (opts.line) checkColor("addBox.line", opts.line.color || opts.line);
```

with:

```js
const fill = _normalizeColorArg("addBox.fill", opts.fill);
const line = _normalizeColorArg("addBox.line", opts.line);
if (fill) checkColor("addBox.fill", fill.color);
if (line) checkColor("addBox.line", line.color);
```

And in the same function update the `slide.addShape` call:

```js
if (opts.shape) {
  slide.addShape(opts.shape, {
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    fill, line,
  });
}
```

- [ ] **Step 3: Add tests**

Append to `theme/layout.test.js`:

```js
t("checkColor: object input throws helpful message", () => {
  const slide = { addText: () => {}, addImage: () => {}, addShape: () => {} };
  expectThrow(() => T.addBox(slide, { x: 0.667, y: 2, w: 4, h: 1, shape: "rect", fill: { wrong: "E90130" }, name: "x" }), /expected a hex string or .*object/);
});

t("checkColor: malformed hex string throws", () => {
  const slide = { addText: () => {}, addImage: () => {}, addShape: () => {} };
  expectThrow(() => T.addBox(slide, { x: 0.667, y: 2, w: 4, h: 1, shape: "rect", fill: "not-a-color", name: "x" }), /not a 6-digit hex|not in the PS palette/);
});

t("addBox: string fill auto-promotes to { color }", () => {
  const slide = { addText: () => {}, addImage: () => {}, addShape: (kind, opts) => { slide._lastShape = opts; } };
  T.addBox(slide, { x: 0.667, y: 2, w: 4, h: 1, shape: "rect", fill: T.RED, name: "x" });
  assert(slide._lastShape && slide._lastShape.fill && slide._lastShape.fill.color === T.RED, "expected fill normalized to object: " + JSON.stringify(slide._lastShape && slide._lastShape.fill));
});
```

- [ ] **Step 4: Run tests**

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/theme/layout.test.js`
Expected: all tests pass.

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All 6 pattern slides validate cleanly.`

- [ ] **Step 5: Commit**

```bash
cd /Users/rjjain/Documents/GitHub/ps-pptx
git add theme/index.js theme/layout.test.js
git commit -m "$(cat <<'EOF'
feat(theme): type-guard color args + auto-promote string fills (P1-7)

checkColor now throws a helpful error when given a non-string
(was: '[object Object]' is not in the PS palette). addBox
normalizes string fill/line to { color } objects so callers can
pass either form.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: P1-9 — `addBodyDense` helper + better `addBody` error

**Files:**
- Modify: `theme/index.js` (improve `addBody` error message; add `addBodyDense`)
- Test: `theme/layout.test.js`

- [ ] **Step 1: Improve addBody error and add addBodyDense**

In `theme/index.js`, in `addBody`, replace the fontSize check:

```js
if (!opts.display && (fontSize < 10 || fontSize > 12)) {
  throw new Error(
    `[ps-pptx] addBody: fontSize ${fontSize} is outside the body range 10–12pt. ` +
    `For data-dense slides (sources lists, deployment tables), use addBodyDense + markRole(slide, "data-dense"). ` +
    `For oversized stats/numerals, pass { display: true }.`
  );
}
```

Add a new function `addBodyDense` immediately after `addBody`:

```js
function addBodyDense(slide, text, opts = {}) {
  if (!hasTag(slide, "data-dense")) {
    throw new Error(`[ps-pptx] addBodyDense: requires markRole(slide, "data-dense") on this slide. Dense type (9–10pt) is reserved for sources lists and deployment tables; on a normal content slide, use addBody at 10–12pt instead.`);
  }
  const fontSize = opts.fontSize != null ? opts.fontSize : 10;
  if (fontSize < 9 || fontSize > 10) {
    throw new Error(`[ps-pptx] addBodyDense: fontSize ${fontSize} is outside the dense range 9–10pt.`);
  }
  return addBody(slide, text, { ...opts, fontSize, name: opts.name || "addBodyDense", display: true });
}
```

Add `addBodyDense` to the module exports.

- [ ] **Step 2: Add tests**

Append to `theme/layout.test.js`:

```js
t("addBody: 9pt without display throws with addBodyDense hint", () => {
  const slide = { addText: () => {}, addImage: () => {}, addShape: () => {} };
  let caught;
  try { T.addBody(slide, "x", { fontSize: 9 }); } catch (e) { caught = e; }
  assert(caught, "expected throw");
  assert(/addBodyDense/.test(caught.message), "expected addBodyDense hint: " + caught.message);
  assert(/data-dense/.test(caught.message), "expected data-dense hint: " + caught.message);
});

t("addBodyDense: requires markRole(data-dense)", () => {
  const slide = { addText: () => {}, addImage: () => {}, addShape: () => {} };
  expectThrow(() => T.addBodyDense(slide, "x", { fontSize: 9 }), /requires markRole.*data-dense/);
});

t("addBodyDense: passes when role tag present", () => {
  const slide = { addText: () => {}, addImage: () => {}, addShape: () => {} };
  T.markRole(slide, "data-dense");
  T.addBodyDense(slide, "x", { fontSize: 9, x: 0.667, y: 2, w: 6, h: 2 });
});

t("addBodyDense: rejects out-of-range font", () => {
  const slide = { addText: () => {}, addImage: () => {}, addShape: () => {} };
  T.markRole(slide, "data-dense");
  expectThrow(() => T.addBodyDense(slide, "x", { fontSize: 8 }), /outside the dense range/);
});
```

- [ ] **Step 3: Run tests**

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/theme/layout.test.js`
Expected: all tests pass.

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All 6 pattern slides validate cleanly.`

- [ ] **Step 4: Commit**

```bash
cd /Users/rjjain/Documents/GitHub/ps-pptx
git add theme/index.js theme/layout.test.js
git commit -m "$(cat <<'EOF'
feat(theme): addBodyDense helper + improved addBody error (P1-9)

addBodyDense covers the legitimate 9-10pt case (sources, dense
tables) and requires markRole(slide, 'data-dense'). The addBody
out-of-range error now points to the right escape hatch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: P1-3 — `heatmap` mandatory legend + region overflow throw

**Files:**
- Modify: `reference/patterns/heatmap.js`
- Test: `reference/patterns/smoke.test.js`

- [ ] **Step 1: Rewrite heatmap with legend + threshold + sizing throw**

Replace `reference/patterns/heatmap.js` with:

```js
/**
 * heatmap — Capability heatmap. Rows × cols of cells colored by score, with
 * a mandatory legend band at the bottom that maps swatch → meaning.
 *
 * content = {
 *   subhead?: string,
 *   title:    string,
 *   colHeaders: string[],
 *   rowHeaders: string[],
 *   scores:    number[][],            // scores[row][col] in [0, 1]; null for blank
 *   threshold?: { strong?: number, partial?: number },  // defaults 0.66, 0.33
 *   legend?:    { strong?: string, partial?: string, weak?: string },
 *   pageNum?:   number,
 * }
 *
 * Score → fill mapping (driven by threshold):
 *   >= strong  → RED
 *   >= partial → PINK
 *   <  partial → GRAY_LIGHT
 *   null       → WHITE (blank)
 */
module.exports = function heatmap(slide, T, content) {
  const { addH1, addBox, addSubheadTag, addFooter, grid, RED, PINK, GRAY_LIGHT, GRAY_MID, BLACK, WHITE, FONT_TITLE, FONT_MONO, MARGIN_L, CONTENT_W, FOOTER_BAND_TOP } = T;
  if (!content || !content.title || !Array.isArray(content.colHeaders) || !Array.isArray(content.rowHeaders) || !Array.isArray(content.scores)) {
    throw new Error("[ps-pptx/patterns/heatmap] requires { title, colHeaders, rowHeaders, scores }");
  }
  const cols = content.colHeaders.length;
  const rows = content.rowHeaders.length;
  if (content.scores.length !== rows || content.scores.some((r) => r.length !== cols)) {
    throw new Error("[ps-pptx/patterns/heatmap] scores dimensions must match rowHeaders × colHeaders");
  }

  const threshold = {
    strong: (content.threshold && content.threshold.strong != null) ? content.threshold.strong : 0.66,
    partial: (content.threshold && content.threshold.partial != null) ? content.threshold.partial : 0.33,
  };
  const legend = {
    strong: (content.legend && content.legend.strong) || "Strong / leader",
    partial: (content.legend && content.legend.partial) || "Partial / qualified",
    weak: (content.legend && content.legend.weak) || "Weak / absent",
  };

  if (content.subhead) addSubheadTag(slide, content.subhead);
  addH1(slide, content.title, { fontSize: 36 });

  const headerW = 1.8;
  const headerH = 0.4;
  const legendH = 0.6;
  const legendGap = 0.15;
  const regionTop = 2.4 + headerH;
  const regionBottom = FOOTER_BAND_TOP - legendGap - legendH;
  const regionH = regionBottom - regionTop;
  if (regionH < 1.5) {
    throw new Error(`[ps-pptx/patterns/heatmap] available cell region (${regionH.toFixed(2)}in) is too small after reserving the legend band. Reduce rows or shorten the title.`);
  }
  const region = { x: MARGIN_L + headerW, y: regionTop, w: CONTENT_W - headerW, h: regionH };

  // Column headers
  const colW = region.w / cols;
  for (let c = 0; c < cols; c++) {
    addBox(slide, {
      x: region.x + c * colW, y: region.y - headerH, w: colW, h: headerH,
      text: content.colHeaders[c],
      textOpts: { fontFace: FONT_MONO, fontSize: 10, color: GRAY_MID, align: "center", valign: "middle" },
      name: `heatmap.colHeader[${c}]`,
    });
  }
  // Row headers
  const rowH = region.h / rows;
  for (let r = 0; r < rows; r++) {
    addBox(slide, {
      x: MARGIN_L, y: region.y + r * rowH, w: headerW - 0.15, h: rowH,
      text: content.rowHeaders[r],
      textOpts: { fontFace: FONT_TITLE, fontSize: 12, color: BLACK, bold: true, valign: "middle" },
      name: `heatmap.rowHeader[${r}]`,
    });
  }

  function fillFor(score) {
    if (score == null) return WHITE;
    if (score >= threshold.strong) return RED;
    if (score >= threshold.partial) return PINK;
    return GRAY_LIGHT;
  }

  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const score = content.scores[r][c];
      items.push({
        col: c, row: r,
        render: (rect) => {
          addBox(slide, {
            x: rect.x, y: rect.y, w: rect.w, h: rect.h,
            shape: "rect",
            fill: { color: fillFor(score) },
            line: { color: GRAY_MID, width: 0.5 },
            name: `heatmap.cell[${r},${c}]`,
          });
        },
      });
    }
  }
  grid(slide, {
    x: region.x, y: region.y, w: region.w, h: region.h,
    cols, rows, gap: 0.05,
    items,
  });

  // Legend band: three swatch + label pairs, evenly spaced.
  const legendY = regionBottom + legendGap;
  const swatch = 0.3;
  const legendItems = [
    { fill: RED,        label: legend.strong },
    { fill: PINK,       label: legend.partial },
    { fill: GRAY_LIGHT, label: legend.weak },
  ];
  const slotW = CONTENT_W / legendItems.length;
  legendItems.forEach((item, i) => {
    const sx = MARGIN_L + i * slotW + 0.2;
    addBox(slide, {
      x: sx, y: legendY + (legendH - swatch) / 2, w: swatch, h: swatch,
      shape: "rect",
      fill: { color: item.fill },
      line: { color: GRAY_MID, width: 0.5 },
      name: `heatmap.legend[${i}].swatch`,
    });
    addBox(slide, {
      x: sx + swatch + 0.15, y: legendY, w: slotW - swatch - 0.5, h: legendH,
      text: item.label,
      textOpts: { fontFace: FONT_MONO, fontSize: 10, color: BLACK, valign: "middle" },
      name: `heatmap.legend[${i}].label`,
    });
  });

  if (content.pageNum != null) addFooter(slide, { pageNum: content.pageNum });
  else addFooter(slide);
};
```

- [ ] **Step 2: Verify smoke fixture still passes**

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All 6 pattern slides validate cleanly.`

If the existing 4×4 fixture fits (regionH at least 1.5in), it passes. If it doesn't, reduce the smoke fixture to 4 cols × 3 rows to leave headroom for the legend.

- [ ] **Step 3: Add a heatmap-overflow test fixture**

Append a sanity check at the end of `reference/patterns/smoke.test.js`, just before the `validateDeck` call:

```js
// heatmap with too many rows must throw at pattern time, not silently overflow.
let heatmapThrew = false;
try {
  patterns.heatmap(pres.addSlide(), T, {
    subhead: "negative test",
    title: "Should throw — too many rows",
    colHeaders: ["A","B","C","D"],
    rowHeaders: ["1","2","3","4","5","6","7","8","9","10","11","12"],
    scores: Array.from({length:12}, () => [0.5,0.5,0.5,0.5]),
  });
} catch (e) {
  heatmapThrew = /too small after reserving the legend band/.test(e.message);
}
if (!heatmapThrew) {
  console.error("expected heatmap to throw on overflow row count");
  process.exit(1);
}
// Remove the failed slide so validateDeck doesn't see a half-built slide.
pres[Symbol.for('ps-pptx.pres-registry')].pop();
```

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All N pattern slides validate cleanly.`

- [ ] **Step 4: Commit**

```bash
cd /Users/rjjain/Documents/GitHub/ps-pptx
git add reference/patterns/heatmap.js reference/patterns/smoke.test.js
git commit -m "$(cat <<'EOF'
feat(patterns): heatmap mandatory legend + threshold knob (P1-3)

Heatmap now reserves a 0.6in legend band at the bottom and labels
the three swatches (strong / partial / weak). Score thresholds
are tunable via content.threshold. Pattern throws when the cell
region collapses below 1.5in instead of silently overflowing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: P1-4 — `matrix2x2` per-quadrant severity + uniform-severity throw

**Files:**
- Modify: `reference/patterns/matrix2x2.js`
- Modify: `reference/patterns/smoke.test.js` (update fixture to use severity)
- Test: `reference/patterns/smoke.test.js`

- [ ] **Step 1: Rewrite matrix2x2**

Replace `reference/patterns/matrix2x2.js` with:

```js
/**
 * matrix2x2 — 2x2 matrix with axis labels and four quadrant cells.
 *
 * content = {
 *   subhead?: string,
 *   title:    string,
 *   xAxis:    { low: string, high: string, label?: string },
 *   yAxis:    { low: string, high: string, label?: string },
 *   quadrants: {
 *     tl: { label: string, body?: string, severity: "high"|"medium"|"low", fill?: string },
 *     tr: { ... },
 *     bl: { ... },
 *     br: { ... },
 *   },
 *   pageNum?: number,
 * }
 *
 * severity → fill: high → PINK, medium → GRAY_LIGHT, low → WHITE.
 * Per-quadrant `fill` overrides the default mapping.
 * Throws when all four quadrants share the same severity (visual signal wasted).
 */
module.exports = function matrix2x2(slide, T, content) {
  const { addH1, addBox, addBody, addSubheadTag, addFooter, grid, PINK, GRAY_LIGHT, GRAY_MID, BLACK, WHITE, FONT_TITLE, FONT_MONO, MARGIN_L, CONTENT_W } = T;
  if (!content || !content.title || !content.quadrants) {
    throw new Error("[ps-pptx/patterns/matrix2x2] requires { title, quadrants }");
  }
  const keys = ["tl", "tr", "bl", "br"];
  const sevAllowed = new Set(["high", "medium", "low"]);
  keys.forEach((k) => {
    const q = content.quadrants[k];
    if (!q || !q.label) throw new Error(`[ps-pptx/patterns/matrix2x2] quadrants.${k}.label is required`);
    if (!sevAllowed.has(q.severity)) {
      throw new Error(`[ps-pptx/patterns/matrix2x2] quadrants.${k}.severity must be "high" | "medium" | "low" (got ${JSON.stringify(q.severity)}).`);
    }
  });
  const sevs = keys.map((k) => content.quadrants[k].severity);
  if (new Set(sevs).size === 1) {
    throw new Error(`[ps-pptx/patterns/matrix2x2] all four quadrants share severity "${sevs[0]}" — the visual signal is wasted. Differentiate severities, or use a list pattern instead.`);
  }

  if (content.subhead) addSubheadTag(slide, content.subhead);
  addH1(slide, content.title, { fontSize: 36 });

  const axisGutter = 0.7;
  const axisLabelH = 0.45;
  const region = {
    x: MARGIN_L + axisGutter,
    y: 2.4,
    w: CONTENT_W - axisGutter,
    h: 6.6 - 2.4 - axisLabelH,
  };

  addBox(slide, {
    x: MARGIN_L, y: region.y, w: axisGutter - 0.1, h: region.h,
    text: `${content.yAxis.high}\n\n\n\n\n${content.yAxis.low}`,
    textOpts: { fontFace: FONT_MONO, fontSize: 9, color: GRAY_MID, align: "right", valign: "top" },
    name: "matrix2x2.yAxis",
  });
  addBox(slide, {
    x: region.x, y: region.y + region.h + 0.1, w: region.w, h: axisLabelH - 0.1,
    text: `${content.xAxis.low}                                                                ${content.xAxis.high}`,
    textOpts: { fontFace: FONT_MONO, fontSize: 9, color: GRAY_MID, valign: "top" },
    name: "matrix2x2.xAxis",
  });

  function fillFor(q) {
    if (q.fill) return q.fill;
    if (q.severity === "high") return PINK;
    if (q.severity === "medium") return GRAY_LIGHT;
    return WHITE;
  }

  const cellMap = { tl: { c: 0, r: 0 }, tr: { c: 1, r: 0 }, bl: { c: 0, r: 1 }, br: { c: 1, r: 1 } };
  const items = keys.map((key) => {
    const q = content.quadrants[key];
    const { c, r } = cellMap[key];
    return {
      col: c, row: r,
      render: (rect) => {
        addBox(slide, {
          x: rect.x, y: rect.y, w: rect.w, h: rect.h,
          shape: "rect",
          fill: { color: fillFor(q) },
          line: { color: GRAY_MID, width: 0.5 },
          name: `matrix2x2.cell[${key}]`,
        });
        addBox(slide, {
          x: rect.x + 0.2, y: rect.y + 0.15, w: rect.w - 0.4, h: 0.4,
          text: q.label,
          textOpts: { fontFace: FONT_TITLE, fontSize: 14, color: BLACK, bold: true },
          allowOverlap: true,
          name: `matrix2x2.cell[${key}].label`,
        });
        if (q.body) {
          addBody(slide, q.body, {
            x: rect.x + 0.2, y: rect.y + 0.65, w: rect.w - 0.4, h: rect.h - 0.8,
            fontSize: 11,
            allowOverlap: true,
            name: `matrix2x2.cell[${key}].body`,
          });
        }
      },
    };
  });

  grid(slide, {
    x: region.x, y: region.y, w: region.w, h: region.h,
    cols: 2, rows: 2, gap: 0.15,
    items,
  });

  if (content.pageNum != null) addFooter(slide, { pageNum: content.pageNum });
  else addFooter(slide);
};
```

- [ ] **Step 2: Update smoke fixture for matrix2x2**

In `reference/patterns/smoke.test.js`, replace the `patterns.matrix2x2(...)` call with:

```js
patterns.matrix2x2(newSlide(), T, {
  subhead: "Pattern: 2x2",
  title: "Capability vs investment",
  xAxis: { low: "Low investment", high: "High investment" },
  yAxis: { low: "Low capability", high: "High capability" },
  quadrants: {
    tl: { label: "Hidden gems",  body: "Underfunded but capable.",   severity: "medium" },
    tr: { label: "Strongholds",  body: "Well-funded and capable.",   severity: "high" },
    bl: { label: "Cut",          body: "Underfunded and weak.",      severity: "low" },
    br: { label: "Risky bets",   body: "Heavily funded but unproven.",severity: "medium" },
  },
  pageNum: pageNum++,
});
```

Append a uniform-severity negative test at the end of the file (next to the heatmap one):

```js
let matrixThrew = false;
try {
  patterns.matrix2x2(pres.addSlide(), T, {
    title: "Uniform severity should throw",
    xAxis: { low: "lo", high: "hi" }, yAxis: { low: "lo", high: "hi" },
    quadrants: {
      tl: { label: "a", severity: "high" }, tr: { label: "b", severity: "high" },
      bl: { label: "c", severity: "high" }, br: { label: "d", severity: "high" },
    },
  });
} catch (e) {
  matrixThrew = /share severity .* visual signal is wasted/.test(e.message);
}
if (!matrixThrew) {
  console.error("expected matrix2x2 to throw on uniform severity");
  process.exit(1);
}
pres[Symbol.for('ps-pptx.pres-registry')].pop();
```

- [ ] **Step 3: Run smoke**

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All N pattern slides validate cleanly.` and the negative tests print no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/rjjain/Documents/GitHub/ps-pptx
git add reference/patterns/matrix2x2.js reference/patterns/smoke.test.js
git commit -m "$(cat <<'EOF'
feat(patterns): matrix2x2 requires per-quadrant severity (P1-4)

Replaces the optional 'highlight' key with required per-quadrant
severity (high|medium|low) that drives the fill. Pattern throws
when all four quadrants share the same severity, since the entire
point of a 2x2 is differentiation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: P1-5 — Add `anchorStat` pattern

**Files:**
- Create: `reference/patterns/anchorStat.js`
- Modify: `reference/patterns/index.js`
- Modify: `reference/patterns/smoke.test.js`

- [ ] **Step 1: Create the pattern**

Create `reference/patterns/anchorStat.js`:

```js
/**
 * anchorStat — Hero-stat slide. One giant numeral with caption, optional
 * sub-stats row, optional footnote. Replaces hand-rolled addBox layouts.
 *
 * content = {
 *   subhead?: string,
 *   title:    string,
 *   stat:     { value: string, unit?: string, caption: string },
 *   subStats?: Array<{ value: string, caption: string }>,  // 0–4
 *   footnote?: string,
 *   pageNum?: number,
 * }
 *
 * Guards:
 *   - stat.value ≤ 8 chars (the hero numeral must be readable at a glance)
 *   - stat.value contains no newline
 *   - subStats ≤ 4
 */
module.exports = function anchorStat(slide, T, content) {
  const { addH1, addBox, addBody, addSubheadTag, addFooter, RED, BLACK, GRAY_MID, FONT_TITLE, FONT_BODY, MARGIN_L, CONTENT_W } = T;
  if (!content || !content.title || !content.stat || !content.stat.value || !content.stat.caption) {
    throw new Error("[ps-pptx/patterns/anchorStat] requires { title, stat: { value, caption } }");
  }
  const heroValue = String(content.stat.value);
  if (heroValue.length > 8) {
    throw new Error(`[ps-pptx/patterns/anchorStat] stat.value "${heroValue}" exceeds 8 chars; rewrite shorter or split into sub-stats.`);
  }
  if (/\n/.test(heroValue)) {
    throw new Error(`[ps-pptx/patterns/anchorStat] stat.value must be a single line.`);
  }
  const subStats = content.subStats || [];
  if (subStats.length > 4) {
    throw new Error(`[ps-pptx/patterns/anchorStat] subStats has ${subStats.length} entries; max is 4.`);
  }

  if (content.subhead) addSubheadTag(slide, content.subhead);
  addH1(slide, content.title, { fontSize: 36 });

  // Hero numeral, centered. 96pt is the largest title size; we use display:true
  // on addBox text since this isn't an H1.
  const heroY = 2.4;
  const heroH = 1.6;
  const heroText = content.stat.unit ? `${heroValue}${content.stat.unit}` : heroValue;
  addBox(slide, {
    x: MARGIN_L, y: heroY, w: CONTENT_W, h: heroH,
    text: heroText,
    textOpts: { fontFace: FONT_TITLE, fontSize: 96, color: RED, bold: true, align: "center", valign: "middle" },
    name: "anchorStat.hero",
  });
  // Caption under the hero numeral, italic, centered.
  addBody(slide, content.stat.caption, {
    x: MARGIN_L, y: heroY + heroH + 0.05, w: CONTENT_W, h: 0.4,
    fontSize: 12, italic: true, color: GRAY_MID, align: "center",
    name: "anchorStat.caption",
  });

  // Sub-stats row.
  if (subStats.length > 0) {
    const rowY = 5.0;
    const rowH = 1.3;
    const slotW = CONTENT_W / subStats.length;
    subStats.forEach((s, i) => {
      const sx = MARGIN_L + i * slotW;
      addBox(slide, {
        x: sx, y: rowY, w: slotW, h: 0.7,
        text: s.value,
        textOpts: { fontFace: FONT_TITLE, fontSize: 28, color: BLACK, bold: true, align: "center", valign: "bottom" },
        name: `anchorStat.subStat[${i}].value`,
      });
      addBody(slide, s.caption, {
        x: sx + 0.2, y: rowY + 0.75, w: slotW - 0.4, h: rowH - 0.75,
        fontSize: 10, color: GRAY_MID, align: "center",
        name: `anchorStat.subStat[${i}].caption`,
      });
    });
  }

  // Footnote, just above the footer band.
  if (content.footnote) {
    addBody(slide, content.footnote, {
      x: MARGIN_L, y: 6.55, w: CONTENT_W, h: 0.18,
      fontSize: 10, italic: true, color: GRAY_MID, align: "center",
      name: "anchorStat.footnote",
    });
  }

  if (content.pageNum != null) addFooter(slide, { pageNum: content.pageNum });
  else addFooter(slide);
};
```

- [ ] **Step 2: Export from patterns/index.js**

In `reference/patterns/index.js`, add `anchorStat: require("./anchorStat.js"),` to the exports object and to the JSDoc list.

- [ ] **Step 3: Add smoke fixture**

In `reference/patterns/smoke.test.js`, after the `journeyMap` block and before the `heatmap` block, insert:

```js
patterns.anchorStat(newSlide(), T, {
  subhead: "Pattern: anchorStat",
  title: "AT&T's SLM-first rebuild proves the architecture",
  stat: { value: "~90", unit: "%", caption: "of agent calls now resolved by an SLM" },
  subStats: [
    { value: "3.2×",  label: "throughput", caption: "vs prior LLM-only stack" },
    { value: "$0.04", caption: "per resolved call" },
    { value: "11mo",  caption: "to migrate" },
  ],
  footnote: "Source: AT&T engineering blog, 2026 Q1.",
  pageNum: pageNum++,
});
```

(Note: `subStats[0]` in the example has both `label` and `caption` — only `caption` is required; the pattern ignores extras. If preferred, drop the `label`.)

Also add a negative-test for >8 char hero value at the bottom of the file:

```js
let anchorThrew = false;
try {
  patterns.anchorStat(pres.addSlide(), T, {
    title: "Should throw",
    stat: { value: "999999999", caption: "too many digits" },
  });
} catch (e) {
  anchorThrew = /exceeds 8 chars/.test(e.message);
}
if (!anchorThrew) {
  console.error("expected anchorStat to throw on long stat.value");
  process.exit(1);
}
pres[Symbol.for('ps-pptx.pres-registry')].pop();
```

- [ ] **Step 4: Run smoke**

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All N pattern slides validate cleanly.`

- [ ] **Step 5: Commit**

```bash
cd /Users/rjjain/Documents/GitHub/ps-pptx
git add reference/patterns/anchorStat.js reference/patterns/index.js reference/patterns/smoke.test.js
git commit -m "$(cat <<'EOF'
feat(patterns): add anchorStat hero-stat pattern (P1-5)

Canonical layout for one-giant-number slides: hero numeral +
italic caption + optional sub-stats row + optional footnote.
Replaces hand-rolled addBox arithmetic for hero stats.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: P1-6 — Add `stackCommentary` pattern

**Files:**
- Create: `reference/patterns/stackCommentary.js`
- Modify: `reference/patterns/index.js`
- Modify: `reference/patterns/smoke.test.js`

- [ ] **Step 1: Create the pattern**

Create `reference/patterns/stackCommentary.js`:

```js
/**
 * stackCommentary — Diagram-on-left, structured commentary on-right.
 *
 * content = {
 *   subhead?: string,
 *   title:    string,
 *   stack:    Array<{ label: string, fill: "red"|"pink"|"gray-mid"|"gray-light", emphasis?: boolean }>,
 *   commentary: Array<{ stackIndex: number, text: string }>,  // exactly stack.length items
 *   pullQuote?: { text: string, source?: string },
 *   pageNum?: number,
 * }
 *
 * Forced 1:1 pairing: every commentary entry anchors to a stack row.
 * Guards: 3 ≤ stack.length ≤ 6; emphasis rows ≤ 2.
 */
module.exports = function stackCommentary(slide, T, content) {
  const { addH1, addBox, addBody, addSubheadTag, addFooter, RED, PINK, GRAY_MID, GRAY_LIGHT, BLACK, WHITE, FONT_TITLE, FONT_BODY, FONT_MONO_LIGHT, MARGIN_L, CONTENT_W } = T;
  if (!content || !content.title || !Array.isArray(content.stack) || !Array.isArray(content.commentary)) {
    throw new Error("[ps-pptx/patterns/stackCommentary] requires { title, stack, commentary }");
  }
  if (content.stack.length < 3 || content.stack.length > 6) {
    throw new Error(`[ps-pptx/patterns/stackCommentary] stack must have 3–6 entries (got ${content.stack.length}).`);
  }
  if (content.commentary.length !== content.stack.length) {
    throw new Error(`[ps-pptx/patterns/stackCommentary] commentary.length (${content.commentary.length}) must equal stack.length (${content.stack.length}); each row needs its own commentary.`);
  }
  const usedIndices = new Set();
  content.commentary.forEach((c, i) => {
    if (typeof c.stackIndex !== "number" || c.stackIndex < 0 || c.stackIndex >= content.stack.length) {
      throw new Error(`[ps-pptx/patterns/stackCommentary] commentary[${i}].stackIndex out of range.`);
    }
    if (usedIndices.has(c.stackIndex)) {
      throw new Error(`[ps-pptx/patterns/stackCommentary] commentary[${i}].stackIndex ${c.stackIndex} duplicated; each stack row gets exactly one commentary entry.`);
    }
    usedIndices.add(c.stackIndex);
  });
  const emphasisCount = content.stack.filter((s) => s.emphasis).length;
  if (emphasisCount > 2) {
    throw new Error(`[ps-pptx/patterns/stackCommentary] at most 2 stack rows may have emphasis (got ${emphasisCount}).`);
  }

  if (content.subhead) addSubheadTag(slide, content.subhead);
  addH1(slide, content.title, { fontSize: 36 });

  const fillMap = { "red": RED, "pink": PINK, "gray-mid": GRAY_MID, "gray-light": GRAY_LIGHT };

  const regionY = 2.4;
  const regionH = content.pullQuote ? 3.4 : 4.1;
  const leftW = 5.0;
  const gap = 0.5;
  const rightX = MARGIN_L + leftW + gap;
  const rightW = CONTENT_W - leftW - gap;
  const rowH = regionH / content.stack.length;

  // Stack rows
  content.stack.forEach((s, i) => {
    const fill = fillMap[s.fill];
    if (!fill) {
      throw new Error(`[ps-pptx/patterns/stackCommentary] stack[${i}].fill "${s.fill}" must be one of: red | pink | gray-mid | gray-light.`);
    }
    const ry = regionY + i * rowH;
    addBox(slide, {
      x: MARGIN_L, y: ry, w: leftW, h: rowH - 0.05,
      shape: "rect",
      fill: { color: fill },
      line: { color: GRAY_MID, width: 0.5 },
      name: `stackCommentary.stack[${i}].bg`,
    });
    const labelColor = (fill === RED || fill === GRAY_MID) ? WHITE : BLACK;
    addBox(slide, {
      x: MARGIN_L + 0.2, y: ry, w: leftW - 0.4, h: rowH - 0.05,
      text: s.label,
      textOpts: {
        fontFace: FONT_TITLE,
        fontSize: s.emphasis ? 16 : 14,
        color: labelColor,
        bold: true,
        valign: "middle",
      },
      allowOverlap: true,
      name: `stackCommentary.stack[${i}].label`,
    });
  });

  // Commentary, paired by stackIndex
  const sorted = content.commentary.slice().sort((a, b) => a.stackIndex - b.stackIndex);
  sorted.forEach((c) => {
    const ry = regionY + c.stackIndex * rowH;
    addBody(slide, c.text, {
      x: rightX, y: ry, w: rightW, h: rowH - 0.05,
      fontSize: 11,
      name: `stackCommentary.commentary[${c.stackIndex}]`,
    });
  });

  // Pull quote
  if (content.pullQuote) {
    const quoteY = regionY + regionH + 0.15;
    const quoteText = content.pullQuote.source
      ? `“${content.pullQuote.text}”  — ${content.pullQuote.source}`
      : `“${content.pullQuote.text}”`;
    addBody(slide, quoteText, {
      x: MARGIN_L, y: quoteY, w: CONTENT_W, h: 0.5,
      fontSize: 11, italic: true, color: GRAY_MID, align: "center",
      fontFace: FONT_MONO_LIGHT,
      name: "stackCommentary.pullQuote",
    });
  }

  if (content.pageNum != null) addFooter(slide, { pageNum: content.pageNum });
  else addFooter(slide);
};
```

- [ ] **Step 2: Export from patterns/index.js**

Add `stackCommentary: require("./stackCommentary.js"),` to the exports.

- [ ] **Step 3: Add smoke fixture**

In `reference/patterns/smoke.test.js`, after the `anchorStat` block insert:

```js
patterns.stackCommentary(newSlide(), T, {
  subhead: "Pattern: stackCommentary",
  title: "Margin migrates up the stack",
  stack: [
    { label: "Apps & assistants", fill: "red", emphasis: true },
    { label: "Orchestration",     fill: "pink" },
    { label: "Foundation models", fill: "gray-mid" },
    { label: "Compute & data",    fill: "gray-light" },
  ],
  commentary: [
    { stackIndex: 0, text: "Where customers feel value; where switching costs accrue." },
    { stackIndex: 1, text: "Tool routing, eval, and observability — the new control plane." },
    { stackIndex: 2, text: "Increasingly commoditized; pricing power erodes." },
    { stackIndex: 3, text: "Capex-heavy; consolidation continues." },
  ],
  pullQuote: { text: "The middle of the stack is where 2026 budgets land.", source: "PS analyst desk" },
  pageNum: pageNum++,
});
```

Append a negative test for mismatched lengths:

```js
let stackThrew = false;
try {
  patterns.stackCommentary(pres.addSlide(), T, {
    title: "Should throw on mismatched lengths",
    stack: [
      { label: "a", fill: "red" }, { label: "b", fill: "pink" }, { label: "c", fill: "gray-mid" },
    ],
    commentary: [{ stackIndex: 0, text: "only one" }],
  });
} catch (e) {
  stackThrew = /must equal stack.length/.test(e.message);
}
if (!stackThrew) {
  console.error("expected stackCommentary to throw on length mismatch");
  process.exit(1);
}
pres[Symbol.for('ps-pptx.pres-registry')].pop();
```

- [ ] **Step 4: Run smoke**

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All N pattern slides validate cleanly.`

- [ ] **Step 5: Commit**

```bash
cd /Users/rjjain/Documents/GitHub/ps-pptx
git add reference/patterns/stackCommentary.js reference/patterns/index.js reference/patterns/smoke.test.js
git commit -m "$(cat <<'EOF'
feat(patterns): add stackCommentary pattern (P1-6)

Diagram-on-left + commentary-on-right with forced 1:1 pairing
between stack rows and commentary entries. Guards enforce 3-6
stack rows, ≤2 emphasis rows, and unique stackIndex per
commentary entry. Optional pull-quote band at the bottom.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: P1-8 — Cover-slide date default to current MM.YYYY

**Files:**
- Modify: `theme/index.js` (`addFooter` default, optional `addCover`)
- Test: `theme/layout.test.js`

- [ ] **Step 1: Default the date to the current MM.YYYY**

In `theme/index.js`, replace inside `addFooter`:

```js
const dateText = opts.dateText || "XX.2026";
```

with:

```js
let dateText = opts.dateText;
if (!dateText) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  dateText = `${mm}.${now.getFullYear()}`;
}
```

- [ ] **Step 2: Add tests**

Append to `theme/layout.test.js`:

```js
t("addFooter: default dateText is current MM.YYYY", () => {
  const captured = [];
  const slide = {
    addText: (txt) => { captured.push(txt); },
    addImage: () => {}, addShape: () => {},
  };
  T.addFooter(slide);
  // First call's text array contains the date as the third segment.
  const arr = captured[0];
  assert(Array.isArray(arr), "expected text array");
  const date = arr[2] && arr[2].text;
  const re = /^\d{2}\.\d{4}$/;
  assert(re.test(date), `expected MM.YYYY format, got "${date}"`);
});

t("addFooter: explicit dateText overrides the default", () => {
  const captured = [];
  const slide = { addText: (txt) => { captured.push(txt); }, addImage: () => {}, addShape: () => {} };
  T.addFooter(slide, { dateText: "Q1 2026" });
  assert(captured[0][2].text === "Q1 2026", "expected explicit override, got " + captured[0][2].text);
});
```

- [ ] **Step 3: Run tests**

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/theme/layout.test.js`
Expected: all tests pass.

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All N pattern slides validate cleanly.`

- [ ] **Step 4: Commit**

```bash
cd /Users/rjjain/Documents/GitHub/ps-pptx
git add theme/index.js theme/layout.test.js
git commit -m "$(cat <<'EOF'
fix(theme): default footer date to current MM.YYYY (P1-8)

addFooter no longer ships placeholder 'XX.2026'. The runtime
default is now derived from new Date() so covers always pick up
the current month/year. Explicit dateText still wins.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: P2-10 — `parityGroup` opt + retrofit scqa3col & beforeAfter

**Files:**
- Modify: `theme/layout.js` (parity check in validateLayout)
- Modify: `reference/patterns/scqa3col.js` (set parityGroup on column bodies)
- Modify: `reference/patterns/beforeAfter.js` (set parityGroup on before/after bodies)
- Test: `theme/layout.test.js`

- [ ] **Step 1: Add parity check to validateLayout**

In `theme/layout.js`, inside the per-slide loop in `validateLayout`, after the balance block, add:

```js
// Parity-group fill check: cells in the same group should have similar fill ratios.
const groups = {};
recs.forEach((r) => {
  if (!r.parityGroup) return;
  (groups[r.parityGroup] = groups[r.parityGroup] || []).push(r);
});
Object.entries(groups).forEach(([group, members]) => {
  if (members.length < 2) return;
  const ratios = members.map((m) => {
    // Use the bbox area as the proxy — for now the caller passes the rendered
    // text/content rect, so this is the box we care about. Density inside is
    // out of scope; we measure the declared rect.
    return m.w * m.h;
  });
  const lo = Math.min(...ratios);
  const hi = Math.max(...ratios);
  if (lo <= 0) return;
  const ratioGap = (hi - lo) / hi;
  if (ratioGap > 0.5) {
    errors.push(`slide ${idx}: parity — group "${group}" has ${(ratioGap * 100).toFixed(0)}% size gap between largest and smallest member; cells look mismatched.`);
  } else if (ratioGap > 0.3) {
    warnings.push(`slide ${idx}: parity — group "${group}" has ${(ratioGap * 100).toFixed(0)}% size gap between largest and smallest member.`);
  }
});
```

- [ ] **Step 2: Pass parityGroup through addBody/addBox**

In `theme/index.js`, in `addBody`, the `recordPlacement` call already passes opts; add `parityGroup: opts.parityGroup`:

```js
layout.recordPlacement(slide, "body", opts.name || "addBody", x, y, w, h, {
  allowOverlap: !!opts.allowOverlap,
  bottomBandPolicy: opts.bottomBandPolicy || (opts.fullBleed ? "fullBleed" : "enforce"),
  parityGroup: opts.parityGroup,
});
```

Same change in `addBox`'s `recordPlacement` call.

- [ ] **Step 3: Update scqa3col to use parityGroup**

In `reference/patterns/scqa3col.js`, in the `addBody` call inside the column render, add `parityGroup: "scqa3col"`:

```js
addBody(slide, col.body, {
  x: rect.x, y: rect.y + labelH + 0.1, w: rect.w, h: rect.h - labelH - 0.1,
  fontSize: 11,
  parityGroup: "scqa3col",
  name: `scqa3col.body[${col.label}]`,
});
```

- [ ] **Step 4: Update beforeAfter similarly**

In `reference/patterns/beforeAfter.js`, in the `addBody` call inside the side render, add `parityGroup: "beforeAfter"`:

```js
addBody(slide, bodyText, {
  x: rect.x + 0.2, y: rect.y + 0.75, w: rect.w - 0.4, h: rect.h - 0.95,
  fontSize: 11,
  allowOverlap: !!fill,
  parityGroup: "beforeAfter",
  name: `beforeAfter.${key}.body`,
});
```

- [ ] **Step 5: Add tests**

Append to `theme/layout.test.js`:

```js
t("parityGroup: matched sizes produce no finding", () => {
  const s = mockSlide();
  s[Symbol.for("ps-pptx.slide-meta")] = { role: "content" };
  layout.recordPlacement(s, "body", "L", 1, 2, 5, 4, { parityGroup: "g" });
  layout.recordPlacement(s, "body", "R", 7, 2, 5, 4, { parityGroup: "g" });
  const r = layout.validateLayout({}, [s], GEOM);
  assert(!r.errors.some((e) => /parity/.test(e)), "no parity error expected");
  assert(!r.warnings.some((w) => /parity/.test(w)), "no parity warning expected");
});

t("parityGroup: >50% size gap errors", () => {
  const s = mockSlide();
  s[Symbol.for("ps-pptx.slide-meta")] = { role: "content" };
  layout.recordPlacement(s, "body", "L", 1, 2, 5, 1, { parityGroup: "g" });
  layout.recordPlacement(s, "body", "R", 7, 2, 5, 4, { parityGroup: "g" });
  const r = layout.validateLayout({}, [s], GEOM);
  assert(r.errors.some((e) => /parity.*size gap/.test(e)), "expected parity error: " + r.errors.join(" | "));
});

t("parityGroup: 30–50% gap warns", () => {
  const s = mockSlide();
  s[Symbol.for("ps-pptx.slide-meta")] = { role: "content" };
  layout.recordPlacement(s, "body", "L", 1, 2, 5, 2.5, { parityGroup: "g" });
  layout.recordPlacement(s, "body", "R", 7, 2, 5, 4, { parityGroup: "g" });
  const r = layout.validateLayout({}, [s], GEOM);
  assert(r.warnings.some((w) => /parity/.test(w)), "expected parity warning: " + r.warnings.join(" | "));
  assert(!r.errors.some((e) => /parity/.test(e)), "should not error at 37%: " + r.errors.join(" | "));
});
```

- [ ] **Step 6: Run tests**

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/theme/layout.test.js`
Expected: all tests pass.

Run: `node /Users/rjjain/Documents/GitHub/ps-pptx/reference/patterns/smoke.test.js`
Expected: `✓ All N pattern slides validate cleanly.` (smoke fixtures use balanced cells, no parity findings expected).

- [ ] **Step 7: Commit**

```bash
cd /Users/rjjain/Documents/GitHub/ps-pptx
git add theme/index.js theme/layout.js theme/layout.test.js reference/patterns/scqa3col.js reference/patterns/beforeAfter.js
git commit -m "$(cat <<'EOF'
feat(qa): parityGroup opt for fill-imbalance detection (P2-10)

addBody/addBox now accept { parityGroup } metadata; validateLayout
flags groups whose member rects differ in size by >30% (warn) or
>50% (error). scqa3col and beforeAfter patterns retrofit their
parallel cells to opt in.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- P0-1: Task 1 ✓
- P0-2: Task 2 ✓ (split into density + center-of-mass with severity tiers, data-dense exemption)
- P1-3 (heatmap legend): Task 5 ✓
- P1-4 (matrix2x2 severity): Task 6 ✓
- P1-5 (anchorStat): Task 7 ✓
- P1-6 (stackCommentary): Task 8 ✓
- P1-7 (color type-guard): Task 3 ✓
- P1-8 (cover date default): Task 9 ✓
- P1-9 (addBodyDense): Task 4 ✓
- P2-10 (parityGroup): Task 10 ✓
- Cross-cutting (lint.js, contract.md, JSDoc): explicitly out of scope ✓

**Type consistency check:**
- `bottomBandPolicy` introduced in Task 1, used identically in Tasks 5/6/7/8/10 (when ranges approach footer band, e.g., `anchorStat.footnote` y=6.55 stays inside `enforce`).
- `markRole(slide, "data-dense")` introduced in Task 2; `addBodyDense` consumes it via `hasTag` in Task 4 — consistent.
- `parityGroup` opt introduced in Task 10's plumbing through `addBody`/`addBox`; consumed in `scqa3col` and `beforeAfter` in the same task — consistent.
- `_normalizeColorArg` and `checkColor` interplay verified: Task 3 normalizes to `{ color }` then calls `checkColor` with `.color` (a string).

**Placeholder scan:** No TODO/TBD/"similar to" references. Each step has actual code.

**Spec adherence to brainstorming-pass adjustments:**
- Hard-cut `overFooter` → `bottomBandPolicy` with no deprecation warning ✓
- Cross-cutting items deferred ✓
- P2-10 retrofits patterns last (after P1-3/4 land) ✓

---

## Execution

Plan complete and saved to `/Users/rjjain/Documents/GitHub/ps-pptx/docs/superpowers/plans/2026-05-20-ps-pptx-structural-fixes.md`.
