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
      mode: 'normal',
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

  // Werte + Mode
    const mode = this._config.mode || 'normal';

    if (mode === 'center') {
      // Prüfen auf symmetrisch, sonst Warnung (min <0, max>0)
      if (min >= 0 || max <= 0) {
        this._renderError('Für center-Mode müssen min < 0 und max > 0 sein.');
        return;
      }
      this._renderCenterBar(rawValue, min, max, displayName, formattedValueWithUnit);
    } else {
      this._renderNormalBar(percent, displayName, formattedValueWithUnit);
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

_renderNormalBar(displayName, percent, formattedValueWithUnit) {
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
        position: relative;
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


  _renderCenterBar(value, min, max, displayName, formattedValueWithUnit) {
/*
  value: z.B. -20 bis +30
  min < 0, max > 0
  Mitte ist 0 --> 50% Breite, Balkenfüllung wird links (negativ) oder rechts (positiv) gezeichnet
*/

const zeroPosPercent = (0 - min) / (max - min) * 100; // z.B. wenn min=-50, max=50 --> 50%
let leftWidth = 0;
let rightWidth = 0;

if (value < 0) {
  const negRange = 0 - min; // z.B. 50 if min=-50
  leftWidth = (Math.min(Math.abs(value), negRange) / negRange) * zeroPosPercent;
} else {
  const posRange = max - 0; // max wenn >0
  rightWidth = (Math.min(value, posRange) / posRange) * (100 - zeroPosPercent);
}

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
      position: relative;
      display: flex;
    }
    .bar-zero {
      position: absolute;
      left: ${zeroPosPercent}%;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #666;
      transform: translateX(-1px);
    }
    .bar-fill-negative {
      height: 100%;
      width: ${leftWidth}%;
      background-color: var(--bar-fill-negative-color, #ef4444);
      border-radius: 12px 0 0 12px;
      transition: width 0.3s ease;
    }
    .bar-fill-positive {
      height: 100%;
      width: ${rightWidth}%;
      background-color: var(--bar-fill-positive-color, #10b981);
      border-radius: 0 12px 12px 0;
      transition: width 0.3s ease;
      margin-left: auto;
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
        <div class="bar-fill-negative" style="flex-shrink: 0;"></div>
        <div class="bar-zero"></div>
        <div class="bar-fill-positive"></div>
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