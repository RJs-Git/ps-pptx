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
    tl: { label: "Hidden gems",  body: "Underfunded but capable.",   severity: "medium" },
    tr: { label: "Strongholds",  body: "Well-funded and capable.",   severity: "high" },
    bl: { label: "Cut",          body: "Underfunded and weak.",      severity: "low" },
    br: { label: "Risky bets",   body: "Heavily funded but unproven.",severity: "medium" },
  },
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

patterns.anchorStat(newSlide(), T, {
  subhead: "Pattern: anchorStat",
  title: "AT&T's SLM-first rebuild proves the architecture",
  stat: { value: "~90", unit: "%", caption: "of agent calls now resolved by an SLM" },
  subStats: [
    { value: "3.2x",  caption: "throughput vs prior LLM-only stack" },
    { value: "$0.04", caption: "per resolved call" },
    { value: "11mo",  caption: "to migrate" },
  ],
  footnote: "Source: AT&T engineering blog, 2026 Q1.",
  pageNum: pageNum++,
});

patterns.stackCommentary(newSlide(), T, {
  subhead: "Pattern: stackCommentary",
  title: "Margin migrates up the stack",
  stack: [
    { label: "Apps & assistants", fill: "red", emphasis: true },
    { label: "Orchestration",     fill: "pink" },
    { label: "Foundation models", fill: "gray-mid" },
    { label: "Compute & data",    fill: "gray-light" },
  ],
  commentary: [
    { stackIndex: 0, text: "Where customers feel value; where switching costs accrue." },
    { stackIndex: 1, text: "Tool routing, eval, and observability — the new control plane." },
    { stackIndex: 2, text: "Increasingly commoditized; pricing power erodes." },
    { stackIndex: 3, text: "Capex-heavy; consolidation continues." },
  ],
  pullQuote: { text: "The middle of the stack is where 2026 budgets land.", source: "PS analyst desk" },
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

// Negative test: matrix2x2 with uniform severity must throw.
let matrixThrew = false;
try {
  patterns.matrix2x2(pres.addSlide(), T, {
    title: "Uniform severity should throw",
    xAxis: { low: "lo", high: "hi" }, yAxis: { low: "lo", high: "hi" },
    quadrants: {
      tl: { label: "a", severity: "high" }, tr: { label: "b", severity: "high" },
      bl: { label: "c", severity: "high" }, br: { label: "d", severity: "high" },
    },
  });
} catch (e) {
  matrixThrew = /share severity .* visual signal is wasted/.test(e.message);
}
if (!matrixThrew) {
  console.error("expected matrix2x2 to throw on uniform severity");
  process.exit(1);
}
pres[Symbol.for('ps-pptx.pres-registry')].pop();

// Negative test: anchorStat with >8 char hero value must throw.
let anchorThrew = false;
try {
  patterns.anchorStat(pres.addSlide(), T, {
    title: "Should throw",
    stat: { value: "999999999", caption: "too many digits" },
  });
} catch (e) {
  anchorThrew = /exceeds 8 chars/.test(e.message);
}
if (!anchorThrew) {
  console.error("expected anchorStat to throw on long stat.value");
  process.exit(1);
}
pres[Symbol.for('ps-pptx.pres-registry')].pop();

// Negative test: stackCommentary with mismatched lengths must throw.
let stackThrew = false;
try {
  patterns.stackCommentary(pres.addSlide(), T, {
    title: "Should throw on mismatched lengths",
    stack: [
      { label: "a", fill: "red" }, { label: "b", fill: "pink" }, { label: "c", fill: "gray-mid" },
    ],
    commentary: [{ stackIndex: 0, text: "only one" }],
  });
} catch (e) {
  stackThrew = /must equal stack.length/.test(e.message);
}
if (!stackThrew) {
  console.error("expected stackCommentary to throw on length mismatch");
  process.exit(1);
}
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
