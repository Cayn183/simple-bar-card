# Simple Bar Card

![Card areas](./assets/card-areas.svg)

Simple, theme-aware Lovelace bar card (single-file). It visualizes numeric entity states as performant bars. This release (v0.2.0-beta) adds stacked multi-entity rows, an optional heading, and improved theme/dark-mode compatibility.

---

## Quick pointers

- Single JS file: `simple-bar-card.js` — drop into Lovelace resources or install via HACS.
- Examples: see the `examples/` folder for ready-to-use YAML snippets.
- Short developer notes: `docs/usage.md` and `docs/TODO.md`.

## Features

- Render 1–5 entities as horizontal rows (icon, label, performant bar, value).
- Multi-entity support (recommended via `entities` array).
- Optional heading (`heading_show`, `heading`).
- Global visibility toggles: `icon_show`, `value_show` (apply to all rows).
- Per-entity overrides: prefer `entities` array; suffixed keys (`entity_2`, `min_2`) are still supported but limited.
- Theme and dark-mode friendliness: prefers HA theme variables while allowing explicit overrides via a small set of CSS config keys.
- Robust icon coloring: attempts to set inner SVG fills when theme colors don't automatically apply.

## Installation

1. Copy `simple-bar-card.js` into Lovelace resources or add via HACS.
2. Use the card via YAML or UI editor.

## Minimal config examples

Single entity (minimum):

```yaml
type: 'custom:simple-bar-card'
entity: sensor.energy_today
min: 0
max: 100
```

Multiple entities — recommended (use `entities` array):

```yaml
type: 'custom:simple-bar-card'
entities:
  - entity: sensor.temp_living
    name: Living Room
  - entity: sensor.temp_bedroom
    name: Bedroom
heading_show: true
heading: Temperatures
icon_show: true
value_show: true
```

Bipolar mode with thresholds example:

```yaml
type: 'custom:simple-bar-card'
entity: sensor.temperature_offset
min: -10
max: 10
bipolar: true
bipolar_mode: symmetric
color_thresholds:
  - value: -5
    color: '#ef4444' # red
  - value: 0
    color: '#f59e0b' # amber
  - value: 10
    color: '#10b981' # green
```

Legacy: suffixed keys (supported but prefer `entities`):

```yaml
type: 'custom:simple-bar-card'
entity: sensor.temp_living
entity_2: sensor.temp_bedroom
name_2: Bedroom
icon_2: mdi:bed
```

Note: `icon_show` and `value_show` are global toggles and should not be set per-entity with suffixed keys.

## Accepted CSS override keys (explicit)

To avoid ambiguous aliases, the card accepts a small, explicit set of config keys that map to CSS custom properties. Provide these snake_case keys in your YAML to override theme values:

- `card_background_color` -> `--card-background-color`
- `card_border_color` -> `--card-border-color`
- `card_border_radius` -> `--card-border-radius`
- `bar_background_color` -> `--bar-background-color`
- `icon_bg_color` -> `--icon-bg-color`
- `label_color` -> `--label-color`
- `value_color` -> `--value-color`
- `bar_fill_color` -> `--bar-fill-color`
- `icon_color` -> `--icon-color`

Dark counterparts (optional): append `_dark` to the key, e.g. `bar_fill_color_dark`.

Example overriding a color:

```yaml
type: 'custom:simple-bar-card'
entity: sensor.foo
bar_fill_color: '#4f46e5'
bar_fill_color_dark: '#7c3aed'
```

## Validation & user feedback

The card now performs defensive validation in `setConfig()`:

- Fatal problems (missing config, invalid schema) show a clear in-card error box.
- Non-fatal issues (e.g. `min === max`, `min > max`) are shown as non-blocking warnings inside the card. The card attempts safe fallbacks where possible (for example, swapping `min`/`max` if they were reversed) so the UI remains visible.
- Max entities: 5 — exceeding this shows an in-card error.

If you see a warning or error, fix the YAML and edit/save the Lovelace card — messages update on the next config application.

## Troubleshooting

- Icons not matching theme: the card tries to set inner SVG fills when HA components don't inherit `currentColor`. This is best-effort and works for common HA icon implementations.
- If a value appears invalid, check that the entity's state is numeric. Non-numeric states display an in-card error explaining the invalid value.

## Developer quick-test (browser console)

Create and attach the card in a browser with `ha-icon` available:

```js
const el = document.createElement('simple-bar-card');
document.body.appendChild(el);
el.setConfig({ entity: 'sensor.test', min: 0, max: 100 });
el.hass = { states: { 'sensor.test': { state: '42', attributes: { unit_of_measurement: '%', friendly_name: 'Test' } } } };
```

---

## German (Kurzfassung)

Simple Bar Card ist eine einzelne JavaScript‑Datei für Home Assistant Lovelace, die numerische Werte als performante Balken darstellt. Diese Version (v0.2.0‑beta) bringt gestapelte Zeilen (bis 5), eine optionale Überschrift und bessere Theme/Dark‑Mode‑Unterstützung.

- Installation: `simple-bar-card.js` als Lovelace Resource hinzufügen oder HACS verwenden.
- Konfiguration: siehe Beispiele oben; bevorzugt wird das `entities` Array.
- Sichtbare Validierungsfehler und Warnungen werden direkt in der Karte angezeigt.

Weitere technische Hinweise und Beispiele: `docs/usage.md` und `examples/`.

---

If you'd like, I can also:

- Add a short config table to `README.md` listing every supported key and type.
- Run a quick lint on the YAML examples to ensure perfect formatting.

Which of those would you like next? 
