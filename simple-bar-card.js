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
      iconColor: undefined,
      iconColorDark: undefined
    };
    // rAF batching
    this._updateScheduled = false;
    this._pendingState = null;
    // Dark mode media query listener
    this._darkModeQuery = null;
    this._darkModeListener = null;
    // Build skeleton once
    this._buildSkeleton();
  }

  /***************************
   * Lifecycle
   ***************************/
  connectedCallback() {
    // Set up dark mode listener to update SVG colors when theme changes
    this._darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._darkModeListener = () => this._updateAllIconColors();
    this._darkModeQuery.addEventListener('change', this._darkModeListener);
  }

  disconnectedCallback() {
    // Clean up listener
    if (this._darkModeQuery && this._darkModeListener) {
      this._darkModeQuery.removeEventListener('change', this._darkModeListener);
      this._darkModeQuery = null;
      this._darkModeListener = null;
    }
  }

  _updateAllIconColors() {
    // Force update of SVG colors for all icon elements when theme changes
    try {
      requestAnimationFrame(() => {
        // Update single-card icon (if exists)
        if (this._iconEl) {
          const desired = window.getComputedStyle(this._iconEl).color;
          this._applyInnerSvgColor(this._iconEl, desired);
        }
        // Update all multi-entity row icons
        if (this._rowEls) {
          for (const rowEl of this._rowEls) {
            if (rowEl.iconEl) {
              const desired = window.getComputedStyle(rowEl.iconEl).color;
              this._applyInnerSvgColor(rowEl.iconEl, desired);
            }
          }
        }
      });
    } catch (e) {}
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
          display: block;
        }
        /* Entities wrapper: stack multiple entity rows vertically */
        .entities {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        /* Each entity row keeps the original horizontal layout: icon | main | value */
        .entity-row {
          display: flex;
          align-items: center;
        }
        /* Optional heading above the entities */
        .heading {
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 6px;
          color: var(--label-color, var(--primary-text-color, inherit));
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
          /* prefer explicit config, otherwise transparent so underlying background shows through */
          background-color: var(--icon-bg-color, transparent);
          box-sizing: border-box;
        }
          .ha-icon.bar-icon {
            width: 35px;
            height: 35px;
            display: block;
            margin: 0 auto;
            line-height: 0;      /* entfernt baseline/Zeilenhöhen-Verschiebung */
            padding: 0;
            /* Prefer explicit CSS variable, otherwise use Home Assistant theme icon color */
            color: var(--icon-color, var(--paper-item-icon-color, currentColor));
          }
        /* Wenn ha-icon ::part(svg) unterstützt, sicherstellen, dass das SVG auch block ist */
        .ha-icon.bar-icon::part(svg) {
          display: block;
          width: 100%;
          height: 100%;
          /* Ensure the SVG paths use the element's color (currentColor) so theme colors apply */
          fill: currentColor;
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
          margin-bottom: 4px;
          font-weight: 600;
          color: var(--label-color, var(--primary-text-color, inherit));
          font-size: 13px;
          transform: translateX(8px);
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
        /* When the icon area is disabled via config (icon: false), hide the icon
           column and remove the left margin so the main content shifts left. */
        :host([no-icon]) .icon-container {
          display: none;
        }
        :host([no-icon]) .main-container {
          margin-left: 0;
        }
        /* When the value area is disabled via config (value_show: false), hide
           the value column and remove the right gap so the bar fills the space. */
        :host([no-value]) .value-container {
          display: none;
        }
        :host([no-value]) .bar-background {
          margin-right: 0;
        }
      </style>
      <style>
        /* Dark-mode: allow explicit dark-mode variables for all visual properties.
           Each visual variable supports a dark counterpart (e.g. --card-background-dark)
           which will be preferred when prefers-color-scheme: dark.
        */
        @media (prefers-color-scheme: dark) {
          .container {
            background-color: var(--card-background-dark, var(--card-background-color, var(--ha-card-background, var(--paper-card-background-color, rgba(40,40,40,1)))));
            border: 1px solid var(--card-border-color-dark, var(--card-border-color, var(--ha-card-border-color, var(--divider-color, #444))));
          }
          .bar-background {
            background-color: var(--bar-background-color-dark, var(--bar-background-color, rgba(255,255,255,0.06)));
          }
          .bar-fill,
          .bar-fill-negative,
          .bar-fill-positive {
            background-color: var(--bar-fill-color-dark, var(--bar-fill-color, var(--primary-color, #3b82f6)));
          }
          .icon-circle {
            background-color: var(--icon-bg-color-dark, var(--icon-bg-color, transparent));
          }
          .label {
            color: var(--label-color-dark, var(--label-color, var(--primary-text-color, inherit)));
          }
          .value {
            color: var(--value-color-dark, var(--value-color, var(--secondary-text-color, inherit)));
          }
          .ha-icon.bar-icon {
            /* Prefer explicit dark-mode variable, otherwise fall back to theme icon color */
            color: var(--icon-color-dark, var(--icon-color, var(--paper-item-icon-color, currentColor)));
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
        <div class="heading" style="display:none"></div>
        <div class="entities">
          <!-- up to 5 entity rows; visibility controlled dynamically -->
          <div class="entity-row">
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
          <div class="entity-row"></div>
          <div class="entity-row"></div>
          <div class="entity-row"></div>
          <div class="entity-row"></div>
        </div>
      </div>
    `;
    // Append once
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    // Cache refs
    this._containerEl = this.shadowRoot.querySelector('.container');
    this._headingEl = this.shadowRoot.querySelector('.heading');
    // Per-row cached refs (support up to 5 rows)
    this._rowEls = [];
    const rows = this.shadowRoot.querySelectorAll('.entity-row');
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.querySelector('.icon-container')) {
        // clone the inner structure from the first row if empty
        const first = rows[0];
        row.innerHTML = first.innerHTML;
      }
      const r = {
        root: row,
        iconEl: row.querySelector('ha-icon.bar-icon'),
        iconCircleEl: row.querySelector('.icon-circle'),
        labelEl: row.querySelector('.label'),
        barBackgroundEl: row.querySelector('.bar-background'),
        barFillEl: row.querySelector('.bar-fill'),
        barFillNegEl: row.querySelector('.bar-fill-negative'),
        barFillPosEl: row.querySelector('.bar-fill-positive'),
        zeroLineEl: row.querySelector('.zero-line'),
        valueEl: row.querySelector('.value')
      };
      this._rowEls.push(r);
    }
    // Initialize last state per row with iconColorDark tracking
    this._lastStateRows = Array.from({ length: this._rowEls.length }, () => ({ iconColor: undefined, iconColorDark: undefined }));
    // Pending row updates storage
    this._pendingRowStates = {};
    this._rowUpdateScheduled = false;
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
      // `icon_show` controls whether the icon column is visible. Default: true.
      icon_show: true,
      // `value_show` controls whether the numeric value column is visible. Default: true.
      value_show: true,
      // Optional heading above entities
      heading_show: false,
      heading: undefined,
      ...config
    };
    // Apply only explicitly provided config-controlled CSS variables.
    const setIf = (prop, val) => {
      if (val !== undefined && val !== null && val !== '') {
        try {
          this.style.setProperty(prop, val);
        } catch (e) {}
        if (this._containerEl) this._containerEl.style.setProperty(prop, val);
      }
    };
    const aliasMap = {
      '--card-background-color': ['card_background_color', 'card_background'],
      '--card-border-color': ['card_border_color', 'card_border'],
      '--card-border-radius': ['card_border_radius', 'card_border_radius_px'],
      '--bar-background-color': ['bar_background_color', 'bar_background'],
      '--icon-bg-color': ['icon_bg_color', 'icon_bg'],
      '--label-color': ['label_color', 'labelColor'],
      '--value-color': ['value_color', 'valueColor'],
      '--bar-fill-color': ['bar_fill_color', 'bar_fill_color_hex', 'barFillColor'],
      '--icon-color': ['icon_color', 'iconColor']
    };
    for (const [cssVar, keys] of Object.entries(aliasMap)) {
      for (const k of keys) {
        if (k in this._config && this._config[k] !== undefined && this._config[k] !== null && this._config[k] !== '') {
          setIf(cssVar, this._config[k]);
          break;
        }
      }
    }
    // value font weight still allowed via config boolean
    const valueWeight = this._config.value_bold ? '700' : '400';
    this.style.setProperty('--value-font-weight', valueWeight);
    if (this._containerEl) this._containerEl.style.setProperty('--value-font-weight', valueWeight);
    // Dark-mode alias map (per-property dark variants)
    const darkAliasMap = {
      '--card-background-dark': ['card_background_color_dark', 'card_background_dark', 'cardBackgroundDark'],
      '--card-border-color-dark': ['card_border_color_dark', 'card_border_dark', 'cardBorderColorDark'],
      '--bar-background-color-dark': ['bar_background_color_dark', 'bar_background_dark', 'barBackgroundColorDark'],
      '--icon-bg-color-dark': ['icon_bg_color_dark', 'icon_bg_dark', 'iconBgColorDark'],
      '--label-color-dark': ['label_color_dark', 'labelColorDark'],
      '--value-color-dark': ['value_color_dark', 'valueColorDark'],
      '--bar-fill-color-dark': ['bar_fill_color_dark', 'bar_fill_dark', 'barFillColorDark'],
      '--icon-color-dark': ['icon_color_dark', 'iconColorDark']
    };
    for (const [cssVar, keys] of Object.entries(darkAliasMap)) {
      for (const k of keys) {
        if (k in this._config && this._config[k] !== undefined && this._config[k] !== null && this._config[k] !== '') {
          setIf(cssVar, this._config[k]);
          break;
        }
      }
    }
    // Parse up to 5 entities. Support two styles:
    // - config.entities: array of strings or objects
    // - config.entity, config.entity_2, config.entity_3, ...
    this._entities = [];
    if (Array.isArray(this._config.entities) && this._config.entities.length > 0) {
      if (this._config.entities.length > 5) throw new Error('Maximal 5 entities sind erlaubt');
      for (const e of this._config.entities) {
        if (typeof e === 'string') {
          this._entities.push(Object.assign({}, this._config, { entity: e }));
        } else if (typeof e === 'object' && e !== null) {
          this._entities.push(Object.assign({}, this._config, e));
        }
      }
    } else {
      for (let i = 1; i <= 5; i++) {
        const key = i === 1 ? 'entity' : `entity_${i}`;
        if (key in this._config && this._config[key]) {
          const per = Object.assign({}, this._config);
          for (const k of Object.keys(this._config)) {
            const suffix = `_${i}`;
            if (k.endsWith(suffix)) {
              const baseKey = k.slice(0, -suffix.length);
              if (baseKey === 'icon_show' || baseKey === 'value_show') continue;
              per[baseKey] = this._config[k];
            }
          }
          per.entity = this._config[key];
          this._entities.push(per);
        }
      }
    }
    if (this._entities.length === 0) {
      throw new Error('Mindestens eine Entity muss angegeben werden');
    }
    if (this._entities.length > 5) {
      throw new Error('Maximal 5 entities sind erlaubt');
    }
    // Show/hide row elements according to number of entities configured
    if (this._rowEls && this._rowEls.length) {
      for (let i = 0; i < this._rowEls.length; i++) {
        const el = this._rowEls[i].root;
        if (i < this._entities.length) {
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      }
    }
    // Heading display
    if (this._headingEl) {
      if (this._config.heading_show) {
        this._headingEl.textContent = this._config.heading || '';
        this._headingEl.style.display = '';
      } else {
        this._headingEl.style.display = 'none';
      }
    }
    // Icon visibility
    if (this._config.icon_show === false) {
      this.setAttribute('no-icon', '');
    } else {
      this.removeAttribute('no-icon');
    }
    // Value visibility
    if (this._config.value_show === false) {
      this.setAttribute('no-value', '');
    } else {
      this.removeAttribute('no-value');
    }
    // Remove per-entity visibility flags
    for (const per of this._entities) {
      if ('icon_show' in per) delete per.icon_show;
      if ('value_show' in per) delete per.value_show;
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
    // For each configured entity, compute its display state and schedule an update for that row
    for (let i = 0; i < this._entities.length; i++) {
      const per = this._entities[i];
      const stateObj = this._hass.states[per.entity];
      if (!stateObj) {
        this._renderError(`Entity nicht gefunden: ${per.entity}`);
        return;
      }
      const rawValue = Number(stateObj.state);
      if (isNaN(rawValue)) {
        this._renderError(`Ungültiger Wert: ${stateObj.state}`);
        return;
      }
      const displayName = per.name || stateObj.attributes.friendly_name || per.entity;
      const formattedValueWithUnit = this._formatValue(rawValue, stateObj, per);
      const fillColor = this._getColorForValue(rawValue, per) || per.bar_fill_color || '#3b82f6';
      // Icon handling per entity. Visibility is global via this._config.icon_show
      let icon;
      if (this._config.icon_show === false) {
        icon = undefined;
      } else {
        icon = (per.icon ?? stateObj.attributes.icon) || 'mdi:chart-bar';
      }
      const iconColor = (per.icon_color !== undefined) ? per.icon_color : undefined;
      const iconColorDark = (per.icon_color_dark !== undefined) ? per.icon_color_dark : undefined;
      // Mode handling
      if (per.bipolar) {
        const min = Number(per.min);
        const max = Number(per.max);
        const clampedValue = Math.min(Math.max(rawValue, min), max);
        const mode = per.bipolar_mode || 'per_side';
        let negScale = 0, posScale = 0;
        const safe = (v) => { v = Number(v); return (isFinite(v) && v !== 0) ? v : null; };
        if (mode === 'per_side') {
          const safeMin = safe(min);
          const safeMax = safe(max);
          if (clampedValue < 0 && safeMin !== null && min < 0) {
            negScale = Math.min(Math.abs(clampedValue / min), 1);
          } else if (clampedValue > 0 && safeMax !== null && max > 0) {
            posScale = Math.min(clampedValue / max, 1);
          }
        } else {
          const maxAbs = Math.max(Math.abs(min || 0), Math.abs(max || 0), 1e-9);
          if (clampedValue < 0) negScale = Math.min(Math.abs(clampedValue) / maxAbs, 1);
          else if (clampedValue > 0) posScale = Math.min(clampedValue / maxAbs, 1);
        }
        const newState = {
          modeBipolar: true,
          negScale,
          posScale,
          fillColor,
          displayName,
          formattedValueWithUnit,
          icon,
          iconColor,
          iconColorDark,
          rawValue
        };
        this._scheduleRowUpdate(i, newState);
      } else {
        const percent = this._calculatePercentWithConfig(rawValue, per) / 100;
        const newState = {
          modeBipolar: false,
          percent,
          fillColor,
          displayName,
          formattedValueWithUnit,
          icon,
          iconColor,
          iconColorDark,
          rawValue
        };
        this._scheduleRowUpdate(i, newState);
      }
    }
    // After rendering all entities, ensure icon colors are applied
    // This is crucial for the first render and after config changes
    this._updateAllIconColors();
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
  // Schedule a single row update (batched via rAF)
  _scheduleRowUpdate(index, state) {
    this._pendingRowStates[index] = Object.assign({}, this._pendingRowStates[index] || {}, state);
    if (this._rowUpdateScheduled) return;
    this._rowUpdateScheduled = true;
    requestAnimationFrame(() => {
      this._rowUpdateScheduled = false;
      const pending = this._pendingRowStates;
      this._pendingRowStates = {};
      for (const [idxStr, s] of Object.entries(pending)) {
        const idx = Number(idxStr);
        this._applyStateRow(idx, s);
      }
    });
  }

  _calculatePercentWithConfig(value, cfg) {
    const min = Number(cfg.min ?? this._config.min);
    const max = Number(cfg.max ?? this._config.max);
    if (max === min) return 0;
    let percent = ((value - min) / (max - min)) * 100;
    return Math.min(Math.max(percent, 0), 100);
  }

  _applyState(state) {
    if (!state) return;
    // If per-row rendering is active, route single-state updates to row 0
    if (this._rowEls && this._rowEls.length) {
      this._applyStateRow(0, state);
      return;
    }
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
      if (state.icon) {
        this._iconEl.setAttribute('icon', state.icon);
      } else {
        this._iconEl.removeAttribute('icon');
      }
      last.icon = state.icon;
      // When icon changes, update its color to match current theme
      this._updateAllIconColors();
    }

    // Apply per-entity icon color overrides (if specified in per-entity config)
    // Otherwise, the global --icon-color/--icon-color-dark CSS variables (set in setConfig) will be used
    if (state.iconColor !== last.iconColor || state.iconColorDark !== last.iconColorDark) {
      if (state.iconColor !== undefined && state.iconColor !== null && state.iconColor !== '') {
        this._containerEl.style.setProperty('--icon-color', state.iconColor);
      } else {
        this._containerEl.style.removeProperty('--icon-color');
      }
      if (state.iconColorDark !== undefined && state.iconColorDark !== null && state.iconColorDark !== '') {
        this._containerEl.style.setProperty('--icon-color-dark', state.iconColorDark);
      } else {
        this._containerEl.style.removeProperty('--icon-color-dark');
      }
      last.iconColor = state.iconColor;
      last.iconColorDark = state.iconColorDark;
      // When per-entity colors change, update SVG to match
      this._updateAllIconColors();
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

  // Apply state to a specific row index using the cached row elements
  _applyStateRow(index, state) {
    if (!state) return;
    const rowEls = this._rowEls[index];
    const last = this._lastStateRows[index] || {};
    // Mode switch
    if (state.modeBipolar !== last.modeBipolar) {
      if (state.modeBipolar) {
        rowEls.barFillEl.style.display = 'none';
        rowEls.barFillNegEl.style.display = '';
        rowEls.barFillPosEl.style.display = '';
        rowEls.zeroLineEl.style.display = '';
        rowEls.barFillNegEl.style.transform = `scaleX(${state.negScale || 0})`;
        rowEls.barFillPosEl.style.transform = `scaleX(${state.posScale || 0})`;
      } else {
        rowEls.barFillEl.style.display = '';
        rowEls.barFillNegEl.style.display = 'none';
        rowEls.barFillPosEl.style.display = 'none';
        rowEls.zeroLineEl.style.display = 'none';
        rowEls.barFillEl.style.transform = `scaleX(${state.percent || 0})`;
      }
      last.modeBipolar = state.modeBipolar;
    }
    // Icon
    if (state.icon !== last.icon) {
      if (state.icon) rowEls.iconEl.setAttribute('icon', state.icon);
      else rowEls.iconEl.removeAttribute('icon');
      last.icon = state.icon;
      // Update SVG color when icon changes
      this._updateAllIconColors();
    }
    // apply per-row icon color via CSS variables (row-root)
    if (state.iconColor !== last.iconColor || state.iconColorDark !== last.iconColorDark) {
      if (state.iconColor !== undefined && state.iconColor !== null && state.iconColor !== '') {
        rowEls.root.style.setProperty('--icon-color', state.iconColor);
      } else {
        rowEls.root.style.removeProperty('--icon-color');
      }
      if (state.iconColorDark !== undefined && state.iconColorDark !== null && state.iconColorDark !== '') {
        rowEls.root.style.setProperty('--icon-color-dark', state.iconColorDark);
      } else {
        rowEls.root.style.removeProperty('--icon-color-dark');
      }
      last.iconColor = state.iconColor;
      last.iconColorDark = state.iconColorDark;
      // Update SVG color when per-entity colors change
      this._updateAllIconColors();
    }
    // Label
    if (state.displayName !== last.displayName) {
      rowEls.labelEl.textContent = state.displayName;
      last.displayName = state.displayName;
    }
    // Value
    if (state.formattedValueWithUnit !== last.formattedValueWithUnit) {
      rowEls.valueEl.textContent = state.formattedValueWithUnit;
      last.formattedValueWithUnit = state.formattedValueWithUnit;
    }
    // Fill color (set on the row root so --bar-fill-color applies)
    if (state.fillColor !== last.fillColor) {
      rowEls.root.style.setProperty('--bar-fill-color', state.fillColor);
      last.fillColor = state.fillColor;
    }
    // Transforms for scales/percent
    if (state.modeBipolar) {
      if (state.negScale !== last.negScale) {
        rowEls.barFillNegEl.style.transform = `scaleX(${state.negScale})`;
        last.negScale = state.negScale;
      }
      if (state.posScale !== last.posScale) {
        rowEls.barFillPosEl.style.transform = `scaleX(${state.posScale})`;
        last.posScale = state.posScale;
      }
      last.percent = undefined;
    } else {
      if (state.percent !== last.percent) {
        rowEls.barFillEl.style.transform = `scaleX(${state.percent})`;
        last.percent = state.percent;
      }
      last.negScale = undefined;
      last.posScale = undefined;
    }
    last.rawValue = state.rawValue;
    this._lastStateRows[index] = last;
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

  _getColorForValue(value, cfg) {
    const thresholds = (cfg && cfg.color_thresholds) || this._config.color_thresholds;
    if (!thresholds || !Array.isArray(thresholds) || thresholds.length === 0) {
      return (cfg && cfg.bar_fill_color) || this._config.bar_fill_color || '#3b82f6';
    }
    for (const threshold of thresholds) {
      if (value <= threshold.value) {
        return threshold.color;
      }
    }
    return thresholds[thresholds.length - 1].color;
  }

  // Try to find the inner SVG inside ha-icon / ha-svg-icon shadow roots and set
  // its path fills to the provided color. This is necessary because many HA
  // icon implementations render the <svg> inside a shadow DOM and do not
  // automatically inherit currentColor.
  _applyInnerSvgColor(iconEl, color) {
    if (!iconEl) return;
    try {
      // ha-icon -> shadowRoot -> ha-svg-icon -> shadowRoot -> svg
      const haSvg = iconEl.shadowRoot && iconEl.shadowRoot.querySelector('ha-svg-icon');
      const svg = haSvg && haSvg.shadowRoot && haSvg.shadowRoot.querySelector('svg');
      if (!svg) return;
      // Compute a concrete color value if needed
      const fillVal = color || window.getComputedStyle(iconEl).color || null;
      if (!fillVal) return;
      // Set fill on path elements (safe and effective)
      const paths = svg.querySelectorAll('path, circle, rect, polygon');
      paths.forEach(p => {
        try { p.setAttribute('fill', fillVal); } catch (e) {}
      });
    } catch (e) {
      // best-effort only
    }
  }

  _formatValue(value, stateObj, cfg) {
    const decimals = ('decimals' in (cfg || this._config)) ? Number((cfg || this._config).decimals) : 0;
    const unit = (cfg && cfg.unit) || this._config.unit || stateObj.attributes.unit_of_measurement || '';
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