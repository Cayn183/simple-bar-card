class SimpleBarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    // Erwartet: entity, min (optional), max (optional)
    if (!config.entity) {
      throw new Error("Entity muss angegeben werden!");
    }
    this._config = {
      min: 0,
      max: 100,
      ...config
    };
  }

  _render() {
    if (!this._config || !this._hass) return;

    const entityId = this._config.entity;
    const stateObj = this._hass.states[entityId];
    const displayName = this._config.name || (stateObj.attributes.friendly_name) || entityId;

    if (!stateObj) {
      this.shadowRoot.innerHTML = `<div>Entity nicht gefunden: ${entityId}</div>`;
      return;
    }

    // Wert als Zahl extrahieren
    const rawValue = Number(stateObj.state);
    if (isNaN(rawValue)) {
      this.shadowRoot.innerHTML = `<div>Ungültiger Wert: ${stateObj.state}</div>`;
      return;
    }

    // Wertebereich aus Config (default 0-100)
    const min = Number(this._config.min);
    const max = Number(this._config.max);

    // Wert formatieren
    const decimals = ('decimals' in this._config) ? Number(this._config.decimals) : 0;
    const unit = this._config.unit ? this._config.unit : stateObj.attributes.unit_of_measurement || '';

    const formattedValue = rawValue.toFixed(decimals);

    // Wert auf 0-100% normalisieren
    let percent = ((rawValue - min) / (max - min)) * 100;
    percent = Math.min(Math.max(percent, 0), 100); // Clamp zwischen 0-100
    
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
          <div class="value">${formattedValue}${unit}</div>
        </div>
      </div>
    `;
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('simple-bar-card', SimpleBarCard);