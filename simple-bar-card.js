class MyBarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  _render() {
    if (!this._config || !this._hass) return;

    const entityId = this._config.entity;
    const stateObj = this._hass.states[entityId];

    if (!stateObj) {
      this.shadowRoot.innerHTML = `<div>Entity not found: ${entityId}</div>`;
      return;
    }
    
    // Hier kommt später das Styling & Render-Logik rein
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('my-bar-card', MyBarCard);