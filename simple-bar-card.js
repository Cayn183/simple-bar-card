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

    // Werte normalisieren und formatieren
    const percent = this._calculatePercent(rawValue);
    const displayName = this._calculateDisplayName(stateObj);
    const formattedValueWithUnit = this._formatValue(rawValue, stateObj);

    // Styles + Template einfügen
    this._renderCard(displayName, percent, formattedValueWithUnit);
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

  _formatValue(value, stateObj) {
    const decimals = ('decimals' in this._config) ? Number(this._config.decimals) : 0;
    const unit = this._config.unit || stateObj.attributes.unit_of_measurement || '';
    const formattedValue = value.toFixed(decimals);
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  }

  _renderCard(displayName, percent, formattedValueWithUnit) {
    const style = `
      <style>
        .container {
          font-family: sans-serif;
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
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
          background-color: #ddd;
          border-radius: 12px;
          overflow: hidden;
          margin-right: 12px;
        }
        .bar-fill {
          height: 100%;
          width: ${percent}%;
          background-color: var(--bar-fill-color, #3b82f6);
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
      <div class="container">
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