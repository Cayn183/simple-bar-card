# Changelog

All notable changes to this project are documented here. Entries are listed in reverse chronological order.

## [v0.2.1-beta] - 2025-11-03

Summary
- Polish and validation: README examples polished, config validation hardened and user-friendly in-card errors/warnings added. Reduced ambiguous CSS aliasing to a small explicit set of override keys.

Highlights
- Added defensive validation in `setConfig()` (numeric checks for `min`/`max`, `decimals`, `bipolar_mode`, `color_thresholds`) and non-destructive in-card error and warning UI.
- README rewritten/cleaned with copy-paste-ready YAML examples and documented explicit CSS override keys.
- Removed broad alias normalization in favor of a minimal, explicit mapping to reduce surprising collisions.

Notes
- This release is primarily stability and documentation focused (preparing for wider beta testing).

## [v0.2.0-beta] - 2025-11-02

Summary
- Multi-entity support, heading area, global visibility toggles and improved theming.

Highlights
- Added multi-entity rendering: up to 5 stacked rows in a single card.
- Optional heading area above the entities (`heading_show`, `heading`).
- Global visibility toggles: `icon_show` and `value_show` now apply to all rows (per-entity `icon_show_2` / `value_show_2` are ignored).
- Improved theme and dark-mode compatibility via explicit `--*-dark` CSS variables and better fallbacks to HA theme variables.
- Per-entity overrides via `entities` array or suffixed keys (`entity_2`, `min_2`, `icon_3`, etc.).
- Icon color handling improved by setting inner SVG fills when necessary to respect theme/icon_color.

Notes
- Maximum of 5 entities is enforced; providing more will throw an error.
- DOM structure changed to support multiple rows; consumers that query the shadow DOM should update selectors if needed.

## [v0.1.4-beta] - 2025-11-02

Summary
- Consolidated styling approach, removed duplicate bubble variant, and added per-property dark-mode support and robust alias handling.

Highlights
- Removed the `bubble_style` visual variant to reduce duplication and make the card easier to maintain.
- Introduced per-property dark-mode variables (for example `--card-background-dark`, `--bar-fill-color-dark`, `--icon-bg-color-dark`) that the component prefers when the user or OS requests dark mode.
- Improved theming reliability by applying configured CSS variables both on the host and the internal `.container` element to avoid race and specificity issues.
- Normalized configuration keys: `setConfig()` now accepts canonical snake_case names and a wide set of aliases (camelCase and legacy names); aliases are normalized internally.
- README updated with canonical keys, accepted aliases, quick tests and migration guidance.

Fixes
- Addressed cases where theme variables were not consistently applied due to host/media-query scoping, which could cause transparent or missing fill colors.

Migration notes (from v0.1.3-beta)
- If you used `bubble_style: true` previously, remove that option and migrate any custom appearance settings to the canonical keys (see README). Use the *_dark keys to reproduce distinct dark-mode appearances.

----

## [v0.1.3-beta]

Summary
- Visual polish and structural improvements to the bar and bipolar rendering.

Improvements
- Rounded corners refined: the standard bar fill now has smoother rounded ends (border-radius: 12px 6px 6px 12px). Bipolar fills are rounded toward the center while keeping the outer ends sharp for a consistent aesthetic.
- Centralized shared styling: layout and shared style properties were consolidated to reduce duplication and simplify future maintenance.
- Bipolar layout consistency: bipolar mode now follows the same left-icon / center bar / right-value structure as the standard bar for visual alignment.
- Icon positioning tuned: adjustments to transforms and sizing produce a cleaner icon placement within its circular background.
- Minor CSS adjustments: spacing and box-sizing tweaks for more stable layout across environments.

----

## [v0.1.2-beta]

Summary
- UX and layout tuning for icon, value placement, and spacing.

Improvements
- Icon size and centering: the icon is sized and positioned for improved balance (icon ~35px inside a 45px circular background) and centered with refined transform tweaks.
- Value layout: the numeric value is placed in its own container aligned to the bar baseline; the value container width and height are tuned for visual parity with the bar.
- Spacing refinements: reduced gap between bar and value container and consistent left margin for the main content.
- Code quality: CSS organization and readability improvements for easier maintenance.

----

## [v0.1.1-beta]

Summary
- Introduced dynamic color support and improved color-handling reliability.

Improvements & Fixes
- Dynamic bar colors with thresholds: added `color_thresholds` configuration option (array of value/color pairs) so the bar color changes automatically based on the entity value.
- Manual fallback color: when `color_thresholds` is not provided, the bar uses the configured `bar_fill_color` or the default blue `#3b82f6`.
- Cleaner color selection logic: simplified and unified the fill-color determination so thresholds, manual config, and defaults are resolved consistently and reliably.
- CSS variable handling: the effective fill color is now consistently exposed via `--bar-fill-color` so themes and overrides apply predictably.
- Minor `_render()` reorganization and readability improvements.

----

Notes
- For usage examples, canonical key names, aliases and migration tips see `README.md`.

