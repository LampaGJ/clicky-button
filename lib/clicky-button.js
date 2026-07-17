'use strict';

// ── Easing presets ───────────────────────────────────────────
/**
 * @displayName Named Easing Preset Table
 * @strategicPurpose Gives the Timing & Easing control card a curated set of
 *   named feels (bouncy/snappy/soft/... /buckling) instead of asking a
 *   consumer to hand-tune cubic-bezier control points from scratch;
 *   'custom' is the escape hatch to the raw bzX1/bzY1/bzX2/bzY2 config
 *   keys.
 * @tacticalObjective Maps each `easingPreset` enum value to its
 *   `[x1,y1,x2,y2]` cubic-bezier control points; read by
 *   getTransformEasing.
 */
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

/**
 * @displayName Shadow-Layer Easing Constants
 * @strategicPurpose The recess shadow's ramp is deliberately fixed to
 *   linear regardless of the transform's chosen easing preset — see the
 *   shadow-timing var group's note: a curved shadow ramp would fight the
 *   geometry-derived flush-point timing (resolveShadowTiming) with its own
 *   acceleration curve. Documents SHADOW_EASING_PRESS and, on the line
 *   below, SHADOW_EASING_RELEASE together, since they are one conceptual
 *   pair.
 * @tacticalObjective Feed `--shadow-ease-press`/`--shadow-ease-release`
 *   directly; never derived from state, unlike --transform-easing.
 */
const SHADOW_EASING_PRESS   = 'linear';
const SHADOW_EASING_RELEASE = 'linear';

// ── Default configuration ──────────────────────────────────────
/**
 * Default config for a click-mode clicky button. Consumers spread this
 * and override the keys they care about.
 *
 * @displayName Clicky Button Configuration Contract
 * @strategicPurpose The single input surface a consumer tunes to describe
 *   one button's whole appearance and behavior — geometry, color, timing,
 *   icon, and per-button variants — so every other artifact in the engine
 *   (CSS var map, emitted CSS/HTML, the export bundle) derives from one
 *   authoritative shape instead of ad hoc parameters at each call site.
 * @tacticalObjective Supplies the default value for every one of the keys
 *   documented per-key in the adjacent `@typedef ClickyConfig` block (kept
 *   key-synced by test/typedef.test.js) and the richer range/enum contract
 *   in test/clicky-config.schema.js; every public builder
 *   (buildClickyCss/buildClickyHtml/buildClickyGroupHtml/buildClickyVars)
 *   merges a caller's partial override over this object via
 *   `{ ...defaultClickyConfig, ...config }` before doing anything else.
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
 * @property {boolean} rimIndependent      — issue #74; false (default, D3)
 *   keeps the rim highlight as L3 of `.btn-face`'s own shared
 *   `--face-shadow-resting`/`--face-shadow-pressed` box-shadow stack
 *   (buildFaceShadow) — physically wrong, since that stack co-animates
 *   with press-darken and the recess layers spatially overlay it. true
 *   moves the rim onto the face-edge overlay (`.btn-face::before`,
 *   shared with issue #68's bevel — see buildFaceEdgeCss), reading
 *   `--rim-shadow`, a value that never changes with press state.

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
 *   Floors `restingChromeAbove` (the chrome visible above the RESTING
 *   face, `.btn-cell`'s `top`) so it can never reach exactly 0 or exactly
 *   `frameWidth`. Both endpoints are a geometric singularity: the cap's
 *   circular top corner (radius R, centre `(frameWidth+R, cellTop+R)`) and
 *   the housing's circular corner (radius `frameWidth+R`, centre
 *   `(frameWidth+R, frameWidth+R)`) sit `frameWidth+R` apart center-to-
 *   center whenever `cellTop` is exactly `0` (rest, when `wallH >=
 *   frameWidth`) or exactly `2*frameWidth` (press overshoot past flush by
 *   a full frameWidth) — internally TANGENT, so the chrome ring pinches to
 *   a single point at the corner and reads as a hard wedge/seam instead of
 *   a smooth taper (issues #89/#90). A strictly-positive floor keeps rest
 *   off the lower singularity; the same floor is honored on the resting
 *   side only; press travel is a separate transform the floor doesn't
 *   reach into (see buildGridCss's restingChromeAbove). 25 (default)
 *   ≈ quarter of the frame width, visually verified in real WebKit to
 *   clear both the rest and pressed-max wedge for the library's default
 *   geometry (see WORK-STATE notes referencing #90) without the floor
 *   itself becoming a visible extra ring.
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
 * @property {boolean} specularIndependent — issue #73; false (default, D3)
 *   keeps the specular gradient as a `background-image`/
 *   `background-blend-mode: soft-light` layer directly on `.btn-face`,
 *   sharing that element's own animating `background-color` — physically
 *   wrong, since a highlight is reflected light and must not dim because
 *   the key moved. true moves the gradient onto the face-top overlay
 *   (`.btn-face::after` — see buildFaceTopCss), a layer that never reads
 *   `--face-pressed`/`--face-toggled` and so never dims on press.
 * @property {number}  contactIntensity    — % — 0 = no second contact-shadow layer emitted
 * @property {Object<string, object>} variants
 *   — slug-keyed per-button overrides; each value may set faceColor/textColor/
 *   iconName/iconColor/toggleColor (whitelist — see issue #29; toggleColor
 *   added by issue #37 for per-segment tri-state latch accents, routed
 *   through the same deriveFaceColorFamily `over` mechanism as faceColor so
 *   the derived family can never partially reflect a variant's overrides)
 * @property {string}  glowColor           — CSS color; '' = no slot
 *   feature active (issue #53/#56 v2 element tree) — `.btn-slot`/
 *   `.btn-glow` stay unemitted (issue #67, D3). Drives both the
 *   travelling halo (outside the clip) and the lit channel (cavity,
 *   inside) from one source.
 * @property {number}  glowIntensity       — %, blur/spread + gradient-
 *   alpha scale for both glow expressions; meaningful only when
 *   glowColor is set.
 * @property {boolean} focusUnclipped      — issue #58; false (default,
 *   D3) keeps the focus ring on `.btn-face` (clipped for the glow/
 *   outline focusStyle variants); true moves it to
 *   `.btn-housing:has(:focus-visible)`, unclipped per the clip map
 *   (#56 §1).
 * @property {'none'|'beveled'} bevelStyle — issue #68; 'none' (default,
 *   D3) emits no `.btn-face::before`; 'beveled' adds an additive
 *   highlight/shadow bevel ring.
 * @property {number}  faceTolerance       — px, issue #76; 0 (default,
 *   D3). Horizontal-only socket-clearance gap between the face/wall and
 *   the cavity; reduces the face/wall's own per-corner radius by the
 *   same amount.
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
  // Independent rim light (issue #74). false (default) keeps the rim as
  // L3 of the shared face box-shadow stack — byte-identical to pre-#74
  // output (D3). true moves it onto the face-edge overlay pseudo
  // (buildFaceEdgeCss), where it holds its value through the press.
  rimIndependent: true,
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
  // Resting-chrome tangency floor (issue #90) — see the ClickyConfig typedef
  // property doc above for the geometric proof. Kept strictly > 0 so the
  // rest state never lands exactly on the singular cellTop === 0 point.
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
  frameBevelConic: true,

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

  // Independent specular layer (issue #73). false (default) keeps the
  // gradient inline on `.btn-face`, blended against its own animating
  // background-color — byte-identical to pre-#73 output (D3). true moves
  // it onto the face-top overlay (buildFaceTopCss), which never reads
  // the press-darkened face color.
  specularIndependent: true,

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

    // Travelling halo + lit channel (issue #53, epic #56 v2 element tree).
    // '' (default) = no slot feature active ⇒ `.btn-slot` is never emitted
    // (issue #67) and neither glow expression paints — byte-identical to
    // pre-#56 output (D3). Any non-empty CSS color value (a hex string, or
    // an arbitrary var()/color-mix() token — same tolerance as faceColor)
    // turns BOTH expressions on from one source, per the owner's ruling.
    glowColor: '',
    // % — scales the halo's blur/spread magnitude (slotGlowLayers) and the
    // lit channel's peak gradient alpha (buildGridCss's cavity glow layer).
    // Only meaningful once glowColor is set.
    glowIntensity: 60,

    // Unclipped focus ring (issue #58). false (default) keeps today's ring
    // on `.btn-face` — clipped by `.btn-cell`/`.btn-housing`'s
    // overflow:hidden for the glow/outline focusStyle variants, but
    // byte-identical to pre-#56 output (D3). true moves the ring to
    // `.btn-housing:has(:focus-visible)`, which the clip map (#56 §1)
    // establishes is NOT clipped by its own overflow (an element's own
    // overflow never clips its own outline/box-shadow) and has no
    // clipping ancestor of its own.
    focusUnclipped: true,

    // True beveled face edge (issue #68, owner-named v1 example of the
    // face-edge PSEUDO-element role — see epic #56's tree). 'none'
    // (default, D3) emits no `.btn-face::before` at all; 'beveled' adds a
    // highlight-top-left/shadow-bottom-right ring, additive to (never
    // replacing) `.btn-face`'s own flush-gated recess shadow.
    bevelStyle: 'none',

    // Face tolerance gap (issue #76) — px, 0 (default, D3). Insets
    // `.btn-face`/`.btn-wall` left/right by this amount and reduces their
    // OWN per-corner radius by the same amount, revealing a true
    // parallel-offset socket-clearance gap. Horizontal-only; the cavity,
    // `.btn-cell`, and all vertical/flush-gate math are untouched.
    faceTolerance: 0,
  };

// ── Utilities ──────────────────────────────────────────────────

function isHexColor(str) {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(str);
}

/**
 * @displayName Hex/Color-to-RGBA Converter (Public Utility)
 * @strategicPurpose A generation-time color utility exposed publicly so a
 *   consumer building custom UI around the library (e.g. a color picker
 *   preview) doesn't need to re-implement hex parsing or reach for an
 *   external color library — keeps the engine dependency-free.
 * @tacticalObjective Parses a 3/6-digit hex color and returns
 *   `rgba(r,g,b,a)`; for a non-hex CSS color value (e.g. a CSS variable or
 *   named color) falls back to `color-mix()`.
 */
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

