#!/usr/bin/env node
/**
 * qa.js — single-command QA runner for ps-pptx decks.
 *
 *   node theme/qa.js <deck-source.js> <deck-output.pptx>
 *
 * Steps:
 *   1. Static lint of <deck-source.js>: hex-literal palette violations,
 *      raw fontFace strings, addLogo/addSubheadTag collisions per slide block.
 *   2. Render <deck-output.pptx> → PDF → per-slide JPGs into qa-report/.
 *   3. Auto-extract per-slide H1 text from the source for "Expected:" lines.
 *   4. Emit qa-report/SUBAGENT_PROMPT.md — pre-filled fresh-eyes prompt for
 *      a visual QA subagent.
 *
 * Exits non-zero on any lint failure. The visual QA subagent step is the
 * caller's responsibility — qa.js prepares the inputs.
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const T = require("./index.js");

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node theme/qa.js <deck-source.js> <deck-output.pptx>");
  process.exit(2);
}
const [SRC, PPTX] = args.map(p => path.resolve(p));
if (!fs.existsSync(SRC))  { console.error(`Source not found: ${SRC}`);  process.exit(2); }
if (!fs.existsSync(PPTX)) { console.error(`Pptx not found: ${PPTX}. Run \`node ${path.basename(SRC)}\` first.`); process.exit(2); }

const REPORT_DIR = path.join(path.dirname(PPTX), "qa-report");
fs.mkdirSync(REPORT_DIR, { recursive: true });

const src = fs.readFileSync(SRC, "utf8");
const errors = [];
const warnings = [];

// ─── 1a. Palette lint — hex literals not in PS palette ──────────────────────
{
  const allowed = new Set(T.ALLOWED_COLORS.map(c => c.toUpperCase()));
  const re = /["'#]([0-9A-Fa-f]{6})["']/g;
  let m;
  const lines = src.split("\n");
  while ((m = re.exec(src)) !== null) {
    const hex = m[1].toUpperCase();
    if (!allowed.has(hex)) {
      const lineNo = src.slice(0, m.index).split("\n").length;
      errors.push(`palette: line ${lineNo}: hex "${m[1]}" is not in the PS palette. Use a token (RED, RED_DARK, PINK, BLACK, WHITE, GRAY_MID, GRAY_LIGHT, CHART_GRAY).`);
    }
  }
}

// ─── 1b. Font lint — fontFace must reference a token, not a string ──────────
{
  const tokens = new Set(["FONT_TITLE", "FONT_BODY", "FONT_MONO", "FONT_MONO_LIGHT"]);
  const re = /fontFace\s*:\s*([A-Za-z_][A-Za-z0-9_]*|"[^"]+"|'[^']+')/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const val = m[1];
    if (val.startsWith('"') || val.startsWith("'")) {
      const lineNo = src.slice(0, m.index).split("\n").length;
      errors.push(`font: line ${lineNo}: fontFace literal ${val}. Use a token (FONT_TITLE | FONT_BODY | FONT_MONO | FONT_MONO_LIGHT).`);
    } else if (!tokens.has(val)) {
      const lineNo = src.slice(0, m.index).split("\n").length;
      warnings.push(`font: line ${lineNo}: fontFace identifier "${val}" — verify this resolves to one of the four PS fonts.`);
    }
  }
}

// ─── 1c. Logo / subhead-tag collision per slide block ───────────────────────
{
  const slideRe = /pres\.addSlide\s*\(/g;
  const slideStarts = [];
  let m;
  while ((m = slideRe.exec(src)) !== null) slideStarts.push(m.index);
  slideStarts.push(src.length);
  for (let i = 0; i < slideStarts.length - 1; i++) {
    const block = src.slice(slideStarts[i], slideStarts[i + 1]);
    const hasLogo = /\baddLogo\s*\(/.test(block);
    const hasTag  = /\baddSubheadTag\s*\(/.test(block);
    if (hasLogo && hasTag) {
      const lineNo = src.slice(0, slideStarts[i]).split("\n").length;
      errors.push(`collision: slide block starting at line ${lineNo}: both addLogo and addSubheadTag — they overlap and must not coexist.`);
    }
  }
}

// ─── 1d. Footer presence vs slide count (heuristic) ─────────────────────────
{
  const slideCount = (src.match(/pres\.addSlide\s*\(/g) || []).length;
  const footerCount = (src.match(/\baddFooter\s*\(/g) || []).length;
  const gap = slideCount - footerCount;
  if (gap > 4) {
    warnings.push(`footer: ${slideCount} slides but only ${footerCount} addFooter calls (gap ${gap}). Covers, "Thank you", and end-cards may legitimately omit footers (typically 2–4 slides). A larger gap means missing footers on content slides.`);
  }
}

// ─── 1e. Forbidden patterns ─────────────────────────────────────────────────
{
  const checks = [
    { re: /linear-gradient|fillType\s*:\s*['"]gradient['"]/i, msg: "gradient (forbidden — solid PS colors only)" },
    { re: /["'][▶●✓►•][\s"']/, msg: "custom bullet marker (forbidden — use bare numbered/lettered list styles)" },
    { re: /shadow\s*:\s*\{[^}]*type/i, msg: "drop shadow (forbidden)" },
  ];
  src.split("\n").forEach((line, i) => {
    checks.forEach(c => {
      if (c.re.test(line)) errors.push(`forbidden: line ${i + 1}: ${c.msg} — \`${line.trim().slice(0, 80)}\``);
    });
  });
}

// ─── 2. Render to PDF + JPGs ────────────────────────────────────────────────
const PDF = path.join(REPORT_DIR, "deck.pdf");
const SOFFICE_PY = path.join(process.env.HOME, ".claude/skills/pptx/scripts/office/soffice.py");
function tryRender() {
  try {
    if (fs.existsSync(SOFFICE_PY)) {
      execSync(`python3 "${SOFFICE_PY}" --headless --convert-to pdf --outdir "${REPORT_DIR}" "${PPTX}"`, { stdio: "pipe" });
    } else {
      execSync(`soffice --headless --convert-to pdf --outdir "${REPORT_DIR}" "${PPTX}"`, { stdio: "pipe" });
    }
    // soffice names the PDF after the input basename
    const expected = path.join(REPORT_DIR, path.basename(PPTX, ".pptx") + ".pdf");
    if (fs.existsSync(expected) && expected !== PDF) fs.renameSync(expected, PDF);
    execSync(`pdftoppm -jpeg -r 150 "${PDF}" "${path.join(REPORT_DIR, "slide")}"`, { stdio: "pipe" });
    return true;
  } catch (e) {
    warnings.push(`render: failed to convert pptx → jpgs (${e.message.split("\n")[0]}). Install LibreOffice + poppler, or run the conversion manually.`);
    return false;
  }
}
const rendered = tryRender();
const slideJpgs = rendered
  ? fs.readdirSync(REPORT_DIR).filter(f => /^slide-\d+\.jpg$/.test(f)).sort()
  : [];

// ─── 3. Auto-extract per-slide expectations from addH1 calls ────────────────
function extractExpectations(src) {
  const out = [];
  const slideRe = /pres\.addSlide\s*\(/g;
  const starts = [];
  let m;
  while ((m = slideRe.exec(src)) !== null) starts.push(m.index);
  starts.push(src.length);
  for (let i = 0; i < starts.length - 1; i++) {
    // Include up to ~6 lines before the addSlide call so we catch the
    // "// Slide N — description" comment that conventionally precedes it.
    const lookback = src.slice(0, starts[i]).split("\n").slice(-7).join("\n");
    const block = lookback + src.slice(starts[i], starts[i + 1]);
    const h1 = block.match(/addH1\s*\([^,]+,\s*(["'`])((?:\\.|(?!\1).)*?)\1/);
    const titleText = block.match(/s\.addText\s*\(\s*(["'`])((?:\\.|(?!\1).)*?)\1/);
    const comment = block.match(/\/\/\s*Slide\s*\d+\s*[—–-]\s*([^\n]+)/);
    let expected = comment ? comment[1].trim() : null;
    if (!expected && h1) expected = `H1: "${h1[2].replace(/\\n/g, " / ").slice(0, 80)}"`;
    else if (!expected && titleText) expected = `Text: "${titleText[2].replace(/\\n/g, " / ").slice(0, 80)}"`;
    out.push(expected || "(no extractable title — inspect carefully)");
  }
  return out;
}
const expectations = extractExpectations(src);

// ─── 4. Emit subagent prompt ────────────────────────────────────────────────
const promptPath = path.join(REPORT_DIR, "SUBAGENT_PROMPT.md");
const slideList = slideJpgs.length
  ? slideJpgs.map((f, i) => `${i + 1}. ${path.join(REPORT_DIR, f)} (Expected: ${expectations[i] || "(unknown)"})`).join("\n")
  : "(JPG render failed — see warnings; run conversion manually then re-list here.)";

const prompt = `# Visual QA — fresh-eyes pass

Visually inspect these slides. **Assume there are issues — find them.** Your first render is almost never correct; if you find zero issues, you weren't looking hard enough.

## Look for

**Layout / general:**
- Overlapping elements (text through shapes, lines through words, stacked elements)
- Text overflow or content cut off at box/slide edges
- Decorative lines/shapes positioned for single-line text but title wrapped to two
- Footers/page numbers colliding with content above
- Insufficient margins (< 0.5") or uneven gaps between blocks
- Low-contrast text (light gray on cream, dark on dark, white on light)
- Text boxes too narrow causing excessive wrapping
- Leftover placeholder content (Lorem, XXXX, TBD, "this layout")

**PS-brand hard failures (flag explicitly):**
- Any color outside the PS palette: RED #E90130, RED_DARK #AE0021, PINK #FA8C9A, BLACK, WHITE, GRAY_MID #6B6B6B, GRAY_LIGHT #D9D9D9, CHART_GRAY #BBBBBB (chart middle series only)
- Any font other than Lexend Deca SemiBold, Roboto, Roboto Mono Medium, or Roboto Mono Light
- Non-cover/non-end-card slide missing the standard footer (© Publicis Sapient + date + page number)
- Accent lines under titles (forbidden in PS template)
- Custom bullet markers (▶ ● ✓) — PS uses bare numbered/lettered styles
- Logo and subhead tag both present on the same slide (they overlap)

## Slides to review

${slideList}

## Output format

For each slide list ALL issues, including minor ones. Group by slide:

\`\`\`
Slide N — [headline]:
  - [issue 1]
  - [issue 2]
\`\`\`

End with a count of hard failures vs minor issues. **Do not declare success on the first pass.**
`;

fs.writeFileSync(promptPath, prompt);

// ─── Report ─────────────────────────────────────────────────────────────────
console.log(`\nps-pptx QA report → ${REPORT_DIR}`);
console.log(`  source : ${SRC}`);
console.log(`  pptx   : ${PPTX}`);
console.log(`  slides : ${slideJpgs.length} jpg(s) rendered`);
console.log(`  prompt : ${promptPath}\n`);

if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.forEach(w => console.log("  ⚠ " + w));
  console.log();
}
if (errors.length) {
  console.log(`Static lint FAILED — ${errors.length} error(s):`);
  errors.forEach(e => console.log("  ✗ " + e));
  console.log("\nFix these, re-run `node " + path.basename(SRC) + "`, then re-run qa.js.");
  process.exit(1);
}
console.log("✓ Static lint passed.");
console.log("Next: dispatch a fresh-eyes subagent with the prompt at " + promptPath);
console.log("      (see ps-pptx SKILL.md → 'Visual QA' for the dispatch pattern).");
