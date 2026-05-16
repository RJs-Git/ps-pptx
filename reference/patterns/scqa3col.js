/**
 * scqa3col — Situation / Complication / Question (or Answer) three-column.
 *
 * content = {
 *   subhead?: string,            // optional subhead tag (mutually exclusive with logo)
 *   title:    string,            // H1 above the three columns
 *   columns:  [                  // 2–4 entries; 3 is canonical
 *     { label: string, body: string },
 *     ...
 *   ],
 *   pageNum?: number,
 * }
 */
module.exports = function scqa3col(slide, T, content) {
  const { addH1, addBody, addBox, addSubheadTag, addFooter, row, RED, BLACK, GRAY_MID, FONT_TITLE, FONT_BODY, MARGIN_L, CONTENT_W } = T;
  if (!content || !content.title || !Array.isArray(content.columns) || content.columns.length < 2) {
    throw new Error("[ps-pptx/patterns/scqa3col] requires { title, columns: [≥2] }");
  }

  if (content.subhead) addSubheadTag(slide, content.subhead);
  addH1(slide, content.title, { fontSize: 38 });

  // Body region sits below the title band, above the footer band.
  const region = { x: MARGIN_L, y: 2.4, w: CONTENT_W, h: 4.2 };

  row(slide, {
    x: region.x, y: region.y, w: region.w, h: region.h, gap: 0.3,
    items: content.columns.map((col) => ({
      flex: 1,
      render: (rect) => {
        // Column label (small caps style via mono font), then body text.
        const labelH = 0.4;
        addBox(slide, {
          x: rect.x, y: rect.y, w: rect.w, h: labelH,
          text: col.label,
          textOpts: { fontFace: FONT_TITLE, fontSize: 12, color: RED, bold: true, valign: "top" },
          name: `scqa3col.label[${col.label}]`,
        });
        addBody(slide, col.body, {
          x: rect.x, y: rect.y + labelH + 0.1, w: rect.w, h: rect.h - labelH - 0.1,
          fontSize: 11,
          name: `scqa3col.body[${col.label}]`,
        });
      },
    })),
  });

  if (content.pageNum != null) addFooter(slide, { pageNum: content.pageNum });
  else addFooter(slide);
};
