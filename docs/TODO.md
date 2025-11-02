# TODO (Project planning)

This file contains a compact, prioritized TODO list intended for the main contributor(s).
Use it as the single source of truth for near-term work. Each item shows: priority (P0..P3), status, owner placeholder and related files.

## How to use
- Edit this file directly for quick updates.
- Use checkboxes for status. Keep descriptions short and link to related files (e.g. `simple-bar-card.js`, `README.md`).

---

## NEXT / Priority P0
- [ ] (P0) Unit tests for percent & bipolar math — Status: not started — Owner: @assistant — Files: `tests/` or `tools/`  
  Short: add a small test harness for percent calculations, bipolar modes and color threshold resolution (cover edge cases).

- [ ] (P0) Improve config validation & runtime errors — Status: not started — Owner: @assistant — Files: `simple-bar-card.js`  
  Short: provide friendly in-card error messages for invalid configs instead of runtime exceptions.

- [ ] (P0) Finalize README examples and wording — Status: in progress — Owner: @you — Files: `README.md`, `examples/`  
  Short: polish examples, ensure bilingual parity and copyable YAML.

- [ ] (P0) Smoke-test examples in Lovelace — Status: not started — Owner: @you — Files: `examples/*`  
  Short: paste `examples/*` into Lovelace to verify layout, icons, and theme behavior.

## IN PROGRESS
- [ ] (P1) Decide repo restructuring & maintenance workflow — Status: in progress — Owner: @you/@assistant  
  Short: lightweight `docs/`, `examples/` created; decide if `.github/` templates or GitHub Issues/Project will be used.

- [ ] (P1) Implement bar animation option (configurable) — Status: not started — Owner: @assistant — Files: `simple-bar-card.js`  
  Short: add config for animations, respect prefers-reduced-motion, test performance.

- [ ] (P1) Decide Card Editor approach (schema vs full editor) — Status: not started — Owner: @you/@assistant  
  Short: pick lightweight JSON schema or full Lovelace editor implementation and plan next steps.

## BACKLOG / Priority P2
- [ ] (P2) Add examples screenshots and compatibility sweep — Status: not started — Owner: @you  
  Short: capture screenshots across themes and document browser/HA compatibility.

- [ ] (P2) Simple local test script / smoke tests — Status: not started — Owner: @assistant  
  Short: provide node script to emulate `hass` and run quick smoke checks.

- [ ] (P2) Performance micro‑optimizations & rAF review — Status: not started — Owner: @assistant  
  Short: ensure rAF batching and minimal DOM writes; measure on low-end devices.

- [ ] (P2) Create GitHub Issues and Project Board for collaboration — Status: not started — Owner: @you  
  Short: export high-priority items into Issues and track via Project when collaboration increases.

- [ ] (P2) Add contribution guide & issue templates (`.github/CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE`) — Status: not started — Owner: @you  
  Short: basic templates to guide contributors.

## DONE (historical)
- [x] (P0) Multi-entity skeleton (up to 5 rows) — Files: `simple-bar-card.js`
- [x] (P0) Config parsing for up to 5 entities and suffix overrides — Files: `simple-bar-card.js`
- [x] (P0) Per-row render & rAF update batching — Files: `simple-bar-card.js`
- [x] (P0) Icon color SVG fallback handling — Files: `simple-bar-card.js`
- [x] (P0) Make `icon_show` and `value_show` global — Files: `simple-bar-card.js`
- [x] (P1) README bilingual update (initial) — Files: `README.md`

---

Additional notes:
- The listed items are intentionally compact; when you approve the set I can split larger items (Card Editor) into sub‑tasks with estimates and milestones.


---

Notes:
- This TODO is intentionally compact to keep focus. For heavier project management, consider moving actionable items into GitHub Issues and linking back to their numbers here.
- Owner placeholders: replace `@you` / `@assistant` with real GitHub handles if you add Issues or collaborators.
