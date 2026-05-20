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
