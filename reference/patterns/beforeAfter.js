/**
 * beforeAfter — Two-column before/after comparison.
 *
 * content = {
 *   subhead?: string,
 *   title:    string,
 *   before:   { label?: string, body: string, bullets?: string[] },
 *   after:    { label?: string, body: string, bullets?: string[] },
 *   pageNum?: number,
 * }
 */
module.exports = function beforeAfter(slide, T, content) {
  const { addH1, addBox, addBody, addSubheadTag, addFooter, row, RED, BLACK, GRAY_MID, GRAY_LIGHT, FONT_TITLE, FONT_BODY, MARGIN_L, CONTENT_W } = T;
  if (!content || !content.title || !content.before || !content.after) {
    throw new Error("[ps-pptx/patterns/beforeAfter] requires { title, before, after }");
  }

  if (content.subhead) addSubheadTag(slide, content.subhead);
  addH1(slide, content.title, { fontSize: 36 });

  const region = { x: MARGIN_L, y: 2.4, w: CONTENT_W, h: 4.2 };
  const sides = [
    { key: "before", side: content.before, defaultLabel: "BEFORE", color: GRAY_MID, fill: GRAY_LIGHT },
    { key: "after",  side: content.after,  defaultLabel: "AFTER",  color: RED,      fill: null },
  ];

  row(slide, {
    x: region.x, y: region.y, w: region.w, h: region.h, gap: 0.4,
    items: sides.map(({ key, side, defaultLabel, color, fill }) => ({
      flex: 1,
      render: (rect) => {
        if (fill) {
          addBox(slide, {
            x: rect.x, y: rect.y, w: rect.w, h: rect.h,
            shape: "rect", fill: { color: fill },
            name: `beforeAfter.${key}.bg`,
          });
        }
        const labelText = side.label || defaultLabel;
        addBox(slide, {
          x: rect.x + 0.2, y: rect.y + 0.2, w: rect.w - 0.4, h: 0.4,
          text: labelText,
          textOpts: { fontFace: FONT_TITLE, fontSize: 14, color, bold: true },
          allowOverlap: !!fill,
          name: `beforeAfter.${key}.label`,
        });
        const bodyText = side.bullets && side.bullets.length
          ? side.bullets.map((b) => "• " + b).join("\n")
          : side.body;
        addBody(slide, bodyText, {
          x: rect.x + 0.2, y: rect.y + 0.75, w: rect.w - 0.4, h: rect.h - 0.95,
          fontSize: 11,
          allowOverlap: !!fill,
          parityGroup: "beforeAfter",
          name: `beforeAfter.${key}.body`,
        });
      },
    })),
  });

  if (content.pageNum != null) addFooter(slide, { pageNum: content.pageNum });
  else addFooter(slide);
};
