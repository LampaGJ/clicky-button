'use strict';

// ── Easing presets ───────────────────────────────────────────
const EASING_PRESETS = {
  bouncy: [0.34, 1.56, 0.64, 1.0],
  snappy: [0.25, 0.1,  0.25, 1.0],
  soft:   [0.4,  0.0,  0.6,  1.0],
  linear: [0.0,  0.0,  1.0,  1.0],
  red:    [0.33, 0.0,  0.67, 1.0],
  brown:  [0.6,  0.05, 0.3,  1.0],
  blue:   [0.8,  0.0,  0.2,  1.25],
  black:  [0.5,  0.0,  0.7,  1.0],
  clear:  [0.7,  0.05, 0.4,  1.0],
  topre:  [0.45, 0.0,  0.55, 1.0],
  buckling: [0.9, 0.05, 0.5, 1.15],
  custom: null,
};

const SHADOW_EASING_PRESS   = 'linear';
const SHADOW_EASING_RELEASE = 'linear';

// ── Default configuration ──────────────────────────────────────
/**
 * Default config for a click-mode clicky button. Consumers spread this
 * and override the keys they care about.
 *
 * @typedef {object} ClickyConfig
 *
 * @property {number}  containerWidth      — px, 80–400 typical
 * @property {number}  containerHeight     — px, 40–200 typical
 * @property {number}  btnCount
 * @property {string}  btnLabels           — comma-separated
 * @property {'row'|'column'} gridDirection
 * @property {'wrap'|'nowrap'} gridWrap
 * @property {number}  gridGap             — px
 * @property {'center'|'flex-start'|'flex-end'|'space-between'|'space-around'} gridJustify
 * @property {'center'|'flex-start'|'flex-end'|'stretch'} gridAlign
 * @property {'separate'|'segmented'} housingLayout — issue #36. 'separate'
 *   (default, byte-identical to pre-#36 output — see D3): N independent
 *   housings, today's buildGridHtml/buildClickyGroupHtml behavior. 'segmented':
 *   N .btn-cell segments share ONE .btn-housing (flex row, no gap) — build
 *   via buildClickyGroupHtml, never buildClickyHtml (throws — a single button
 *   cannot express a shared housing). Runtime validateClickyConfig is
 *   typeof-only for this key; the enum + the cross-field rejects (gridWrap
 *   'wrap', btnCount > label count, duplicate segment slugs, missing
 *   groupLabel, mode 'radio' without 'segmented') are enforced explicitly in
 *   validateClickyConfig and mirrored in the Zod schema (test-side).
 * @property {number}  segmentDividerWidth — px; segmented-only divider ridge
 *   between adjacent segments (issue #36). Vars only emitted when
 *   housingLayout is 'segmented' (D3).
 * @property {string}  groupLabel          — aria-label for the segment
 *   group's role="group"/"radiogroup" (issue #36/#37). Required (non-empty)
 *   whenever housingLayout is 'segmented'. A buildClickyGroupHtml opts.groupLabel
 *   call-arg overrides this per-call (appearance in config, identity in call
 *   args — issue #37).
 * @property {number}  radiusRatio         — % of containerWidth
 * @property {Object<string, number>|null} radiusCorners — per-corner override
 *   (keys tl/tr/br/bl, ratio units matching radiusRatio); null = uniform
 *   radiusRatio path (default, byte-identical to pre-#35 output — see D3).
 *   Face/cap only — the chrome housing's chromeRadiusRatio stays uniform.
 * @property {number}  chromeRadiusRatio   — % of housing width
 * @property {number}  skewXAngle          — deg, parallelogram skew via
 *   skewX on `.btn-housing` (clamped to ±18 — issue #34, moved from
 *   `.btn-cell` to the housing by issue #40 so the chrome frame/cavity/wall/
 *   cap all shear as one rigid unit). 0 = no skew.
 * @property {number}  skewYAngle          — deg, vertical parallelogram skew
 *   via skewY on `.btn-housing`, composed with skewXAngle in one `transform`
 *   (issue #40). Clamped tighter than X, to ±8 — its housing-height widen
 *   term scales with housing WIDTH, which grows with segmentCount (see
 *   buildVarMap's W0/H0 space-reservation math). Both skewXAngle/skewYAngle
 *   at 0 = no skew (default, byte-identical to pre-#34 output — see D3).
 * @property {string}  faceColor           — hex
 * @property {string}  textColor           — hex
 * @property {number}  fontSizeRatio       — % of cqi
 * @property {string}  fontWeight
 * @property {number}  letterSpacing       — em
 * @property {number}  wallHRatio          — % of cqb (height)
 * @property {number}  pressDepthRatio     — % of cqb
 * @property {boolean} useButtonWallColor        — false: button-wall base = faceColor
 * @property {string}  buttonWallColor           — hex; used only when useButtonWallColor
 * @property {number}  buttonWallShadowAlpha     — %
 * @property {number}  buttonWallShadowEdgeRatio — %
 * @property {number}  buttonWallGradientSpread  — 0–100
 * @property {boolean} useCavityWallColor        — false: cavity-wall base = frameColor
 * @property {string}  cavityWallColor           — hex; used only when useCavityWallColor
 * @property {number}  cavityWallShadowAlpha     — %
 * @property {number}  cavityWallShadowEdgeRatio — %
 * @property {number}  cavityWallGradientSpread  — 0–100
 * @property {number}  insetDepthRatio     — %
 * @property {number}  insetBlurRatio      — %
 * @property {number}  insetAlphaTop       — %
 * @property {number}  insetAlphaBot       — %
 * @property {boolean} topHighlight
 * @property {string}  highlightColor      — hex
 * @property {number}  highlightOpacity    — %
 * @property {number}  rimHeightRatio      — %
 * @property {number}  faceEdgeAlpha       — %

 * @property {boolean} usePressColor
 * @property {string}  pressColor          — hex
 * @property {boolean} useToggleColor            — false: toggled face base = faceColor
 * @property {string}  toggleColor               — hex; used only when useToggleColor
 * @property {number}  pressDarken         — % — darken amount for pressed/toggled face + icon
 * @property {number}  ambientIntensity    — %
 * @property {number}  ambientBlurMult     — multiplier on wall_h_px
 * @property {number}  ambientYMult        — multiplier on wall_h_px
 * @property {number}  ambientPressReduction — %
 * @property {boolean} frameEnabled
 * @property {number}  frameWidth          — px
 * @property {string}  frameColorHi        — hex
 * @property {string}  frameColor          — hex
 * @property {string}  frameColorLo        — hex
 * @property {number}  frameBevelAlpha     — %
 * @property {number}  frameBevelWidth     — px
 * @property {boolean} frameBevelConic     — issue #18: false (default,
 *   byte-identical to pre-#18 output — see D3) keeps the four discrete
 *   straight-edge box-shadow bevel insets; true replaces them with a single
 *   `.btn-housing::after` conic-gradient ring (mask-composite gradient-
 *   border technique) so the highlight/shadow sweep follows the rounded
 *   chrome corner continuously instead of jumping at the corner vertex. The
 *   ring's transition-zone stop angles are computed per-instance in
 *   buildVarMap from the housing's actual aspect ratio and chrome radius
 *   (see computeFrameBevelConicStops) — never hardcoded degrees, since a
 *   fixed angle desyncs from non-square housings or a changed chromeRadiusRatio.
 * @property {'click'|'toggle'|'radio'} mode — 'radio' (issue #37, tri-state)
 *   is built on top of housingLayout 'segmented' ONLY — validateClickyConfig
 *   rejects 'radio' without 'segmented'. Reuses the toggle CSS wholesale
 *   (`.clicky-toggle:has(input:checked)` is input-type-agnostic); only the
 *   emitted `<input>` type/name/value/checked attributes differ, built by
 *   buildClickyGroupHtml.
 * @property {number}  speedFactor         — log10, -2..0
 * @property {number}  duration            — ms (release)
 * @property {number}  pressDuration       — ms
 * @property {keyof typeof EASING_PRESETS} easingPreset
 * @property {boolean} overshoot
 * @property {number}  bzX1
 * @property {number}  bzY1
 * @property {number}  bzX2
 * @property {number}  bzY2
 * @property {number}  toggleHeightRatio   — %
 * @property {number}  borderWidth         — px
 * @property {string}  borderColor         — hex
 * @property {string}  borderStyle
 * @property {string}  focusColor          — hex
 * @property {number}  focusSize           — px
 * @property {'tint'|'glow'|'outline'|'none'} focusStyle
 * @property {number}  hoverLift           — px (0 disables)
 * @property {boolean} textWrap            — false: nowrap
 * @property {number}  shadowAnimDelay     — % of press cycle (0 = full, 25 = middle 50%)
 * @property {number}  colorAnimDelay      — % of press cycle (0 = full, 25 = middle 50%)
 * @property {string}  iconName            — Material Symbols ligature name, '' = no icon
 * @property {'left'|'right'} iconPosition — side of the label the icon sits on
 * @property {number}  iconScale           — × label font-size (em)
 * @property {number}  iconGap             — px — space between icon and label
 * @property {boolean} iconUseColor        — false: icon inherits text color via currentColor
 * @property {string}  iconColor           — hex; used only when iconUseColor
 * @property {boolean} iconFill            — false: outline glyph; true: filled glyph
 * @property {'inline'|'edge'} iconPlacement — 'inline' (default, beside label) | 'edge'
 *   (absolutely pinned to the face edge, label stays centered — issue #30)
 * @property {number}  iconInset           — px — distance from the face edge when
 *   iconPlacement is 'edge'
 * @property {string}  iconSvg             — raw inline &lt;svg&gt; markup, embedded
 *   verbatim; '' = none. Takes precedence over iconName when non-empty (issue #31).
 *   This library does ZERO sanitization — sanitize before storing it in config.
 * @property {number}  specularAlpha       — % — 0 = no specular-hotspot gradient emitted
 * @property {number}  lightAngleX         — % — horizontal light-source position
 * @property {number}  lightAngleY         — % — vertical light-source position
 * @property {number}  specularSize        — % — specular gradient falloff radius
 * @property {number}  contactIntensity    — % — 0 = no second contact-shadow layer emitted
 * @property {Object<string, object>} variants
 *   — slug-keyed per-button overrides; each value may set faceColor/textColor/
 *   iconName/iconColor/toggleColor (whitelist — see issue #29; toggleColor
 *   added by issue #37 for per-segment tri-state latch accents, routed
 *   through the same deriveFaceColorFamily `over` mechanism as faceColor so
 *   the derived family can never partially reflect a variant's overrides)
 */
const defaultClickyConfig = {
  containerWidth:   180,
  containerHeight:   88,

  btnCount:           4,
  btnLabels:    'PLAY,STOP,REC,PAUSE',
  gridDirection:  'row',
  gridWrap:       'wrap',
  gridGap:          12,
  gridJustify:  'center',
  gridAlign:    'center',

  // Segmented housing (issue #36) / tri-state radio group (issue #37).
  // 'separate' (default) keeps every button in its own housing — byte-
  // identical to pre-#36 output (see D3). 'segmented' shares one housing
  // across N .btn-cell flex children; build it via buildClickyGroupHtml,
  // never buildClickyHtml (throws).
  housingLayout:      'separate',
  segmentDividerWidth:     2,
  groupLabel:             '',

  radiusRatio:        8,
  // Per-corner radius override (issue #35). null = uniform radiusRatio path
  // (legacy, byte-identical output — see D3); { tl, tr, br, bl } (ratio units
  // matching radiusRatio) switches every consumer site to independent
  // per-corner values. Face/cap only — chromeRadiusRatio (chrome housing)
  // stays a separate, uniform family (see buildVarMap).
  radiusCorners:   null,
  chromeRadiusRatio: 12,
  // Parallelogram skew (issue #34; moved to `.btn-housing` and extended to a
  // second axis by issue #40 — see resolveSkew). skewXAngle clamped ±18,
  // skewYAngle clamped ±8, both in buildVarMap (Zod mirrors the clamps for
  // authoring-time feedback, but the runtime validator is typeof-only — see
  // validateClickyConfig). Both 0 = no skew (default, byte-identical output
  // — see D3).
  skewXAngle:         0,
  skewYAngle:         0,
  faceColor:    '#c8c0b4',
  textColor:    '#1a1a1a',
  fontSizeRatio:      0,
  fontWeight:       '700',
  letterSpacing:    0.08,

  wallHRatio:        16,
  pressDepthRatio:   16,

  // Button wall — the moving side of the keycap. Color defaults to faceColor.
  useButtonWallColor:        false,
  buttonWallColor:           '#c8c0b4',
  buttonWallShadowAlpha:     85,
  buttonWallShadowEdgeRatio: 50,
  buttonWallGradientSpread:  20,

  // Cavity wall — the static housing slot. Color defaults to frameColor.
  useCavityWallColor:        false,
  cavityWallColor:           '#b8bcc0',
  cavityWallShadowAlpha:     85,
  cavityWallShadowEdgeRatio: 50,
  cavityWallGradientSpread:  20,
  insetDepthRatio:    8,
  insetBlurRatio:    12,
  insetAlphaTop:     55,
  insetAlphaBot:     28,
  topHighlight:    true,
  highlightColor: '#ffffff',
  highlightOpacity:  30,
  rimHeightRatio:    8,
  faceEdgeAlpha:     0,
  usePressColor:  false,
  pressColor:   '#b8b0a4',
  useToggleColor: false,
  toggleColor:  '#b8b0a4',
  pressDarken:      0,

  ambientIntensity:  25,
  ambientBlurMult:  3.0,
  ambientYMult:     1.5,
  ambientPressReduction: 50,

  frameEnabled:   true,
  frameWidth:       14,
  frameColorHi: '#e8e8ec',
  frameColor:   '#b8bcc0',
  frameColorLo: '#8c9094',
  frameBevelAlpha:  50,
  frameBevelWidth:   1,
  // Conic-gradient corner bevel (issue #18). false (default) keeps the four
  // discrete straight-edge box-shadow insets — byte-identical to pre-#18
  // output (D3). true swaps them for a `.btn-housing::after` conic-gradient
  // ring whose two transition zones are computed per-instance against the
  // real chrome radius (see computeFrameBevelConicStops), so the bevel
  // sweeps continuously around rounded corners instead of jumping at the
  // vertex.
  frameBevelConic: false,

  mode:          'click',
  speedFactor:       0,
  duration:        160,
  pressDuration:    80,
  easingPreset:  'bouncy',
  overshoot:      true,
  bzX1: 0.34, bzY1: 1.56, bzX2: 0.64, bzY2: 1.0,
  toggleHeightRatio: 50,

  borderWidth:      0,
  borderColor:  '#444444',
  borderStyle:  'solid',
  focusColor:   '#5b8dee',
  focusSize:        3,
  focusStyle:   'tint',

  hoverLift:        2,
  textWrap:       true,

  // Per-property animation timing (% of press cycle to wait before that
  // property starts changing; symmetric — same delay on the way back).
  // 0 = property animates over full cycle alongside transform.
  // 25 = property animates only during the middle 50% of the cycle.
  shadowAnimDelay:    0,
  colorAnimDelay:     0,

  // Icon (Material Symbols glyph on the button face)
  iconName:        '',        // '' = no icon; else a Material Symbols ligature, e.g. 'send'
  iconPosition:    'left',    // 'left' | 'right' — side of the label the icon sits on
  iconScale:        1.2,      // × the label font-size (em); icon scales with the button
  iconGap:          8,        // px — space between icon and label
  iconUseColor:   false,      // false = inherit text color; true = use iconColor
  iconColor:    '#1a1a1a',    // hex — used only when iconUseColor
  iconFill:       false,      // false = outline glyph; true = filled glyph

  // Edge-pinned icon layout (issue #30). 'inline' (default) keeps today's
  // beside-the-label layout; 'edge' absolutely positions the icon against the
  // face's inline edge while the label stays centered. Off by default so
  // pre-existing exports/snapshots stay byte-identical — see D3.
  iconPlacement:  'inline',   // 'inline' | 'edge'
  iconInset:        12,       // px — distance from the face edge in 'edge' mode

  // Inline SVG icon (issue #31) — an alternative to the Material Symbols
  // ligature. Precedence, not mutual exclusion: non-empty iconSvg wins over
  // iconName. Embedded as-is; sanitize before storing it in config — this
  // library does zero sanitization (see JSDoc on the ClickyConfig typedef).
  iconSvg:          '',       // raw inline <svg> markup, embedded verbatim; '' = none

  // Specular hotspot (realism pack #7a). Off by default (specularAlpha: 0)
  // so pre-existing exports/snapshots stay byte-identical — see D3.
  specularAlpha:    0,        // % — 0 = no gradient emitted at all
  lightAngleX:     50,        // % — horizontal light-source position
  lightAngleY:     25,        // % — vertical light-source position
  specularSize:    60,        // % — gradient falloff radius

  // Second, tight contact-shadow layer (realism pack #7c). Off by default
  // (contactIntensity: 0) so pre-existing exports/snapshots stay
  // byte-identical — see D3.
  contactIntensity: 0,        // % — 0 = no second shadow layer emitted at all

  // Per-button variants (issue #29) — slug-keyed overrides on top of the base
  // config, applied to individual buttons in a grid via the existing
  // `label-<slug>` CSS hook. v1 whitelist: faceColor/textColor/iconName/
  // iconColor only — see buildVariantsCss for why geometry isn't variant-able.
  // Empty by default so pre-existing exports/snapshots stay byte-identical.
  variants: {},
};

