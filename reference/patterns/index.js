/**
 * Pattern library — vetted slide layouts that the deck agent should reach
 * for first instead of composing layouts from raw coordinates.
 *
 * Each pattern is a function (slide, T, content) where:
 *   - slide   : a PptxGenJS slide created via T.instrument(pres).addSlide()
 *   - T       : the ps-pptx theme module (require("../../theme/index.js"))
 *   - content : pattern-specific content object (see each pattern's JSDoc)
 *
 * Patterns use only theme primitives (row/column/grid) + helpers
 * (addH1/addBody/addBox/addSubheadTag/addFooter), so every rect they place
 * flows through the placement registry and validateDeck() will catch
 * overlaps or footer-band overruns.
 *
 * Available patterns:
 *   - scqa3col    : Situation / Complication / Question(/Answer) three-column
 *   - matrix2x2   : 2x2 matrix with axis labels and quadrant boxes
 *   - kpiTree     : One headline KPI feeding a row of supporting KPIs
 *   - beforeAfter : Two-column before/after comparison with labels
 *   - journeyMap  : Horizontal step sequence with labels above and notes below
 *   - heatmap     : Capability heatmap (rows × cols, cells colored by score)
 *   - anchorStat  : Hero-stat slide (giant numeral + sub-stats)
 *   - stackCommentary : Layered stack diagram + paired commentary
 */

module.exports = {
  scqa3col: require("./scqa3col.js"),
  matrix2x2: require("./matrix2x2.js"),
  kpiTree: require("./kpiTree.js"),
  beforeAfter: require("./beforeAfter.js"),
  journeyMap: require("./journeyMap.js"),
  heatmap: require("./heatmap.js"),
  anchorStat: require("./anchorStat.js"),
  stackCommentary: require("./stackCommentary.js"),
};
