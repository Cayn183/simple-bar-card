# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.4-beta] - 2025-11-02
### Changed
- Removed the `bubble_style` visual variant. The card now focuses on one canonical style and provides more flexible editability via per-property variables and dark-mode variants.
- Introduced per-property dark-mode variables and fallbacks. For example `--card-background-dark`, `--bar-fill-color-dark`, `--icon-bg-color-dark`, etc. These are preferred when the user or OS requests dark mode.
- Improved theming reliability: configuration values are applied both to the host and to the internal `.container` element to avoid race/specificity issues with host-scoped or media-query-scoped CSS.
- Normalized configuration keys: `setConfig()` now accepts a canonical snake_case set of keys and a broad set of aliases (camelCase or legacy names) which are normalized internally.
- README updated with canonical key names, aliases, quick tests and migration notes.

### Fixed
- Resolved several edge-cases where theme variables could be overridden or not applied due to host/media-scope ordering.

### Removed
- `bubble_style` option and associated `:host([bubble-style])` CSS duplication. (This simplifies maintenance and reduces duplication while keeping full editability through canonical variables.)

### Migration notes (from v0.1.3-beta)
- If you previously used `bubble_style: true`, remove that option and port any custom rules you had to the canonical config keys (see README). The card now supports per-property dark variants so you can reproduce the same visual appearance by setting both the light and dark keys.
- Recommended canonical keys to use (examples):
  - `card_background_color` / `card_background_color_dark`
  - `bar_fill_color` / `bar_fill_color_dark`
  - `bar_background_color` / `bar_background_color_dark`
  - `icon_bg_color` / `icon_bg_color_dark`
  - `label_color` / `label_color_dark`
  - `value_color` / `value_color_dark`

### Notes
- Aliases are still accepted (e.g., `card_background`, `cardBackgroundDark`, `bar_fill_color_hex`) and will be normalized by `setConfig()`; however, prefer the canonical snake_case names going forward.

For more details and examples see `README.md` and `simple-bar-card.js`.
