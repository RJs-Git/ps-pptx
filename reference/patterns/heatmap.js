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
  const minRowH = 0.32;
  if (regionH / rows < minRowH) {
    throw new Error(`[ps-pptx/patterns/heatmap] ${rows} rows in ${regionH.toFixed(2)}in cell region produces row height ${(regionH/rows).toFixed(2)}in, below the ${minRowH}in minimum. Region is too small after reserving the legend band; reduce rows.`);
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
