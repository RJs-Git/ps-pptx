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

  // Hero numeral, centered. Use addBox with display:true since this isn't an H1.
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
