# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); this project uses semantic versioning.

## [2.0.2] — 2026-07-17

Keycap geometry fixes — the pressed state and the chrome ring now render
correctly on proud keycaps (a tall wall relative to the frame). Verified in real
WebKit and visually across rest → flush → deep press.

### Fixed

- **Pressed state** no longer bounces or reveals a recess too early. The cavity is
  now a static hole pinned at the flush line (`top: --wall-h`): as the key sinks it
  uncovers the housing surface pre-flush, then the channel post-flush. Nothing
  animates its position, so there is no channel bounce.
- **Chrome ring is measured around the channel, not the resting cap.** A proud key
  stands above its plate, so centering the ring on the cap pushed the channel down
  and read as excess chrome above the button. The ring is now even (frame-width) on
  the sides and bottom, with the proud key rising out of the top.
- **Bottom ring no longer doubles.** The cell is pinned by top + bottom rather than
  a fixed height, so the freed top inset on a proud key can't pile up at the bottom.

### Internal

- Groundwork for the mechanical-keycap **sculpt** (taper + dish config keys) is in the
  engine, off by default and byte-identical when unset. The generator controls and a
  Keyboard preset land in 2.1.0 alongside the light switch and first-class button-type
  modes.

## [2.0.1] — 2026-07-17

Completes the v2 responsive promise — **every form** now reflows to any size and
ratio, not just the common button. Each verified reflowing in real WebKit.

### Fixed / Added

- **Per-corner radius** configs are now live: each of the four corner radii scales
  with the container (the browser applies the adjacent-corner overlap clamp live,
  so no generation-time overlap pass is needed).
- **Skewed (parallelogram)** configs are now live: the housing's skew-widen space
  reservation is recovered from the filled scale via `W0 = housingW − housingH·|tanX|`
  (the widen cross-term cancels), with the fixed skew angles baked as `tan()`
  constants — the sheared button reflows at any ratio with its ring intact.
- **Segmented housings** are now live: the shared housing's per-segment container
  width is back-solved from the scale and divided by the segment count, so an
  N-segment strip fills and reflows to any container width.

Previously these three forms fell back to their frozen authored-px size (they
rendered correctly but did not reflow). The base non-cq fallback is unchanged.

## [2.0.0] — 2026-07-17

The **responsive engine** release: one generated button now fills any container
size and aspect ratio, live, with correct geometry throughout — verified in real
WebKit (Simulator Safari) at every step.

### Breaking

- **New `.btn-scale` wrapper.** Every button is now wrapped in an unconditional
  `.btn-scale` element (a `container-type: size` boundary), so the emitted markup
  gains one level: `.btn-grid > .btn-scale > .btn-housing > .btn-cell > …`. The
  container query moved off `.btn-cell` (no longer a container) onto `.btn-scale`.
  Re-export buttons, or update any consumer CSS/JS keyed to the old DOM depth. See
  the migration note in the README. The config API, `--clicky-*` theming contract,
  and class names are otherwise unchanged.

### Added

- **Live container-query geometry.** Housing, frame, corner radii, wall height,
  and press depth reflow against `.btn-scale` via cq units — the button fills its
  space at any size/ratio without regeneration.
- **Ratio-balanced frame.** Frame width scales off the shorter axis (`cqmin`), so
  the chrome ring stays a uniform, balanced band on wide-flat or tall-narrow
  buttons (was a fixed px band that fattened on the long axis).
- **Aspect-tracking frame bevel.** The conic frame-bevel stop angles are computed
  live with CSS `atan2()` against the housing dimensions, so the bevel highlight
  sweeps the real corner at any ratio (was frozen at the authored aspect ratio).
- **Size-scaled shadows.** The ambient/contact drop-shadow and the glow halo scale
  with the live wall height (were frozen px that read oversized when shrunk).
- **Interactive flexbox playground** in `gallery.html` — a resizable flex stage
  with live `flex-direction` / `justify-content` / `align-items` / `flex-wrap` /
  `gap` controls (each explained), three button fill modes, and a copyable CSS
  snippet. The showcase variation gallery is retained alongside it.

### Fixed

- **Pressed-state recess reveal.** The cavity top edge was pinned at wall-height,
  so once the cap descended to/past it, a band of bare housing chrome showed above
  the sinking cap (worst on tall buttons). The cavity top now tracks the descending
  cap, so the dark recess fills that band — it reads as a key sinking into a hole.
- The concentric chrome ring (`housing-radius === cap-radius + frame-width`) is now
  preserved *live* under resize, expressed as a textual `calc()` reference so it
  holds at every size by construction.
- `gridWrap` schema now accepts `wrap-reverse` (the control offered it, so exporting
  a `wrap-reverse` config no longer throws).
- `chromeRadiusOffset` control range aligned to its schema; the sync display clamps
  so a slider and its number box can never disagree.

### Internal

- Magic-tuning constants extracted with their physics invariants documented; three
  previously-duplicated cross-representation pairs single-sourced.
- The `chromeRadiusRatio` config key is now `chromeRadiusOffset` (a ± px offset on
  the derived concentric radius).

## [0.1.0]

Initial generator: skeuomorphic clicky-button designer with live controls, 2D/3D
preview, click/toggle/tri-state modes, per-button variants, segmented housings,
icons, and a dependency-free importable ES-module engine.
