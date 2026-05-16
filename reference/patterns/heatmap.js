/**
 * heatmap — Capability heatmap. Rows × cols of cells colored by score.
 *
 * content = {
 *   subhead?: string,
 *   title:    string,
 *   colHeaders: string[],            // e.g., ["Q1", "Q2", "Q3", "Q4"]
 *   rowHeaders: string[],            // e.g., ["Discovery", "Build", "Launch"]
 *   scores:    number[][],           // scores[row][col] in [0, 1]; null for blank
 *   pageNum?:  number,
 * }
 *
 * Score → fill mapping:
 *   ≥ 0.66 → RED
 *   ≥ 0.33 → PINK
 *   <  0.33 → GRAY_LIGHT
 *   null   → WHITE (blank)
 */
module.exports = function heatmap(slide, T, content) {
  const { addH1, addBox, addSubheadTag, addFooter, grid, RED, PINK, GRAY_LIGHT, GRAY_MID, BLACK, WHITE, FONT_TITLE, FONT_MONO, MARGIN_L, CONTENT_W } = T;
  if (!content || !content.title || !Array.isArray(content.colHeaders) || !Array.isArray(content.rowHeaders) || !Array.isArray(content.scores)) {
    throw new Error("[ps-pptx/patterns/heatmap] requires { title, colHeaders, rowHeaders, scores }");
  }
  const cols = content.colHeaders.length;
  const rows = content.rowHeaders.length;
  if (content.scores.length !== rows || content.scores.some((r) => r.length !== cols)) {
    throw new Error("[ps-pptx/patterns/heatmap] scores dimensions must match rowHeaders × colHeaders");
  }

  if (content.subhead) addSubheadTag(slide, content.subhead);
  addH1(slide, content.title, { fontSize: 36 });

  const headerW = 1.8;
  const headerH = 0.4;
  const region = { x: MARGIN_L + headerW, y: 2.4 + headerH, w: CONTENT_W - headerW, h: 4.0 - headerH };

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
    if (score >= 0.66) return RED;
    if (score >= 0.33) return PINK;
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

  if (content.pageNum != null) addFooter(slide, { pageNum: content.pageNum });
  else addFooter(slide);
};
