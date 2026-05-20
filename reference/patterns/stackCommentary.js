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

  // Commentary, paired by stackIndex.
  const sorted = content.commentary.slice().sort((a, b) => a.stackIndex - b.stackIndex);
  sorted.forEach((c) => {
    const ry = regionY + c.stackIndex * rowH;
    addBody(slide, c.text, {
      x: rightX, y: ry, w: rightW, h: rowH - 0.05,
      fontSize: 11,
      name: `stackCommentary.commentary[${c.stackIndex}]`,
    });
  });

  // Pull quote.
  if (content.pullQuote) {
    const quoteY = regionY + regionH + 0.15;
    const quoteText = content.pullQuote.source
      ? `"${content.pullQuote.text}"  — ${content.pullQuote.source}`
      : `"${content.pullQuote.text}"`;
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