// ── Utilities ──────────────────────────────────────────────────

function isHexColor(str) {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(str);
}

function hexToRgba(color, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  if (!isHexColor(color)) {
    return `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`;
  }
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

function darkenColor(color, percent) {
  if (!isHexColor(color)) {
    return percent <= 0 ? color : `color-mix(in srgb, ${color} ${100 - percent}%, black)`;
  }
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const f = 1 - percent / 100;
  const r = Math.round(parseInt(hex.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(hex.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(hex.slice(4, 6), 16) * f);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Per-corner radius (issue #35) — replicates the CSS border-radius spec's own
// adjacent-corner overlap algorithm (https://www.w3.org/TR/css-backgrounds-3/
// #corner-overlap): for each of the 4 box edges, if the two corner radii
// sharing that edge sum to more than the edge's length, EVERY corner radius
// is scaled down by the smallest such ratio. Browsers apply this live at
// render time; this library bakes CSS at generation time (max(wall-h, radius)
// etc. are frozen strings, not live calc() over the *unclamped* corners), so
// without this JS-side pass the wall geometry could desync from the cap's
// browser-clamped silhouette — the exact corner-bleed failure mode #35 exists
// to prevent. Called AFTER each corner's own per-axis clamp (maxRadiusPx).
function clampRadiusCorners(tl, tr, br, bl, width, height) {
  const f = Math.min(
    1,
    width  / Math.max(1e-9, tl + tr),
    width  / Math.max(1e-9, bl + br),
    height / Math.max(1e-9, tl + bl),
    height / Math.max(1e-9, tr + br),
  );
  return f < 1 ? [tl * f, tr * f, br * f, bl * f] : [tl, tr, br, bl];
}

// Conic-gradient corner bevel (issue #18) — the housing's straight-edge
// box-shadow bevel (top+left lit, bottom+right shadowed, matching a
// top-left light source) reads correctly at the TOP-LEFT and BOTTOM-RIGHT
// corners, where both adjoining edges already agree on color — but at
// TOP-RIGHT and BOTTOM-LEFT, lit meets shadowed, and a straight-edge inset
// pair produces a hard jump right on the rounded corner arc. A conic-
// gradient ring fixes this IF its two transition zones are placed exactly
// where the rounded corner's fillet arc sits, not at a fixed 45°/225°
// (only correct for a square housing at a small radius).
//
// This replicates the CSS border-radius corner-fillet geometry directly:
// for a rect of half-width w / half-height h with corner radius r, the
// top-right fillet is a quarter-circle centered at (w-r, -(h-r)) (origin =
// box center, y negative = up) swept between its two tangent points — where
// it meets the straight top edge, (w-r, -h), and where it meets the
// straight right edge, (w, -(h-r)). Each tangent point is reprojected as a
// conic-gradient azimuth (0deg = up, clockwise) AS SEEN FROM THE BOX
// CENTER via atan2(x, -y) — the transition zone spans exactly the azimuth
// range between those two points, so it's automatically narrow for a small
// radius on a large housing and wide (up to the full 90° quadrant) as the
// radius approaches a stadium/pill shape. At r=0 tr-start === tr-end (a
// zero-width ramp — degrades to the same hard cut the old straight-edge
// bevel already had at a square corner, so nothing regresses there).
//
// Bottom-left is the point reflection of top-right through the box center
// (+180deg) — same fillet geometry, opposite side; top-left and
// bottom-right need no explicit stop since both their adjoining edges are
// already the same color.
function computeFrameBevelConicStops(housingW, housingH, chromeRadius) {
  const w = housingW / 2;
  const h = housingH / 2;
  const r = Math.max(0, Math.min(chromeRadius, w, h));
  const toDeg = rad => rad * 180 / Math.PI;
  const trStart = toDeg(Math.atan2(w - r, h));     // fillet meets the top edge
  const trEnd   = toDeg(Math.atan2(w, h - r));      // fillet meets the right edge
  return {
    trStart,
    trEnd,
    blStart: trStart + 180,
    blEnd:   trEnd + 180,
  };
}

// Parallelogram skew v2 (issue #40) — single clamp authority shared by every
// consumer site (buildVarMap's space-reservation math, buildGridCss's
// `.btn-housing` transform, buildButtonWallCss's counter-skew, and
// buildIconPlacementCss's edge-icon transform). A mismatch between sites
// would desync the reserved space from the transform actually painted, or
// the counter-skew from the shear it's meant to cancel — so every site reads
// through THIS function, never re-clamps state.skewXAngle/skewYAngle itself.
// X keeps issue #34's ±18° clamp (its housing-widen term scales with H0,
// which doesn't grow with segmentCount). Y is tighter, ±8° (issue #40 pin):
// its housing-widen term scales with W0, which DOES grow with segmentCount,
// so the same angle reserves proportionally more height on wide/segmented
// housings. Both 0 ⇒ active: false ⇒ every gated consumer below stays
// byte-identical to pre-#34 output (D3).
function resolveSkew(state) {
  const x = Math.max(-18, Math.min(18, state.skewXAngle || 0));
  const y = Math.max(-8, Math.min(8, state.skewYAngle || 0));
  return { x, y, active: x !== 0 || y !== 0 };
}

// ── Recess-shadow timing (single source, geometry-derived) ──────
// The face can only be shadowed by the channel once it is INSIDE the channel.
// It reaches the plate ("flush") after travelling its own wall height, so:
//
//   flushFrac = wallH / pressDepth
//
// press:   hold the resting shadow for flushFrac of the travel, then ramp
//          while the face sinks below the plate.
// release: ramp back out over the rise to flush (which is the FIRST
//          (1 - flushFrac) of the release), then hold.
//
// Those two windows are different lengths whenever pressDuration !== duration,
// so the timing lives in the keyframe offsets / per-property transition
// windows — not in one centred delay. `animates: false` means the key stops at
// or above flush and is never recessed, so the shadow must not move at all.
// Note pressFrac needs no speed/distance scaling: both durations scale by the
// same factor, so it cancels.
function resolveShadowTiming(state) {
  const wallH_px      = Math.max(1, Math.round(state.containerHeight * state.wallHRatio / 100));
  const pressDepth_px = Math.max(1, Math.round(state.containerHeight * state.pressDepthRatio / 100));
  const flushFrac = Math.min(1, Math.max(0, wallH_px / pressDepth_px));
  const manual    = Math.min(0.49, Math.max(0, (state.shadowAnimDelay || 0) / 100));
  const effFlush  = Math.min(1, flushFrac + manual * (1 - flushFrac));
  const pressFrac = state.pressDuration / (state.pressDuration + state.duration);
  return {
    flushFrac, effFlush, pressFrac,
    animates: effFlush < 0.995,
    // Cycle offsets (0..1) for the press-and-release keyframe animation.
    flushDown: effFlush * pressFrac,                               // face meets plate
    bottom:    pressFrac,                                          // deepest point
    flushUp:   pressFrac + (1 - effFlush) * (1 - pressFrac),       // face clears plate
  };
}

// Per-corner radius (issue #35) — the SAME border-radius declaration for
// .btn-cell, .btn-cell::before (cavity), and .btn-face (sharedFaceCssProps)
// — they must byte-match or the cavity clip disagrees with the cap's, and
// the cap disagrees with the cell that clips it. Uniform (radiusCorners
// null) keeps the single scalar var(--radius) — byte-identical to pre-#35
// output (D3); active per-corner composes the four scalars in CSS clock
// order (never a single opaque combined var — see buildVarMap).
function radiusBorderDecl(state) {
  return state.radiusCorners
    ? 'var(--radius-tl) var(--radius-tr) var(--radius-br) var(--radius-bl)'
    : 'var(--radius)';
}

// ── Internal builders ──────────────────────────────────────────

// Single source of truth for every keycap transform value (issue #12) — the
// wall and cap can never disagree at generation time because both read from
// this object instead of re-typing translateY(...) at each call site.
const KEYCAP_Y = {
  rest:    'translateY(0)',
  hover:   'translateY(calc(-1 * var(--hover-lift)))',
  pressed: 'translateY(var(--press-translate))',
  toggled: 'translateY(var(--toggle-height))',
};

function getTransformEasing(state) {
  if (state.easingPreset === 'custom') {
    return `cubic-bezier(${state.bzX1}, ${state.bzY1}, ${state.bzX2}, ${state.bzY2})`;
  }
  const preset = EASING_PRESETS[state.easingPreset] || EASING_PRESETS.bouncy;
  if (state.overshoot) {
    const [x1, y1, x2, y2] = preset;
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
  }
  return 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
}

// One source for the ambient/contact layer geometry, so the box-shadow and
// drop-shadow renderings below can never drift apart.
function housingShadowLayers(state, pressed) {
  const wallH_px = Math.max(1, Math.round(state.containerHeight * state.wallHRatio / 100));
  const keep = pressed ? 1 - (state.ambientPressReduction / 100) : 1;
  const ambient = {
    y: Math.round(wallH_px * state.ambientYMult * keep),
    blur: Math.round(wallH_px * state.ambientBlurMult * keep),
    color: `rgba(0, 0, 0, ${((state.ambientIntensity / 100) * keep).toFixed(3)})`,
  };
  const contact = state.contactIntensity > 0
    ? {
        y: Math.max(1, Math.round(wallH_px * 0.25 * keep)),
        blur: Math.max(2, Math.round(wallH_px * 0.5 * keep)),
        color: `rgba(0, 0, 0, ${(state.contactIntensity / 100).toFixed(3)})`,
      }
    : null;
  return { ambient, contact };
}

// A frameless housing paints nothing, so an outer box-shadow — which CSS clips
// OUT of its own caster's border box — leaves a bright, hard-edged rectangle of
// un-shadowed background that the key uncovers as it presses down (issue #54).
// drop-shadow is painted BEHIND the element instead, so it shows through the
// transparent region and no hole exists. Framed housings hide the hole behind
// their chrome, so they keep the cheaper, compositor-friendlier box-shadow.
function buildHousingDropShadow(state, pressed) {
  const { ambient, contact } = housingShadowLayers(state, pressed);
  const fn = l => `drop-shadow(0 ${l.y}px ${l.blur}px ${l.color})`;
  return fn(ambient) + (contact ? ` ${fn(contact)}` : '');
}

function buildHousingShadow(state, pressed) {
  const { ambient, contact } = housingShadowLayers(state, pressed);
  const wallH_px = Math.max(1, Math.round(state.containerHeight * state.wallHRatio / 100));
  const keep = pressed ? 1 - (state.ambientPressReduction / 100) : 1;
  const ambientY = ambient.y, ambientBlur = ambient.blur, ambientColor = ambient.color;

  // Second, tight contact-shadow layer (realism pack #7c). Off by default
  // (contactIntensity: 0 → no second layer emitted at all, per D3).
  // Unlike the diffuse ambient shadow above, a contact shadow reads as the
  // cap physically seated in the cavity — it must not fade as the cap
  // presses down, so its ALPHA is intentionally NOT scaled by `keep` (only
  // the offset/blur geometry is, so it visually tightens on press without
  // fading out — see issue #16 review; do not add `* keep` to the alpha).
  const contactCss = contact
    ? `, 0 ${contact.y}px ${contact.blur}px 0 ${contact.color}`
    : '';

  return `0 ${ambientY}px ${ambientBlur}px 0 ${ambientColor}${contactCss}`;
}

function buildFaceShadow(state, pressed, unit) {
  // unit: 'cqb' (default, live container-relative) | 'px' (generation-time
  // computed fallback for browsers that don't parse cq units — see D5).
  unit = unit === 'px' ? 'px' : 'cqb';
  const px = n => Math.round(n * state.containerHeight / 100);
  const len = n => unit === 'px' ? `${px(n)}px` : `${n}cqb`;

  const insetY   = state.insetDepthRatio;
  const insetB   = state.insetBlurRatio;
  const alphaTop = state.insetAlphaTop / 100;
  const alphaBot = state.insetAlphaBot / 100;
  const hlAlpha  = state.highlightOpacity / 100;

  const L0 = `inset 0 0 0 0 transparent`;

  const softColor = `rgba(0, 0, 0, ${alphaTop.toFixed(3)})`;
  const L1 = pressed
    ? `inset 0 ${len(insetY)} ${len(insetB)} 0 ${softColor}`
    : `inset 0 0 0 0 ${softColor}`;

  const botColor  = `rgba(0, 0, 0, ${alphaBot.toFixed(3)})`;
  const insetYBot = Math.round(insetY * 0.45);
  const insetBBot = Math.round(insetB * 0.65);
  const L2 = pressed
    ? `inset 0 -${len(insetYBot)} ${len(insetBBot)} 0 ${botColor}`
    : `inset 0 0 0 0 ${botColor}`;

  const hlColor = state.topHighlight
    ? hexToRgba(state.highlightColor, hlAlpha)
    : hexToRgba(state.highlightColor, 0);
  const rimBlur = Math.max(2, Math.round(state.rimHeightRatio * 0.5));
  const rimBlurLen = unit === 'px' ? `${Math.max(2, px(rimBlur))}px` : `${rimBlur}cqb`;
  const L3 = `inset 0 ${len(state.rimHeightRatio)} ${rimBlurLen} 0 ${hlColor}`;

  const edgeAlpha = (state.faceEdgeAlpha / 100).toFixed(3);
  const L4 = `inset 0 -1px 0 0 rgba(0, 0, 0, ${edgeAlpha})`;

  // The button wall (moving side of the keycap) is its own element, .btn-wall,
  // sitting behind the cap — see buildButtonWallCss. Keeping it a real rounded
  // element lets it carry the full L-R gradient while still hugging the cap's
  // rounded silhouette; it mirrors the cap's transform via parallel rules.
  return [L0, L1, L2, L3, L4].join(',\n    ');
}

// Single source of truth for the face-color→derived-family computation
// (issue #29's flagged riskiest part). --face-pressed / --face-toggled /
// --button-wall-color / --icon-color-pressed are all precomputed derivatives
// of faceColor/textColor/iconColor + the use-flags (usePressColor/
// useToggleColor/useButtonWallColor/iconUseColor) + pressDarken. Both the
// base var map (buildVarMap) and the per-variant CSS emitter (buildVariantsCss)
// call this SAME function so a variant's faceColor/textColor/iconColor can
// never recompute only some of the derived vars and silently desync the
// press/toggle animation from the base color.
//
// `over` lets a caller substitute just the inputs a variant actually
// overrides, while everything else (use-flags, pressColor, toggleColor,
// buttonWallColor, pressDarken) still comes from the base `state` — v1
// variants don't override those.
function deriveFaceColorFamily(state, over = {}) {
  const faceColor = over.faceColor !== undefined ? over.faceColor : state.faceColor;
  const iconColorBase = over.iconColorBase !== undefined
    ? over.iconColorBase
    : (state.iconUseColor ? state.iconColor : state.textColor);
  // toggleColor override (issue #37) — an explicit override forces the
  // toggled-family derivation to use it regardless of the base useToggleColor
  // flag: a variant setting toggleColor (e.g. a tri-state segment's latch
  // accent) is an unambiguous per-segment request, not conditional on a
  // global flag the caller may never have touched. Base var-map calls never
  // pass over.toggleColor, so this is byte-identical to pre-#37 output (D3).
  const useToggle = over.toggleColor !== undefined ? true : state.useToggleColor;
  const toggleColorValue = over.toggleColor !== undefined ? over.toggleColor : state.toggleColor;
  return {
    facePressed:      darkenColor(state.usePressColor  ? state.pressColor  : faceColor, state.pressDarken),
    faceToggled:      darkenColor(useToggle ? toggleColorValue : faceColor, state.pressDarken),
    buttonWallColor:  state.useButtonWallColor ? state.buttonWallColor : faceColor,
    iconColorPressed: darkenColor(iconColorBase, state.pressDarken),
  };
}

function buildVarMap(state) {
  const fwRaw = state.frameEnabled ? state.frameWidth : 0;
  const fwMaxByWidth  = Math.floor(state.containerWidth  * 0.25);
  const fwMaxByHeight = Math.floor(state.containerHeight * 0.40);
  const fw = Math.min(fwRaw, fwMaxByWidth, fwMaxByHeight);

  const wallH_px = Math.max(1, Math.round(state.containerHeight * state.wallHRatio / 100));
  const pressDepth_px = Math.max(1, Math.round(state.containerHeight * state.pressDepthRatio / 100));

  const insetY_px = Math.round(state.containerHeight * state.insetDepthRatio / 100);
  const distScale = Math.max(0.5, Math.min(3, (pressDepth_px + insetY_px) / 21));

  const faceH_px    = state.containerHeight - wallH_px;
  const maxRadiusPx = Math.min(
    Math.floor(state.containerWidth  / 2),
    Math.floor(faceH_px             / 2),
    Math.floor(state.containerHeight / 2)
  );
  const radius_px = Math.min(
    Math.round(state.containerWidth * state.radiusRatio / 100),
    maxRadiusPx
  );

  // Per-corner radius (issue #35). radiusCorners === null is the uniform
  // legacy path — radiusTL_px..radiusBL_px all equal radius_px (the SAME
  // value computed above), so every consumer that switches to the per-corner
  // vars below is byte-identical to today whenever they're not in use. Only
  // when radiusCorners is a { tl, tr, br, bl } object do the four values
  // diverge, each independently clamped by the existing per-axis maxRadiusPx
  // and then by the adjacent-sum pairwise clamp (clampRadiusCorners) that
  // replicates the browser's own live proportional shrink — necessary
  // because the wall's max(wall-h, radius) math below is generation-time-
  // frozen and gets no browser safety net of its own.
  const cornersCfg = state.radiusCorners;
  let radiusTL_px, radiusTR_px, radiusBR_px, radiusBL_px;
  if (cornersCfg) {
    const cornerPx = ratio => Math.min(
      Math.round(state.containerWidth * ratio / 100),
      maxRadiusPx
    );
    const [tl, tr, br, bl] = clampRadiusCorners(
      cornerPx(cornersCfg.tl), cornerPx(cornersCfg.tr),
      cornerPx(cornersCfg.br), cornerPx(cornersCfg.bl),
      state.containerWidth, state.containerHeight
    );
    radiusTL_px = Math.round(tl);
    radiusTR_px = Math.round(tr);
    radiusBR_px = Math.round(br);
    radiusBL_px = Math.round(bl);
  } else {
    radiusTL_px = radiusTR_px = radiusBR_px = radiusBL_px = radius_px;
  }
  // Wall-top offset needs the max of the two TOP corners; the wall's own
  // border-radius needs only the two BOTTOM corners — composed directly at
  // that CSS site (buildButtonWallCss) via the CSS max() 3-arg form, so no
  // JS-side precomputed top-max value is needed here.

  // Parallelogram skew v2 (issue #40) — shear moved from `.btn-cell` to
  // `.btn-housing` (housing + frame + cavity + wall + cap all shear as one
  // rigid unit), extended to a second (Y) axis. Clamps live in resolveSkew,
  // the single shared authority every consumer site below and in
  // buildGridCss/buildButtonWallCss/buildIconPlacementCss reads through.
  const skew = resolveSkew(state);
  const tanX = Math.tan(skew.x * Math.PI / 180);
  const tanY = Math.tan(skew.y * Math.PI / 180);

  // Segmented housing (issue #36) — the housing must be wide enough to hold
  // N side-by-side segments, not just one containerWidth (a bug caught in
  // browser verification: without this, N segments get flex-shrunk/clipped
  // into a single-button-wide box). segmentCount is always 1 in the default
  // ('separate') path, so W0's formula is byte-identical to pre-#36 output
  // whenever segmented isn't in use (D3).
  const segmentCount = state.housingLayout === 'segmented' ? Math.max(1, getLabels(state).length) : 1;
  const segmentDividersTotal_px = segmentCount > 1 ? (segmentCount - 1) * state.segmentDividerWidth : 0;

  // Base (pre-skew) housing dims — issue #40 pin §2's W0/H0, the SAME
  // pre-#34 housingW/housingH formulas (segment-aware width, frame-aware
  // height). Space reservation is computed from these bases directly, no
  // fixed-point iteration needed.
  const W0 = segmentCount > 1
    ? segmentCount * state.containerWidth + segmentDividersTotal_px + 2 * fw
    : state.containerWidth + 2 * fw;
  // Equal ring is measured around the CHANNEL — the opening the key sinks
  // into — not around the resting key. At rest the key stands proud and
  // covers the top chrome (correct: a keycap sits above its plate); pressed
  // FLUSH (descended by wallH) the face lands inside an even fw ring.
  //
  //   restingChromeAbove (cellTop) = max(0, fw - wallH)   // never negative:
  //                                  a proud key must not clip on the housing
  //   H0 = max(fw, wallH) + faceH + fw
  //
  // ⇒ ring at flush is fw top AND bottom whenever wallH <= fw. A wall deeper
  // than the frame rises higher than the plate's ring, so its top ring reads
  // wallH — the honest projection, and still unclipped. Reduces to the
  // historical containerHeight + fw for both the default (wallH === fw) and
  // frameless (fw === 0) — why that formula looked right for those and
  // drifted only in between.
  const H0 = Math.max(fw, wallH_px) + faceH_px + fw;

  // Space reservation (issue #40 pin §2) — both axes, plus the X cross-term
  // that combined skewX·skewY introduces (a sheared-then-sheared parallelo-
  // gram's horizontal extent grows by more than skewX alone accounts for).
  // widenY_px scales with W0 (width) — which DOES grow with segmentCount —
  // the reason skewYAngle's clamp (resolveSkew) is tighter than X's. Both
  // angles 0 ⇒ tanX === tanY === 0 ⇒ both widen terms are exactly 0 ⇒
  // housingW/housingH are byte-identical to pre-#40 (and pre-#34) output —
  // see D3.
  const widenX_px = skew.active
    ? Math.ceil(H0 * Math.abs(tanX) + W0 * Math.abs(tanX * tanY))
    : 0;
  const widenY_px = skew.active
    ? Math.ceil(W0 * Math.abs(tanY))
    : 0;

  const housingW = W0 + widenX_px;
  const housingH = H0 + widenY_px;
  const chromeRadius_px = fw > 0
    ? Math.min(
        Math.round(housingW * state.chromeRadiusRatio / 100),
        Math.floor(housingW / 2),
        Math.floor(housingH / 2)
      )
    : radius_px;
  const borderDecl = state.borderWidth > 0
    ? `${state.borderWidth}px ${state.borderStyle} ${state.borderColor}`
    : 'none';

  const ambientY_px    = Math.round(wallH_px * state.ambientYMult);
  const ambientBlur_px = Math.round(wallH_px * state.ambientBlurMult);
  const ambientAlpha   = state.ambientIntensity / 100;
  const ambientColor   = `rgba(0, 0, 0, ${ambientAlpha.toFixed(3)})`;

  const faceFamily = deriveFaceColorFamily(state);

  return {
    '--grid-direction':  state.gridDirection,
    '--grid-wrap':       state.gridWrap,
    '--grid-gap':       `${state.gridGap}px`,
    '--grid-justify':    state.gridJustify,
    '--grid-align':      state.gridAlign,

    '--housing-width':  `${housingW}px`,
    '--housing-height': `${housingH}px`,

    '--container-width':  `${state.containerWidth}px`,
    '--container-height': `${state.containerHeight}px`,

    '--radius':     `${radius_px}px`,
    '--radius-bot': `${chromeRadius_px}px`,

    // Per-corner radius (issue #35) — FOUR scalar vars, not one composed
    // 4-value string (an opaque combined var can't feed calc() algebra at
    // the wall-top max() / icon-clearance padding sites). Emitted only when
    // radiusCorners is in use, so the uniform default keeps referencing the
    // single --radius var everywhere and stays byte-identical (D3).
    ...(cornersCfg ? {
      '--radius-tl': `${radiusTL_px}px`,
      '--radius-tr': `${radiusTR_px}px`,
      '--radius-br': `${radiusBR_px}px`,
      '--radius-bl': `${radiusBL_px}px`,
    } : {}),

    // Parallelogram skew v2 (issue #40) — emitted only when either axis is
    // non-zero, so default output stays byte-identical (D3). Both vars are
    // always emitted TOGETHER when active (even if one axis is itself still
    // 0deg) — buildGridCss's `.btn-housing` transform and buildButtonWallCss's
    // counter-skew both reference both vars unconditionally once active, per
    // the issue #40 pin's composed-inverse math (§4), which needs both
    // angles present regardless of which one a caller actually changed.
    ...(skew.active ? {
      '--skew-x-angle': `${skew.x}deg`,
      '--skew-y-angle': `${skew.y}deg`,
    } : {}),
    // `--skew-widen-y` backs `.btn-cell`'s housing-relative top-centering
    // (buildGridCss); emitted only when the Y widen is actually non-zero —
    // the CSS site falls back to `var(--skew-widen-y, 0px)` when X-only skew
    // is active and there's no vertical widen to center against.
    ...(widenY_px !== 0 ? {
      '--skew-widen-y': `${widenY_px}px`,
    } : {}),

    // Segmented housing (issue #36) — emitted only when in use, so default
    // ('separate') output stays byte-identical (D3).
    ...(state.housingLayout === 'segmented' ? {
      '--segment-divider-width': `${state.segmentDividerWidth}px`,
    } : {}),

    '--face-color':      state.faceColor,
    '--face-pressed':    faceFamily.facePressed,
    '--face-toggled':    faceFamily.faceToggled,
    '--text-color':      state.textColor,
    '--font-size':       state.fontSizeRatio > 0
      ? `${Math.round(state.containerWidth * state.fontSizeRatio / 100)}px`
      : `min(${Math.round(state.containerWidth * 0.08)}px, ${Math.round(state.containerHeight * 0.22)}px)`,
    '--font-weight':     state.fontWeight,
    '--letter-spacing': `${state.letterSpacing}em`,
    '--border':          borderDecl,
    '--focus-color':     state.focusColor,
    '--focus-size':     `${state.focusSize}px`,
    '--hover-lift':     `${state.hoverLift}px`,
    '--text-wrap':       state.textWrap ? 'normal' : 'nowrap',

    // Icon (Material Symbols glyph on the face). --icon-color inherits the text
    // color via currentColor unless an independent icon color is enabled.
    '--icon-size':  `${state.iconScale}em`,
    '--icon-gap':   `${state.iconGap}px`,
    '--icon-color':  state.iconUseColor ? state.iconColor : 'currentColor',
    '--icon-fill':   state.iconFill ? '1' : '0',
    '--icon-color-pressed': faceFamily.iconColorPressed,

    // Edge-pinned icon (issue #30) — vars only emitted when the feature is
    // in use, so default output (iconPlacement: 'inline') stays byte-identical
    // to pre-#30 snapshots (D3).
    ...(state.iconPlacement === 'edge' ? {
      '--icon-inset':     `${state.iconInset}px`,
      '--icon-clearance': `calc(var(--icon-inset) + var(--icon-size) + var(--icon-gap))`,
    } : {}),

    // Specular hotspot (realism pack #7a) — vars emitted unconditionally
    // (harmless); the gradient itself is emitted conditionally in
    // sharedFaceCssProps, gated on specularAlpha > 0.
    '--light-x':        `${state.lightAngleX}%`,
    '--light-y':         `${state.lightAngleY}%`,
    '--specular-alpha': `${(state.specularAlpha / 100).toFixed(3)}`,
    '--specular-size':  `${state.specularSize}%`,

    // Button wall = the moving side of the keycap (defaults to the face color);
    // cavity wall = the static housing slot. With a frame it defaults to the
    // chrome frame color; frameless, it defaults to a darkened wall color so
    // the revealed channel always reads as occluded (darker than the wall).
    // Each wall has its own independent color / alpha / edge-darken / gradient.
    '--button-wall-color': faceFamily.buttonWallColor,
    '--button-wall-shadow-alpha': `${(state.buttonWallShadowAlpha / 100).toFixed(3)}`,
    '--button-wall-shadow-edge-ratio': `${(state.buttonWallShadowEdgeRatio / 100).toFixed(3)}`,
    '--button-wall-gradient-lo': `${50 - state.buttonWallGradientSpread / 2}%`,
    '--button-wall-gradient-hi': `${50 + state.buttonWallGradientSpread / 2}%`,

    '--cavity-wall-color': state.useCavityWallColor ? state.cavityWallColor
      : state.frameEnabled ? state.frameColor
      : darkenColor(faceFamily.buttonWallColor, 45),
    '--cavity-wall-shadow-alpha': `${(state.cavityWallShadowAlpha / 100).toFixed(3)}`,
    '--cavity-wall-shadow-edge-ratio': `${(state.cavityWallShadowEdgeRatio / 100).toFixed(3)}`,
    '--cavity-wall-gradient-lo': `${50 - state.cavityWallGradientSpread / 2}%`,
    '--cavity-wall-gradient-hi': `${50 + state.cavityWallGradientSpread / 2}%`,

    '--ambient-color':  `${ambientColor}`,
    '--ambient-blur':   `${ambientBlur_px}px`,
    '--ambient-y':      `${ambientY_px}px`,
    '--ambient-spread': `0px`,
    '--housing-shadow':         buildHousingShadow(state, false),
    '--housing-shadow-pressed': buildHousingShadow(state, true),
    // Frameless only (issue #54): the same layers rendered as a filter, so the
    // shadow is not clipped out of the housing's own transparent box.
    ...(state.frameEnabled ? {} : {
      '--housing-drop-shadow':         buildHousingDropShadow(state, false),
      '--housing-drop-shadow-pressed': buildHousingDropShadow(state, true),
    }),

    '--face-shadow-resting': buildFaceShadow(state, false, 'px'),
    // A key whose travel never carries it past flush is never inside the
    // channel, so nothing can cast a recess shadow on it: its "pressed"
    // shadow IS its resting shadow. (Otherwise the zero-length ramp this
    // implies would snap the shadow on at the bottom of the travel.)
    '--face-shadow-pressed': buildFaceShadow(state, resolveShadowTiming(state).animates, 'px'),

    '--wall-h':          `${wallH_px}px`,
    '--press-translate': `${pressDepth_px}px`,
    '--toggle-height':   `${Math.round(pressDepth_px * state.toggleHeightRatio / 100)}px`,

    '--frame-width':     `${fw}px`,
    '--frame-color':      state.frameColor,
    '--frame-color-hi':   state.frameColorHi,
    '--frame-color-lo':   state.frameColorLo,
    '--frame-bevel-alpha':        `${(state.frameBevelAlpha / 100).toFixed(3)}`,
    '--frame-bevel-alpha-shadow': `${(state.frameBevelAlpha / 100 * 0.7).toFixed(3)}`,
    '--frame-bevel-width':        `${state.frameBevelWidth}px`,

    // Conic-gradient corner bevel (issue #18) — emitted only when in use, so
    // default output (frameBevelConic: false) stays byte-identical (D3).
    // Stop angles computed per-instance against THIS housing's real aspect
    // ratio + chrome radius (computeFrameBevelConicStops) — never hardcoded
    // degrees, per the design review's explicit instruction.
    ...(state.frameBevelConic ? (() => {
      const stops = computeFrameBevelConicStops(housingW, housingH, chromeRadius_px);
      return {
        '--frame-bevel-conic-tr-start': `${stops.trStart.toFixed(2)}deg`,
        '--frame-bevel-conic-tr-end':   `${stops.trEnd.toFixed(2)}deg`,
        '--frame-bevel-conic-bl-start': `${stops.blStart.toFixed(2)}deg`,
        '--frame-bevel-conic-bl-end':   `${stops.blEnd.toFixed(2)}deg`,
      };
    })() : {}),

    '--duration':       `${Math.round(state.duration * Math.pow(10, -state.speedFactor) * distScale)}ms`,
    '--press-duration': `${Math.round(state.pressDuration * Math.pow(10, -state.speedFactor) * distScale)}ms`,

    // Per-property animation timing (fractions of total press cycle).
    // Symmetric delays — same wait at start and end of cycle. Each property
    // animates over (1 - 2 * delay) of the total duration, centered.
    //
    // Recess-shadow timing is derived from the geometry, not guessed. The
    // face only receives an inset shadow once it is BELOW the plate — i.e.
    // after it has travelled its wall height and gone flush. Before that it
    // stands proud and nothing can shadow it.
    //
    //   flushFrac = wallH / pressDepth   — the point in the travel that the
    //                                      face reaches the plate surface
    //
    // Press:   wait flushFrac of the press, then ramp over the rest (sinking).
    // Release: ramp down immediately over the rise back to flush — the
    //          shadow is gone the instant the face clears the plate — then wait.
    // The two windows are ASYMMETRIC, which is why this cannot be expressed as
    // one centred delay (the old symmetric model was only right when the press
    // and release durations happened to match).
    // flushFrac >= 1 ⇒ the key stops at or above flush and never sinks into
    // the channel ⇒ no recess shadow at all (see faceShadowAnimates).
    ...(function () {
      const flushFrac = pressDepth_px > 0
        ? Math.min(1, Math.max(0, wallH_px / pressDepth_px))
        : 1;
      // Manual slider pushes the ramp later still (0 = pure geometry).
      const manualFrac = Math.min(0.49, Math.max(0, state.shadowAnimDelay / 100));
      const effFlush = Math.min(1, flushFrac + manualFrac * (1 - flushFrac));
      const colorFrac = Math.min(0.49, state.colorAnimDelay / 100);
      return {
        '--shadow-flush-frac': effFlush.toFixed(3),
        // Windows for the pure-CSS :active/toggle transitions.
        '--shadow-press-delay': `calc(var(--press-duration) * ${effFlush.toFixed(3)})`,
        '--shadow-press-dur':   `calc(var(--press-duration) * ${(1 - effFlush).toFixed(3)})`,
        '--shadow-release-dur': `calc(var(--duration) * ${(1 - effFlush).toFixed(3)})`,
        '--color-anim-delay-frac':  colorFrac.toFixed(3),
        '--color-anim-frac':        Math.max(0.01, 1 - 2 * colorFrac).toFixed(3),
      };
    })(),

    '--transform-easing':     getTransformEasing(state),
    '--shadow-ease-press':    SHADOW_EASING_PRESS,
    '--shadow-ease-release':  SHADOW_EASING_RELEASE,
  };
}

// ── Scoping (item #3 / D4) ──────────────────────────────────────
// Central post-processor: prefixes every top-level (and one-level-nested,
// e.g. inside @media) selector with the scope, and suffixes every
// @keyframes name with a deterministic hash of the scope string, so N
// differently-scoped buttons on one page never collide. Comment-aware,
// brace-depth-aware line-based state machine — safe because every builder
// in this file emits one selector per line with `{` ending the line.

const KEYFRAME_NAMES = [
  'clicky-transform-cycle',
  'clicky-shadow-cycle',
  'clicky-color-cycle',
  'toggle-press-on',
  'toggle-press-off',
  'toggle-xform-on',
  'toggle-xform-off',
];

function djb2Base36(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash * 33) ^ str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function getIndent(line) {
  return line.match(/^\s*/)[0];
}

function scopeCssBlock(css, scope) {
  const hash = djb2Base36(scope);

  // Pass 1: rename every keyframe reference (definition + animation/
  // animation-name references) via a whole-word replace on the known,
  // fixed set of 7 names — no name is a substring of another, so one pass
  // per name is safe. The negative lookahead makes this idempotent.
  let renamed = css;
  for (const name of KEYFRAME_NAMES) {
    const re = new RegExp(`\\b${name}\\b(?!-${hash})`, 'g');
    renamed = renamed.replace(re, `${name}-${hash}`);
  }

  const isAlreadyScoped = sel =>
    sel === scope || sel.startsWith(scope + ' ') || sel.startsWith(scope + ',');

  // Pass 2: prefix selectors. Comment-aware, brace-depth-aware line scan.
  const lines = renamed.split('\n');
  const out = [];
  // 'top'            — top level; selectors here get prefixed.
  // 'atrule'         — inside @media/@supports, before its nested rule
  //                     body; selectors here (one level in) get prefixed.
  // 'ruleBody'       — inside a normal selector rule's declarations —
  //                     untouched, including multi-line value continuations.
  // 'keyframes' /
  // 'keyframesInner' — inside @keyframes — untouched (offsets, declarations,
  //                     the @keyframes line itself already renamed above).
  const stack = ['top'];
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = getIndent(line);

    if (inBlockComment) {
      out.push(line);
      if (trimmed.includes('*/')) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
      inBlockComment = true;
      out.push(line);
      continue;
    }
    if (trimmed === '') { out.push(line); continue; }

    const ctx = stack[stack.length - 1];

    if (ctx === 'keyframes' || ctx === 'keyframesInner') {
      out.push(line);
      if (trimmed === '}') { stack.pop(); continue; }
      if (trimmed.endsWith('{')) stack.push('keyframesInner');
      continue;
    }

    if (ctx === 'ruleBody') {
      out.push(line);
      if (trimmed === '}') stack.pop();
      continue;
    }

    // ctx is 'top' or 'atrule' — selector-scanning context.
    if (trimmed === '}') { stack.pop(); out.push(line); continue; }
    if (trimmed.startsWith('@keyframes')) { out.push(line); stack.push('keyframes'); continue; }
    if (trimmed.startsWith('@media') || trimmed.startsWith('@supports')) { out.push(line); stack.push('atrule'); continue; }

    if (trimmed.includes('{') && trimmed.endsWith('}')) {
      // Complete single-line rule: "selector(s) { declarations }".
      const openIdx = trimmed.indexOf('{');
      const selector = trimmed.slice(0, openIdx).trim();
      const restPart = trimmed.slice(openIdx);
      out.push(isAlreadyScoped(selector) ? `${indent}${trimmed}` : `${indent}${scope} ${selector} ${restPart}`);
      continue;
    }

    if (trimmed.endsWith('{')) {
      const selector = trimmed.slice(0, -1).trim();
      out.push(isAlreadyScoped(selector) ? `${indent}${trimmed}` : `${indent}${scope} ${selector} {`);
      stack.push('ruleBody');
      continue;
    }

    if (trimmed.endsWith(',')) {
      const selector = trimmed.slice(0, -1).trim();
      out.push(isAlreadyScoped(selector) ? `${indent}${trimmed}` : `${indent}${scope} ${selector},`);
      continue;
    }

    out.push(line);
  }

  return out.join('\n');
}

function buildCss(state, scopeSelector) {
  const vars = buildVarMap(state);
  const varLines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  // mode 'radio' (issue #37) reuses the toggle CSS wholesale — the pinned
  // design's whole point: `.clicky-toggle:has(input:checked)` doesn't care
  // about input type, so a tri-state radio segment gets every transform/
  // shadow/color state for free. Only buildToggleFaceCss's visually-hidden
  // input selector needs to know which type is actually in play (see there).
  const isToggle = state.mode === 'toggle' || state.mode === 'radio';

  // Container-query fallback (D5): the base block above carries px-computed
  // values for --font-size / --face-shadow-resting / --face-shadow-pressed
  // so pre-16.0 Safari (and any engine that can't parse cqi/cqb) still gets
  // a valid, generation-time-frozen layout. Browsers that DO support cq
  // units get the live, container-responsive versions via this override.
  const fontSizeCq = state.fontSizeRatio > 0
    ? `${state.fontSizeRatio}cqi`
    : `min(8cqi, 22cqb)`;
  const faceShadowRestingCq = buildFaceShadow(state, false, 'cqb');
  // Same never-recessed gate as the px base block — the two must agree or the
  // cq-capable and fallback paths would disagree about whether a key that
  // stops at flush gets a recess shadow.
  const faceShadowPressedCq = buildFaceShadow(state, resolveShadowTiming(state).animates, 'cqb');
  const cqSupportsBlock = `@supports (width: 1cqi) {
    ${scopeSelector} {
      --font-size: ${fontSizeCq};
      --face-shadow-resting: ${faceShadowRestingCq};
      --face-shadow-pressed: ${faceShadowPressedCq};
    }
  }`;

  // Everything below gets centrally scoped (item #3 / D4): every top-level
  // selector (and selectors one level inside @media) is prefixed with
  // scopeSelector, and every @keyframes name is suffixed with a hash of the
  // scope string. The var block and @supports block ABOVE already carry the
  // literal scopeSelector via direct interpolation and must NEVER be passed
  // through scopeCssBlock — doing so would double-prefix `:root` into
  // `:root :root` and make the @supports override unreachable.
  let rest = '';
  rest += buildGridCss(state);
  rest += '\n\n';
  rest += isToggle ? buildToggleFaceCss(state) : buildClickFaceCss(state);
  rest += '\n\n';
  rest += buildButtonWallCss(state);
  // Inline SVG icon (issue #31) — appended only when in use (D3).
  const iconSvgCss = buildIconSvgCss(state);
  if (iconSvgCss) {
    rest += '\n\n';
    rest += iconSvgCss;
  }
  // Edge-pinned icon (issue #30) — appended only when in use (D3).
  const iconPlacementCss = buildIconPlacementCss(state);
  if (iconPlacementCss) {
    rest += '\n\n';
    rest += iconPlacementCss;
  }
  // Per-button variants (issue #29) — appended before scopeCssBlock runs, only
  // when non-empty, so byte-identical default output (D3) is preserved.
  const variantsCss = buildVariantsCss(state);
  if (variantsCss) {
    rest += '\n\n';
    rest += variantsCss;
  }
  const scopedRest = scopeCssBlock(rest, scopeSelector);

  let css = `/* --- Clicky Button --- */\n`;
  css += `${scopeSelector} {\n${varLines}\n}\n\n`;
  css += cqSupportsBlock;
  css += '\n\n';
  css += scopedRest;
  return css;
}

/* The button wall (moving side of the keycap) is its OWN element, .btn-wall,
   painted before .btn-face so the cap overlays it. It is a rounded copy of the
   cap shifted straight down (top = wall-h + hover-lift), so its rounded bottom
   edge hugs the cap's silhouette at any radius — and being a real element it can
   carry the full L-R gradient. It mirrors the cap's transform through parallel
   hover / press / toggle rules in buildClickFaceCss / buildToggleFaceCss. */
function buildButtonWallCss(state) {
  // Per-corner radius (issue #35) — radiusCorners null keeps the uniform
  // scalar var(--radius) expressions byte-identical to pre-#35 output (D3).
  // Active: the top offset needs the max of the two TOP corners; the wall's
  // own bottom-only border-radius needs the two BOTTOM corners — never the
  // same pair (per the expert-pinned var scheme).
  const cornersActive = !!state.radiusCorners;
  const topExpr = cornersActive
    ? 'calc(max(var(--wall-h), var(--radius-tl), var(--radius-tr)) + var(--hover-lift))'
    : 'calc(max(var(--wall-h), var(--radius)) + var(--hover-lift))';
  const heightExpr = cornersActive
    ? 'calc(100% - max(var(--wall-h), var(--radius-tl), var(--radius-tr)))'
    : 'calc(100% - max(var(--wall-h), var(--radius)))';
  const wallRadiusExpr = cornersActive
    ? '0 0 var(--radius-br) var(--radius-bl)'
    : '0 0 var(--radius) var(--radius)';

  // Parallelogram skew v2 (issue #40) — counter-skew on the label/icon so
  // text stays upright while `.btn-housing` (now the shear owner, per the
  // pin's §1) shears everything below it, wall+cap included. Emitted only
  // when either axis is non-zero (D3); the wall itself needs no transform of
  // its own — it's a descendant of the same skewed `.btn-housing` and shears
  // for free.
  //
  // Reversed order, negated (issue #40 pin §4) — NOT skewX(-a) skewY(-b).
  // `skewX(a) skewY(b)` composes to matrix [[1+tanA·tanB, tanA],[tanB, 1]];
  // its inverse is `SkewY(-b)·SkewX(-a)` (verified by direct multiplication —
  // same-order negation does NOT invert it once both angles are nonzero).
  const skew = resolveSkew(state);
  const counterSkewCss = skew.active
    ? `\n\n.btn-label,\n.btn-icon {\n  transform: skewY(calc(-1 * var(--skew-y-angle))) skewX(calc(-1 * var(--skew-x-angle)));\n}`
    : '';

  return `/* Button wall — moving side of the keycap, behind the cap. */
.btn-wall {
  position: absolute;
  left: 0;
  right: 0;
  /* True extrusion of the cap, not a congruent copy: a square-topped slab
     that starts below the cap's corner arcs (max(wall-h, radius)) so its
     straight sides fill the corner waist a shifted copy would leave, rounded
     only at the bottom. The square top stays hidden behind the opaque cap
     (both share every transform). The extra hover-lift overshoots the clipped
     cell bottom at rest, then pulls flush on hover so the rising key never
     exposes a strip of cavity. */
  top: ${topExpr};
  height: ${heightExpr};
  border-radius: ${wallRadiusExpr};
  background-color: var(--button-wall-color);
  background-image: linear-gradient(
    to right,
    rgba(0, 0, 0, var(--button-wall-shadow-alpha))                                                  0%,
    rgba(0, 0, 0, calc(var(--button-wall-shadow-alpha) * var(--button-wall-shadow-edge-ratio))) var(--button-wall-gradient-lo),
    rgba(0, 0, 0, calc(var(--button-wall-shadow-alpha) * var(--button-wall-shadow-edge-ratio))) var(--button-wall-gradient-hi),
    rgba(0, 0, 0, var(--button-wall-shadow-alpha))                                                100%
  );
  background-blend-mode: multiply;
  pointer-events: none;
  transition: transform 100ms ease-out;
}

/* Button label — wraps the face text so it stays clipped to the cap. */
.btn-label {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  white-space: inherit;
}

/* Button icon — a Material Symbols glyph rendered as a ligature beside the
   label. Self-contained font declaration so exported buttons need only the
   Material Symbols Rounded font <link> (added to exported HTML when an icon is
   in use). FILL is driven by --icon-fill (0 outline, 1 solid). */
.btn-icon {
  flex: 0 0 auto;
  font-family: 'Material Symbols Rounded';
  font-weight: normal;
  font-style: normal;
  font-size: var(--icon-size);
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  color: var(--icon-color);
  -webkit-font-smoothing: antialiased;
  font-variation-settings: 'FILL' var(--icon-fill), 'wght' 400, 'GRAD' 0, 'opsz' 24;
  transition: color var(--duration) var(--shadow-ease-release);
}${counterSkewCss}`;
}

// Per-button variants (issue #29) — v1 keys are faceColor/textColor/iconName/
// iconColor only. Geometry (radius/wall/press) is NOT variant-able: those
// values are baked at build time into JS-computed px clamps, shadow strings,
// and duration/delay math (see buildVarMap) — a geometric variant would
// silently desync all of that. iconName is handled separately, at the HTML
// level (buildFaceInner merge), since it's markup, not a CSS var.
//
// One rule per slug, ONE SELECTOR PER LINE (first line ends `,`, second ends
// `{`) — scopeCssBlock's single-line-rule branch prefixes a comma-selector
// string only once, leaking the second selector unscoped if both sit on one
// line. Every key in `variants` gets a rule regardless of whether that slug
// appears in the current btnLabels/btnCount — a caller may build a single
// button (buildClickyHtml) with an arbitrary label that still needs to pick
// up its variant.
function buildVariantsCss(state) {
  const variants = state.variants;
  if (!variants || typeof variants !== 'object') return '';
  const slugs = Object.keys(variants);
  if (slugs.length === 0) return '';

  const rules = [];
  for (const slug of slugs) {
    const v = variants[slug];
    if (!v || typeof v !== 'object') continue;

    const hasFaceColor = v.faceColor !== undefined;
    const hasTextColor = v.textColor !== undefined;
    const hasIconColor = v.iconColor !== undefined;
    // toggleColor (issue #37) — per-segment tri-state latch accent. Folded
    // into the SAME deriveFaceColorFamily() call as faceColor below (never a
    // second, independent derivation) so the two overrides can't desync —
    // the "half-applied override" risk both #29 and #37's expert reviews flag.
    const hasToggleColor = v.toggleColor !== undefined;
    if (!hasFaceColor && !hasTextColor && !hasIconColor && !hasToggleColor) continue;

    const lines = [];

    // Single derivation call per variant, covering every override this slug
    // carries — order of the `over` fields doesn't matter, only which fields
    // are present.
    const over = {};
    if (hasFaceColor) over.faceColor = v.faceColor;
    if (hasToggleColor) over.toggleColor = v.toggleColor;
    if (hasTextColor || hasIconColor) over.iconColorBase = hasIconColor ? v.iconColor : v.textColor;
    const family = (hasFaceColor || hasToggleColor || hasTextColor || hasIconColor)
      ? deriveFaceColorFamily(state, over)
      : null;

    if (hasFaceColor) {
      lines.push(`  --face-color: ${v.faceColor};`);
      lines.push(`  --face-pressed: ${family.facePressed};`);
    }
    if (hasFaceColor || hasToggleColor) {
      lines.push(`  --face-toggled: ${family.faceToggled};`);
    }
    if (hasFaceColor) {
      lines.push(`  --button-wall-color: ${family.buttonWallColor};`);
    }
    if (hasTextColor) {
      lines.push(`  --text-color: ${v.textColor};`);
    }
    if (hasIconColor) {
      // Variant iconColor implies per-button icon coloring even when the
      // global iconUseColor flag is off.
      lines.push(`  --icon-color: ${v.iconColor};`);
    }
    if (hasTextColor || hasIconColor) {
      lines.push(`  --icon-color-pressed: ${family.iconColorPressed};`);
    }

    if (lines.length === 0) continue;
    rules.push(
      `.clicky-btn.label-${slug},\n.clicky-toggle.label-${slug} {\n${lines.join('\n')}\n}`
    );
  }

  return rules.join('\n\n');
}

// Edge-pinned icon layout (issue #30). Additive rules only — base .btn-icon
// (buildButtonWallCss) is untouched. Mechanism: .btn-face is already
// position: absolute (relative to .btn-cell), so it's already the icon's
// containing block — no wrapper element needed. Gated behind a CLASS
// (.icon-edge / .icon-left / .icon-right on .btn-face), not a config-driven
// inline style, so it scopes/hashes like everything else and stays out of
// the default (inline) output entirely (D3).
function buildIconPlacementCss(state) {
  if (state.iconPlacement !== 'edge') return '';

  // Per-corner radius (issue #35) — the clearance max() needs the corner
  // PAIR on the same edge it pads (start: tl/bl, end: tr/br), same reasoning
  // as sharedFaceCssProps' padding-inline split. Uniform stays byte-identical
  // to pre-#35 output (D3).
  const padStartExpr = state.radiusCorners
    ? 'max(calc(max(var(--radius-tl), var(--radius-bl)) * 0.5), var(--icon-clearance))'
    : 'max(calc(var(--radius) * 0.5), var(--icon-clearance))';
  const padEndExpr = state.radiusCorners
    ? 'max(calc(max(var(--radius-tr), var(--radius-br)) * 0.5), var(--icon-clearance))'
    : 'max(calc(var(--radius) * 0.5), var(--icon-clearance))';

  // Parallelogram skew v2 (issue #40) — this edge-icon rule already sets its
  // own transform (translateY(-50%)), so the generic .btn-label/.btn-icon
  // counter-skew rule (buildButtonWallCss) loses here on specificity (3
  // classes beats 1) and never applies — the counter-skew must be composed
  // directly into THIS rule's transform instead, same reversed-order-negated
  // pair as buildButtonWallCss (pin §4). Byte-identical to pre-#34 output
  // when both skew axes are 0 (D3).
  const skew = resolveSkew(state);
  const edgeIconTransform = skew.active
    ? 'translateY(-50%) skewY(calc(-1 * var(--skew-y-angle))) skewX(calc(-1 * var(--skew-x-angle)))'
    : 'translateY(-50%)';

  return `/* Edge-pinned icon (issue #30) — icon absolutely positioned against the
   button-face edge; label stays centered via the existing flex layout. */
.btn-face.icon-edge .btn-icon {
  position: absolute;
  top: 50%;
  transform: ${edgeIconTransform};
  inset-inline-start: var(--icon-inset);
  inset-inline-end: auto;
}

.btn-face.icon-edge.icon-right .btn-icon {
  inset-inline-start: auto;
  inset-inline-end: var(--icon-inset);
}

/* Clearance — reserve space on .btn-face (not the label) so the label's flex
   box shrinks against it automatically on every wrapped line. Must win over
   sharedFaceCssProps' base padding-inline: placed after it in source order,
   plus these selectors already carry higher specificity (3 classes). */
.btn-face.icon-edge.icon-left {
  padding-inline-start: ${padStartExpr};
}

.btn-face.icon-edge.icon-right {
  padding-inline-end: ${padEndExpr};
}`;
}

// Inline SVG icon sizing (issue #31) — the em trap: --icon-size is already
// an em value (${iconScale}em) applied as font-size on .btn-icon; sizing the
// SVG with width: var(--icon-size) would compound (1.2em of an element whose
// font-size is ALREADY 1.2em = 1.44×). `1em` here resolves against the SAME
// font-size and lands exactly on --icon-size, with no double scale. Gated on
// iconSvg being in use so default output stays byte-identical (D3).
function buildIconSvgCss(state) {
  if (!(state.iconSvg || '').trim()) return '';
  return `/* Inline SVG icon sizing (issue #31) — 1em here == --icon-size exactly;
   do NOT use var(--icon-size) — see the em-trap note above buildIconSvgCss. */
.btn-icon-svg svg {
  display: block;
  width: 1em;
  height: 1em;
}`;
}

// v1 whitelist for per-button variant keys — see buildVariantsCss for why
// geometry is excluded. Shared by validateClickyConfig.
const VARIANT_KEY_TYPES = {
  faceColor: 'string',
  textColor: 'string',
  iconName:  'string',
  iconColor: 'string',
  // Per-segment tri-state latch accent (issue #37) — routed through
  // deriveFaceColorFamily's `over.toggleColor`, see buildVariantsCss.
  toggleColor: 'string',
};

function buildGridCss(state) {
  const frameEnabled = state.frameEnabled;
  const radiusDecl = radiusBorderDecl(state);
  // Bottom-only, mirroring .btn-wall's wallRadiusExpr — see the cavity rule.
  const cavityRadiusExpr = state.radiusCorners
    ? '0 0 var(--radius-br) var(--radius-bl)'
    : '0 0 var(--radius) var(--radius)';

  // Conic-gradient corner bevel (issue #18). false (default) leaves both
  // housing box-shadow blocks below untouched — the four straight-edge inset
  // lines they've always had — so default output stays byte-identical (D3).
  // true drops those four inset lines from BOTH blocks (they'd double up
  // with the ring below) and adds a single `.btn-housing::after` ring whose
  // stop angles (--frame-bevel-conic-*, computed in buildVarMap) don't
  // change between resting/pressed, so — unlike the box-shadow bevel, which
  // is redundantly re-declared identically in both blocks today — the ring
  // needs no pressed-state counterpart at all.
  const conicBevel = frameEnabled && state.frameBevelConic;
  const straightBevelInsets = (frameEnabled && !state.frameBevelConic)
    ? `inset 0 var(--frame-bevel-width) 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha)),
    inset 0 calc(-1 * var(--frame-bevel-width)) 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)),
    inset var(--frame-bevel-width) 0 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha)),
    inset calc(-1 * var(--frame-bevel-width)) 0 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)),`
    : '';
  // Ring uses the standard mask-composite gradient-border technique (padding
  // = ring thickness, then XOR the padding-box mask out of the border-box
  // mask) so the sweep is a true ring following var(--radius-bot) — the same
  // chrome/housing radius the ring's own stop-angle math was computed
  // against — rather than a filled disc. Unconditional across
  // resting/pressed/hover states (no :has() variant needed — see above).
  const conicBevelCss = !conicBevel ? '' : `
.btn-housing::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-bot);
  padding: var(--frame-bevel-width);
  background: conic-gradient(
    from 0deg,
    rgba(255, 255, 255, var(--frame-bevel-alpha)) 0deg,
    rgba(255, 255, 255, var(--frame-bevel-alpha)) var(--frame-bevel-conic-tr-start),
    rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)) var(--frame-bevel-conic-tr-end),
    rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)) var(--frame-bevel-conic-bl-start),
    rgba(255, 255, 255, var(--frame-bevel-alpha)) var(--frame-bevel-conic-bl-end),
    rgba(255, 255, 255, var(--frame-bevel-alpha)) 360deg
  );
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
`;

  // Parallelogram skew v2 (issue #40 pin §1) — shear moved UP to
  // `.btn-housing`: it already owns overflow:hidden + border-radius + chrome
  // gradient + ambient/bevel shadow (the same clip-then-shear-as-one-rigid-
  // unit pattern #34 used at `.btn-cell`, now one level up so the CLIP
  // boundary itself becomes the parallelogram — the whole point of #40).
  // `.btn-cell` loses its own skewX/transform-origin entirely — removed, not
  // left dormant (KEYCAP_Y and every keyframe stay translate-only,
  // untouched; press still reads as LOCAL to the tilted plate — see the
  // pin's §1 "crux, decided" note). Emitted only when either skew axis is
  // non-zero, so default output stays byte-identical (D3).
  const skew = resolveSkew(state);
  const housingSkewCss = skew.active
    ? `\n  transform: skewX(var(--skew-x-angle)) skewY(var(--skew-y-angle));\n  transform-origin: center;`
    : '';

  // `.btn-cell` positioning (issue #40 pin §2) — switches from fixed
  // frame-width insets to housing-relative centering, since a skewed housing
  // widens asymmetrically (frame-width alone is only ever correct when the
  // skew widen is 0). Left/right center the cell's true containerWidth
  // inside the (possibly widened) --housing-width; top centers it inside the
  // (possibly widened) --housing-height via --skew-widen-y. Gated on
  // skew.active so the inactive path keeps the EXACT pre-#34 literal text
  // (`var(--frame-width)` / `0`) — byte-identical default output (D3) — even
  // though the centering formula is arithmetically equivalent at zero-widen.
  const cellInsetExpr = skew.active
    ? 'calc((var(--housing-width) - var(--container-width)) / 2)'
    : 'var(--frame-width)';
  // Chrome visible above the RESTING face: fw minus however much the proud key
  // covers, floored at 0 so the key never clips through the housing's top.
  // Pressing by wallH (flush) then lands the face in an even fw ring.
  const restingChromeAbove = 'max(0px, calc(var(--frame-width) - var(--wall-h)))';
  const cellTopExpr = skew.active
    ? `calc(${restingChromeAbove} + var(--skew-widen-y, 0px) / 2)`
    : restingChromeAbove;

  // Segmented housing (issue #36) — all three expert reviews flag the
  // whole-housing `:has(.clicky-btn:active)`/`:has(.clicky-toggle
  // input:checked)` shadow swap as the riskiest carryover: shared across N
  // segments, pressing ANY one of them would repaint the ambient drop-shadow
  // of the ENTIRE housing (both an illusion break — a shared plate visibly
  // "flexing" on every keypress — and a full-housing main-thread repaint).
  // Segmented mode drops this rule entirely; each segment's own .btn-face
  // inset shadow already carries the pressed/checked read (unchanged).
  // Non-segmented (default) output is untouched — see D3.
  const segmented = state.housingLayout === 'segmented';
  const pressedHousingShadowBlock = segmented ? '' : `
.btn-housing:has(.clicky-btn:active),
.btn-housing:has(.clicky-toggle input:checked) {
${state.frameEnabled
  ? `  box-shadow:
    ${straightBevelInsets}
    var(--housing-shadow-pressed);
  transition: box-shadow var(--press-duration) var(--shadow-ease-press);`
  : `  filter: var(--housing-drop-shadow-pressed);
  transition: filter var(--press-duration) var(--shadow-ease-press);`}
}
`;

  // Segmented housing layout (issue #36) — additive rules only, appended
  // after .btn-cell::before, gated on housingLayout so default ('separate')
  // output stays byte-identical (D3). Switches .btn-cell from the
  // absolutely-positioned single-cell model to flex-row children (no gap —
  // segments adjoin); outer segments keep the real corner radius on their
  // OUTER side only, inner corners square off. Reuses the #35 per-corner
  // scalar vars when radiusCorners is active (direct consumer, per the
  // pinned design), else the plain uniform --radius var — never a new,
  // parallel corner-radius mechanism.
  const segmentedCss = !segmented ? '' : (() => {
    const cornerVar = corner => (state.radiusCorners ? `var(--radius-${corner})` : 'var(--radius)');
    return `

.btn-housing--segmented {
  display: flex;
  padding-inline: var(--frame-width);
}

.btn-housing--segmented .btn-cell {
  /* Deviation from the pinned "position: static" snippet (issue #36, browser-
     verified): .btn-cell is the containing block every absolutely-positioned
     descendant relies on — .clicky-btn/.clicky-toggle (position:absolute;
     inset:0, buildClick/ToggleFaceCss) AND .btn-face itself
     (sharedFaceCssProps). "static" strips that containing block, so those
     descendants escape to the shared .btn-housing and every segment's face
     stretches full-width and stacks on the last one painted. "relative"
     keeps .btn-cell a normal, fully participating flex item (flex-item
     status is unaffected by position:relative — only position:absolute/fixed
     would pull it out of flow) while restoring per-segment containment. */
  position: relative;
  left: auto;
  right: auto;
  flex: 1 1 0;
  border-radius: 0;
}

.btn-housing--segmented .btn-cell::before {
  border-radius: 0;
}

.btn-housing--segmented .btn-cell .btn-face {
  border-radius: 0;
}

.btn-housing--segmented .btn-cell.seg-first,
.btn-housing--segmented .btn-cell.seg-first::before,
.btn-housing--segmented .btn-cell.seg-first .btn-face {
  border-radius: ${cornerVar('tl')} 0 0 ${cornerVar('bl')};
}

.btn-housing--segmented .btn-cell.seg-last,
.btn-housing--segmented .btn-cell.seg-last::before,
.btn-housing--segmented .btn-cell.seg-last .btn-face {
  border-radius: 0 ${cornerVar('tr')} ${cornerVar('br')} 0;
}

/* Divider — a thin metal-bead ridge BETWEEN adjacent cells, not one merged
   shared trough: each segment keeps its own .btn-cell::before cavity
   (unchanged), so the cavity's revealed-darkness still visually correlates
   with which segment is actually pressed (the illusion-designer's pinned
   reasoning — a shared trough would desync that read). */
.btn-housing--segmented .btn-divider {
  flex: 0 0 var(--segment-divider-width);
  align-self: flex-start;
  height: var(--container-height);
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.35), rgba(0, 0, 0, 0.45));
  pointer-events: none;
}`;
  })();

  return `/* Grid wrapper */
.btn-grid {
  display: flex;
  flex-direction: var(--grid-direction);
  flex-wrap: var(--grid-wrap);
  gap: var(--grid-gap);
  justify-content: var(--grid-justify);
  align-items: var(--grid-align);
}

.btn-housing {
  position: relative;
  width: var(--housing-width);
  max-width: 100%;
  height: var(--housing-height);
  border-radius: var(--radius-bot);
  overflow: hidden;
  background: ${frameEnabled ? `linear-gradient(
    to bottom,
    var(--frame-color-hi) 0%,
    var(--frame-color)    55%,
    var(--frame-color-lo) 100%
  )` : 'transparent'};
  ${frameEnabled
    ? `box-shadow:
    ${straightBevelInsets}
    var(--housing-shadow);
  transition: box-shadow var(--duration) var(--shadow-ease-release);`
    : `filter: var(--housing-drop-shadow);
  transition: filter var(--duration) var(--shadow-ease-release);`}${housingSkewCss}
}
${conicBevelCss}${pressedHousingShadowBlock}
.btn-cell {
  position: absolute;
  top: ${cellTopExpr};
  left: ${cellInsetExpr};
  right: ${cellInsetExpr};
  height: var(--container-height);
  container-type: size;
  overflow: hidden;
  border-radius: ${radiusDecl};
  background: transparent;
}

.btn-cell::before {
  content: '';
  position: absolute;
  /* The cavity's top edge sits exactly where the face lands when it goes
     FLUSH — one wall-height below the resting face. Until the key has sunk
     that far its own wall band still fills the gap, so nothing of the recess
     may show; only once the visible wall reaches zero does the cavity start
     to be revealed from its top edge. (Pinning this to --frame-width instead
     leaked the recess in from the first pixel of travel on any key whose wall
     is deeper than its frame — most visibly on frameless deep-travel keys,
     where fw is 0.)
     Slight 1px inflation on the visible edges prevents sub-pixel anti-alias
     gaps where the dark wall corner meets the bright chrome surround. */
  top: var(--wall-h);
  left: -1px;
  right: -1px;
  bottom: -1px;
  /* Square-topped, exactly like .btn-wall (which needed the same correction):
     the cavity's top edge is the channel's straight edge, not a corner. Giving
     it a full radius here drew a THIRD arc inside the cell's own clip arc, so
     the revealed recess band terminated in a sharp cusp at the top corners.
     The cell's clip supplies the outer curve; the face supplies the inner one. */
  border-radius: ${cavityRadiusExpr};
  /* Cavity wall — the static inside of the housing slot, revealed above the
     key as it presses down. Base defaults to the chrome frame color; the
     cavity-alpha dark gradient is multiplied on top for the recessed edge
     shadow. Flip useCavityWallColor to set an independent cavity color. (The
     moving button-side wall is its own separate element, .btn-wall — see
     buildButtonWallCss — not a drop-shadow of the cap; it carries its own
     independent L-R gradient from its own button-wall vars.) */
  background-color: var(--cavity-wall-color);
  background-image: linear-gradient(
    to right,
    rgba(0, 0, 0, var(--cavity-wall-shadow-alpha))                                                0%,
    rgba(0, 0, 0, calc(var(--cavity-wall-shadow-alpha) * var(--cavity-wall-shadow-edge-ratio))) var(--cavity-wall-gradient-lo),
    rgba(0, 0, 0, calc(var(--cavity-wall-shadow-alpha) * var(--cavity-wall-shadow-edge-ratio))) var(--cavity-wall-gradient-hi),
    rgba(0, 0, 0, var(--cavity-wall-shadow-alpha))                                              100%
  );
  background-blend-mode: multiply;
  pointer-events: none;
}${segmentedCss}`;
}

function toggledRestStatePropsCss(indent) {
  const i = indent || '  ';
  return [
    `${i}transform: ${KEYCAP_Y.toggled};`,
    `${i}box-shadow:`,
    `${i}  var(--face-shadow-pressed);`,
    `${i}background-color: var(--face-toggled);`,
    `${i}transition: transform var(--press-duration) var(--transform-easing), box-shadow var(--shadow-press-dur) var(--shadow-ease-press) var(--shadow-press-delay), background-color var(--press-duration) var(--shadow-ease-press);`,
  ].join('\n');
}

function sharedFaceCssProps(state, indent) {
  const i = indent || '  ';
  return [
    `${i}position: absolute;`,
    `${i}top: 0;`,
    `${i}left: 0;`,
    `${i}right: 0;`,
    `${i}height: calc(100% - var(--wall-h));`,
    `${i}display: flex;`,
    `${i}align-items: center;`,
    `${i}justify-content: center;`,
    `${i}gap: var(--icon-gap);`,
    `${i}border-radius: ${radiusBorderDecl(state)};`,
    // The face is just the rounded cap (top surface). The button wall — the
    // moving side of the keycap — is its OWN separate element, .btn-wall
    // (see buildButtonWallCss), painted behind the cap and shifted straight
    // down by the wall-h band. Being a real rounded element (not a CSS
    // drop-shadow) lets it carry its own independent L-R gradient while
    // still hugging the cap's rounded silhouette at any corner radius.
    `${i}background-color: var(--face-color);`,
    // Specular hotspot (realism pack #7a) — emitted only when enabled (D3:
    // new realism keys default to "off = byte-identical output"). Note:
    // background-color transitions on press/release but this gradient is
    // static, so under soft-light the hotspot reads brighter relative to
    // the surface as the base darkens on press — physically plausible
    // (glint intensifies as the surface tilts), intentional, not a bug.
    ...(state.specularAlpha > 0 ? [
      `${i}background-image: radial-gradient(circle at var(--light-x) var(--light-y), rgba(255, 255, 255, var(--specular-alpha)) 0%, transparent var(--specular-size));`,
      `${i}background-blend-mode: soft-light;`,
    ] : []),
    `${i}color: var(--text-color);`,
    `${i}font-size: var(--font-size);`,
    `${i}font-weight: var(--font-weight);`,
    `${i}letter-spacing: var(--letter-spacing);`,
    `${i}text-indent: var(--letter-spacing);`,
    `${i}font-family: inherit;`,
    `${i}border: var(--border);`,
    `${i}cursor: pointer;`,
    `${i}user-select: none;`,
    `${i}-webkit-user-select: none;`,
    `${i}touch-action: manipulation;`,
    `${i}text-align: center;`,
    `${i}white-space: var(--text-wrap);`,
    `${i}text-wrap: balance;`,
    `${i}overflow-wrap: normal;`,
    `${i}word-break: normal;`,
    `${i}overflow: hidden;`,
    `${i}padding-top: 0;`,
    `${i}padding-bottom: 0;`,
    // Icon clearance padding (issue #35) — uniform stays the symmetric
    // shorthand (byte-identical, D3); per-corner splits into longhands, each
    // referencing the corner-pair on THAT edge (start: left pair tl/bl, end:
    // right pair tr/br) — a shorthand can't express asymmetric per-side radii.
    state.radiusCorners
      ? `${i}padding-inline-start: calc(max(var(--radius-tl), var(--radius-bl)) * 0.5);\n${i}padding-inline-end: calc(max(var(--radius-tr), var(--radius-br)) * 0.5);`
      : `${i}padding-inline: calc(var(--radius) * 0.5);`,
    `${i}box-shadow:`,
    `${i}  var(--face-shadow-resting);`,
    `${i}transition:`,
    `${i}  transform 100ms ease-out,`,
    `${i}  box-shadow var(--duration) var(--shadow-ease-release),`,
    `${i}  background-color var(--duration) var(--shadow-ease-release);`,
  ].join('\n');
}

function pressedStatePropsCss(indent) {
  const i = indent || '  ';
  return [
    `${i}transform: ${KEYCAP_Y.pressed};`,
    `${i}box-shadow:`,
    `${i}  var(--face-shadow-pressed);`,
    `${i}background-color: var(--face-pressed);`,
    `${i}transition:`,
    `${i}  transform var(--press-duration) var(--transform-easing),`,
    // The recess shadow waits out the descent to flush, then ramps only while
    // the face is actually below the plate — see resolveShadowTiming.
    `${i}  box-shadow var(--shadow-press-dur) var(--shadow-ease-press) var(--shadow-press-delay),`,
    `${i}  background-color var(--press-duration) var(--shadow-ease-press);`,
  ].join('\n');
}

function buildFocusVisibleCss(state, selector) {
  const c = state.focusColor;
  const sz = state.focusSize;
  switch (state.focusStyle) {
    case 'tint': {
      // Pre-16.2-Safari color-mix() fallback: when both colors are hex, a
      // literal pre-computed background-color line, emitted BEFORE the
      // color-mix line, wins on old engines (last-valid-wins — the value is
      // direct, not var()-mediated) and is silently overridden by the real
      // color-mix line on engines that support it.
      let fallbackLine = '';
      if (isHexColor(c) && isHexColor(state.faceColor)) {
        const norm = h => {
          let x = h.replace('#', '');
          if (x.length === 3) x = x.split('').map(ch => ch + ch).join('');
          return x;
        };
        const fh = norm(c), bh = norm(state.faceColor);
        const mixCh = (a, b) => Math.round(0.18 * parseInt(a, 16) + 0.82 * parseInt(b, 16));
        const r = mixCh(fh.slice(0, 2), bh.slice(0, 2));
        const g = mixCh(fh.slice(2, 4), bh.slice(2, 4));
        const b = mixCh(fh.slice(4, 6), bh.slice(4, 6));
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        fallbackLine = `  background-color: ${hex};\n`;
      }
      return `${selector} {
  ${fallbackLine}background-color: color-mix(in srgb, ${c} 18%, var(--face-color));
  }`;
    }
    case 'glow':
      return `${selector} {
  box-shadow:
    var(--face-shadow-resting),
    0 0 0 ${sz}px ${c}66,
    0 0 ${sz * 3}px ${sz}px ${c}55;
}`;
    case 'outline':
      return `${selector} {
  outline: ${sz}px solid ${c};
  outline-offset: 2px;
}`;
    case 'none':
    default:
      return `${selector} { /* no visible focus style */ }`;
  }
}

function buildClickFaceCss(state) {
  // Cycle offsets for the JS-driven full press-and-release animation. The
  // bottom lands at the configured press/release split (a hardcoded 50% here
  // silently ignored pressDuration vs duration and made the preview disagree
  // with the :active transitions the export actually ships).
  const sh  = resolveShadowTiming(state);
  const pct = f => `${(f * 100).toFixed(2)}%`;
  return `/* Click mode */
.clicky-btn {
  position: absolute;
  inset: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

.clicky-btn:focus-visible { outline: none; }

.clicky-btn .btn-face {
${sharedFaceCssProps(state)}
}

@media (hover: hover) {
  .clicky-btn:hover:not(:active):not(.clicky-press) .btn-face,
  .clicky-btn:hover:not(:active):not(.clicky-press) .btn-wall {
    transform: ${KEYCAP_Y.hover};
  }
}

.clicky-btn:active .btn-face {
${pressedStatePropsCss()}
}

.clicky-btn:active .btn-wall {
  transform: ${KEYCAP_Y.pressed};
  transition: transform var(--press-duration) var(--shadow-ease-press);
}

/* Full press cycle — runs resting → pressed → resting on every click.
   Triggered by adding .clicky-press class via JS on pointerdown:
     btn.addEventListener('pointerdown', () => {
       btn.classList.remove('clicky-press');
       void btn.offsetWidth;
       btn.classList.add('clicky-press');
     });
     btn.addEventListener('animationend', e => {
       if (e.animationName.startsWith('clicky-transform-cycle'))
         btn.classList.remove('clicky-press');
     });
   The animation runs to completion regardless of click duration. Holding the
   button does NOT keep it pressed — the animation always completes its cycle
   and returns to resting. Plain, JS-free holds (keyboard Space, a static tap)
   are handled instead by the .clicky-btn:active .btn-face rule above, which
   applies the pressed property values for as long as :active is true. */

@keyframes clicky-transform-cycle {
  0%, 100%   { transform: ${KEYCAP_Y.rest}; }
  ${pct(sh.bottom)} { transform: ${KEYCAP_Y.pressed}; }
}

/* The recess shadow holds its resting value until the face goes FLUSH
   (${pct(sh.flushDown)} of the cycle), ramps only while the face is below the
   plate, and is gone again the moment it clears on the way up
   (${pct(sh.flushUp)}). Those two windows are different lengths — which is why
   the offsets carry the timing here rather than one centred delay. */
@keyframes clicky-shadow-cycle {
${sh.animates
  ? `  0%, ${pct(sh.flushDown)} { box-shadow: var(--face-shadow-resting); }
  ${pct(sh.bottom)}   { box-shadow: var(--face-shadow-pressed); }
  ${pct(sh.flushUp)}, 100% { box-shadow: var(--face-shadow-resting); }`
  : `  /* press depth never carries the face below flush ⇒ never recessed */
  0%, 100% { box-shadow: var(--face-shadow-resting); }`}
}

@keyframes clicky-color-cycle {
  0%, 100%   { background-color: var(--face-color); }
  ${pct(sh.bottom)} { background-color: var(--face-pressed); }
}

.clicky-btn.clicky-press .btn-face {
  animation-name: clicky-transform-cycle, clicky-shadow-cycle, clicky-color-cycle;
  animation-duration:
    calc(var(--press-duration) + var(--duration)),
    calc(var(--press-duration) + var(--duration)),
    calc((var(--press-duration) + var(--duration)) * var(--color-anim-frac));
  animation-timing-function: linear, linear, linear;
  animation-delay:
    0s,
    0s,
    calc((var(--press-duration) + var(--duration)) * var(--color-anim-delay-frac));
  animation-fill-mode: forwards, forwards, forwards;
}

/* The wall mirrors only the cap's transform (reusing the transform-only
   keyframe), so it stays glued to the cap through the press cycle. */
.clicky-btn.clicky-press .btn-wall {
  animation: clicky-transform-cycle calc(var(--press-duration) + var(--duration)) linear forwards;
}

/* Icon press-darken (realism pack #7d) — the icon participates in the same
   darken effect as the face. Two paths must both be covered: the pseudo-class
   path (:active / :has(input:checked)) for held presses, AND a parallel
   keyframe animation for the JS-driven full press cycle — a parent's animated
   background-color does not cascade into a child element's color, so .btn-icon
   needs its own animation-name list (animation-name is per-element). */
@keyframes clicky-icon-color-cycle {
  0%, 100% { color: var(--icon-color); }
  50%      { color: var(--icon-color-pressed); }
}

.clicky-btn:active .btn-icon {
  color: var(--icon-color-pressed);
  transition: color var(--press-duration) var(--shadow-ease-press);
}

.clicky-btn.clicky-press .btn-icon {
  animation-name: clicky-icon-color-cycle;
  animation-duration: calc((var(--press-duration) + var(--duration)) * var(--color-anim-frac));
  animation-timing-function: linear;
  animation-delay: calc((var(--press-duration) + var(--duration)) * var(--color-anim-delay-frac));
  animation-fill-mode: forwards;
}

${buildFocusVisibleCss(state, '.clicky-btn:focus-visible .btn-face')}

@media (prefers-reduced-motion: reduce) {
  .clicky-btn .btn-face,
  .clicky-btn:active .btn-face,
  .clicky-btn.clicky-press .btn-face,
  .clicky-btn .btn-wall,
  .clicky-btn.clicky-press .btn-wall,
  .clicky-btn .btn-icon,
  .clicky-btn:active .btn-icon,
  .clicky-btn.clicky-press .btn-icon { transition: none; animation: none; }
}
`;
}

function buildToggleFaceCss(state) {
  // mode 'radio' (issue #37) emits <input type="radio"> instead of
  // type="checkbox" (see buildRadioSegmentHtml) — this is the ONLY line in
  // this whole function that needs to know which input type is actually in
  // play; every other selector below (:has(input:checked), ~ .btn-face, etc.)
  // is already input-type-agnostic. Gated so mode:'toggle' output stays
  // byte-identical to pre-#37 output (D3).
  const inputTypeSelector = state.mode === 'radio' ? 'input[type="radio"]' : 'input[type="checkbox"]';
  return `/* Toggle mode — hidden checkbox + visible face */
.clicky-toggle {
  position: absolute;
  inset: 0;
  display: block;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

.clicky-toggle ${inputTypeSelector} {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}

@keyframes toggle-press-on {
  0%   {
    transform: ${KEYCAP_Y.rest};
    box-shadow: var(--face-shadow-resting);
    background-color: var(--face-color);
  }
  50%  {
    transform: ${KEYCAP_Y.pressed};
    box-shadow: var(--face-shadow-pressed);
    background-color: var(--face-pressed);
  }
  100% {
    transform: ${KEYCAP_Y.toggled};
    box-shadow: var(--face-shadow-pressed);
    background-color: var(--face-toggled);
  }
}

@keyframes toggle-press-off {
  0%   {
    transform: ${KEYCAP_Y.toggled};
    box-shadow: var(--face-shadow-pressed);
    background-color: var(--face-toggled);
  }
  50%  {
    transform: ${KEYCAP_Y.pressed};
    box-shadow: var(--face-shadow-pressed);
    background-color: var(--face-pressed);
  }
  100% {
    transform: ${KEYCAP_Y.rest};
    box-shadow: var(--face-shadow-resting);
    background-color: var(--face-color);
  }
}

/* Transform-only counterparts of the toggle keyframes, for the wall — it tracks
   the cap's position without touching the cap's box-shadow / background-color. */
@keyframes toggle-xform-on {
  0%   { transform: ${KEYCAP_Y.rest}; }
  50%  { transform: ${KEYCAP_Y.pressed}; }
  100% { transform: ${KEYCAP_Y.toggled}; }
}

@keyframes toggle-xform-off {
  0%   { transform: ${KEYCAP_Y.toggled}; }
  50%  { transform: ${KEYCAP_Y.pressed}; }
  100% { transform: ${KEYCAP_Y.rest}; }
}

.clicky-toggle .btn-face {
${sharedFaceCssProps(state)}
}

/* Uncheck-direction (release) transition — same selector text as the base
   rule above; must stay AFTER it in source order so this real duration/
   easing wins over sharedFaceCssProps' hardcoded 100ms transform transition. */
.clicky-toggle .btn-face {
  transition: transform var(--duration) var(--transform-easing), box-shadow var(--shadow-release-dur) var(--shadow-ease-release) 0s, background-color var(--duration) var(--shadow-ease-release);
}

.clicky-toggle .btn-wall {
  transition: transform var(--duration) var(--transform-easing);
}

@media (hover: hover) {
  .clicky-toggle:hover:not(:has(input:checked)) .btn-face,
  .clicky-toggle:hover:not(:has(input:checked)) .btn-wall {
    transform: ${KEYCAP_Y.hover};
  }
}

.clicky-toggle:has(input:checked) .btn-face,
.clicky-toggle input:checked ~ .btn-face {
${toggledRestStatePropsCss()}
}

/* Wall rest position when toggled on — transform only. */
.clicky-toggle:has(input:checked) .btn-wall,
.clicky-toggle input:checked ~ .btn-wall {
  transform: ${KEYCAP_Y.toggled};
  transition: transform var(--press-duration) var(--transform-easing);
}

.clicky-toggle.toggle-did-interact:has(input:checked) .btn-face,
.clicky-toggle.toggle-did-interact input:checked ~ .btn-face {
  transition: none;
  animation: toggle-press-on calc(var(--press-duration) + var(--duration)) linear forwards;
}

.clicky-toggle.toggle-did-interact:not(:has(input:checked)) .btn-face {
  transition: none;
  animation: toggle-press-off calc(var(--press-duration) + var(--duration)) linear forwards;
}

.clicky-toggle.toggle-did-interact input:not(:checked) ~ .btn-face {
  transition: none;
  animation: toggle-press-off calc(var(--press-duration) + var(--duration)) linear forwards;
}

/* Wall mirrors the cap's transform through the toggle animations. */
.clicky-toggle.toggle-did-interact:has(input:checked) .btn-wall,
.clicky-toggle.toggle-did-interact input:checked ~ .btn-wall {
  transition: none;
  animation: toggle-xform-on calc(var(--press-duration) + var(--duration)) linear forwards;
}

.clicky-toggle.toggle-did-interact:not(:has(input:checked)) .btn-wall,
.clicky-toggle.toggle-did-interact input:not(:checked) ~ .btn-wall {
  transition: none;
  animation: toggle-xform-off calc(var(--press-duration) + var(--duration)) linear forwards;
}

/* Icon press-darken (realism pack #7d) — mirrors the click-mode rules above.
   The static pseudo-class path covers held/settled states; the parallel
   toggle-icon-color-on/off keyframes cover the JS-driven .toggle-did-interact
   animation, since a parent's animated background-color does not cascade
   into a child element's color (animation-name is per-element). */
@keyframes toggle-icon-color-on {
  0%   { color: var(--icon-color); }
  50%  { color: var(--icon-color-pressed); }
  100% { color: var(--icon-color-pressed); }
}

@keyframes toggle-icon-color-off {
  0%   { color: var(--icon-color-pressed); }
  50%  { color: var(--icon-color-pressed); }
  100% { color: var(--icon-color); }
}

.clicky-toggle:has(input:checked) .btn-icon,
.clicky-toggle input:checked ~ .btn-face .btn-icon {
  color: var(--icon-color-pressed);
  transition: color var(--press-duration) var(--shadow-ease-press);
}

.clicky-toggle.toggle-did-interact:has(input:checked) .btn-icon,
.clicky-toggle.toggle-did-interact input:checked ~ .btn-face .btn-icon {
  animation: toggle-icon-color-on calc(var(--press-duration) + var(--duration)) linear forwards;
}

.clicky-toggle.toggle-did-interact:not(:has(input:checked)) .btn-icon,
.clicky-toggle.toggle-did-interact input:not(:checked) ~ .btn-face .btn-icon {
  animation: toggle-icon-color-off calc(var(--press-duration) + var(--duration)) linear forwards;
}

${buildFocusVisibleCss(state, '.clicky-toggle input:focus-visible ~ .btn-face')}

@media (prefers-reduced-motion: reduce) {
  .clicky-toggle .btn-face,
  .clicky-toggle:has(input:checked) .btn-face,
  .clicky-toggle input:checked ~ .btn-face { transition: none; animation: none; }
  .clicky-toggle.toggle-did-interact:has(input:checked) .btn-face,
  .clicky-toggle.toggle-did-interact input:checked ~ .btn-face { animation: none; }
  .clicky-toggle.toggle-did-interact:not(:has(input:checked)) .btn-face,
  .clicky-toggle.toggle-did-interact input:not(:checked) ~ .btn-face { animation: none; }
  .clicky-toggle .btn-wall,
  .clicky-toggle:has(input:checked) .btn-wall,
  .clicky-toggle input:checked ~ .btn-wall,
  .clicky-toggle.toggle-did-interact .btn-wall { transition: none; animation: none; }
  .clicky-toggle .btn-icon,
  .clicky-toggle:has(input:checked) .btn-icon,
  .clicky-toggle input:checked ~ .btn-face .btn-icon,
  .clicky-toggle.toggle-did-interact .btn-icon { transition: none; animation: none; }
}
`;
}

// ── HTML generation ────────────────────────────────────────────

function getLabels(state) {
  const raw = state.btnLabels.split(',').map(s => s.trim()).filter(Boolean);
  const count = state.btnCount;
  if (raw.length === 0) {
    // Icon-only edge case (issue #32): empty btnLabels + an icon configured
    // yields exactly one icon-only button, not btnCount copies of a numbered
    // BTN${n} fallback. Previously `raw[i % raw.length]` divided by zero
    // whenever raw.length was 0 (`i % 0` is NaN, `raw[NaN]` is undefined),
    // silently falling through to the 'BTN1' branch every time.
    const hasIcon = !!(state.iconName || '').trim() || !!(state.iconSvg || '').trim();
    if (hasIcon) return [''];
  }
  const labels = [];
  for (let i = 0; i < count; i++) {
    labels.push(raw[i] || (raw.length > 0 ? raw[i % raw.length] : undefined) || `BTN${i + 1}`);
  }
  return labels;
}

// Shared slug logic (issues #29/#32) — labels slug to their lowercase
// alnum-only text; empty/all-symbol labels fall back to 'btn'.
function slugify(str) {
  return (str || '').toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Empty label ⇒ slug derived from iconName instead (issue #32) — deriving it
// from the (empty) label would collide every icon-only button in a gallery
// on the same `label-btn` hook. `icon-${slug}` keeps them unique per icon,
// and still falls back to a shared 'icon-btn' bucket when there's no icon
// either (matching the old btn fallback's collision semantics).
function computeButtonSlug(label, cfg) {
  if (label) return slugify(label) || 'btn';
  const iconSlug = slugify((cfg && cfg.iconName) || 'btn');
  return `icon-${iconSlug || 'btn'}`;
}

/* Build the inner content of a .btn-face: the label, plus an optional icon on
   the configured side. The icon is aria-hidden — it is decorative alongside
   the visible text label. Two icon sources, in precedence order (issue #31):
     1. iconSvg  — raw inline <svg> markup, embedded verbatim (see trust model
        on the ClickyConfig typedef — this library does zero sanitization).
     2. iconName — a Material Symbols ligature, rendered as text.
   Non-empty iconSvg wins over iconName (precedence, not mutual exclusion —
   the generator UI legitimately holds both fields at once). */
function buildFaceInner(state, txt) {
  // Empty label ⇒ omit .btn-label entirely (issue #32), not render-and-hide.
  // .btn-face is already justify-content:center/align-items:center
  // (sharedFaceCssProps), so with the label gone .btn-icon becomes the sole
  // flex child and centers automatically — no new CSS needed.
  const label = txt ? `<span class="btn-label">${txt}</span>` : '';
  const svg = (state.iconSvg || '').trim();
  if (svg) {
    const icon = `<span class="btn-icon btn-icon-svg" aria-hidden="true">${svg}</span>`;
    return state.iconPosition === 'right' ? `${label}${icon}` : `${icon}${label}`;
  }
  const name = (state.iconName || '').trim();
  if (!name) return label;
  const icon = `<span class="btn-icon material-symbols-rounded" aria-hidden="true">${escapeHtml(name)}</span>`;
  return state.iconPosition === 'right' ? `${label}${icon}` : `${icon}${label}`;
}

// Edge-pinned icon (issue #30) — extra classes on .btn-face, gated on
// iconPlacement so the default ('inline') markup is byte-identical to
// pre-#30 output (D3).
function buildFaceClassSuffix(cfg) {
  if (cfg.iconPlacement !== 'edge') return '';
  const side = cfg.iconPosition === 'right' ? 'icon-right' : 'icon-left';
  return ` icon-edge ${side}`;
}

function buildSingleButtonHtml(state, label, extraClass, extraAttrs) {
  const extra = extraClass ? ` ${extraClass}` : '';
  const txt = escapeHtml(label);
  const resolvedSlug = computeButtonSlug(label, state);
  const labelClass = ` label-${resolvedSlug}`;
  // Icon-only (issue #32) — a stable hook independent of icon name.
  const iconOnlyClass = label ? '' : ' icon-only';
  // Per-button variants (issue #29) — merge the icon fields (HTML-side, not
  // CSS) over the config before building the face markup, keyed by the same
  // slug the label-<slug> CSS hook uses.
  const variant = state.variants && state.variants[resolvedSlug];
  const faceState = variant && variant.iconName !== undefined
    ? { ...state, iconName: variant.iconName }
    : state;
  const faceInner = buildFaceInner(faceState, txt);
  const faceClass = buildFaceClassSuffix(state);
  const attrStr = extraAttrs
    ? Object.entries(extraAttrs).map(([k, v]) => ` ${escapeHtml(k)}="${escapeHtml(v)}"`).join('')
    : '';
  if (state.mode === 'click') {
    return `<div class="btn-housing"><div class="btn-cell"><button class="clicky-btn${labelClass}${iconOnlyClass}${extra}" type="button"${attrStr}><span class="btn-wall"></span><span class="btn-face${faceClass}">${faceInner}</span></button></div></div>`;
  }
  return `<div class="btn-housing"><div class="btn-cell"><label class="clicky-toggle${labelClass}${iconOnlyClass}${extra}"${attrStr}>
  <input type="checkbox">
  <span class="btn-wall"></span>
  <span class="btn-face${faceClass}">${faceInner}</span>
</label></div></div>`;
}

function buildGridHtml(state, extraClass) {
  const labels = getLabels(state);
  // Icon-only buttons (issue #32) need an accessible name; the generator UI
  // collects one (state.iconOnlyAriaLabel, a UI-only key — see app.js) when
  // the Labels field is emptied, and it flows through here into every
  // icon-only cell in the grid/export.
  const cells = labels.map(l => {
    const attrs = (!l && state.iconOnlyAriaLabel) ? { 'aria-label': state.iconOnlyAriaLabel } : undefined;
    return buildSingleButtonHtml(state, l, extraClass, attrs);
  }).join('\n  ');
  return `<div class="btn-grid">\n  ${cells}\n</div>`;
}

// Segmented housing (issues #36/#37) — shared per-segment face computation,
// same variant-icon-merge logic as buildSingleButtonHtml, factored out so the
// segment/radio builders below can never silently diverge from the
// single-button behavior (the "half-applied override" desync risk).
function buildSegmentFaceParts(state, label) {
  const resolvedSlug = computeButtonSlug(label, state);
  const labelClass = ` label-${resolvedSlug}`;
  const iconOnlyClass = label ? '' : ' icon-only';
  const variant = state.variants && state.variants[resolvedSlug];
  const faceState = variant && variant.iconName !== undefined
    ? { ...state, iconName: variant.iconName }
    : state;
  const txt = escapeHtml(label);
  const faceInner = buildFaceInner(faceState, txt);
  const faceClass = buildFaceClassSuffix(state);
  return { labelClass, iconOnlyClass, faceInner, faceClass, resolvedSlug };
}

// One click/toggle segment (issue #36) — a .btn-cell meant to be a flex
// child of a shared .btn-housing--segmented, not its own housing. posClass
// is ' seg-first' | ' seg-last' | '' (see buildGridCss's corner-radius rules).
function buildSegmentCellHtml(state, label, posClass) {
  const { labelClass, iconOnlyClass, faceInner, faceClass } = buildSegmentFaceParts(state, label);
  if (state.mode === 'toggle') {
    return `<div class="btn-cell${posClass}"><label class="clicky-toggle${labelClass}${iconOnlyClass}">
    <input type="checkbox">
    <span class="btn-wall"></span>
    <span class="btn-face${faceClass}">${faceInner}</span>
  </label></div>`;
  }
  return `<div class="btn-cell${posClass}"><button class="clicky-btn${labelClass}${iconOnlyClass}" type="button"><span class="btn-wall"></span><span class="btn-face${faceClass}">${faceInner}</span></button></div>`;
}

// One radio segment (issue #37, tri-state) — reuses the toggle face markup
// wholesale, swapping only the input type/name/value/checked (the pinned
// design's whole point: `.clicky-toggle:has(input:checked)` doesn't care
// about input type). `name` groups segments for native mutual exclusion;
// `checked` marks the tacit/default value so the group ALWAYS reads a value
// via FormData, never an unchecked group with no value at all.
function buildRadioSegmentHtml(state, label, value, name, isChecked, posClass) {
  const { labelClass, iconOnlyClass, faceInner, faceClass } = buildSegmentFaceParts(state, label);
  const checkedAttr = isChecked ? ' checked' : '';
  return `<div class="btn-cell${posClass}"><label class="clicky-toggle${labelClass}${iconOnlyClass}">
    <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}"${checkedAttr}>
    <span class="btn-wall"></span>
    <span class="btn-face${faceClass}">${faceInner}</span>
  </label></div>`;
}

// Segmented group assembly (issues #36/#37) — N .btn-cell segments (click,
// toggle, or radio) sharing ONE .btn-housing--segmented, joined by
// .btn-divider ridges. Shared by buildClickyGroupHtml's 'segmented' branch;
// factored out so validation/assembly stays in one place regardless of mode.
function buildSegmentedHousingHtml(state, opts, groupLabel) {
  const labels = getLabels(state);
  const isRadio = state.mode === 'radio';

  if (isRadio) {
    if (!opts.name) {
      throw new Error('buildClickyGroupHtml: mode "radio" requires opts.name (shared radio-group name)');
    }
    if (!Array.isArray(opts.values) || opts.values.length === 0) {
      throw new Error('buildClickyGroupHtml: mode "radio" requires opts.values (one machine value per segment)');
    }
    if (opts.values.length !== labels.length) {
      throw new Error(`buildClickyGroupHtml: opts.values length (${opts.values.length}) must match the resolved segment count (${labels.length})`);
    }
  }

  const cells = labels.map((label, i) => {
    const posClass = i === 0 ? ' seg-first' : (i === labels.length - 1 ? ' seg-last' : '');
    if (isRadio) {
      return buildRadioSegmentHtml(state, label, opts.values[i], opts.name, opts.values[i] === opts.checked, posClass);
    }
    return buildSegmentCellHtml(state, label, posClass);
  });

  const withDividers = [];
  cells.forEach((cellHtml, i) => {
    if (i > 0) withDividers.push('<div class="btn-divider"></div>');
    withDividers.push(cellHtml);
  });

  const role = isRadio ? 'radiogroup' : 'group';
  return `<div class="btn-housing btn-housing--segmented" role="${role}" aria-label="${escapeHtml(groupLabel)}">\n  ${withDividers.join('\n  ')}\n</div>`;
}

function validateClickyConfig(config) {
  if (config === null || config === undefined) return;
  if (Array.isArray(config) || typeof config !== 'object') {
    throw new TypeError('Invalid clicky config: config must be a plain object');
  }
  const issues = [];
  for (const key of Object.keys(config)) {
    if (key === 'variants') {
      // Per-button variants (issue #29) — special-cased before the generic
      // typeof check, which would otherwise accept an array (typeof [] ===
      // 'object') and would never look inside the nested per-slug objects.
      const variants = config.variants;
      if (variants === null || variants === undefined) continue;
      if (Array.isArray(variants) || typeof variants !== 'object') {
        issues.push('"variants" must be a plain object');
        continue;
      }
      for (const slug of Object.keys(variants)) {
        const v = variants[slug];
        if (v === null || Array.isArray(v) || typeof v !== 'object') {
          issues.push(`variants["${slug}"] must be a plain object`);
          continue;
        }
        for (const vKey of Object.keys(v)) {
          if (!(vKey in VARIANT_KEY_TYPES)) {
            issues.push(`variants["${slug}"]: unknown key "${vKey}"`);
            continue;
          }
          const vExpected = VARIANT_KEY_TYPES[vKey];
          const vActual = typeof v[vKey];
          if (vActual !== vExpected) {
            issues.push(`variants["${slug}"].${vKey} expected ${vExpected}, got ${vActual}`);
          }
        }
      }
      continue;
    }
    if (key === 'radiusCorners') {
      // Per-corner radius (issue #35) — special-cased before the generic
      // typeof check for the SAME reason as variants above: typeof null ===
      // 'object' (the default) AND typeof [] === 'object' (the trap this
      // ticket's expert commentary calls out by name), so a naive generic
      // check would silently accept an array here. null/undefined ⇒ "not in
      // use" (the uniform legacy path); anything else must be a plain object
      // with exactly the four numeric tl/tr/br/bl keys.
      const rc = config.radiusCorners;
      if (rc === null || rc === undefined) continue;
      if (Array.isArray(rc) || typeof rc !== 'object') {
        issues.push('"radiusCorners" must be a plain object or null');
        continue;
      }
      const cornerKeys = ['tl', 'tr', 'br', 'bl'];
      for (const ck of Object.keys(rc)) {
        if (!cornerKeys.includes(ck)) {
          issues.push(`radiusCorners: unknown key "${ck}"`);
        }
      }
      for (const ck of cornerKeys) {
        if (!(ck in rc)) {
          issues.push(`radiusCorners missing key "${ck}"`);
          continue;
        }
        if (typeof rc[ck] !== 'number' || Number.isNaN(rc[ck])) {
          issues.push(`radiusCorners.${ck} must be a number`);
        }
      }
      continue;
    }
    if (!(key in defaultClickyConfig)) {
      issues.push(`unknown key "${key}"`);
      continue;
    }
    const expected = typeof defaultClickyConfig[key];
    const actual = typeof config[key];
    if (actual !== expected) {
      issues.push(`"${key}" expected ${expected}, got ${actual}`);
      continue;
    }
    if (actual === 'number' && Number.isNaN(config[key])) {
      issues.push(`"${key}" must not be NaN`);
    }
    // Inline SVG icon (issue #31) — one cheap loud-failure guard, nothing
    // more (this library trusts config as markup-adjacent input — see the
    // trust-model note on the ClickyConfig typedef).
    if (key === 'iconSvg' && config[key] && !/^\s*<svg[\s>]/i.test(config[key])) {
      issues.push('"iconSvg" must be inline <svg> markup or empty');
    }
  }

  // Segmented housing (issue #36) / tri-state radio (issue #37) — cross-field
  // checks a single-key typeof loop can't express. Runs AFTER the per-key
  // loop so a real type error on the key itself is reported first. Reads the
  // EFFECTIVE value (the override if the caller supplied one and it's the
  // expected type, else the same default buildClickyCss would merge in) so a
  // check never fires spuriously off a key the caller didn't touch, and never
  // throws its OWN crash off a key that's already flagged as the wrong type.
  const effective = (key, expectedType) => {
    if (key in config && typeof config[key] === expectedType) return config[key];
    return defaultClickyConfig[key];
  };
  const housingLayout = effective('housingLayout', 'string');
  const mode = effective('mode', 'string');

  if (mode === 'radio' && housingLayout !== 'segmented') {
    issues.push('mode "radio" requires housingLayout "segmented" (issue #37 builds tri-state on top of the segmented housing primitive)');
  }

  if (housingLayout === 'segmented') {
    if (effective('gridWrap', 'string') === 'wrap') {
      issues.push('housingLayout "segmented" cannot be combined with gridWrap "wrap" — a wrapped segment strip is meaningless');
    }
    if (!effective('groupLabel', 'string')) {
      issues.push('housingLayout "segmented" requires a non-empty "groupLabel" (aria-label for the segment group)');
    }
    const btnCount = effective('btnCount', 'number');
    const btnLabels = effective('btnLabels', 'string');
    const raw = btnLabels.split(',').map(s => s.trim()).filter(Boolean);
    if (raw.length > 0 && btnCount > raw.length) {
      issues.push(`housingLayout "segmented": btnCount (${btnCount}) exceeds the label count (${raw.length}) — getLabels would cycle and mint duplicate segments, colliding their label-<slug> variant hooks`);
    } else if (raw.length > 0) {
      const seen = new Set();
      for (const label of raw.slice(0, btnCount)) {
        const s = slugify(label) || 'btn';
        if (seen.has(s)) {
          issues.push(`housingLayout "segmented": duplicate segment slug "${s}" — segment labels must produce unique slugs`);
          break;
        }
        seen.add(s);
      }
    }
  }

  if (issues.length > 0) {
    throw new TypeError(`Invalid clicky config: ${issues.join('; ')}`);
  }
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Build the full CSS string for a clicky button.
 * @param {Partial<ClickyConfig>} [config={}] — overrides on defaults
 * @param {object} [opts]
 * @param {string} [opts.scope=":root"] — selector to scope custom
 *   properties under.
 * @returns {string} CSS string ready to inject into a <style> tag.
 */
function buildClickyCss(config = {}, opts = {}) {
  validateClickyConfig(config);
  const merged = { ...defaultClickyConfig, ...config };
  const scope  = opts.scope ?? ':root';
  return buildCss(merged, scope);
}

/**
 * Build the HTML structure for one clicky button (housing -> cell -> face).
 * @param {object} args
 * @param {string} args.label — visible text on the face; '' for an icon-only
 *   button (requires attrs['aria-label'] — see issue #32)
 * @param {string} [args.tag="button"] — element tag for click mode
 * @param {Record<string,string>} [args.attrs] — extra attributes
 * @param {string} [args.extraClass]
 * @param {Partial<ClickyConfig>} [args.config] — overrides on defaults
 * @returns {string} HTML string
 * @throws {Error} if label is empty and attrs['aria-label'] is not provided
 *   (issue #32) — this is a build-time library call, not runtime user input;
 *   validateClickyConfig already throws fail-fast for bad config, so this
 *   matches existing style.
 */
function buildClickyHtml({ label, tag = 'button', attrs = {}, extraClass = '', config: userConfig = {} }) {
  validateClickyConfig(userConfig);
  if (!label && !attrs['aria-label']) {
    throw new Error(
      'buildClickyHtml: label is empty — attrs["aria-label"] is required for icon-only buttons'
    );
  }
  const config = { ...defaultClickyConfig, ...userConfig };
  // Segmented housing (issue #36) — a single button cannot express a shared
  // housing; validateClickyConfig already rejects mode:'radio' without
  // housingLayout:'segmented', so this one guard covers both cases. Same
  // fail-fast pattern as the icon-only aria-label guard above.
  if (config.housingLayout === 'segmented') {
    throw new Error(
      'buildClickyHtml: housingLayout "segmented" requires the group builder — use buildClickyGroupHtml instead (a single button cannot express a shared segmented housing)'
    );
  }
  const txt = escapeHtml(label);
  const resolvedSlug = computeButtonSlug(label, config);
  const labelClass = `label-${resolvedSlug}`;
  const iconOnlyClass = label ? '' : 'icon-only';
  const cls = [extraClass, labelClass, iconOnlyClass].filter(Boolean).join(' ');

  const attrStr = Object.entries(attrs)
    .map(([k, v]) => ` ${escapeHtml(k)}="${escapeHtml(v)}"`)
    .join('');

  // Per-button variants (issue #29) — iconName is markup, not CSS, so merge
  // it over config here before building the face; the color/derived-family
  // half of a variant is handled entirely by buildVariantsCss via the
  // label-<slug> selector already present on cls.
  const variant = config.variants && config.variants[resolvedSlug];
  const faceConfig = variant && variant.iconName !== undefined
    ? { ...config, iconName: variant.iconName }
    : config;
  const faceClass = buildFaceClassSuffix(config);

  if (config.mode === 'toggle') {
    return `<div class="btn-housing"><div class="btn-cell"><label class="clicky-toggle ${cls}"${attrStr}>
  <input type="checkbox">
  <span class="btn-wall"></span>
  <span class="btn-face${faceClass}">${buildFaceInner(faceConfig, txt)}</span>
</label></div></div>`;
  }

  const tagName = tag || 'button';
  const typeAttr = tagName === 'button' ? ' type="button"' : '';
  return `<div class="btn-housing"><div class="btn-cell"><${tagName} class="clicky-btn ${cls}"${typeAttr}${attrStr}><span class="btn-wall"></span><span class="btn-face${faceClass}">${buildFaceInner(faceConfig, txt)}</span></${tagName}></div></div>`;
}

/**
 * Build markup for a GROUP of buttons: N independent housings
 * (housingLayout: 'separate', the default — today's buildGridHtml behavior,
 * byte-identical to pre-#36 output, see D3) OR N segments sharing one housing
 * (housingLayout: 'segmented', issue #36). Promotes to a public call the
 * assembly gallery.html previously did by hand (internals.getLabels +
 * per-label buildClickyHtml + hand-wrapped .btn-grid) — see issue #36's
 * critic comment.
 *
 * API split — "appearance in config, identity in call args" (issue #37): the
 * LOOK of a group (colors, geometry, housingLayout, mode, variants) lives in
 * config and can be built into ONE shared stylesheet via buildClickyCss;
 * per-instance IDENTITY (a radio group's shared `name`, its machine
 * `values`, which one starts `checked`, and a per-call groupLabel override)
 * are call-time opts so rendering N filter rows never mints N stylesheets.
 *
 * @param {Partial<ClickyConfig>} [config={}]
 * @param {object} [opts]
 * @param {string} [opts.name] — shared radio `name` attribute; required when
 *   config.mode === 'radio'.
 * @param {string[]} [opts.values] — machine values, one per segment, aligned
 *   1:1 with the resolved label list; required when config.mode === 'radio'.
 * @param {string} [opts.checked] — which value starts checked (radio only).
 *   MUST be a checked radio, never an unchecked group — issue #37's FormData
 *   contract requires the group to always read a defined value.
 * @param {string} [opts.groupLabel] — overrides config.groupLabel for THIS
 *   call (segmented layouts only).
 * @param {string} [opts.extraClass] — 'separate' layout only, forwarded to
 *   buildGridHtml.
 * @returns {string} HTML string
 * @throws {Error} mode 'radio' without opts.name/opts.values, a
 *   values/label-count mismatch, or housingLayout 'segmented' without a
 *   resolvable groupLabel (config.groupLabel or opts.groupLabel).
 */
function buildClickyGroupHtml(config = {}, opts = {}) {
  validateClickyConfig(config);
  const state = { ...defaultClickyConfig, ...config };

  if (state.housingLayout !== 'segmented') {
    // 'separate' layout — N independent housings. Delegates to the existing,
    // already-tested buildGridHtml so default output stays byte-identical
    // to pre-#36 output (D3) — this is the SAME internals gallery.html used
    // to reach into directly, now promoted behind one public call.
    return buildGridHtml(state, opts.extraClass || '');
  }

  const groupLabel = opts.groupLabel !== undefined ? opts.groupLabel : state.groupLabel;
  if (!groupLabel) {
    throw new Error(
      'buildClickyGroupHtml: housingLayout "segmented" requires a non-empty groupLabel (config.groupLabel or opts.groupLabel) — aria-label for the segment group'
    );
  }
  return buildSegmentedHousingHtml(state, opts, groupLabel);
}

/**
 * Lower-level access to the CSS custom property map.
 * @param {Partial<ClickyConfig>} [config={}]
 * @returns {Record<string,string>}
 */
function buildClickyVars(config = {}) {
  validateClickyConfig(config);
  const merged = { ...defaultClickyConfig, ...config };
  return buildVarMap(merged);
}

// ── Internals (for advanced consumers & generator UI) ──────────

const internals = {
  buildHousingShadow,
  buildFaceShadow,
  buildVarMap,
  buildCss,
  buildGridCss,
  buildButtonWallCss,
  buildVariantsCss,
  clampRadiusCorners,
  computeFrameBevelConicStops,
  resolveSkew,
  radiusBorderDecl,
  deriveFaceColorFamily,
  buildIconPlacementCss,
  buildIconSvgCss,
  sharedFaceCssProps,
  pressedStatePropsCss,
  toggledRestStatePropsCss,
  buildFocusVisibleCss,
  buildClickFaceCss,
  buildToggleFaceCss,
  getTransformEasing,
  getLabels,
  slugify,
  computeButtonSlug,
  buildSingleButtonHtml,
  buildGridHtml,
  buildSegmentFaceParts,
  buildSegmentCellHtml,
  buildRadioSegmentHtml,
  buildSegmentedHousingHtml,
  hexToRgba,
  darkenColor,
  isHexColor,
  escapeHtml,
  KEYCAP_Y,
  scopeCssBlock,
  validateClickyConfig,
  EASING_PRESETS,
  SHADOW_EASING_PRESS,
  SHADOW_EASING_RELEASE,
};

export {
  defaultClickyConfig,
  buildClickyCss,
  buildClickyHtml,
  buildClickyGroupHtml,
  buildClickyVars,
  internals,
  EASING_PRESETS,
  SHADOW_EASING_PRESS,
  SHADOW_EASING_RELEASE,
  hexToRgba,
  escapeHtml,
};
