# Simple Bar Card

English and German documentation are provided below. This README has been updated to reflect new features added to the card (improved theming, dark-mode background support and config aliasing).

---

## Overview (EN)

The Simple Bar Card is a single-file Home Assistant Lovelace custom card that renders a performant horizontal bar for numeric entities. It prefers Home Assistant theme variables by default and only applies custom CSS variables when explicitly supplied in the card configuration.

Key features:
- Single-file component: just add `simple-bar-card.js` as a Lovelace resource.
- Theme-friendly: prefers HA theme CSS vars; custom colors are applied only when provided in config.
- Editability: most visual options support an explicit dark-mode variant (for example `--card-background-dark`) and corresponding config aliases (see below). This lets you fully customize both light and dark appearances without separate variants.
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
 - icon: string — set to an icon name (e.g. `mdi:chart-bar`) to show an icon.
 - icon_show: boolean — set to `false` to hide the icon area and let the bar shift left (default: true).

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

UI visibility
- `icon` (string) — icon name to display (e.g. `mdi:chart-bar`)
- `icon_show` (boolean) — show the icon column when true (default) or hide it when false

Note: CSS variables are applied to both the host and to the internal `.container` element to improve reliability across host-scoped and media-query scoped styles.

### Editability & dark variants (EN)

Most visual configuration options support a matching dark variant. Supply e.g. `card_background_dark`, `bar_fill_color_dark`, `icon_bg_color_dark`, `label_color_dark`, etc., to control the dark-mode appearance specifically. The card also accepts several alias names for backward compatibility (see the Visual / theme-related section above).

Example (EN):

```yaml
type: 'custom:simple-bar-card'
entity: sensor.my_sensor
card_background_color: 'rgba(255,255,255,0.9)'
card_background_dark: 'rgba(40,40,40,1)'
bar_fill_color: 'dodgerblue'
bar_fill_color_dark: '#1e90ff'
```

### Canonical keys & aliases

The card accepts a set of canonical snake_case config keys. For backwards compatibility we also accept common aliases (camelCase, short forms). Below are the canonical keys we recommend and the aliases that are accepted and normalized by `setConfig()`.

Light variants (canonical -> aliases accepted):

```
card_background_color          <- card_background_color | card_background
card_border_color              <- card_border_color | card_border
card_border_radius_px         <- card_border_radius | card_border_radius_px

bar_background_color          <- bar_background_color | bar_background
bar_fill_color                <- bar_fill_color | bar_fill_color_hex | barFillColor

icon_bg_color                 <- icon_bg_color | icon_bg
icon_color                    <- icon_color | iconColor

label_color                   <- label_color | labelColor
value_color                   <- value_color | valueColor
value_bold                    <- value_bold
```

Dark variants (canonical -> aliases accepted):

```
card_background_color_dark     <- card_background_color_dark | card_background_dark | cardBackgroundDark
card_border_color_dark         <- card_border_color_dark | card_border_dark | cardBorderColorDark
bar_background_color_dark      <- bar_background_color_dark | bar_background_dark | barBackgroundColorDark
bar_fill_color_dark            <- bar_fill_color_dark | bar_fill_dark | barFillColorDark
icon_bg_color_dark             <- icon_bg_color_dark | icon_bg_dark | iconBgColorDark
icon_color_dark                <- icon_color_dark | iconColorDark
label_color_dark               <- label_color_dark | labelColorDark
value_color_dark               <- value_color_dark | valueColorDark
```

Recommended: use the canonical snake_case names in your configs; aliases will continue to work but may be removed in future major versions.

### Quick browser test (EN)

Open the browser console on a Home Assistant page where `ha-icon` is available and run:

```js
const el = document.createElement('simple-bar-card');
document.body.appendChild(el);
el.setConfig({ entity: 'sensor.test', min:0, max:100, card_background_color: 'rgba(255,200,200,1)', card_background_dark: 'rgba(40,40,40,1)', bar_fill_color: 'dodgerblue' });
el.hass = { states: { 'sensor.test': { state: '42', attributes: { unit_of_measurement: '%', friendly_name: 'Test' } } } };
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
- Erweiterte Editierbarkeit: Viele visuelle Optionen unterstützen eine explizite Dark-Mode-Variante (z. B. `--card-background-dark`) und entsprechende Konfigurations-Aliase, damit Sie Erscheinungsbild für Hell/Dunkel getrennt steuern können.
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

 - vX.Y.Z: removed `bubble_style`; added `card_background_dark` and per-property dark-mode variants, alias-friendly config handling, and more robust application of CSS variables (host + container).

Für Details siehe `simple-bar-card.js`.