/**
 * @displayName HTML Escaper (Public Utility)
 * @strategicPurpose Every label/attribute value the engine writes into
 *   markup goes through this — the one place that prevents a consumer's
 *   config value (label text, aria attributes) from breaking out of its
 *   HTML context.
 * @tacticalObjective Replaces &, <, >, " with their HTML entities; used by
 *   every HTML-emitting builder for label text and attribute values.
 */
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

// Slot gate (issue #67/#53, epic #56 v2 element tree) — the single shared
// predicate every `.btn-slot`/`.btn-glow` consumer (buildVarMap, buildGridCss,
// and every HTML builder that wraps `.btn-housing`) reads through, so the
// wrapper and its halo child can never independently decide they're "on" while
// the other thinks it's "off". glowColor is v1's only slot feature (D3: '' ⇒
// inactive, byte-identical to pre-#56 output).
function slotActive(state) {
  return !!(state.glowColor && String(state.glowColor).trim());
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

// The cavity's own L-R multiply-blend gradient (issue #53b needs to
// reference this EXACT string a second time — the click-mode full-cycle
// keyframe, buildClickFaceCss — without retyping it and risking drift, so
// it is factored out here as the one shared source both call sites read).
// Extracted verbatim from buildGridCss's `.btn-cell::before` rule — the
// indentation below is significant (it is spliced directly into a
// `background-image:` declaration at 2-space CSS indent); do not reflow.
function cavityGradientDecl() {
  return `linear-gradient(
    to right,
    rgba(0, 0, 0, var(--cavity-wall-shadow-alpha))                                                0%,
    rgba(0, 0, 0, calc(var(--cavity-wall-shadow-alpha) * var(--cavity-wall-shadow-edge-ratio))) var(--cavity-wall-gradient-lo),
    rgba(0, 0, 0, calc(var(--cavity-wall-shadow-alpha) * var(--cavity-wall-shadow-edge-ratio))) var(--cavity-wall-gradient-hi),
    rgba(0, 0, 0, var(--cavity-wall-shadow-alpha))                                              100%
  )`;
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

// Face tolerance gap (issue #76) — companion to radiusBorderDecl,
// consumed ONLY by `.btn-face`'s own border-radius (sharedFaceCssProps).
// `.btn-wall`'s bottom-only radius gets its own tolerance-aware
// expression directly in buildButtonWallCss (a different corner subset,
// same reasoning). 0 (default) returns the EXACT pre-#76
// radiusBorderDecl() output, byte-identical (D3).
function faceRadiusBorderDecl(state) {
  if (!(state.faceTolerance > 0)) return radiusBorderDecl(state);
  return state.radiusCorners
    ? 'max(0px, calc(var(--radius-tl) - var(--face-tolerance))) max(0px, calc(var(--radius-tr) - var(--face-tolerance))) max(0px, calc(var(--radius-br) - var(--face-tolerance))) max(0px, calc(var(--radius-bl) - var(--face-tolerance)))'
    : 'max(0px, calc(var(--radius) - var(--face-tolerance)))';
}

// Face tolerance gap (issue #76) — companion for `.btn-face`/`.btn-wall`'s
// own left/right inset (currently the literal `0`). 0 (default) returns
// the EXACT literal string '0', byte-identical (D3).
function faceInsetDecl(state) {
  return state.faceTolerance > 0 ? 'var(--face-tolerance)' : '0';
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
  // Second, tight contact-shadow layer (realism pack #7c). Off by default
  // (contactIntensity: 0 → no second layer emitted at all, per D3).
  // Unlike the diffuse ambient above, a contact shadow reads as the cap
  // physically SEATED in the cavity — it must not fade as the cap presses
  // down, so its ALPHA is intentionally NOT scaled by `keep` (only the
  // offset/blur geometry is, so it visually tightens on press without fading
  // out — see issue #16 review; do not add `* keep` to the alpha).
  const contact = state.contactIntensity > 0
    ? {
        y: Math.max(1, Math.round(wallH_px * 0.25 * keep)),
        blur: Math.max(2, Math.round(wallH_px * 0.5 * keep)),
        color: `rgba(0, 0, 0, ${(state.contactIntensity / 100).toFixed(3)})`,
      }
    : null;
  return { ambient, contact };
}

// The travelling halo's geometry (issue #53a, epic #56 Amendment 1).
// Unlike housingShadowLayers' directional y-offset (correct for a
// shadow, wrong for a rim glow — per the illusion-designer's accepted
// sign-off exception), this is symmetric 0/0-offset blur+spread that
// CONTRACTS as the key sinks: light transfers from the ambient halo
// into the lit cavity channel (buildGridCss's cavity glow layer,
// issue #53b) as the key goes flush. Same wallH_px-derived scale
// family as housingShadowLayers' ambient layer (max reach ≈ 2×wallH_px
// at rest — the same figure buildVarMap's --slot-breathing-room
// reserves) and reuses the SAME ambientPressReduction knob
// housingShadowLayers already exposes for its own press-contraction,
// rather than inventing a second, parallel percentage.
function slotGlowLayers(state, pressed) {
  const wallH_px = Math.max(1, Math.round(state.containerHeight * state.wallHRatio / 100));
  const keep = pressed ? 1 - (state.ambientPressReduction / 100) : 1;
  const blur = Math.round(wallH_px * 1.5 * keep);
  const spread = Math.round(wallH_px * 0.5 * keep);
  const alpha = (state.glowIntensity / 100) * keep;
  return { blur, spread, color: hexToRgba(state.glowColor, alpha) };
}

function buildGlowShadow(state, pressed) {
  const { blur, spread, color } = slotGlowLayers(state, pressed);
  return `0 0 ${blur}px ${spread}px ${color}`;
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
  // Layer geometry (including the contact layer's deliberate no-fade alpha)
  // lives in housingShadowLayers — the one source this and the drop-shadow
  // rendering both read.
  const { ambient, contact } = housingShadowLayers(state, pressed);
  const contactCss = contact
    ? `, 0 ${contact.y}px ${contact.blur}px 0 ${contact.color}`
    : '';

  return `0 ${ambient.y}px ${ambient.blur}px 0 ${ambient.color}${contactCss}`;
}

// Rim-highlight layer math (issue #74) — factored out of buildFaceShadow so
// the independent rim (rimIndependent, `.btn-face::before` — see
// buildFaceEdgeCss) and the legacy shared-stack rim (buildFaceShadow's L3,
// still the byte-identical default path per D3) compute the EXACT same
// geometry from one source, never two independently-typed formulas that
// could drift apart.
function buildRimLayer(state, unit) {
  unit = unit === 'px' ? 'px' : 'cqb';
  const px = n => Math.round(n * state.containerHeight / 100);
  const len = n => unit === 'px' ? `${px(n)}px` : `${n}cqb`;
  const hlAlpha = state.highlightOpacity / 100;
  const hlColor = state.topHighlight
    ? hexToRgba(state.highlightColor, hlAlpha)
    : hexToRgba(state.highlightColor, 0);
  const rimBlur = Math.max(2, Math.round(state.rimHeightRatio * 0.5));
  const rimBlurLen = unit === 'px' ? `${Math.max(2, px(rimBlur))}px` : `${rimBlur}cqb`;
  return `inset 0 ${len(state.rimHeightRatio)} ${rimBlurLen} 0 ${hlColor}`;
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

  // Independent rim light (issue #74) — when rimIndependent moves the rim
  // onto the face-edge overlay's own `--rim-shadow` (buildFaceEdgeCss), it
  // must be NEUTRALIZED here, not merely duplicated: leaving the real
  // highlight in this shared stack too would still let L1's press-active
  // soft shadow spatially overlay it (the exact defect #74 exists to fix)
  // while ALSO painting a second, independent copy. Default (false) is
  // byte-identical to pre-#74 output (D3).
  const L3 = state.rimIndependent ? L0 : buildRimLayer(state, unit);

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

/**
 * @displayName CSS Custom-Property Map Compiler
 * @strategicPurpose The intermediate artifact every emitted CSS rule
 *   consumes — collapsing all client-tunable geometry/color/timing math
 *   (radius clamping, skew space-reservation, shadow layering, per-property
 *   animation delay) into one flat, generation-time-frozen set of `--*`
 *   custom properties, so the CSS emitters below never re-derive that math
 *   and can never disagree with each other about it.
 * @tacticalObjective Merges a validated ClickyConfig into ~71 (up to 87
 *   with optional features active) CSS custom properties, grouped and
 *   gap-tracked in scripts/artifact-annotations.mjs; exposed publicly via
 *   buildClickyVars and consumed internally by buildCss.
 */
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
  // covers MOST (not, per issue #90, necessarily ALL) of the top chrome;
  // pressed FLUSH (descended by wallH) the face lands inside an even fw
  // ring.
  //
  //   restingChromeAbove (cellTop) = max(floor, fw - wallH)   // floor > 0,
  //                                  never negative: a proud key must not
  //                                  clip on the housing, and per #90 must
  //                                  not land exactly on the tangency
  //                                  singularity at floor === 0 either
  //   H0 = max(fw, wallH + floor) + faceH + fw
  //
  // ⇒ ring at flush is fw top AND bottom whenever wallH <= fw. A wall deeper
  // than the frame rises higher than the plate's ring, so its top ring reads
  // wallH — the honest projection, and still unclipped. Reduces to the
  // historical containerHeight + fw for both the default (wallH === fw) and
  // frameless (fw === 0) — why that formula looked right for those and
  // drifted only in between. floor === 0 reduces H0 to the pre-#90 formula
  // exactly (byte-identical whenever restingChromeFloorRatio is 0).
  //
  // The corner-tangency proof (issue #90): the cap's circular top-left
  // corner (radius R, centre `(fw+R, cellTop+R)` in housing-local
  // coordinates) and the housing's circular corner (radius Rh === fw+R,
  // centre `(fw+R, fw+R)`) are separated, vertically only, by
  // `d = |fw - cellTop|`. Two nested circles are internally TANGENT
  // (touch at exactly one point — the chrome ring pinches to zero width
  // there, reading as a hard wedge/seam) iff `d === Rh - R === fw`, i.e.
  // iff `cellTop === 0` or `cellTop === 2*fw`. `cellTop === 0` is exactly
  // what the pre-#90 formula produced whenever `wallH >= fw` (the
  // library's own default: wallH === fw === 14). A strictly-positive
  // floor keeps `cellTop` off that singularity at rest; see buildGridCss's
  // restingChromeAbove for the matching CSS-side expression.
  // Even ring: the housing reserves exactly fw of chrome above AND below the
  // keycap (which fills the cell = containerHeight). With the cell inset fw at
  // the top (restingChromeAbove below) and the housing corner radius derived as
  // R + fw, the cap corner and housing corner are concentric at every corner,
  // so the ring is a uniform fw band all the way around — no wedge, no lumpy
  // top corners (issue #90). This supersedes the restingChromeFloor approach,
  // whose small top inset (!= fw) forced the top corners off-concentric.
  const H0 = state.containerHeight + 2 * fw;

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
  // Housing corner radius is DERIVED as cap radius + frame width, not taken
  // from chromeRadiusRatio — because a uniform-width chrome ring REQUIRES the
  // housing corner to be concentric with the cap corner, and concentric means
  // exactly Rh === R + fw (issue #90). An independent chrome radius (what
  // chromeRadiusRatio used to set) is geometrically incompatible with a clean
  // ring: any Rh !== R + fw offsets the two corner arcs and the ring pinches
  // to a wedge at the top corners. The geometry comments in buildVarMap always
  // ASSUMED Rh === fw + R; this makes the code honour that assumption for every
  // config instead of only the ones where chromeRadiusRatio happened to land on
  // it. (chromeRadiusRatio is now vestigial — kept in the config for
  // compatibility, superseded here; the generator's Chrome Radius readout shows
  // the derived value.)
  const chromeRadius_px = fw > 0
    ? Math.min(radius_px + fw, Math.floor(housingW / 2), Math.floor(housingH / 2))
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

    // `.btn-slot` breathing room (issue #67) — reserves layout room around
    // the housing so a travelling halo (issue #53a) has room to bleed
    // into before it touches the next button's slot, without touching
    // `--grid-gap` itself (a caller's own gap choice stays theirs).
    // Emitted only when a slot feature is active (D3). wallH_px * 2
    // matches slotGlowLayers' own max reach (blur 1.5x + spread 0.5x, at
    // rest) — see the comment there; the two figures are kept in the same
    // 2x-wallH family deliberately so they can't silently drift apart,
    // though neither is derived from the other in code (flagged in the
    // synthesis notes as a judgment call, not a hard invariant).
    ...(slotActive(state) ? {
      '--slot-breathing-room': `${Math.round(wallH_px * 2)}px`,
    } : {}),

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

    // Travelling halo (issue #53a) — symmetric box-shadow strings (see
    // slotGlowLayers, Amendment 1). Emitted only when a slot feature is
    // active (D3), mirroring --housing-shadow/--housing-shadow-pressed's
    // resting/pressed pair structurally.
    ...(slotActive(state) ? {
      '--glow-shadow':         buildGlowShadow(state, false),
      '--glow-shadow-pressed': buildGlowShadow(state, true),
    } : {}),

    // Lit channel (issue #53b) — the SAME --glow-color/--glow-intensity
    // source as the halo above, expressed as a second background-image
    // gradient layer on the cavity (buildGridCss's `.btn-cell::before`).
    // Resting is fully transparent (alpha 0) so the un-pressed cavity is
    // byte-unchanged in spirit (the layer exists but paints nothing);
    // pressed peaks at glowIntensity. Kept as a resting/pressed STRING
    // pair (not a live CSS var read directly in the gradient) to match
    // this codebase's dominant generation-time-frozen pattern (see
    // buildFaceShadow/buildHousingShadow) rather than introducing a new
    // live-var-in-gradient idiom.
    ...(slotActive(state) ? {
      '--cavity-glow-resting': `linear-gradient(to top, ${hexToRgba(state.glowColor, 0)} 0%, transparent 100%)`,
      '--cavity-glow-pressed': `linear-gradient(to top, ${hexToRgba(state.glowColor, state.glowIntensity / 100)} 0%, transparent 100%)`,
    } : {}),

    '--face-shadow-resting': buildFaceShadow(state, false, 'px'),
    // A key whose travel never carries it past flush is never inside the
    // channel, so nothing can cast a recess shadow on it: its "pressed"
    // shadow IS its resting shadow. (Otherwise the zero-length ramp this
    // implies would snap the shadow on at the bottom of the travel.)
    '--face-shadow-pressed': buildFaceShadow(state, resolveShadowTiming(state).animates, 'px'),

    // Independent rim light (issue #74) — a standalone box-shadow value
    // consumed by the face-edge overlay (buildFaceEdgeCss), the SAME
    // buildRimLayer geometry as --face-shadow-*'s L3, but never re-mixed
    // into that stack — so it never co-animates with press-darken.
    // Emitted only when rimIndependent is on (D3).
    ...(state.rimIndependent ? {
      '--rim-shadow': buildRimLayer(state, 'px'),
    } : {}),

    '--wall-h':          `${wallH_px}px`,
    '--press-translate': `${pressDepth_px}px`,
    '--toggle-height':   `${Math.round(pressDepth_px * state.toggleHeightRatio / 100)}px`,

    // Face tolerance gap (issue #76) — emitted only when non-zero (D3).
    ...(state.faceTolerance > 0 ? {
      '--face-tolerance': `${state.faceTolerance}px`,
    } : {}),

    '--frame-width':     `${fw}px`,
    // Resting-chrome tangency floor (issue #90) — see buildGridCss's
    // restingChromeAbove and the ClickyConfig typedef's restingChromeFloorRatio
    // doc for the geometric singularity this retires.
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
  'clicky-glow-channel-cycle',
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
  // Independent rim light (issue #74) — same cq-fallback pairing as
  // --face-shadow-resting/-pressed above, gated on rimIndependent so the
  // override line only appears when the var itself exists (D3). Attached
  // to the preceding `;` on the SAME line — a ternary emitting '' on its
  // own source line still emits a stray newline even when the branch
  // taken is '' (see the whitespace trap this file has hit before).
  const rimShadowCqLine = state.rimIndependent
    ? `\n      --rim-shadow: ${buildRimLayer(state, 'cqb')};`
    : '';
  const cqSupportsBlock = `@supports (width: 1cqi) {
    ${scopeSelector} {
      --font-size: ${fontSizeCq};
      --face-shadow-resting: ${faceShadowRestingCq};
      --face-shadow-pressed: ${faceShadowPressedCq};${rimShadowCqLine}
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
  // Face-edge overlay (issue #68 bevel / issue #74 independent rim) —
  // appended only when at least one of bevelStyle/rimIndependent is in
  // use (D3).
  const faceEdgeCss = buildFaceEdgeCss(state);
  if (faceEdgeCss) {
    rest += '\n\n';
    rest += faceEdgeCss;
  }
  // Face-top overlay (issue #73 independent specular) — appended only
  // when in use (D3).
  const faceTopCss = buildFaceTopCss(state);
  if (faceTopCss) {
    rest += '\n\n';
    rest += faceTopCss;
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
/**
 * @displayName Button-Wall & Label/Icon Rule Emitter
 * @strategicPurpose The moving side of the keycap needed its own real
 *   element (not a drop-shadow) so it can carry an independent left-right
 *   gradient while still hugging the cap's rounded silhouette at any
 *   corner radius — this is where that element, plus the label and icon it
 *   sits behind, get their CSS.
 * @tacticalObjective Emits `.btn-wall` (true-extrusion geometry,
 *   background gradient, transform mirroring), `.btn-label` (clipped text
 *   wrapper), and `.btn-icon` (Material Symbols ligature styling), plus
 *   the parallelogram counter-skew rule for label/icon when skew is
 *   active.
 */
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
  const wallRadiusExpr = state.faceTolerance > 0
    ? (cornersActive
        ? '0 0 max(0px, calc(var(--radius-br) - var(--face-tolerance))) max(0px, calc(var(--radius-bl) - var(--face-tolerance)))'
        : '0 0 max(0px, calc(var(--radius) - var(--face-tolerance))) max(0px, calc(var(--radius) - var(--face-tolerance)))')
    : (cornersActive
        ? '0 0 var(--radius-br) var(--radius-bl)'
        : '0 0 var(--radius) var(--radius)');

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
  left: ${faceInsetDecl(state)};
  right: ${faceInsetDecl(state)};
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

  // Face-edge overlay (`.btn-face::before`) — hosts BOTH the true bevel
  // (issue #68, owner-named v1 example, bevelStyle) and the independent
  // rim light (issue #74, rimIndependent). Additive overlay pseudo-
  // element — must NOT touch `.btn-face`'s own box-shadow (owned entirely
  // by buildFaceShadow/the flush gate, per epic #56 §4's hard constraint:
  // "the existing recess inset-shadow stack must stay owned by .btn-face
  // itself; edge/top are additive overlays only"). A single element can
  // only have one `box-shadow` property, so whichever gate(s) are active
  // are merged into ONE comma-joined layer list here — never two rules
  // fighting to set the same property. Bevel reuses the EXISTING
  // frame-bevel alpha vars rather than inventing a third, parallel
  // bevel-intensity knob (flagged in the synthesis notes as a judgment
  // call); rim reads `--rim-shadow` (buildVarMap), the SAME buildRimLayer
  // geometry as the legacy shared-stack rim, computed once. Neither gate
  // sets a transform of its own — inherits KEYCAP_Y/skew for free as a
  // descendant of the already-transformed `.btn-face` (§3). Both gates
  // off ⇒ no rule emitted at all, byte-identical to pre-#68 output (D3).
  function buildFaceEdgeCss(state) {
    const layers = [];
    if (state.bevelStyle === 'beveled') {
      layers.push(
        'inset 1px 1px 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha))',
        'inset -1px -1px 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow))'
      );
    }
    if (state.rimIndependent) {
      layers.push('var(--rim-shadow)');
    }
    if (layers.length === 0) return '';
    return `.btn-face::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      ${layers.join(',\n      ')};
    pointer-events: none;
  }`;
  }

  // Face-top overlay (`.btn-face::after`) — hosts the independent
  // specular hotspot (issue #73, specularIndependent). The whole point:
  // this layer never reads `.btn-face`'s own `--face-pressed`/
  // `--face-toggled` background-color, so the highlight holds its exact
  // resting value through the press — a highlight is reflected light and
  // must not dim because the key moved. Same radial-gradient definition
  // sharedFaceCssProps emits inline (default path); plain alpha
  // compositing here (no background-blend-mode) is deliberate — blending
  // against the backdrop (mix-blend-mode) or against a same-element
  // background-color (background-blend-mode) would both re-derive the
  // result from whatever's underneath, reintroducing the exact
  // press-coupling this issue exists to remove. No transform of its own;
  // inherits KEYCAP_Y/skew for free as a descendant of the already-
  // transformed `.btn-face` (§3). Gated on specularIndependent (and
  // specularAlpha > 0, matching sharedFaceCssProps' own gate) so default
  // output stays byte-identical (D3).
  function buildFaceTopCss(state) {
    if (!(state.specularIndependent && state.specularAlpha > 0)) return '';
    return `.btn-face::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-image: radial-gradient(circle at var(--light-x) var(--light-y), rgba(255, 255, 255, var(--specular-alpha)) 0%, transparent var(--specular-size));
    pointer-events: none;
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

/**
 * @displayName Grid & Housing Chrome Rule Emitter
 * @strategicPurpose Owns the outermost structural layer of the DOM tree —
 *   the flex grid wrapper, the chrome housing (with its bevel/shadow
 *   finish), the per-button cell that clips the cap, and the cavity that
 *   is revealed as the key presses down — so the illusion of a key seated
 *   in a chrome-framed slot lives in one place instead of being re-derived
 *   per element.
 * @tacticalObjective Emits the CSS rules for `.btn-grid`, `.btn-housing`
 *   (+ its `--segmented` variant and the pressed-state box-shadow/filter
 *   swap), `.btn-cell` and its `::before` cavity pseudo-element, and —
 *   when housingLayout is 'segmented' — `.btn-housing--segmented`,
 *   `.btn-divider`, and the `.seg-first`/`.seg-last` corner-radius rules.
 *   Per-element detail is gap-tracked in scripts/artifact-annotations.mjs
 *   (id prefix `element:`).
 */
function buildGridCss(state) {
  const frameEnabled = state.frameEnabled;
  const radiusDecl = radiusBorderDecl(state);
  // The cavity is clipped by and concentric with the cell (same radius), so it
  // takes the CELL's full corner radius — all four corners round, matching the
  // cap. #55 square-topped it ('0 0 R R') to kill a resting cusp back when the
  // cavity radius did NOT match the cell's; but after today's equal-ring/floor/
  // revert work the cell-clip, cap, and cavity radii all coincide, so a square
  // top no longer helps AT REST and actively produces a dark wedge at the top
  // corners MID-PRESS (the square cavity corner poking behind the round cap as
  // the channel is revealed). Rounding it to match makes the revealed channel
  // follow the corner smoothly in every press state — verified at rest, flush,
  // mid-press, and pressed-max.
  const cavityRadiusExpr = radiusDecl;

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
  // covers, floored at `--resting-chrome-floor` (issue #90; > 0 by default —
  // see restingChromeFloorRatio's typedef doc) rather than 0, so the key
  // never clips through the housing's top AND rest never lands exactly on
  // the cellTop === 0 corner-tangency singularity that read as a hard
  // wedge/seam (issues #89/#90). Pressing by wallH (flush) then lands the
  // face in an even fw ring; pressing further still (max press, per
  // pressDepthRatio) can carry cellTop past the OTHER singularity
  // (cellTop === 2*fw) — the floor only guards the resting side; see the
  // buildVarMap H0 comment for the full proof.
  // The cell (and the keycap it holds) is inset exactly frame-width at the top,
  // matching the sides and bottom → an even fw ring, concentric corners (the
  // housing radius is derived as R + fw). This is the y-half of the concentric
  // condition faceTop === Rh - R === fw; the x-half is the derived housing
  // radius in buildVarMap (issue #90).
  const restingChromeAbove = 'var(--frame-width)';
  const cellTopExpr = skew.active
    ? `calc(${restingChromeAbove} + var(--skew-widen-y, 0px) / 2)`
    : restingChromeAbove;

  // The cell CLIPS its children (overflow: hidden), and the cap is the widest
  // of them — so the cell's corner radius may never exceed the cap's, or the
  // clip eats the cap's own corner. #89 tried "inner = outer - inset" here
  // (top inset 0 ⇒ the housing's 51px) and that is exactly what it did: a 14px
  // bite out of the face's top corners, shipped live and worse than the seam
  // it meant to fix. The cell's clip tracks the CAP, full stop.
  const cellRadiusDecl = radiusDecl;

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
  const segmentCount = segmented ? Math.max(1, getLabels(state).length) : 1;
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

  // Per-segment travelling halo (issue #53a + Amendment 2, epic #56).
  // EQUAL-DIVISION approximation of each glow child's width/position
  // (housing-width / N) — does not account for
  // `.btn-housing--segmented`'s frame-width padding-inline or the
  // divider width; flagged as a synthesis-stage approximation needing a
  // visual pass, per the contract's own "accepted combinatorial
  // cost... flagged not solved" framing for per-segment halo cost.
  // `.btn-housing` occupies DOM position 1 inside `.btn-slot`, so glow i
  // (0-based) sits at 1-based nth-child position i+2; `.btn-cell` i sits
  // at 1-based position 2*i+1 inside `.btn-housing--segmented` (cells and
  // dividers interleave, divider BETWEEN cells, not after the last).
  const glowSegmentedCss = (!segmented || !slotActive(state) || segmentCount <= 1) ? '' : (() => {
    const cornerVar2 = corner => (state.radiusCorners ? `var(--radius-${corner})` : 'var(--radius)');
    const rules = [];
    for (let i = 0; i < segmentCount; i++) {
      const glowPos = i + 2;
      const cellPos = 2 * i + 1;
      const isFirst = i === 0;
      const isLast = i === segmentCount - 1;
      const radiusDecl2 = isFirst
        ? `${cornerVar2('tl')} 0 0 ${cornerVar2('bl')}`
        : isLast
          ? `0 ${cornerVar2('tr')} ${cornerVar2('br')} 0`
          : '0';
      // Amendment 2 — mask the inner-facing edge(s) to the divider
      // centerline: inset(top right bottom left).
      const insetRight = isLast ? '0' : 'calc(var(--segment-divider-width, 0px) / 2)';
      const insetLeft = isFirst ? '0' : 'calc(var(--segment-divider-width, 0px) / 2)';
      rules.push(`.btn-glow:nth-child(${glowPos}) {
    left: calc(var(--housing-width) / ${segmentCount} * ${i});
    width: calc(var(--housing-width) / ${segmentCount});
    right: auto;
    border-radius: ${radiusDecl2};
    clip-path: inset(0 ${insetRight} 0 ${insetLeft});
  }
  .btn-slot:has(.btn-housing--segmented .btn-cell:nth-child(${cellPos}) .clicky-btn:active) .btn-glow:nth-child(${glowPos}),
  .btn-slot:has(.btn-housing--segmented .btn-cell:nth-child(${cellPos}) .clicky-toggle input:checked) .btn-glow:nth-child(${glowPos}) {
    box-shadow: var(--glow-shadow-pressed);
  }`);
    }
    return '\n  ' + rules.join('\n  ');
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
${slotActive(state) ? `
.btn-slot {
  position: relative;
  padding: var(--slot-breathing-room);
}
` : ''}
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
  border-radius: ${cellRadiusDecl};
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
  /* Fully rounded, matching the cell/cap radius so the three are concentric.
     A square top ('0 0 R R') used to be needed to avoid a resting cusp when the
     cavity radius did NOT match the cell's; after the equal-ring/floor work the
     radii coincide, so the round cavity nests cleanly — and the square top was
     itself causing a dark wedge at the top corners mid-press, where its square
     corner poked behind the round cap as the channel opened (issue #90). */
  border-radius: ${cavityRadiusExpr};
  /* Cavity wall — the static inside of the housing slot, revealed above the
     key as it presses down. Base defaults to the chrome frame color; the
     cavity-alpha dark gradient is multiplied on top for the recessed edge
     shadow. Flip useCavityWallColor to set an independent cavity color. (The
     moving button-side wall is its own separate element, .btn-wall — see
     buildButtonWallCss — not a drop-shadow of the cap; it carries its own
     independent L-R gradient from its own button-wall vars.) */
  background-color: var(--cavity-wall-color);
  background-image: ${cavityGradientDecl()}${slotActive(state) ? `,
  var(--cavity-glow-resting)` : ''};
  background-blend-mode: multiply;
  pointer-events: none;${slotActive(state) ? `
  transition: background-image var(--shadow-release-dur) var(--shadow-ease-release);` : ''}
}${!slotActive(state) ? '' : `
.btn-cell:has(.clicky-btn:active)::before,
.btn-cell:has(.clicky-toggle input:checked)::before {
  background-image: ${cavityGradientDecl()},
  var(--cavity-glow-pressed);
  transition: background-image var(--shadow-press-dur) var(--shadow-ease-press) var(--shadow-press-delay);
}`}${segmentedCss}${!slotActive(state) ? '' : `

  .btn-glow {
    position: absolute;
    inset: 0;
    border-radius: ${radiusBorderDecl(state)};
    box-shadow: var(--glow-shadow);
    pointer-events: none;
    transition: box-shadow var(--duration) var(--shadow-ease-release);
  }
  ${!segmented ? `.btn-slot:has(.clicky-btn:active) .btn-glow,
  .btn-slot:has(.clicky-toggle input:checked) .btn-glow {
    box-shadow: var(--glow-shadow-pressed);
    transition: box-shadow var(--press-duration) var(--shadow-ease-press);
  }` : glowSegmentedCss}`}`;
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

/**
 * @displayName Shared Button-Face Property Emitter
 * @strategicPurpose The cap's resting-state declarations (position,
 *   sizing, color, shadow, padding) are identical in click and toggle mode
 *   — factoring them into one function is what guarantees the two modes'
 *   `.btn-face` can never drift apart on the properties they share.
 * @tacticalObjective Emits the shared `.btn-face` declaration block
 *   consumed by both buildClickFaceCss and buildToggleFaceCss.
 */
function sharedFaceCssProps(state, indent) {
  const i = indent || '  ';
  return [
    `${i}position: absolute;`,
    `${i}top: 0;`,
    `${i}left: ${faceInsetDecl(state)};`,
    `${i}right: ${faceInsetDecl(state)};`,
    `${i}height: calc(100% - var(--wall-h));`,
    `${i}display: flex;`,
    `${i}align-items: center;`,
    `${i}justify-content: center;`,
    `${i}gap: var(--icon-gap);`,
    `${i}border-radius: ${faceRadiusBorderDecl(state)};`,
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
    //
    // specularIndependent (issue #73) moves this SAME gradient onto the
    // face-top overlay (`.btn-face::after` — see buildFaceTopCss) instead,
    // so it is emitted from exactly one place at a time — never both (D3:
    // the default, specularIndependent: false, is byte-identical to
    // pre-#73 output).
    ...(state.specularAlpha > 0 && !state.specularIndependent ? [
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

/**
 * @displayName Click-Mode Face Rule + Keyframe Emitter
 * @strategicPurpose Click mode's whole interaction model — a spring that
 *   always completes its cycle once triggered, holds only while :active —
 *   lives here, split into three independently-timed CSS properties
 *   (transform/shadow/color) per the issue #12/#16 pattern, so a future
 *   edit to one property's timing can never silently desync another's.
 * @tacticalObjective Emits `.clicky-btn` (and its
 *   `:hover`/`:active`/`:focus-visible` states) plus the
 *   clicky-transform-cycle, clicky-shadow-cycle, clicky-color-cycle, and
 *   clicky-icon-color-cycle keyframes used by the JS-driven full
 *   press-and-release bounce.
 */
function buildClickFaceCss(state) {
  // Cycle offsets for the JS-driven full press-and-release animation. The
  // bottom lands at the configured press/release split (a hardcoded 50% here
  // silently ignored pressDuration vs duration and made the preview disagree
  // with the :active transitions the export actually ships).
  const sh  = resolveShadowTiming(state);
  const pct = f => `${(f * 100).toFixed(2)}%`;
  // Unclipped focus ring (issue #58) — see the ClickyConfig typedef entry
  // for focusUnclipped. Default (false) is the EXACT pre-#58 literal
  // string (D3).
  const focusSelector = state.focusUnclipped
    ? '.btn-housing:has(.clicky-btn:focus-visible)'
    : '.clicky-btn:focus-visible .btn-face';
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
}${!slotActive(state) ? '' : `

/* Lit channel, click-mode full press cycle (issue #53b) — driven by the SAME
   flush-point offsets clicky-shadow-cycle already uses (sh.flushDown /
   sh.bottom / sh.flushUp), never a parallel timing source: the channel only
   exists once the key is flush, so the light that fills it is gated by the
   same geometry. Both stops carry the SAME gradient TYPE and stop-count
   (cavityGradientDecl() + a one-color/one-transparent linear-gradient) so the
   browser interpolates the colour channel smoothly instead of flipping
   discretely at the midpoint — CSS Images' interpolation rule only applies to
   structurally-identical gradients. */
@keyframes clicky-glow-channel-cycle {
${sh.animates
  ? `  0%, ${pct(sh.flushDown)} { background-image: ${cavityGradientDecl()}, var(--cavity-glow-resting); }
  ${pct(sh.bottom)}   { background-image: ${cavityGradientDecl()}, var(--cavity-glow-pressed); }
  ${pct(sh.flushUp)}, 100% { background-image: ${cavityGradientDecl()}, var(--cavity-glow-resting); }`
  : `  /* press depth never carries the face below flush ⇒ it never enters the
     channel ⇒ nothing to light */
  0%, 100% { background-image: ${cavityGradientDecl()}, var(--cavity-glow-resting); }`}
}

.btn-cell:has(.clicky-btn.clicky-press)::before {
  animation-name: clicky-glow-channel-cycle;
  animation-duration: calc(var(--press-duration) + var(--duration));
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
`}

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

${buildFocusVisibleCss(state, focusSelector)}

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

/**
 * @displayName Toggle/Radio-Mode Face Rule + Keyframe Emitter
 * @strategicPurpose Toggle mode (and radio, built on top of it per issue
 *   #37 — `:has(input:checked)` is input-type-agnostic) needs a persistent
 *   checked-state read, not just a momentary press, so its rules and
 *   keyframes are a parallel but distinct system from click mode's,
 *   sharing only the visual language.
 * @tacticalObjective Emits `.clicky-toggle` (and its checked/hover/focus
 *   states) plus the toggle-press-on, toggle-press-off, toggle-xform-on,
 *   toggle-xform-off, toggle-icon-color-on, and toggle-icon-color-off
 *   keyframes used by the `.toggle-did-interact` JS-driven bounce.
 */
function buildToggleFaceCss(state) {
  // mode 'radio' (issue #37) emits <input type="radio"> instead of
  // type="checkbox" (see buildRadioSegmentHtml) — this is the ONLY line in
  // this whole function that needs to know which input type is actually in
  // play; every other selector below (:has(input:checked), ~ .btn-face, etc.)
  // is already input-type-agnostic. Gated so mode:'toggle' output stays
  // byte-identical to pre-#37 output (D3).
  const inputTypeSelector = state.mode === 'radio' ? 'input[type="radio"]' : 'input[type="checkbox"]';
  // Unclipped focus ring (issue #58) — see buildClickFaceCss's identical
  // comment. Default (false) is the EXACT pre-#58 literal string (D3).
  const focusSelector = state.focusUnclipped
    ? '.btn-housing:has(.clicky-toggle input:focus-visible)'
    : '.clicky-toggle input:focus-visible ~ .btn-face';
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

${buildFocusVisibleCss(state, focusSelector)}

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
  // `.btn-slot` wrap (issue #67) — gated, so default (no slot feature)
  // output is byte-identical to pre-#56 (D3). See slotActive/#53a for the
  // `.btn-glow` sibling this wrapper exists to host.
  const slotOpen = slotActive(state) ? '<div class="btn-slot">' : '';
  // `.btn-glow` (issue #53a) — sole child, sibling of `.btn-housing`,
  // inside `.btn-slot`. Empty content is intentional: it is a pure
  // box-shadow/clip-path canvas, never a text/paint container.
  const glowHtml = slotActive(state) ? '<div class="btn-glow"></div>' : '';
  const slotClose = slotActive(state) ? '</div>' : '';
  if (state.mode === 'click') {
    return `${slotOpen}<div class="btn-housing"><div class="btn-cell"><button class="clicky-btn${labelClass}${iconOnlyClass}${extra}" type="button"${attrStr}><span class="btn-wall"></span><span class="btn-face${faceClass}">${faceInner}</span></button></div></div>${glowHtml}${slotClose}`;
  }
  return `${slotOpen}<div class="btn-housing"><div class="btn-cell"><label class="clicky-toggle${labelClass}${iconOnlyClass}${extra}"${attrStr}>
  <input type="checkbox">
  <span class="btn-wall"></span>
  <span class="btn-face${faceClass}">${faceInner}</span>
</label></div></div>${glowHtml}${slotClose}`;
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
  // `.btn-slot` wrap (issue #67) — ONE shared slot around the shared
  // segmented housing, matching the reconciled contract's "segmented gets
  // this FREE — one shared housing, one slot" note. Gated, byte-identical
  // default output (D3).
  const housingHtml = `<div class="btn-housing btn-housing--segmented" role="${role}" aria-label="${escapeHtml(groupLabel)}">\n  ${withDividers.join('\n  ')}\n</div>`;
  if (!slotActive(state)) return housingHtml;
  // N `.btn-glow` children (issue #53a), one per segment — their
  // nth-child position (housing occupies position 1) is what
  // buildGridCss's per-segment CSS (glowSegmentedCss) selects against;
  // do not reorder these relative to `.btn-housing`.
  const glowChildren = labels.map(() => '<div class="btn-glow"></div>').join('\n  ');
  return `<div class="btn-slot">${housingHtml}\n  ${glowChildren}\n</div>`;
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
 * @displayName CSS Bundle Builder (Public API)
 * @strategicPurpose The single entry point that turns a ClickyConfig into
 *   the complete, self-contained stylesheet a page needs to render and
 *   animate a clicky button — the "Option B" runtime-generation path the
 *   README documents alongside the static export.
 * @tacticalObjective Validates config, merges it over defaultClickyConfig,
 *   and returns the full CSS string (var block + `@supports` cq-unit
 *   override + every scoped rule) for the given scope selector.
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
 * @displayName Single-Button HTML Builder (Public API)
 * @strategicPurpose The markup half of the "Option B" runtime-generation
 *   path — stamps one button's housing→cell→face DOM tree so a consumer
 *   never hand-writes the class list buildClickyCss's selectors expect.
 * @tacticalObjective Validates config, resolves the label slug and icon
 *   markup, and returns one `.btn-housing` tree in click or toggle mode;
 *   throws for `housingLayout: 'segmented'` (use buildClickyGroupHtml) and
 *   for an empty label with no aria-label.
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
  // `.btn-slot` wrap (issue #67) — gated, so default (no slot feature)
  // output is byte-identical to pre-#56 (D3).
  const slotOpen = slotActive(config) ? '<div class="btn-slot">' : '';
  const glowHtml = slotActive(config) ? '<div class="btn-glow"></div>' : '';
  const slotClose = slotActive(config) ? '</div>' : '';

  if (config.mode === 'toggle') {
    return `${slotOpen}<div class="btn-housing"><div class="btn-cell"><label class="clicky-toggle ${cls}"${attrStr}>
  <input type="checkbox">
  <span class="btn-wall"></span>
  <span class="btn-face${faceClass}">${buildFaceInner(faceConfig, txt)}</span>
</label></div></div>${glowHtml}${slotClose}`;
  }

  const tagName = tag || 'button';
  const typeAttr = tagName === 'button' ? ' type="button"' : '';
  return `${slotOpen}<div class="btn-housing"><div class="btn-cell"><${tagName} class="clicky-btn ${cls}"${typeAttr}${attrStr}><span class="btn-wall"></span><span class="btn-face${faceClass}">${buildFaceInner(faceConfig, txt)}</span></${tagName}></div></div>${glowHtml}${slotClose}`;
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
 * @displayName Button-Group HTML Builder (Public API)
 * @strategicPurpose Issue #36/#37's promoted public entry point for
 *   rendering MULTIPLE buttons that must agree on layout — either N
 *   independent housings (default) or N segments sharing one housing — so
 *   gallery.html and any consumer no longer hand-assembles the grid the
 *   way gallery.html used to before this existed.
 * @tacticalObjective Delegates to buildGridHtml for the 'separate' layout
 *   or buildSegmentedHousingHtml for 'segmented' (click/toggle/radio),
 *   enforcing the identity args (`name`/`values`/`checked`) a radio group
 *   needs at call time rather than in config.
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
 * @displayName CSS Custom-Property Map Accessor (Public API)
 * @strategicPurpose The lower-level escape hatch onto buildVarMap's output
 *   for a consumer that wants the raw `--*` values without a full
 *   stylesheet — e.g. to drive an external animation library off the same
 *   numbers the CSS itself uses.
 * @tacticalObjective Validates config, merges it over defaultClickyConfig,
 *   and returns the flat `Record<string,string>` buildVarMap produces.
 * @param {Partial<ClickyConfig>} [config={}]
 * @returns {Record<string,string>}
 */
function buildClickyVars(config = {}) {
  validateClickyConfig(config);
  const merged = { ...defaultClickyConfig, ...config };
  return buildVarMap(merged);
}

// ── Internals (for advanced consumers & generator UI) ──────────

/**
 * @displayName Internals Escape Hatch (Public API)
 * @strategicPurpose The generator UI (app.js) and advanced consumers need
 *   direct access to individual builder functions (e.g. to preview one CSS
 *   fragment, or drive per-state shadow computation in the 3D view)
 *   without re-implementing them — exporting them under one namespace
 *   keeps that access explicit and auditable instead of consumers reaching
 *   into unexported closures.
 * @tacticalObjective Re-exports every internal builder/helper function
 *   (buildVarMap, buildGridCss, buildButtonWallCss, resolveSkew,
 *   deriveFaceColorFamily, scopeCssBlock, validateClickyConfig, etc.)
 *   under one object, for advanced consumers and the generator UI — not
 *   part of the stable versioned contract the way the top-level exports
 *   are.
 */
const internals = {
  slotActive,
  slotGlowLayers,
  buildGlowShadow,
  cavityGradientDecl,
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
  buildFaceEdgeCss,
  buildFaceTopCss,
  buildRimLayer,
  faceRadiusBorderDecl,
  faceInsetDecl,
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
