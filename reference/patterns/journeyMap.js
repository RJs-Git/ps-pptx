/**
 * journeyMap — Horizontal step sequence.
 *
 * content = {
 *   subhead?: string,
 *   title:    string,
 *   steps: [
 *     { label: string, note?: string, value?: string },  // 3–7 steps
 *     ...
 *   ],
 *   pageNum?: number,
 * }
 *
 * Renders: numbered step boxes connected by a single horizontal line, with
 * step labels above and notes below each box.
 */
module.exports = function journeyMap(slide, T, content) {
  const { addH1, addBox, addSubheadTag, addFooter, row, RED, BLACK, WHITE, GRAY_MID, GRAY_LIGHT, FONT_TITLE, FONT_BODY, FONT_MONO, MARGIN_L, CONTENT_W } = T;
  if (!content || !content.title || !Array.isArray(content.steps) || content.steps.length < 2) {
    throw new Error("[ps-pptx/patterns/journeyMap] requires { title, steps: [≥2] }");
  }

  if (content.subhead) addSubheadTag(slide, content.subhead);
  addH1(slide, content.title, { fontSize: 36 });

  const region = { x: MARGIN_L, y: 2.6, w: CONTENT_W, h: 3.8 };
  // Three horizontal bands inside the region: label (top), step disc (middle), note (bottom)
  const labelH = 0.6;
  const discH = 0.9;
  const noteH = region.h - labelH - discH - 0.3;

  // Connector line through the middle of the disc band
  const connectorY = region.y + labelH + discH / 2;
  addBox(slide, {
    x: region.x + 0.5, y: connectorY - 0.02, w: region.w - 1.0, h: 0.04,
    shape: "rect", fill: { color: GRAY_LIGHT },
    name: "journeyMap.connector",
    allowOverlap: true,
  });

  row(slide, {
    x: region.x, y: region.y, w: region.w, h: region.h, gap: 0.2,
    items: content.steps.map((step, i) => ({
      flex: 1,
      render: (rect) => {
        // Label above
        addBox(slide, {
          x: rect.x, y: rect.y, w: rect.w, h: labelH,
          text: step.label,
          textOpts: { fontFace: FONT_TITLE, fontSize: 12, color: BLACK, bold: true, align: "center", valign: "middle" },
          name: `journeyMap.step[${i}].label`,
        });
        // Step disc with number (or value)
        const discSize = Math.min(discH, rect.w * 0.5);
        const discX = rect.x + (rect.w - discSize) / 2;
        const discY = rect.y + labelH + (discH - discSize) / 2;
        addBox(slide, {
          x: discX, y: discY, w: discSize, h: discSize,
          shape: "ellipse", fill: { color: RED },
          name: `journeyMap.step[${i}].disc`,
          allowOverlap: true,
        });
        addBox(slide, {
          x: discX, y: discY, w: discSize, h: discSize,
          text: step.value != null ? String(step.value) : String(i + 1),
          textOpts: { fontFace: FONT_TITLE, fontSize: 16, color: WHITE, bold: true, align: "center", valign: "middle" },
          allowOverlap: true,
          name: `journeyMap.step[${i}].discText`,
        });
        // Note below
        if (step.note) {
          addBox(slide, {
            x: rect.x, y: rect.y + labelH + discH + 0.15, w: rect.w, h: noteH,
            text: step.note,
            textOpts: { fontFace: FONT_BODY, fontSize: 10, color: GRAY_MID, align: "center", valign: "top" },
            name: `journeyMap.step[${i}].note`,
          });
        }
      },
    })),
  });

  if (content.pageNum != null) addFooter(slide, { pageNum: content.pageNum });
  else addFooter(slide);
};
