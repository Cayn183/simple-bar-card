class SimpleBarCard extends HTMLElement {
  constructor() {
    super();
    // Shadow root
    this.attachShadow({ mode: 'open' });

    // Cached DOM references (werden in _build once gesetzt)
    this._containerEl = null;
    this._headingEl = null;
    this._rowEls = null;

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

    // Build skeleton once
    this._buildSkeleton();
  }

  /***************************
   * Gemeinsame CSS & Template (static)
   ***************************/
  _commonStyles() {
    return `
      <style>
        :host { display: block; }
        .container {
          font-family: sans-serif;
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
          background-color: var(--card-background-color, var(--ha-card-background, var(--paper-card-background-color, #fff)));
          border: 1px solid var(--card-border-color, var(--ha-card-border-color, var(--divider-color, #ccc)));
          border-radius: var(--card-border-radius, 12px);
          display: block;
        }
        .entities { display: flex; flex-direction: column; gap: 8px; }
        .entity-row { display: flex; align-items: center; }
        .heading { font-weight:700; font-size:14px; margin-bottom:6px; color: var(--label-color, var(--primary-text-color, inherit)); }

        /* Icon area */
        .icon-container { width:50px; display:flex; justify-content:center; align-items:center; }
        .icon-circle {
          width:45px; height:45px; border-radius:50%; display:flex; align-items:center; justify-content:center;
          background-color: var(--icon-bg-color, transparent); box-sizing:border-box;
        }

        /* *** IMPORTANT FIX ***
           Use tag selector 'ha-icon.bar-icon' (not .ha-icon.bar-icon).
           ha-icon is the element tag, not a CSS class.
        */
        ha-icon.bar-icon {
          width: 35px;
          height: 35px;
          display: block;
          margin: 0 auto;
          line-height: 0;
          padding: 0;
          color: var(--icon-color, var(--paper-item-icon-color, inherit));
        }

        /* If ha-icon supports ::part(svg) (newer versions), ensure svg inherits color */
        ha-icon.bar-icon::part(svg) {
          display: block;
          width: 100%;
          height: 100%;
          fill: currentColor;
        }

        /* Main area */
        .main-container { flex-grow:1; display:flex; flex-direction:column; justify-content:center; margin-left:12px; }
        .label { margin-bottom:4px; font-weight:600; color: var(--label-color, var(--primary-text-color, inherit)); font-size:13px; transform: translateX(8px); }

        .bar-row { display:flex; align-items:center; }
        .bar-background {
          position:relative; flex-grow:1; height:24px; background-color: var(--bar-background-color, rgba(0,0,0,0.08));
          border-radius:12px; overflow:hidden; margin-right:12px;
        }
        .bar-fill {
          position:absolute; left:0; top:0; bottom:0; width:100%;
          transform-origin:left; transform:scaleX(0);
          background-color: var(--bar-fill-color, var(--primary-color, #3b82f6));
          border-radius: 12px 6px 6px 12px;
          transition: transform 300ms ease; will-change: transform;
        }

        .bar-fill-negative, .bar-fill-positive {
          position:absolute; top:0; bottom:0; width:50%; transition: transform 300ms ease; will-change: transform;
          background-color: var(--bar-fill-color, var(--primary-color, #3b82f6));
        }
        .bar-fill-negative { right:50%; transform-origin:right; border-radius:6px 0 0 6px; }
        .bar-fill-positive { left:50%; transform-origin:left; border-radius:0 6px 6px 0; }

        .zero-line { position:absolute; top:0; bottom:0; left:50%; width:2px; background-color: var(--card-border-color, var(--divider-color, #ccc)); transform: translateX(-50%); z-index:2; }

        .value-container { width:60px; display:flex; justify-content:center; align-items:flex-end; white-space:nowrap; margin-left:8px; height:24px; box-sizing:border-box; }
        .value {
          min-width:50px; font-size:14px; color: var(--value-color, var(--secondary-text-color, inherit));
          font-weight: var(--value-font-weight, 400); text-align:center; transform: translateY(12px);
        }

        /* host attributes to hide columns */
        :host([no-icon]) .icon-container { display:none; }
        :host([no-icon]) .main-container { margin-left:0; }
        :host([no-value]) .value-container { display:none; }
        :host([no-value]) .bar-background { margin-right:0; }
      </style>

      <style>
        @media (prefers-color-scheme: dark) {
          .container {
            background-color: var(--card-background-dark, var(--card-background-color, var(--ha-card-background, var(--paper-card-background-color, rgba(40,40,40,1)))));
            border: 1px solid var(--card-border-color-dark, var(--card-border-color, var(--ha-card-border-color, var(--divider-color, #444))));
          }
          .bar-background { background-color: var(--bar-background-color-dark, var(--bar-background-color, rgba(255,255,255,0.06))); }
          .bar-fill, .bar-fill-negative, .bar-fill-positive {
            background-color: var(--bar-fill-color-dark, var(--bar-fill-color, var(--primary-color, #3b82f6)));
          }
          .icon-circle { background-color: var(--icon-bg-color-dark, var(--icon-bg-color, transparent)); }
          .label { color: var(--label-color-dark, var(--label-color, var(--primary-text-color, inherit))); }
          .value { color: var(--value-color-dark, var(--value-color, var(--secondary-text-color, inherit))); }
          ha-icon.bar-icon {
            color: var(--icon-color-dark, var(--icon-color, var(--paper-item-icon-color, inherit)));
          }
        }
      </style>
    `;
  }

  /***************************
   * Build skeleton once
   ***************************/
  _buildSkeleton() {
    const template = document.createElement('template');
    template.innerHTML = `
      ${this._commonStyles()}
      <div class="container">
        <div class="heading" style="display:none"></div>
        <div class="entities">
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
                  <div class="bar-fill"></div>
                  <div class="bar-fill-negative" style="transform: scaleX(0)"></div>
                  <div class="bar-fill-positive" style="transform: scaleX(0)"></div>
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
    this._pendingRowStates = {};
    this._rowUpdateScheduled = false;
  }

  /***************************
   * Konfigurations-Handler
   ***************************/
  setConfig(config) {
    if (!config || !config.entity) throw new Error("Entity muss angegeben werden!");
    this._config = {
      min: 0,
      max: 100,
      bipolar: false,
      icon_show: true,
      value_show: true,
      heading_show: false,
      heading: undefined,
      ...config
    };

    const setIf = (prop, val) => {
      if (val !== undefined && val !== null && val !== '') {
        try { this.style.setProperty(prop, val); } catch (e) {}
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

    const valueWeight = this._config.value_bold ? '700' : '400';
    this.style.setProperty('--value-font-weight', valueWeight);
    if (this._containerEl) this._containerEl.style.setProperty('--value-font-weight', valueWeight);

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

    // Parse entities...
    this._entities = [];
    if (Array.isArray(this._config.entities) && this._config.entities.length > 0) {
      if (this._config.entities.length > 5) throw new Error('Maximal 5 entities sind erlaubt');
      for (const e of this._config.entities) {
        if (typeof e === 'string') this._entities.push(Object.assign({}, this._config, { entity: e }));
        else if (typeof e === 'object' && e !== null) this._entities.push(Object.assign({}, this._config, e));
      }
    } else {
      for (let i=1;i<=5;i++) {
        const key = i===1 ? 'entity' : `entity_${i}`;
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

    if (this._entities.length === 0) throw new Error('Mindestens eine Entity muss angegeben werden');
    if (this._entities.length > 5) throw new Error('Maximal 5 entities sind erlaubt');

    // show/hide rows
    if (this._rowEls && this._rowEls.length) {
      for (let i=0;i<this._rowEls.length;i++) {
        const el = this._rowEls[i].root;
        el.style.display = (i < this._entities.length) ? '' : 'none';
      }
    }

    // heading
    if (this._headingEl) {
      if (this._config.heading_show) {
        this._headingEl.textContent = this._config.heading || '';
        this._headingEl.style.display = '';
      } else {
        this._headingEl.style.display = 'none';
      }
    }

    // icon/value visibility
    if (this._config.icon_show === false) this.setAttribute('no-icon',''); else this.removeAttribute('no-icon');
    if (this._config.value_show === false) this.setAttribute('no-value',''); else this.removeAttribute('no-value');

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
   * Haupt-Render-Methode
   ***************************/
  _render() {
    if (!this._config || !this._hass) return;

    for (let i=0;i<this._entities.length;i++) {
      const per = this._entities[i];
      const stateObj = this._hass.states[per.entity];
      if (!stateObj) { this._renderError(`Entity nicht gefunden: ${per.entity}`); return; }
      const rawValue = Number(stateObj.state);
      if (isNaN(rawValue)) { this._renderError(`Ungültiger Wert: ${stateObj.state}`); return; }

      const displayName = per.name || stateObj.attributes.friendly_name || per.entity;
      const formattedValueWithUnit = this._formatValue(rawValue, stateObj, per);
      const fillColor = this._getColorForValue(rawValue, per) || per.bar_fill_color || '#3b82f6';

      let icon;
      if (this._config.icon_show === false) icon = undefined;
      else icon = (per.icon ?? stateObj.attributes.icon) || 'mdi:chart-bar';

      const iconColor = (per.icon_color !== undefined) ? per.icon_color : undefined;
      const iconColorDark = (per.icon_color_dark !== undefined) ? per.icon_color_dark : undefined;

      if (per.bipolar) {
        const min = Number(per.min); const max = Number(per.max);
        const clampedValue = Math.min(Math.max(rawValue, min), max);
        const mode = per.bipolar_mode || 'per_side';
        let negScale = 0, posScale = 0;
        const safe = (v) => { v = Number(v); return (isFinite(v) && v !== 0) ? v : null; };
        if (mode === 'per_side') {
          const safeMin = safe(min), safeMax = safe(max);
          if (clampedValue < 0 && safeMin !== null && min < 0) negScale = Math.min(Math.abs(clampedValue / min), 1);
          else if (clampedValue > 0 && safeMax !== null && max > 0) posScale = Math.min(clampedValue / max, 1);
        } else {
          const maxAbs = Math.max(Math.abs(min || 0), Math.abs(max || 0), 1e-9);
          if (clampedValue < 0) negScale = Math.min(Math.abs(clampedValue) / maxAbs, 1);
          else if (clampedValue > 0) posScale = Math.min(clampedValue / maxAbs, 1);
        }
        const newState = { modeBipolar:true, negScale, posScale, fillColor, displayName, formattedValueWithUnit, icon, iconColor, iconColorDark, rawValue };
        this._scheduleRowUpdate(i, newState);
      } else {
        const percent = this._calculatePercentWithConfig(rawValue, per) / 100;
        const newState = { modeBipolar:false, percent, fillColor, displayName, formattedValueWithUnit, icon, iconColor, iconColorDark, rawValue };
        this._scheduleRowUpdate(i, newState);
      }
    }
  }

  /***************************
   * Scheduling & Applying Updates
   ***************************/
  _scheduleRowUpdate(index, state) {
    this._pendingRowStates[index] = Object.assign({}, this._pendingRowStates[index] || {}, state);
    if (this._rowUpdateScheduled) return;
    this._rowUpdateScheduled = true;
    requestAnimationFrame(() => {
      this._rowUpdateScheduled = false;
      const pending = this._pendingRowStates;
      this._pendingRowStates = {};
      for (const [idxStr, s] of Object.entries(pending)) {
        this._applyStateRow(Number(idxStr), s);
      }
    });
  }

  _calculatePercentWithConfig(value, cfg) {
    const min = Number(cfg.min ?? this._config.min);
    const max = Number(cfg.max ?? this._config.max);
    if (max === min) return 0;
    let percent = ((value - min) / (max - min)) * 100;
    return Math.min(Math.max(percent,0),100);
  }

  _applyStateRow(index, state) {
    if (!state) return;
    const rowEls = this._rowEls[index];
    const last = this._lastStateRows[index] || {};

    // mode
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

    // icon
    if (state.icon !== last.icon) {
      if (state.icon) rowEls.iconEl.setAttribute('icon', state.icon);
      else rowEls.iconEl.removeAttribute('icon');
      last.icon = state.icon;
    }

    // per-row icon colors via CSS vars on row root (fixes dark tooling)
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
      try {
        const desired = window.getComputedStyle(rowEls.iconEl).color;
        this._applyInnerSvgColor(rowEls.iconEl, desired);
      } catch (e) {}
      last.iconColor = state.iconColor;
      last.iconColorDark = state.iconColorDark;
    }

    // label
    if (state.displayName !== last.displayName) {
      rowEls.labelEl.textContent = state.displayName;
      last.displayName = state.displayName;
    }

    // value
    if (state.formattedValueWithUnit !== last.formattedValueWithUnit) {
      rowEls.valueEl.textContent = state.formattedValueWithUnit;
      last.formattedValueWithUnit = state.formattedValueWithUnit;
    }

    // fill color per row
    if (state.fillColor !== last.fillColor) {
      rowEls.root.style.setProperty('--bar-fill-color', state.fillColor);
      last.fillColor = state.fillColor;
    }

    // transforms
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
   * Utilities
   ***************************/
  _renderError(message) {
    this.shadowRoot.innerHTML = `${this._commonStyles()}<div style="padding:8px;color:#c00;font-weight:600;">${message}</div>`;
  }

  _applyInnerSvgColor(iconEl, color) {
    if (!iconEl) return;
    try {
      const haSvg = iconEl.shadowRoot && iconEl.shadowRoot.querySelector('ha-svg-icon');
      const svg = haSvg && haSvg.shadowRoot && haSvg.shadowRoot.querySelector('svg');
      if (!svg) return;
      const fillVal = color || window.getComputedStyle(iconEl).color || null;
      if (!fillVal) return;
      const paths = svg.querySelectorAll('path, circle, rect, polygon');
      paths.forEach(p => {
        try { p.setAttribute('fill', fillVal); } catch (e) {}
      });
    } catch (e) {}
  }

  _formatValue(value, stateObj, cfg) {
    const decimals = ('decimals' in (cfg || this._config)) ? Number((cfg || this._config).decimals) : 0;
    const unit = (cfg && cfg.unit) || this._config.unit || stateObj.attributes.unit_of_measurement || '';
    const formattedValue = Number(value).toFixed(decimals);
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  }

  getCardSize() { return 1; }
}

customElements.define('simple-bar-card', SimpleBarCard);