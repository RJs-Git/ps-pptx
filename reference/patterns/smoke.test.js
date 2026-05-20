#!/usr/bin/env node
/**
 * Smoke test — build one slide per pattern, run validateDeck, fail on any error.
 *
 *   node reference/patterns/smoke.test.js
 */
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const T = require("../../theme/index.js");
const patterns = require("./index.js");

const pres = T.instrument(new PptxGenJS());
pres.layout = "LAYOUT_WIDE";

let pageNum = 1;
function newSlide() { return pres.addSlide(); }

patterns.scqa3col(newSlide(), T, {
  subhead: "Pattern: SCQA",
  title: "Three-column SCQA",
  columns: [
    { label: "SITUATION",    body: "Today, X is happening at scale." },
    { label: "COMPLICATION", body: "But existing solutions break under Y." },
    { label: "QUESTION",     body: "How can we close the gap?" },
  ],
  pageNum: pageNum++,
});

patterns.matrix2x2(newSlide(), T, {
  subhead: "Pattern: 2x2",
  title: "Capability vs investment",
  xAxis: { low: "Low investment", high: "High investment" },
  yAxis: { low: "Low capability", high: "High capability" },
  quadrants: {
    tl: { label: "Hidden gems",  body: "Underfunded but capable." },
    tr: { label: "Strongholds",  body: "Well-funded and capable." },
    bl: { label: "Cut",          body: "Underfunded and weak." },
    br: { label: "Risky bets",   body: "Heavily funded but unproven." },
  },
  highlight: "tr",
  pageNum: pageNum++,
});

patterns.kpiTree(newSlide(), T, {
  subhead: "Pattern: KPI tree",
  title: "Q4 results",
  headline: { value: "$42M", label: "Total revenue (+18% YoY)" },
  children: [
    { value: "+24%",  label: "New ARR" },
    { value: "92%",   label: "Gross retention" },
    { value: "1.4×",  label: "Net dollar retention" },
    { value: "11d",   label: "Median deal cycle" },
  ],
  pageNum: pageNum++,
});

patterns.beforeAfter(newSlide(), T, {
  subhead: "Pattern: before/after",
  title: "What changes for the analyst",
  before: { bullets: ["6h to compile a weekly report", "3 separate dashboards", "Manual QA on every export"] },
  after:  { bullets: ["20-minute self-service report",  "1 unified workspace",  "Auto-validation in pipeline"] },
  pageNum: pageNum++,
});

patterns.journeyMap(newSlide(), T, {
  subhead: "Pattern: journey",
  title: "End-to-end onboarding",
  steps: [
    { label: "Sign up",   note: "Email + SSO" },
    { label: "Configure", note: "Pick workspace" },
    { label: "Invite",    note: "Add teammates" },
    { label: "Launch",    note: "First report" },
    { label: "Expand",    note: "Connect data" },
  ],
  pageNum: pageNum++,
});

patterns.heatmap(newSlide(), T, {
  subhead: "Pattern: heatmap",
  title: "Capability maturity by quarter",
  colHeaders: ["Q1", "Q2", "Q3", "Q4"],
  rowHeaders: ["Discovery", "Build", "Launch", "Scale"],
  scores: [
    [0.8, 0.9, 0.7, 0.5],
    [0.4, 0.5, 0.7, 0.8],
    [0.2, 0.3, 0.5, 0.6],
    [null, 0.1, 0.3, 0.4],
  ],
  pageNum: pageNum++,
});

// Negative test: heatmap with too many rows must throw at pattern time.
let heatmapThrew = false;
try {
  patterns.heatmap(pres.addSlide(), T, {
    subhead: "negative test",
    title: "Should throw — too many rows",
    colHeaders: ["A","B","C","D"],
    rowHeaders: ["1","2","3","4","5","6","7","8","9","10","11","12"],
    scores: Array.from({length:12}, () => [0.5,0.5,0.5,0.5]),
  });
} catch (e) {
  heatmapThrew = /too small after reserving the legend band|below the .* minimum/.test(e.message);
}
if (!heatmapThrew) {
  console.error("expected heatmap to throw on overflow row count");
  process.exit(1);
}
// Drop the half-built slide so validateDeck doesn't see it.
pres[Symbol.for('ps-pptx.pres-registry')].pop();

let result;
try {
  result = T.validateDeck(pres, { silent: true });
} catch (e) {
  console.error("VALIDATE FAILED:");
  console.error(e.message);
  process.exit(1);
}

console.log(`✓ All ${pageNum - 1} pattern slides validate cleanly.`);
if (result.warnings.length) {
  console.log(`  (${result.warnings.length} balance warning(s):)`);
  result.warnings.forEach((w) => console.log("    ⚠ " + w));
}

const out = path.join(__dirname, "smoke-output.pptx");
pres.writeFile({ fileName: out }).then(() => {
  console.log(`  wrote ${out}`);
});
