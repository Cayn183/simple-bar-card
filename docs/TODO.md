# TODO (Project planning)

This file contains a compact, prioritized TODO list intended for the main contributor(s).
Use it as the single source of truth for near-term work. Each item shows: priority (P0..P3), status, owner placeholder and related files.

## How to use
- Edit this file directly for quick updates.
- Use checkboxes for status. Keep descriptions short and link to related files (e.g. `simple-bar-card.js`, `README.md`).

---

## NEXT / Priority P0
- [ ] (P0) Finalize README examples and wording — Status: In progress — Owner: @you — Files: `README.md`, `examples/`  
  Short: polish examples, ensure bilingual parity and copyable YAML.

- [ ] (P0) Add examples to Lovelace and smoke-test visuals — Status: not started — Owner: @you — Files: `examples/*`  
  Short: paste `examples/*` into Lovelace to verify layout, icons, and theme behavior.

- [ ] (P0) Add `docs/usage.md` technical notes — Status: in progress — Owner: @assistant — Files: `docs/usage.md`  
  Short: document inheritance rules, global toggles, and where to find examples.

## IN PROGRESS
- [ ] (P1) Decide repo restructuring & maintenance workflow — Status: in progress — Owner: @you/@assistant  
  Short: lightweight `docs/`, `examples/` created; decide if `.github/` templates or GitHub Issues/Project will be used.

## BACKLOG / Priority P2
- [ ] (P2) Create GitHub Issues and Project Board for collaboration — Status: not started — Owner: @you  
  Short: export high-priority items into Issues and track via Project when collaboration increases.

- [ ] (P2) Add contribution guide & issue templates (`.github/CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE`) — Status: not started — Owner: @you  

## DONE (historical)
- [x] (P0) Multi-entity skeleton (up to 5 rows) — Files: `simple-bar-card.js`
- [x] (P0) Config parsing for up to 5 entities and suffix overrides — Files: `simple-bar-card.js`
- [x] (P0) Per-row render & rAF update batching — Files: `simple-bar-card.js`
- [x] (P0) Icon color SVG fallback handling — Files: `simple-bar-card.js`
- [x] (P0) Make `icon_show` and `value_show` global — Files: `simple-bar-card.js`
- [x] (P1) README bilingual update (initial) — Files: `README.md`

---

Notes:
- This TODO is intentionally compact to keep focus. For heavier project management, consider moving actionable items into GitHub Issues and linking back to their numbers here.
- Owner placeholders: replace `@you` / `@assistant` with real GitHub handles if you add Issues or collaborators.
