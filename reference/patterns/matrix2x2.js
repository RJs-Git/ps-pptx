/**
 * matrix2x2 — 2x2 matrix with axis labels and four quadrant cells.
 *
 * content = {
 *   subhead?: string,
 *   title:    string,
 *   xAxis:    { low: string, high: string, label?: string },
 *   yAxis:    { low: string, high: string, label?: string },
 *   quadrants: {
 *     tl: { label: string, body?: string },  // top-left  (low-x, high-y)
 *     tr: { label: string, body?: string },  // top-right (high-x, high-y)
 *     bl: { label: string, body?: string },
 *     br: { label: string, body?: string },
 *   },
 *   highlight?: "tl" | "tr" | "bl" | "br",   // tint with PINK fill
 *   pageNum?: number,
 * }
 */
module.exports = function matrix2x2(slide, T, content) {
  const { addH1, addBox, addBody, addSubheadTag, addFooter, grid, RED, PINK, BLACK, WHITE, GRAY_LIGHT, GRAY_MID, FONT_TITLE, FONT_BODY, FONT_MONO, MARGIN_L, CONTENT_W } = T;
  if (!content || !content.title || !content.quadrants) {
    throw new Error("[ps-pptx/patterns/matrix2x2] requires { title, quadrants }");
  }

  if (content.subhead) addSubheadTag(slide, content.subhead);
  addH1(slide, content.title, { fontSize: 36 });

  // Axis label gutter widths
  const axisGutter = 0.7;     // left strip for y-axis labels
  const axisLabelH = 0.45;    // bottom strip for x-axis labels
  const region = {
    x: MARGIN_L + axisGutter,
    y: 2.4,
    w: CONTENT_W - axisGutter,
    h: 6.6 - 2.4 - axisLabelH,    // ~3.75 tall
  };

  // Y-axis: low (bottom) → high (top), drawn in left gutter.
  addBox(slide, {
    x: MARGIN_L, y: region.y, w: axisGutter - 0.1, h: region.h,
    text: `${content.yAxis.high}\n\n\n\n\n${content.yAxis.low}`,
    textOpts: { fontFace: FONT_MONO, fontSize: 9, color: GRAY_MID, align: "right", valign: "top" },
    name: "matrix2x2.yAxis",
  });

  // X-axis: low (left) → high (right), drawn below the matrix.
  addBox(slide, {
    x: region.x, y: region.y + region.h + 0.1, w: region.w, h: axisLabelH - 0.1,
    text: `${content.xAxis.low}                                                                ${content.xAxis.high}`,
    textOpts: { fontFace: FONT_MONO, fontSize: 9, color: GRAY_MID, valign: "top" },
    name: "matrix2x2.xAxis",
  });

  const cellMap = { tl: { c: 0, r: 0 }, tr: { c: 1, r: 0 }, bl: { c: 0, r: 1 }, br: { c: 1, r: 1 } };
  const items = Object.keys(cellMap).map((key) => {
    const q = content.quadrants[key];
    const { c, r } = cellMap[key];
    const isHighlighted = content.highlight === key;
    return {
      col: c, row: r,
      render: (rect) => {
        addBox(slide, {
          x: rect.x, y: rect.y, w: rect.w, h: rect.h,
          shape: "rect",
          fill: { color: isHighlighted ? PINK : GRAY_LIGHT },
          line: { color: GRAY_MID, width: 0.5 },
          name: `matrix2x2.cell[${key}]`,
        });
        // Label
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
