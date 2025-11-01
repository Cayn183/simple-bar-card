class SimpleBarCard extends HTMLElement {
  constructor() {
    super();

    // Shadow root
    this.attachShadow({ mode: 'open' });

    // Cached DOM references (werden in _build once gesetzt)
    this._containerEl = null;
    this._labelEl = null;
    this._barBackgroundEl = null;
    this._barFillEl = null;
    this._barFillNegEl = null;
    this._barFillPosEl = null;
    this._zeroLineEl = null;
    this._valueEl = null;
    this._iconEl = null;
    this._iconCircleEl = null;

    // Last known state for change detection
    this._lastState = {
      rawValue: undefined,
      percent: undefined,
      fillColor: undefined,
      modeBipolar: undefined,
      negScale: undefined,
      posScale: undefined,
      displayName: undefined,
      formattedValueWithUnit: undefined,
      icon: undefined,
      iconColor: undefined
    };

    // rAF batching
    this._updateScheduled = false;
    this._pendingState = null;

    // Build skeleton once
    this._buildSkeleton();
  }

  /***************************
   * Gemeinsame CSS & Template (static)
   ***************************/
  _commonStyles() {
    return `
      <style>
        :host {
          display: block;
        }
        .container {
          font-family: sans-serif;
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
          /* Prefer Home Assistant theme variables; fall back to sensible defaults */
          background-color: var(--card-background-color, var(--ha-card-background, var(--paper-card-background-color, #fff)));
          border: 1px solid var(--card-border-color, var(--ha-card-border-color, var(--divider-color, #ccc)));
          border-radius: var(--card-border-radius, 12px);
          display: flex;
          align-items: center;
        }

        /* Icon area */
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
          /* prefer explicit config, otherwise HA theme color */
          background-color: var(--icon-bg-color, var(--paper-item-icon-active-color, #3b82f6));
          box-sizing: border-box;
        }
        .ha-icon.bar-icon {
          width: 35px;
          height: 35px;
          display: block;
          margin: 0 auto;
          line-height: 0;      /* entfernt baseline/Zeilenhöhen-Verschiebung */
          padding: 0;
          color: var(--icon-color, var(--paper-item-icon-color, #fff));
        }
        /* Wenn ha-icon ::part(svg) unterstützt, sicherstellen, dass das SVG auch block ist */
        .ha-icon.bar-icon::part(svg) {
          display: block;
          width: 100%;
          height: 100%;
        }

        /* Main area: label + bar */
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
          color: var(--label-color, var(--primary-text-color, inherit));
          font-size: 14px;
        }

        /* Standard bar background (holds fills) */
        .bar-row {
          display: flex;
          align-items: center;
        }
        .bar-background {
          position: relative;
          flex-grow: 1;
          height: 24px;
          background-color: var(--bar-background-color, rgba(0,0,0,0.08));
          border-radius: 12px;
          overflow: hidden;
          margin-right: 12px;
        }

        /* STANDARD fill (uses transform scaleX for performance) */
        .bar-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 100%;               /* full width, scaled via transform */
          transform-origin: left;
          transform: scaleX(0);
          background-color: var(--bar-fill-color, var(--primary-color, #3b82f6));
          border-radius: 12px 6px 6px 12px;
          transition: transform 300ms ease;
          will-change: transform;
        }

        /* BIPOLAR fills: each covers half width; scaled via transform */
        .bar-fill-negative,
        .bar-fill-positive {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;                /* half width; scaleX(0..1) visualizes amount */
          transition: transform 300ms ease;
          will-change: transform;
          background-color: var(--bar-fill-color, var(--primary-color, #3b82f6));
        }
        .bar-fill-negative {
          right: 50%;
          transform-origin: right;
          border-radius: 6px 0 0 6px; /* rounded toward center */
        }
        .bar-fill-positive {
          left: 50%;
          transform-origin: left;
          border-radius: 0 6px 6px 0; /* rounded toward center */
        }

        /* Zero line for bipolar */
        .zero-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          background-color: var(--card-border-color, var(--divider-color, #ccc));
          transform: translateX(-50%);
          z-index: 2;
        }

        /* Value area */
        .value-container {
          width: 60px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          white-space: nowrap;
          margin-left: 8px;
          height: 24px;
          box-sizing: border-box;
        }
        .value {
          min-width: 50px;
          font-size: 14px;
          color: var(--value-color, var(--secondary-text-color, inherit));
          font-weight: var(--value-font-weight, 400); /* normal or bold */
          text-align: center;
          transform: translateY(12px);
        }
      </style>
      <style>
        /* Bubble style duplicate: full copy of the standard styles but scoped to
           :host([bubble-style]) so you can edit these independently later. The
           rules intentionally mirror the main styles above.
        */

        :host([bubble-style]) {
          display: block;
        }

        :host([bubble-style]) .container {
          font-family: sans-serif;
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
          background-color: var(--card-background-color, var(--ha-card-background, var(--paper-card-background-color, rgba(0,0,0,0.15))));
          //border: 1px solid var(--card-border-color, var(--ha-card-border-color, var(--divider-color, #ccc)));
          border-radius: var(--card-border-radius, 12px);
          display: flex;
          align-items: center;
        }

        :host([bubble-style]) .icon-container {
          width: 50px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        :host([bubble-style]) .icon-circle {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--icon-bg-color, var(--paper-item-icon-active-color, #3b82f6));
          box-sizing: border-box;
        }

        :host([bubble-style]) .ha-icon.bar-icon {
          width: 35px;
          height: 35px;
          display: block;
          margin: 0 auto;
          line-height: 0;
          padding: 0;
          color: var(--icon-color, var(--paper-item-icon-color, #6e6c6cff));
        }

        :host([bubble-style]) .ha-icon.bar-icon::part(svg) {
          display: block;
          width: 100%;
          height: 100%;
        }

        :host([bubble-style]) .main-container {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-left: 12px;
        }

        :host([bubble-style]) .label {
          margin-bottom: 6px;
          font-weight: 600;
          color: var(--label-color, var(--primary-text-color, inherit));
          font-size: 14px;
        }

        :host([bubble-style]) .bar-row {
          display: flex;
          align-items: center;
        }

        :host([bubble-style]) .bar-background {
          position: relative;
          flex-grow: 1;
          height: 24px;
          background-color: var(--bar-background-color, rgba(0,0,0,0.25));
          border-radius: 12px;
          overflow: hidden;
          margin-right: 12px;
        }

        :host([bubble-style]) .bar-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 100%;
          transform-origin: left;
          transform: scaleX(0);
          background-color: var(--bar-fill-color, var(--primary-color, #3b82f6));
          border-radius: 12px 6px 6px 12px;
          transition: transform 300ms ease;
          will-change: transform;
        }

        :host([bubble-style]) .bar-fill-negative,
        :host([bubble-style]) .bar-fill-positive {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          transition: transform 300ms ease;
          will-change: transform;
          background-color: var(--bar-fill-color, var(--primary-color, #3b82f6));
        }

        :host([bubble-style]) .bar-fill-negative {
          right: 50%;
          transform-origin: right;
          border-radius: 6px 0 0 6px;
        }

        :host([bubble-style]) .bar-fill-positive {
          left: 50%;
          transform-origin: left;
          border-radius: 0 6px 6px 0;
        }

        :host([bubble-style]) .zero-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          background-color: var(--card-border-color, var(--divider-color, #ccc));
          transform: translateX(-50%);
          z-index: 2;
        }

        :host([bubble-style]) .value-container {
          width: 60px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          white-space: nowrap;
          margin-left: 8px;
          height: 24px;
          box-sizing: border-box;
        }

        :host([bubble-style]) .value {
          min-width: 50px;
          font-size: 14px;
          color: var(--value-color, var(--secondary-text-color, inherit));
          font-weight: var(--value-font-weight, 400);
          text-align: center;
          transform: translateY(12px);
        }

        /* Keep dark-mode fallback identical to previous behavior */
        @media (prefers-color-scheme: dark) {
          :host([bubble-style]) .container {
            background-color: var(--card-background-color, rgba(40,40,40,1));
          }
        }
      </style>
    `;
  }

  /***************************
   * Build skeleton once
   * - create DOM structure & static styles once
   * - store element references for future updates
   ***************************/
  _buildSkeleton() {
    const template = document.createElement('template');
    template.innerHTML = `
      ${this._commonStyles()}
      <div class="container">
        <div class="icon-container">
          <div class="icon-circle">
            <ha-icon class="bar-icon"></ha-icon>
          </div>
        </div>
        <div class="main-container">
          <div class="label"></div>
          <div class="bar-row">
            <div class="bar-background">
              <!-- standard fill (scaled via transform) -->
              <div class="bar-fill"></div>

              <!-- bipolar fills (each covers half, scaled via transform) -->
              <div class="bar-fill-negative" style="transform: scaleX(0)"></div>
              <div class="bar-fill-positive" style="transform: scaleX(0)"></div>

              <!-- zero line (shown only in bipolar mode) -->
              <div class="zero-line" style="display:none"></div>
            </div>
          </div>
        </div>
        <div class="value-container"><div class="value"></div></div>
      </div>
    `;
    // Append once
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Cache refs
    this._containerEl = this.shadowRoot.querySelector('.container');
    this._labelEl = this.shadowRoot.querySelector('.label');
    this._barBackgroundEl = this.shadowRoot.querySelector('.bar-background');
    this._barFillEl = this.shadowRoot.querySelector('.bar-fill');
    this._barFillNegEl = this.shadowRoot.querySelector('.bar-fill-negative');
    this._barFillPosEl = this.shadowRoot.querySelector('.bar-fill-positive');
    this._zeroLineEl = this.shadowRoot.querySelector('.zero-line');
    this._valueEl = this.shadowRoot.querySelector('.value');
    this._iconEl = this.shadowRoot.querySelector('ha-icon.bar-icon');
    this._iconCircleEl = this.shadowRoot.querySelector('.icon-circle');
  }

  /***************************
   * Konfigurations-Handler
   ***************************/
  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("Entity muss angegeben werden!");
    }
    this._config = {
      min: 0,
      max: 100,
      bipolar: false,
      ...config
    };

    // Apply only explicitly provided config-controlled CSS variables.
    // This preserves Home Assistant themes (dark/light) when no custom color is given.
    if (this._containerEl) {
      if ('card_background_color' in this._config && this._config.card_background_color) {
        this._containerEl.style.setProperty('--card-background-color', this._config.card_background_color);
      }
      if ('card_border_color' in this._config && this._config.card_border_color) {
        this._containerEl.style.setProperty('--card-border-color', this._config.card_border_color);
      }
      if ('card_border_radius' in this._config && this._config.card_border_radius) {
        this._containerEl.style.setProperty('--card-border-radius', this._config.card_border_radius);
      }
      if ('bar_background_color' in this._config && this._config.bar_background_color) {
        this._containerEl.style.setProperty('--bar-background-color', this._config.bar_background_color);
      }
      if ('icon_bg_color' in this._config && this._config.icon_bg_color) {
        this._containerEl.style.setProperty('--icon-bg-color', this._config.icon_bg_color);
      }
      if ('label_color' in this._config && this._config.label_color) {
        this._containerEl.style.setProperty('--label-color', this._config.label_color);
      }
      if ('value_color' in this._config && this._config.value_color) {
        this._containerEl.style.setProperty('--value-color', this._config.value_color);
      }
      // value font weight still allowed via config boolean
      this._containerEl.style.setProperty('--value-font-weight', this._config.value_bold ? '700' : '400');
      // icon color handled later in _applyState (so HA themes remain default unless config sets icon_color)
      if ('bar_fill_color' in this._config && this._config.bar_fill_color) {
        this._containerEl.style.setProperty('--bar-fill-color', this._config.bar_fill_color);
      }
      // Toggle bubble style host attribute so CSS above can react.
      if (this._config.bubble_style) {
        this.setAttribute('bubble-style', '');
      } else {
        this.removeAttribute('bubble-style');
      }
    }
  }

  /***************************
   * Home Assistant Update
   ***************************/
  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  /***************************
   * Haupt-Render-Methode (light & efficient)
   ***************************/
  _render() {
    // Preconditions
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

    // Prepare display values
    const displayName = this._calculateDisplayName(stateObj);
    const formattedValueWithUnit = this._formatValue(rawValue, stateObj);
    const fillColor = this._getColorForValue(rawValue) || this._config.bar_fill_color || '#3b82f6';
    const icon = this._config.icon || stateObj.attributes.icon || this._config.icon || 'mdi:chart-bar';
    const iconColor = this._config.icon_color || stateObj.attributes.entity_picture ? undefined : (this._config.icon_color || 'var(--paper-item-icon-color, #fff)');

    // Mode handling (bipolar with mode option: 'per_side' (default) | 'symmetric')
    if (this._config.bipolar) {
      const min = Number(this._config.min);
      const max = Number(this._config.max);
      const clampedValue = Math.min(Math.max(rawValue, min), max);

      // Choose bipolar scaling mode (default: per_side)
      const mode = this._config.bipolar_mode || 'per_side'; // 'per_side' | 'symmetric'

      // Outputs for transform scale (0..1)
      let negScale = 0;
      let posScale = 0;

      // Helper: avoid division by zero
      const safe = (v) => { v = Number(v); return (isFinite(v) && v !== 0) ? v : null; };

      if (mode === 'per_side') {
        // Each side scales to its own configured extreme (min for negative, max for positive)
        const safeMin = safe(min); // null if 0 or invalid
        const safeMax = safe(max);

        if (clampedValue < 0 && safeMin !== null && min < 0) {
          negScale = Math.min(Math.abs(clampedValue / min), 1); // 0..1
        } else if (clampedValue > 0 && safeMax !== null && max > 0) {
          posScale = Math.min(clampedValue / max, 1); // 0..1
        }
      } else {
        // symmetric: both sides scaled relative to the same absolute maximum
        const maxAbs = Math.max(Math.abs(min || 0), Math.abs(max || 0), 1e-9); // avoid 0
        if (clampedValue < 0) {
          negScale = Math.min(Math.abs(clampedValue) / maxAbs, 1);
        } else if (clampedValue > 0) {
          posScale = Math.min(clampedValue / maxAbs, 1);
        }
      }

      // Prepare pending state (scales are 0..1 for scaleX)
      const newState = {
        modeBipolar: true,
        negScale,
        posScale,
        fillColor,
        displayName,
        formattedValueWithUnit,
        icon,
        iconColor,
        rawValue
      };

      this._scheduleStateUpdate(newState);
      return;
    }

    // Standard mode
    const percent = this._calculatePercent(rawValue) / 100; // 0..1 for scaleX

    const newState = {
      modeBipolar: false,
      percent,
      fillColor,
      displayName,
      formattedValueWithUnit,
      icon,
      iconColor,
      rawValue
    };

    this._scheduleStateUpdate(newState);
  }

  /***************************
   * Scheduling & Applying Updates (batched with requestAnimationFrame)
   ***************************/
  _scheduleStateUpdate(state) {
    // Merge into pendingState
    this._pendingState = Object.assign({}, this._pendingState || {}, state);

    if (this._updateScheduled) return;

    this._updateScheduled = true;
    requestAnimationFrame(() => {
      this._updateScheduled = false;
      const next = this._pendingState;
      this._pendingState = null;
      this._applyState(next);
    });
  }

  _applyState(state) {
    if (!state) return;

    // Short-circuit if nothing changed (compare relevant fields)
    const last = this._lastState;

    // Mode change handling
    if (state.modeBipolar !== last.modeBipolar) {
      // Show/hide elements appropriately
      if (state.modeBipolar) {
        // ensure bipolar elements visible
        this._barFillEl.style.display = 'none';
        this._barFillNegEl.style.display = '';
        this._barFillPosEl.style.display = '';
        this._zeroLineEl.style.display = '';
        // set initial transforms
        this._barFillNegEl.style.transform = `scaleX(${state.negScale || 0})`;
        this._barFillPosEl.style.transform = `scaleX(${state.posScale || 0})`;
      } else {
        // standard mode
        this._barFillEl.style.display = '';
        this._barFillNegEl.style.display = 'none';
        this._barFillPosEl.style.display = 'none';
        this._zeroLineEl.style.display = 'none';
        this._barFillEl.style.transform = `scaleX(${state.percent || 0})`;
      }
      last.modeBipolar = state.modeBipolar;
    }

    // Update icon if changed
    if (state.icon !== last.icon) {
      this._iconEl.setAttribute('icon', state.icon);
      last.icon = state.icon;
    }
    if (state.iconColor !== last.iconColor) {
      if (state.iconColor) {
        this._iconEl.style.color = state.iconColor;
      } else {
        this._iconEl.style.removeProperty('color');
      }
      last.iconColor = state.iconColor;
    }

    // Update displayName
    if (state.displayName !== last.displayName) {
      this._labelEl.textContent = state.displayName;
      last.displayName = state.displayName;
    }

    // Update formatted value
    if (state.formattedValueWithUnit !== last.formattedValueWithUnit) {
      this._valueEl.textContent = state.formattedValueWithUnit;
      last.formattedValueWithUnit = state.formattedValueWithUnit;
    }

    // Update fill color
    if (state.fillColor !== last.fillColor) {
      // Set CSS variable on container for fills to use
      this._containerEl.style.setProperty('--bar-fill-color', state.fillColor);
      last.fillColor = state.fillColor;
    }

    // Update bar transform depending on mode
    if (state.modeBipolar) {
      // negScale / posScale each 0..1
      if (state.negScale !== last.negScale) {
        this._barFillNegEl.style.transform = `scaleX(${state.negScale})`;
        last.negScale = state.negScale;
      }
      if (state.posScale !== last.posScale) {
        this._barFillPosEl.style.transform = `scaleX(${state.posScale})`;
        last.posScale = state.posScale;
      }
      // ensure standard not changed
      last.percent = undefined;
    } else {
      if (state.percent !== last.percent) {
        this._barFillEl.style.transform = `scaleX(${state.percent})`;
        last.percent = state.percent;
      }
      // ensure bipolar not changed
      last.negScale = undefined;
      last.posScale = undefined;
    }

    // store rawValue
    last.rawValue = state.rawValue;
  }

  /***************************
   * Hilfsmethoden & Utilities
   ***************************/
  _renderError(message) {
    this.shadowRoot.innerHTML = `
      ${this._commonStyles()}
      <div style="padding:8px;color:#c00;font-weight:600;">${message}</div>
    `;
  }

  _calculatePercent(value) {
    const min = Number(this._config.min);
    const max = Number(this._config.max);
    if (max === min) return 0;
    let percent = ((value - min) / (max - min)) * 100;
    return Math.min(Math.max(percent, 0), 100);
  }

  _calculateDisplayName(stateObj) {
    return this._config.name || stateObj.attributes.friendly_name || this._config.entity;
  }

  _getColorForValue(value) {
    const thresholds = this._config.color_thresholds;
    if (!thresholds || !Array.isArray(thresholds) || thresholds.length === 0) {
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
    const formattedValue = Number(value).toFixed(decimals);
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  }

  /***************************
   * Card size (Lovelace)
   ***************************/
  getCardSize() {
    return 1;
  }
}

customElements.define('simple-bar-card', SimpleBarCard);