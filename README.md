# Simple Bar Card

English and German documentation are provided below. This README has been updated to reflect new features added to the card (bubble-style, improved theming, dark-mode background support and config aliasing).

---

## Overview (EN)

The Simple Bar Card is a single-file Home Assistant Lovelace custom card that renders a performant horizontal bar for numeric entities. It prefers Home Assistant theme variables by default and only applies custom CSS variables when explicitly supplied in the card configuration.

Key features:
- Single-file component: just add `simple-bar-card.js` as a Lovelace resource.
- Theme-friendly: prefers HA theme CSS vars; custom colors are applied only when provided in config.
- `bubble_style`: an opt-in visual variant that duplicates the normal styles under `:host([bubble-style])` so you can tweak them independently.
- Dark-mode: `card_background_dark` lets you supply an explicit dark-mode background.
- Bipolar mode: negative/positive split with two half fills and a zero-line.
- Color thresholds: `color_thresholds` array to pick fill color based on value ranges.

### Basic usage (EN)

```yaml
type: 'custom:simple-bar-card'
entity: sensor.my_sensor
min: 0
max: 100
```

### Important config keys (EN)

- entity (required)
- min, max
- name (override label)
- bipolar (boolean)
- bipolar_mode: 'per_side' | 'symmetric'
- color_thresholds: [{ value, color }, ...]

Visual / theme-related (aliases supported):

- `card_background_color` / `card_background`
- `card_background_dark` / `cardBackgroundDark`
- `card_border_color` / `card_border`
- `card_border_radius` / `card_border_radius_px`
- `bar_background_color` / `bar_background`
- `bar_fill_color` / `bar_fill_color_hex` / `barFillColor`
- `icon_bg_color` / `icon_bg`
- `label_color` / `labelColor`
- `value_color` / `valueColor`
- `value_bold` (boolean)

Note: CSS variables are applied to both the host and to the internal `.container` element to improve reliability across host-scoped and media-query scoped styles.

### bubble_style (EN)

Set `bubble_style: true` to enable the bubble visual variant. The card toggles the host attribute `bubble-style`. The component contains a full copy of the default styles scoped to `:host([bubble-style])` so you can safely modify shape, radii, shadows, or colors specifically for this variant.

Example (EN):

```yaml
type: 'custom:simple-bar-card'
entity: sensor.my_sensor
bubble_style: true
card_background_color: 'rgba(255,255,255,0.9)'
card_background_dark: 'rgba(40,40,40,1)'
bar_fill_color: 'dodgerblue'
```

### Quick browser test (EN)

Open the browser console on a Home Assistant page where `ha-icon` is available and run:

```js
const el = document.createElement('simple-bar-card');
document.body.appendChild(el);
el.setConfig({ entity: 'sensor.test', min:0, max:100, bubble_style: true, card_background_color: 'rgba(255,200,200,1)', card_background_dark: 'rgba(40,40,40,1)', bar_fill_color: 'dodgerblue' });
el.hass = { states: { 'sensor.test': { state: '42', attributes: { unit_of_measurement: '%', friendly_name: 'Test' } } } };
console.log('has bubble-style?', el.hasAttribute('bubble-style'));
console.log('host --card-background-color:', getComputedStyle(el).getPropertyValue('--card-background-color'));
const container = el.shadowRoot.querySelector('.container');
console.log('container computed background:', getComputedStyle(container).backgroundColor);
```

Toggle OS / browser dark mode (or use devtools emulation) and re-check the container computed background color to confirm dark-mode fallback picks up `card_background_dark` if supplied.

---

## Übersicht (DE)

Die Simple Bar Card ist eine einzelne JavaScript-Datei für Home Assistant Lovelace, die einen horizontalen Balken für numerische Entitäten anzeigt. Die Karte verwendet bevorzugt Theme-Variablen von Home Assistant. Eigene Farben werden nur angewendet, wenn sie explizit in der Konfiguration angegeben werden.

### Wichtige Funktionen (DE)

- Single-file Web Component — `simple-bar-card.js` als Lovelace-Resource.
- Theme-freundlich: Falls keine Farben konfiguriert sind, folgen die Stile den HA-Themes.
- `bubble_style` — opt-in Variante mit eigener CSS-Kopie unter `:host([bubble-style])`.
- Dark-Mode: `card_background_dark` ermöglicht ein explizites dunkles Hintergrund-Fallback.
- Bipolar-Modus: Negative/Positive Aufteilung mit zwei halben Füllungen und Null-Linie.
- Farb-Schwellen: `color_thresholds` zur Auswahl der Füllfarbe basierend auf dem Wert.

### Grundkonfiguration (DE)

```yaml
type: 'custom:simple-bar-card'
entity: sensor.mein_sensor
min: 0
max: 100
```

### Konfigurationsoptionen (DE)

Siehe oben (Important config keys) — die meisten Optionen unterstützen mehrere Alias-Namen zur Rückwärtskompatibilität.

### Beispiel für color_thresholds (DE)

```yaml
color_thresholds:
  - value: 40
    color: '#2ECC71'   # grün bis 40
  - value: 70
    color: '#F1C40F'   # gelb bis 70
  - value: 100
    color: '#E74C3C'   # rot ab 71
```

---

## Entwicklerhinweise

- Die vollständige Implementierung befindet sich in `simple-bar-card.js`. Es gibt keinen Build-Schritt — die Datei wird direkt als Resource verwendet.
- Visuelle Updates nutzen `transform: scaleX(...)` und sind per `requestAnimationFrame` gebündelt, um flüssige Animationen bei geringer CPU-Last zu erreichen.
- Wenn DOM-Struktur oder Klassennamen geändert werden, müssen die gecachten Referenzen in `_buildSkeleton()` angepasst werden (z. B. `this._barFillEl`, `this._barFillNegEl`).

## Troubleshooting

- Falls Ihre HA-Theme-Regeln die konfigurierten Hintergründe weiterhin überschreiben (z. B. durch `!important`), können Sie:
  - ein explizites `card_background_dark` angeben, oder
  - optional eine Inline-Fallback-Option aktivieren lassen (die Karte kann bei Bedarf `container.style.backgroundColor` setzen), was jedoch invasiver ist.

## Kurz-Änderungsprotokoll

- vX.Y.Z: `bubble_style`, `card_background_dark`, alias-freundliche Konfigurationsverarbeitung, sowie robustere Anwendung von CSS-Variablen (host + container) hinzugefügt.

Für Details siehe `simple-bar-card.js`.
