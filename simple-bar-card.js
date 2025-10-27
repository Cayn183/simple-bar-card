class SimpleBarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /***************************
   * Konfigurations-Handler
   ***************************/
  setConfig(config) {
    if (!config.entity) {
      throw new Error("Entity muss angegeben werden!");
    }
    this._config = {
      min: 0,
      max: 100,
      ...config
    };
  }

  /***************************
   * Home Assistant Update
   ***************************/
  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  /***************************
   * Haupt-Render-Methode
   ***************************/
  _render() {
    if (!this._config || !this._hass) return;

    const min = Number(this._config.min);
    const max = Number(this._config.max);

    const stateObj = this._hass.states[this._config.entity];
    if (!stateObj) {
      this._renderError(`Entity nicht gefunden: ${this._config.entity}`);
      return;
    }

    const rawValue = Number(stateObj.state);
    if (isNaN(rawValue)) {
      this._renderError(`Ungültiger Wert: ${stateObj.state}`);
      return;
    }

    // Definierte Min- und Max-Farben in der Config oder fallback auf grün/rot
    const minColorHex = this._config.min_color || '#2ECC71';  // grün
    const maxColorHex = this._config.max_color || '#E74C3C';  // rot

    const rgbMin = this._hexToRgb(minColorHex);
    const rgbMax = this._hexToRgb(maxColorHex);

    // t = normierter Wert zwischen 0 und 1 im Bereich min..max
    const t = Math.min(Math.max((rawValue - min) / (max - min), 0), 1);

    // interpolierte Farbe berechnen
    const fillColor = this._interpolateColor(rgbMin, rgbMax, t);

    // Werte normalisieren und formatieren
    const percent = this._calculatePercent(rawValue);
    const displayName = this._calculateDisplayName(stateObj);
    const formattedValueWithUnit = this._formatValue(rawValue, stateObj);

    // Styles + Template einfügen
    this._renderCard(displayName, percent, formattedValueWithUnit, fillColor);

  }

  /***************************
   * Hilfsmethoden
   ***************************/
  _renderError(message) {
    this.shadowRoot.innerHTML = `<div>${message}</div>`;
  }

  _calculatePercent(value) {
    const min = Number(this._config.min);
    const max = Number(this._config.max);
    let percent = ((value - min) / (max - min)) * 100;
    return Math.min(Math.max(percent, 0), 100);
  }

  // Hex-Farbwert in RGB-Array umwandeln
_hexToRgb(hex) {
  const normalizedHex = hex.replace('#', '');
  const bigint = parseInt(normalizedHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

// Interpolation zwischen zwei RGB Farben, t in [0,1]
_interpolateColor(color1, color2, t) {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
  _calculateDisplayName(stateObj) {
    return this._config.name || stateObj.attributes.friendly_name || this._config.entity;
  }

  _formatValue(value, stateObj) {
    const decimals = ('decimals' in this._config) ? Number(this._config.decimals) : 0;
    const unit = this._config.unit || stateObj.attributes.unit_of_measurement || '';
    const formattedValue = value.toFixed(decimals);
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  }

  _renderCard(displayName, percent, formattedValueWithUnit, fillColor) {
    const containerStyles = `
      --card-background-color: ${this._config.card_background_color || '#fff'};
      --card-border-color: ${this._config.card_border_color || '#ccc'};
      --card-border-radius: ${this._config.card_border_radius || '12px'};
      --bar-background-color: ${this._config.bar_background_color || '#ddd'};
      --bar-fill-color: ${fillColor};
    `;
      
    const style = `
      <style>
        .container {
          font-family: sans-serif;
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
          background-color: var(--card-background-color);
          border: 1px solid var(--card-border-color);
          border-radius: var(--card-border-radius);
        }
        .label {
          margin-bottom: 6px;
          font-weight: 600;
        }
        .bar-row {
          display: flex;
          align-items: center;
        }
        .bar-background {
          flex-grow: 1;
          height: 24px;
          background-color: var(--bar-background-color);
          border-radius: 12px;
          overflow: hidden;
          margin-right: 12px;
        }
        .bar-fill {
          height: 100%;
          width: ${percent}%;
          background-color: var(--bar-fill-color);
          border-radius: 12px 0 0 12px;
          transition: width 0.3s ease;
        }
        .value {
          min-width: 50px;
          font-size: 14px;
          color: #444;
          text-align: right;
          white-space: nowrap;
        }
      </style>
    `;

    this.shadowRoot.innerHTML = `
      ${style}
      <div class="container" style="${containerStyles}">
        <div class="label">${displayName}</div>
        <div class="bar-row">
          <div class="bar-background">
            <div class="bar-fill"></div>
          </div>
          <div class="value">${formattedValueWithUnit}</div>
        </div>
      </div>
    `;
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('simple-bar-card', SimpleBarCard);