class SimpleBarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /***************************
   * Gemeinsame CSS-Stile
   ***************************/
  _commonStyles() {
    return `
      <style>
        .container {
          font-family: sans-serif;
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
          background-color: var(--card-background-color);
          border: 1px solid var(--card-border-color);
          border-radius: var(--card-border-radius);
          display: flex;
          align-items: center;
        }
        .icon-container {
          width: 50px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .icon-circle {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate(3px, 0px);
          background-color: var(--icon-bg-color, #3b82f6);
        }
        .bar-icon {
          width: 35px !important;
          height: 35px !important;
          display: inline-block !important;
          vertical-align: middle !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          transform: translate(5px, 4px);
          color: var(--icon-color, #fff);
        }
        .main-container {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-left: 12px;
        }
        .label {
          margin-bottom: 6px;
          font-weight: 600;
        }
        .value-container {
          width: 50px;
          font-size: 14px;
          color: #444;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          white-space: nowrap;
          margin-left: 8px;
          height: 24px;
          margin-bottom: -20px;
          box-sizing: border-box;
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
      bipolar: false,
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
    // Vorbedingungen prüfen
    if (!this._config || !this._hass) return;

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

    // Werte & Anzeige vorbereiten
    const displayName = this._calculateDisplayName(stateObj);
    const formattedValueWithUnit = this._formatValue(rawValue, stateObj);
    const fillColor = this._getColorForValue(rawValue) || this._config.bar_fill_color || '#3b82f6';

    // Bipolar oder Standard rendern
    if (this._config.bipolar) {
      const min = Number(this._config.min);
      const max = Number(this._config.max);
      const clampedValue = Math.min(Math.max(rawValue, min), max);
      let negPercent = 0;
      let posPercent = 0;
      if (clampedValue < 0 && min < 0) {
        negPercent = Math.min(Math.abs(clampedValue / min), 1) * 50; // Negativer Anteil bis 50%
      } else if (clampedValue > 0 && max > 0) {
        posPercent = Math.min(clampedValue / max, 1) * 50; // Positiver Anteil bis 50%
      }
      this._renderBipolarCard(displayName, negPercent, posPercent, formattedValueWithUnit, fillColor);
      return;
    }

    const percent = this._calculatePercent(rawValue);
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

  _calculateDisplayName(stateObj) {
    return this._config.name || stateObj.attributes.friendly_name || this._config.entity;
  }

  _getColorForValue(value) {
    const thresholds = this._config.color_thresholds;
    if (!thresholds || !Array.isArray(thresholds) || thresholds.length === 0) {
      // Fallbackfarbe
      return this._config.bar_fill_color || '#3b82f6';
    }
    for (const threshold of thresholds) {
      if (value <= threshold.value) {
        return threshold.color;
      }
    }
    return thresholds[thresholds.length - 1].color;
  }

  _formatValue(value, stateObj) {
    const decimals = ('decimals' in this._config) ? Number(this._config.decimals) : 0;
    const unit = this._config.unit || stateObj.attributes.unit_of_measurement || '';
    const formattedValue = value.toFixed(decimals);
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  }

  /***************************
   * Standard Balken rendern
   ***************************/
  _renderCard(displayName, percent, formattedValueWithUnit, fillColor) {
    const containerStyles = `
      --card-background-color: ${this._config.card_background_color || '#fff'};
      --card-border-color: ${this._config.card_border_color || '#ccc'};
      --card-border-radius: ${this._config.card_border_radius || '12px'};
      --bar-background-color: ${this._config.bar_background_color || '#ddd'};
      --bar-fill-color: ${fillColor};
    `.replace(/\s+/g, ' ').trim();

    const barSpecificStyles = `
      <style>
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
      </style>
    `;

    const htmlContent = `
      <div class="container" style="${containerStyles}">
        <div class="icon-container">
          <div class="icon-circle">
            <ha-icon class="bar-icon" icon="${this._config.icon || 'mdi:chart-bar'}" style="color: ${this._config.icon_color || 'var(--paper-item-icon-color, #fff)'}"></ha-icon>
          </div>
        </div>
        <div class="main-container">
          <div class="label">${displayName}</div>
          <div class="bar-row">
            <div class="bar-background">
              <div class="bar-fill"></div>
            </div>
          </div>
        </div>
        <div class="value-container">${formattedValueWithUnit}</div>
      </div>
    `;

    this.shadowRoot.innerHTML = `
      ${this._commonStyles()}
      ${barSpecificStyles}
      ${htmlContent}
    `;
  }

  /***************************
   * Bipolaren Balken rendern
   ***************************/
  _renderBipolarCard(displayName, negPercent, posPercent, formattedValueWithUnit, fillColor) {
    const containerStyles = `
      --card-background-color: ${this._config.card_background_color || '#fff'};
      --card-border-color: ${this._config.card_border_color || '#ccc'};
      --card-border-radius: ${this._config.card_border_radius || '12px'};
      --bar-background-color: ${this._config.bar_background_color || '#ddd'};
      --bar-fill-color: ${fillColor};
    `.replace(/\s+/g, ' ').trim();

    const barSpecificStyles = `
      <style>
        .bar-container {
          position: relative;
          height: 24px;
          background-color: var(--bar-background-color);
          border-radius: 12px;
          overflow: hidden;
        }
        .zero-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          background-color: var(--card-border-color);
          transform: translateX(-50%);
          z-index: 2;
        }
        .bar-fill-negative {
          position: absolute;
          top: 0;
          bottom: 0;
          right: 50%;
          width: ${negPercent}%;
          background-color: var(--bar-fill-color);
          border-radius: 6px 0 0 6px;
          transition: width 0.3s ease;
          z-index: 1;
        }
        .bar-fill-positive {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: ${posPercent}%;
          background-color: var(--bar-fill-color);
          border-radius: 0 6px 6px 0;
          transition: width 0.3s ease;
          z-index: 1;
        }
      </style>
    `;

    const htmlContent = `
      <div class="container" style="${containerStyles}">
        <div class="icon-container">
          <div class="icon-circle">
            <ha-icon class="bar-icon" icon="${this._config.icon || 'mdi:chart-bar'}" style="color: ${this._config.icon_color || 'var(--paper-item-icon-color, #fff)'}"></ha-icon>
          </div>
        </div>
        <div class="main-container">
          <div class="label">${displayName}</div>
          <div class="bar-container">
            <div class="zero-line"></div>
            <div class="bar-fill-negative" style="width: ${negPercent}%; right: 50%;"></div>
            <div class="bar-fill-positive" style="width: ${posPercent}%; left: 50%;"></div>
          </div>
        </div>
        <div class="value-container">${formattedValueWithUnit}</div>
      </div>
    `;

    this.shadowRoot.innerHTML = `
      ${this._commonStyles()}
      ${barSpecificStyles}
      ${htmlContent}
    `;
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('simple-bar-card', SimpleBarCard);