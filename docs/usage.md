# Usage notes & technical details

This short document complements the README with implementation-focused notes.

## Inheritance model
- Top-level config values (e.g. `min`, `max`, `icon`, `icon_color`, `bar_fill_color`) are applied to every row by default.
- Per-entity overrides are supported in two forms:
  - `entities` array: object entries may contain `min`, `max`, `icon`, `icon_color`, etc.
  - Suffixed keys: `entity_2`, `min_2`, `icon_3`, ... — these will override the base config for that specific row.
- Visibility flags are global: `icon_show` and `value_show` are read from the top-level config only. Suffixes like `icon_show_2` are ignored intentionally.

## Percent calculation and bipolar mode
- Standard mode percent calculation: percent = (value - min) / (max - min) clamped to 0..100.
- Bipolar mode: supports `per_side` (each side has its own limit) and `symmetric` (uses max abs value to normalize). Use `bipolar: true` and `bipolar_mode` to choose behavior.

## Color selection
- Per-entity `color_thresholds` (array of `{ value, color }`) take precedence when provided for that entity.
- Otherwise the card uses `bar_fill_color` (or theme default) as fallback.

## Icon coloring
- The card sets `color` on the `ha-icon` element and attempts to set `fill` on inner SVG path elements inside the icon's shadow roots when necessary. This is a best-effort approach to ensure icons follow theme colors or explicit `icon_color` config.

## File locations
- Main implementation: `simple-bar-card.js`
- Documentation: `README.md` (user-facing) and `docs/usage.md` (implementation notes)
- Examples: `examples/` (copy-paste YAML snippets)
- TODO / planning: `docs/TODO.md`

## Quick testing tip
- Use the `examples/*.yaml` snippets in your Lovelace raw config editor or a temporary Lovelace card to visually verify layout and theme behavior.

---

Kurze deutsche Hinweise

- Vererbungsmodell: Top-Level-Konfiguration gilt für alle Zeilen, außer wenn eine Zeile explizit override-Keys erhält (entweder im `entities[]`-Objekt oder via Suffix wie `min_2`).
- Sichtbarkeit: `icon_show` und `value_show` sind global und gelten für alle Zeilen.
- Farb‑/Bipolar‑Regeln wie oben beschrieben.
