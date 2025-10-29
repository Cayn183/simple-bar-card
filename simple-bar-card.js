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
    const fillColor = this._getColorForValue(rawValue) || this._config.bar_fill_color || '#3b82f6';
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

  _renderCard(displayName, percent, formattedValueWithUnit, fillColor) {
    const containerStyles = `
      --card-background-color: ${this._config.card_background_color || '#fff'};
      --card-border-color: ${this._config.card_border_color || '#ccc'};
      --card-border-radius: ${this._config.card_border_radius || '12px'};
      --bar-background-color: ${this._config.bar_background_color || '#ddd'};
      --bar-fill-color: ${fillColor};
      `.replace(/\s+/g, ' ').trim();
      
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
        .icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          box-sizing: border-box;
          background-color: var(--icon-bg-color, #3b82f6); /* CSS-Variable für Hintergrund */
        }
        .bar-icon {
          width: 20px !important;
          height: 20px !important;
          display: inline-block !important;
          vertical-align: middle !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          transform: translate(-5px, -5px); /* Feinjustierung */
          color: var(--icon-color, #fff);
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
          <div class="icon-circle" style="background-color: ${this._config.icon_bg_color || '#3b82f6'};">
            <ha-icon 
              class="bar-icon" 
              icon="${this._config.icon || 'mdi:chart-bar'}" 
              style="color: ${this._config.icon_color || 'var(--paper-item-icon-color, #fff)'}">
            </ha-icon>
          </div>
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