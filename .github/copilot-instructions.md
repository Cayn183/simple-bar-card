## Purpose
Provide AI coding agents the minimal, actionable knowledge to be productive in this repository (a single-file Home Assistant Lovelace custom card).

## Big picture
- This repo implements a single Web Component Lovelace card in `simple-bar-card.js` (class `SimpleBarCard`, registered as `simple-bar-card`).
- It is intended to be loaded into Home Assistant Lovelace as a resource (HACS metadata is in `hacs.json`).
- Data flow: Home Assistant injects the `hass` object via the `set hass(hass)` setter; the card reads the entity state using `hass.states[<entity>]` and updates the DOM.

## Key files
- `simple-bar-card.js` — the whole implementation: config handling (`setConfig`), `set hass` entry point, render pipeline (`_render`), rAF batching (`_scheduleStateUpdate`), and DOM updates (`_applyState`).
- `README.md` — user-facing configuration examples (color_thresholds, options). Use it for examples to reproduce behavior.
- `hacs.json` — packaging metadata for HACS installs.

## Important conventions & patterns (do not change without good reason)
- Single-file component: prefer editing `simple-bar-card.js`; there is no build step—deliverable is the JS file.
- Performance: visual updates use CSS transforms (scaleX) and are batched with `requestAnimationFrame` in `_scheduleStateUpdate`. Preserve that batching when changing update logic.
- Two rendering modes:
  - Standard: a single `.bar-fill` element scaled by `scaleX(percent)` (see `_calculatePercent`).
  - Bipolar: uses two half-width fills `.bar-fill-negative` and `.bar-fill-positive` plus `.zero-line`. Behavior controlled by `config.bipolar` and `config.bipolar_mode` (`per_side` or `symmetric`).
- Styling via CSS variables set on the container in `setConfig` (e.g., `--bar-fill-color`, `--card-background-color`). Keep that pattern when adding style-related features.
- Color thresholds: `config.color_thresholds` is an ordered array of `{ value, color }`. `_getColorForValue` walks thresholds and returns the first matching color.

## How to run & debug locally
- There is no build tooling. To test in Home Assistant Lovelace:
  - Add `simple-bar-card.js` as a Lovelace resource, then use the YAML config from `README.md`.
- Quick browser console test (in a HA page where `ha-icon` is available):
  ```js
  // create and attach
  const el = document.createElement('simple-bar-card');
  document.body.appendChild(el);
  // set config and a fake hass for quick visual test
  const color = 'dodgerblue'; // use a named color in examples to avoid parser issues
  el.setConfig({ entity: 'sensor.test', min: 0, max: 100, bar_fill_color: color });
  el.hass = { states: { 'sensor.test': { state: '42', attributes: { unit_of_measurement: '%', friendly_name: 'Test' } } } };
  ```
- Use browser DevTools → Elements to inspect the shadow DOM and the `.bar-fill*` transforms and CSS variables when debugging.

## Tests and build
- There are no automated tests or build scripts in the repo. Changes should keep the single-file output usable as-is.

## Common change impact areas
- Changing any DOM shape (class names, elements inside `_buildSkeleton`) requires updating cached references (look for `this._barFillEl`, `this._barFillNegEl`, etc.).
- If you change transform or animation timing, update both CSS transitions and the places where `style.transform` is set in `_applyState`.
- If you alter configuration keys, update `setConfig`, places reading `this._config`, and the README examples.

## Integration points / expectations
- Expects to run inside Home Assistant (global `ha-icon` component present). The card sets `ha-icon`'s `icon` attribute and uses `hass.states` structure.
- HACS consumers rely on `hacs.json` metadata—preserve its format if publishing releases.

## Helpful code pointers (examples inside `simple-bar-card.js`)
- rAF batching: `_scheduleStateUpdate(state)` merges pending state and applies in `requestAnimationFrame` → keep this for smooth updates.
- Percent calculation: `_calculatePercent(value)` clamps to `[min,max]` and returns 0..100.
- Color selection: `_getColorForValue(value)` iterates `config.color_thresholds`.

## If you need to change behavior, follow this checklist
1. Update `README.md` with new config examples.
2. Keep output as a single JS file unless adding a build step (document the build in README if you add tooling).
3. Preserve rAF batching and scaleX approach for animation performance.

---
If anything here is unclear or you want the guidance to include example PR templates, test steps, or CI hooks, tell me which sections to expand and I'll iterate.

## New: bubble_style (opt-in visual variant)

- Key: `bubble_style` (boolean) — example: `{ entity: 'sensor.test', bubble_style: true }`.
- Implementation: toggles a host attribute `bubble-style` so CSS inside `simple-bar-card.js` switches to the bubble visuals (smaller bar height, pill-shaped fills, larger border-radius, subtle shadow).
- Theme-friendly: bubble style only changes layout/shape; colors still come from HA theme variables or explicit config keys.

Quick browser test snippet (manual debug):

```js
const el = document.createElement('simple-bar-card');
document.body.appendChild(el);
el.setConfig({ entity: 'sensor.test', min: 0, max: 100, bubble_style: true });
el.hass = { states: { 'sensor.test': { state: '42', attributes: { unit_of_measurement: '%', friendly_name: 'Test' } } } };
```

If you'd like the README updated as well, I can apply the same short section to `README.md` (I attempted earlier but hit a patching quirk — happy to add it next). 
