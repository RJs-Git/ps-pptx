# ps-pptx

A Claude Code skill that generates Publicis Sapient–branded `.pptx` decks with strict adherence to the PS theme — palette, typography, logos, footers, and the canonical layout catalog.

The repo *is* the skill. `SKILL.md` is the only entry point loaded up front; `reference/` holds progressive-disclosure documentation; `theme/` is the runtime module (`require()`'d, never read as docs) and contains its own assets.

## Layout

```
SKILL.md              # entry point (always loaded)
reference/            # progressive-disclosure docs (loaded on demand)
  layouts.md
  helpers.md
  qa.md
theme/                # runtime — require()'d, never read as docs
  index.js            # canonical tokens + helpers
  build_deck.js       # runnable golden reference
  output.pptx         # committed render of build_deck.js
  assets/
    logos/            # ps-logo-{white,color,black}.png
    media/            # placeholder imagery
README.md             # human-facing; not loaded by the skill
```

## Install

Install at the user level by symlinking:

```bash
# from this repo's root:
ln -s "$PWD" ~/.claude/skills/ps-pptx
```

Verify:

```bash
ls ~/.claude/skills/ps-pptx/SKILL.md
```

Updates flow automatically — `git pull` in the repo and the skill is up to date.

## Uninstall

```bash
rm ~/.claude/skills/ps-pptx
```

(Removes the symlink only; the repo is untouched.)

## Dependencies

Same as the parent `pptx` skill, plus `pptxgenjs`:

```bash
npm install -g pptxgenjs
pip install "markitdown[pptx]" Pillow
# soffice (LibreOffice) and pdftoppm (Poppler) are required for visual QA.
```
