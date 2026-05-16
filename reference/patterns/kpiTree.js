/**
 * kpiTree — One headline KPI feeding a row of supporting KPIs.
 *
 * content = {
 *   subhead?: string,
 *   title:    string,
 *   headline: { value: string, label: string },        // big number + caption
 *   children: [ { value: string, label: string }, ... ] // 2–5 supporting KPIs
 *   pageNum?: number,
 * }
 */
module.exports = function kpiTree(slide, T, content) {
  const { addH1, addBox, addSubheadTag, addFooter, row, RED, BLACK, GRAY_MID, FONT_TITLE, FONT_BODY, FONT_MONO, MARGIN_L, CONTENT_W } = T;
  if (!content || !content.title || !content.headline || !Array.isArray(content.children) || content.children.length < 2) {
    throw new Error("[ps-pptx/patterns/kpiTree] requires { title, headline, children: [≥2] }");
  }

  if (content.subhead) addSubheadTag(slide, content.subhead);
  addH1(slide, content.title, { fontSize: 36 });

  // Headline KPI band
  const headlineRect = { x: MARGIN_L, y: 2.3, w: CONTENT_W, h: 1.6 };
  addBox(slide, {
    x: headlineRect.x, y: headlineRect.y, w: headlineRect.w, h: 0.95,
    text: content.headline.value,
    textOpts: { fontFace: FONT_TITLE, fontSize: 72, color: RED, bold: true, align: "center", valign: "middle" },
    name: "kpiTree.headline.value",
  });
  addBox(slide, {
    x: headlineRect.x, y: headlineRect.y + 1.0, w: headlineRect.w, h: 0.55,
    text: content.headline.label,
    textOpts: { fontFace: FONT_MONO, fontSize: 11, color: GRAY_MID, align: "center", valign: "top" },
    name: "kpiTree.headline.label",
  });

  // Supporting children KPIs in a row
  const childrenRect = { x: MARGIN_L, y: 4.4, w: CONTENT_W, h: 2.0 };
  row(slide, {
    x: childrenRect.x, y: childrenRect.y, w: childrenRect.w, h: childrenRect.h, gap: 0.3,
    items: content.children.map((kpi, i) => ({
      flex: 1,
      render: (rect) => {
        addBox(slide, {
          x: rect.x, y: rect.y, w: rect.w, h: 1.2,
          text: kpi.value,
          textOpts: { fontFace: FONT_TITLE, fontSize: 38, color: BLACK, bold: true, align: "center", valign: "middle" },
          name: `kpiTree.child[${i}].value`,
        });
        addBox(slide, {
          x: rect.x, y: rect.y + 1.25, w: rect.w, h: 0.7,
          text: kpi.label,
          textOpts: { fontFace: FONT_BODY, fontSize: 11, color: GRAY_MID, align: "center", valign: "top" },
          name: `kpiTree.child[${i}].label`,
        });
      },
    })),
  });

  if (content.pageNum != null) addFooter(slide, { pageNum: content.pageNum });
  else addFooter(slide);
};
