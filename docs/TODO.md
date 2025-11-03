# TODO — vereinfachte Übersicht

Diese Datei ist die einfache, visuelle TODO‑Liste für dieses Repository. Ziel ist eine schnelle, klare Übersicht für die nächsten Schritte. Ich habe die Einträge bewusst auf drei Bereiche reduziert: "In Progress", "Coming Soon" und "Done".

Kurzanleitung
- Editiere diese Datei direkt, um den Status zu ändern (Checkboxes).  
- Benutze kurze Titel und verlinke bei Bedarf auf Dateien (`simple-bar-card.js`, `README.md`, `examples/`).

---

## In Progress ▶️
- [x] Finalize README examples and wording — Owner: @you — Files: `README.md`, `examples/`  
  (Bilingual examples polieren, copy‑paste‑ready YAML)  (Release: v0.0.1)
- [ ] Decide repo restructuring & maintenance workflow — Owner: @you/@assistant — Files: `docs/`, `examples/`  
  (leichte Reorg: docs + examples, Entscheidung GitHub Issues/Project)  (Release: v0.0.1)

---

## Release plan

- v0.0.1 (Patch): Stabilität & Qualität
  - Unit tests for percent & bipolar math
  - Improve config validation & runtime errors
  - Finalize README examples and wording + Smoke‑test examples in Lovelace

- v0.1.0 (Minor): UX & Tooling
  - Implement bar animation option (configurable)
  - Simple local test script / smoke tests
  - Performance micro‑optimizations & rAF review
  - Decide Card Editor approach (plan / schema)


## Coming Soon 🔜
- [ ] Unit tests for percent & bipolar math — Owner: @assistant — Files: `tests/` or `tools/`  
  (kleiner Test‑Harness für Prozent/Bipolar/Thresholds)
- [x] Improve config validation & runtime errors — Owner: @assistant — Files: `simple-bar-card.js`  
  (freundliche In‑Card Fehlermeldungen statt Exceptions)
- [ ] Implement bar animation option (configurable) — Owner: @assistant — Files: `simple-bar-card.js`  
  (smooth animations, respects prefers‑reduced‑motion)
- [ ] Decide Card Editor approach — Owner: @you/@assistant — Files: `docs/`  
  (leichtes JSON‑Schema vs. Full Lovelace editor)
- [ ] Smoke-test examples in Lovelace — Owner: @you — Files: `examples/*`  
  (schnell testen, copy/paste in UI)
- [ ] Performance micro‑optimizations & rAF review — Owner: @assistant — Files: `simple-bar-card.js`  
  (DOM writes, batching, low‑end devices)
- [ ] Simple local test script / smoke tests — Owner: @assistant — Files: `tools/`  
  (Node script to emulate `hass` for quick checks)
- [ ] Add examples screenshots and compatibility sweep — Owner: @you — Files: `examples/`, `docs/`  
  (screenshots for README/docs)
- [ ] Create GitHub Issues & Project Board (optional) — Owner: @you — Files: `.github/`  
  (falls du Collaboration tracking möchtest)
- [ ] Add contribution guide & issue templates — Owner: @you — Files: `.github/`  
  (CONTRIBUTING.md, ISSUE_TEMPLATE)

## Done ✅
- [x] Multi‑entity skeleton (up to 5 rows) — Files: `simple-bar-card.js`
- [x] Config parsing for up to 5 entities and suffix overrides — Files: `simple-bar-card.js`
- [x] Per‑row render & rAF update batching — Files: `simple-bar-card.js`
- [x] Icon color SVG fallback handling — Files: `simple-bar-card.js`
- [x] Make `icon_show` and `value_show` global — Files: `simple-bar-card.js`
- [x] Docs: `docs/TODO.md` and `docs/usage.md` created — Files: `docs/`
- [x] README bilingual initial update — Files: `README.md`

---

Wenn Dir das Layout so passt, übernehme ich die Einträge in die interne TODO‑Liste (ich habe das bereits vorbereitet) und wir starten mit den P0‑Items. Willst Du, dass ich die P0‑Items sofort anfange (Unit‑Tests + Config‑Validation), oder möchtest Du zuerst noch Änderungen am Layout?

---

Notes:
- This TODO is intentionally compact to keep focus. For heavier project management, consider moving actionable items into GitHub Issues and linking back to their numbers here.
- Owner placeholders: replace `@you` / `@assistant` with real GitHub handles if you add Issues or collaborators.

---

