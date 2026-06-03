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
 * @property {number}  radiusRatio         — % of containerWidth
 * @property {number}  chromeRadiusRatio   — % of housing width
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

 * @property {boolean} usePressColor
 * @property {string}  pressColor          — hex
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
 * @property {'click'|'toggle'} mode
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

  radiusRatio:        8,
  chromeRadiusRatio: 12,
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
};

// ── Utilities ──────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

function darkenColor(hex, percent) {
  hex = hex.replace('#', '');
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

// ── Internal builders ──────────────────────────────────────────

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

function buildHousingShadow(state, pressed) {
  const wallH_px = Math.max(1, Math.round(state.containerHeight * state.wallHRatio / 100));
  const keep = pressed ? 1 - (state.ambientPressReduction / 100) : 1;
  const ambientY    = Math.round(wallH_px * state.ambientYMult    * keep);
  const ambientBlur = Math.round(wallH_px * state.ambientBlurMult * keep);
  const ambientAlpha = (state.ambientIntensity / 100) * keep;
  const ambientColor = `rgba(0, 0, 0, ${ambientAlpha.toFixed(3)})`;
  return `0 ${ambientY}px ${ambientBlur}px 0 ${ambientColor}`;
}

function buildFaceShadow(state, pressed) {
  const insetY   = state.insetDepthRatio;
  const insetB   = state.insetBlurRatio;
  const alphaTop = state.insetAlphaTop / 100;
  const alphaBot = state.insetAlphaBot / 100;
  const hlAlpha  = state.highlightOpacity / 100;

  const L0 = `inset 0 0 0 0 transparent`;

  const softColor = `rgba(0, 0, 0, ${alphaTop.toFixed(3)})`;
  const L1 = pressed
    ? `inset 0 ${insetY}cqb ${insetB}cqb 0 ${softColor}`
    : `inset 0 0 0 0 ${softColor}`;

  const botColor  = `rgba(0, 0, 0, ${alphaBot.toFixed(3)})`;
  const insetYBot = Math.round(insetY * 0.45);
  const insetBBot = Math.round(insetB * 0.65);
  const L2 = pressed
    ? `inset 0 -${insetYBot}cqb ${insetBBot}cqb 0 ${botColor}`
    : `inset 0 0 0 0 ${botColor}`;

  const hlColor = state.topHighlight
    ? hexToRgba(state.highlightColor, hlAlpha)
    : hexToRgba(state.highlightColor, 0);
  const rimBlur = Math.max(2, Math.round(state.rimHeightRatio * 0.5));
  const L3 = `inset 0 ${state.rimHeightRatio}cqb ${rimBlur}cqb 0 ${hlColor}`;

  const edgeAlpha = (state.faceEdgeAlpha / 100).toFixed(3);
  const L4 = `inset 0 -1px 0 0 rgba(0, 0, 0, ${edgeAlpha})`;

  // The button wall (moving side of the keycap) is its own element, .btn-wall,
  // sitting behind the cap — see buildButtonWallCss. Keeping it a real rounded
  // element lets it carry the full L-R gradient while still hugging the cap's
  // rounded silhouette; it mirrors the cap's transform via parallel rules.
  return [L0, L1, L2, L3, L4].join(',\n    ');
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

  const housingW = state.containerWidth + 2 * fw;
  const housingH = state.containerHeight + fw;
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

    '--face-color':      state.faceColor,
    '--face-pressed':    darkenColor(state.usePressColor ? state.pressColor : state.faceColor, state.pressDarken),
    '--face-toggled':    darkenColor(state.useToggleColor ? state.toggleColor : state.faceColor, state.pressDarken),
    '--text-color':      state.textColor,
    '--font-size':       state.fontSizeRatio > 0 ? `${state.fontSizeRatio}cqi` : `min(8cqi, 22cqb)`,
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

    // Button wall = the moving side of the keycap (defaults to the face color);
    // cavity wall = the static housing slot (defaults to the chrome frame color).
    // Each wall has its own independent color / alpha / edge-darken / gradient.
    '--button-wall-color': state.useButtonWallColor ? state.buttonWallColor : state.faceColor,
    '--button-wall-shadow-alpha': `${(state.buttonWallShadowAlpha / 100).toFixed(3)}`,
    '--button-wall-shadow-edge-ratio': `${(state.buttonWallShadowEdgeRatio / 100).toFixed(3)}`,
    '--button-wall-gradient-lo': `${50 - state.buttonWallGradientSpread / 2}%`,
    '--button-wall-gradient-hi': `${50 + state.buttonWallGradientSpread / 2}%`,

    '--cavity-wall-color': state.useCavityWallColor ? state.cavityWallColor : state.frameColor,
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

    '--face-shadow-resting': buildFaceShadow(state, false),
    '--face-shadow-pressed': buildFaceShadow(state, true),

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

    '--duration':       `${Math.round(state.duration * Math.pow(10, -state.speedFactor) * distScale)}ms`,
    '--press-duration': `${Math.round(state.pressDuration * Math.pow(10, -state.speedFactor) * distScale)}ms`,

    // Per-property animation timing (fractions of total press cycle).
    // Symmetric delays — same wait at start and end of cycle. Each property
    // animates over (1 - 2 * delay) of the total duration, centered.
    //
    // Shadow delay is auto-computed from wall-h / press-translate so the
    // inset shadow waits until the face has descended past the visible
    // wall band ("flush with surface"). The manual shadowAnimDelay slider
    // adds to this baseline if the user wants additional delay.
    ...(function () {
      const autoFrac = pressDepth_px > 0
        ? Math.min(0.45, (wallH_px / pressDepth_px) / 2)
        : 0;
      const manualFrac = state.shadowAnimDelay / 100;
      const shadowFrac = Math.min(0.49, Math.max(manualFrac, autoFrac));
      const colorFrac = Math.min(0.49, state.colorAnimDelay / 100);
      return {
        '--shadow-anim-delay-frac': shadowFrac.toFixed(3),
        '--shadow-anim-frac':       Math.max(0.01, 1 - 2 * shadowFrac).toFixed(3),
        '--color-anim-delay-frac':  colorFrac.toFixed(3),
        '--color-anim-frac':        Math.max(0.01, 1 - 2 * colorFrac).toFixed(3),
      };
    })(),

    '--transform-easing':     getTransformEasing(state),
    '--shadow-ease-press':    SHADOW_EASING_PRESS,
    '--shadow-ease-release':  SHADOW_EASING_RELEASE,
  };
}

function buildCss(state, scopeSelector) {
  const vars = buildVarMap(state);
  const varLines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  const isToggle = state.mode === 'toggle';

  let css = `/* --- Clicky Button --- */\n`;
  css += `${scopeSelector} {\n${varLines}\n}\n\n`;
  css += buildGridCss(state);
  css += '\n\n';
  css += isToggle ? buildToggleFaceCss(state) : buildClickFaceCss(state);
  css += '\n\n';
  css += buildButtonWallCss();
  return css;
}

/* The button wall (moving side of the keycap) is its OWN element, .btn-wall,
   painted before .btn-face so the cap overlays it. It is a rounded copy of the
   cap shifted straight down (top = wall-h + hover-lift), so its rounded bottom
   edge hugs the cap's silhouette at any radius — and being a real element it can
   carry the full L-R gradient. It mirrors the cap's transform through parallel
   hover / press / toggle rules in buildClickFaceCss / buildToggleFaceCss. */
function buildButtonWallCss() {
  return `/* Button wall — moving side of the keycap, behind the cap. */
.btn-wall {
  position: absolute;
  left: 0;
  right: 0;
  /* Copy of the cap (same height + radius) shifted down by the wall band. The
     extra hover-lift overshoots the clipped cell bottom at rest, then pulls
     flush on hover so the rising key never exposes a strip of cavity. */
  top: calc(var(--wall-h) + var(--hover-lift));
  height: calc(100% - var(--wall-h));
  border-radius: var(--radius);
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
}`;
}

function buildGridCss(state) {
  const frameEnabled = state.frameEnabled;
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
  box-shadow:
    ${frameEnabled ? `inset 0 var(--frame-bevel-width) 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha)),
    inset 0 calc(-1 * var(--frame-bevel-width)) 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)),
    inset var(--frame-bevel-width) 0 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha)),
    inset calc(-1 * var(--frame-bevel-width)) 0 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)),` : ''}
    var(--housing-shadow);
  transition: box-shadow var(--duration) var(--shadow-ease-release);
}

.btn-housing:has(.clicky-btn:active),
.btn-housing:has(.clicky-toggle input:checked) {
  box-shadow:
    ${frameEnabled ? `inset 0 var(--frame-bevel-width) 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha)),
    inset 0 calc(-1 * var(--frame-bevel-width)) 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)),
    inset var(--frame-bevel-width) 0 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha)),
    inset calc(-1 * var(--frame-bevel-width)) 0 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)),` : ''}
    var(--housing-shadow-pressed);
  transition: box-shadow var(--press-duration) var(--shadow-ease-press);
}

.btn-cell {
  position: absolute;
  top: 0;
  left: var(--frame-width);
  right: var(--frame-width);
  height: var(--container-height);
  container-type: size;
  overflow: hidden;
  border-radius: var(--radius);
  background: transparent;
}

.btn-cell::before {
  content: '';
  position: absolute;
  /* Slight 1px inflation on the visible edges prevents sub-pixel anti-alias
     gaps where the dark wall corner meets the bright chrome surround. */
  top: var(--frame-width);
  left: -1px;
  right: -1px;
  bottom: -1px;
  border-radius: var(--radius);
  /* Cavity wall — the static inside of the housing slot, revealed above the
     key as it presses down. Base defaults to the chrome frame color; the
     cavity-alpha dark gradient is multiplied on top for the recessed edge
     shadow. Flip useCavityWallColor to set an independent cavity color. (The
     moving button-side wall is a drop-shadow copy of the cap — see
     buildFaceShadow — flat-colored from its own button-wall vars.) */
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
}`;
}

function toggledRestStatePropsCss(indent) {
  const i = indent || '  ';
  return [
    `${i}transform: translateY(var(--toggle-height));`,
    `${i}box-shadow:`,
    `${i}  var(--face-shadow-pressed);`,
    `${i}background-color: var(--face-toggled);`,
    `${i}transition: none;`,
  ].join('\n');
}

function sharedFaceCssProps(indent) {
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
    `${i}border-radius: var(--radius);`,
    // The face is just the rounded cap (top surface). The button wall — the
    // moving side of the keycap — is drawn as a drop-shadow copy of this cap,
    // shifted straight down, in buildFaceShadow. Because it is a copy of the
    // rounded cap shape (not a rectangle) it hugs the cap's rounded bottom edge
    // exactly, so the cap keeps its corner radius and no cavity leaks through.
    `${i}background-color: var(--face-color);`,
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
    `${i}padding-inline: calc(var(--radius) * 0.5);`,
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
    `${i}transform: translateY(var(--press-translate));`,
    `${i}box-shadow:`,
    `${i}  var(--face-shadow-pressed);`,
    `${i}background-color: var(--face-pressed);`,
    `${i}transition:`,
    `${i}  transform var(--press-duration) var(--shadow-ease-press),`,
    `${i}  box-shadow var(--press-duration) var(--shadow-ease-press),`,
    `${i}  background-color var(--press-duration) var(--shadow-ease-press);`,
  ].join('\n');
}

function buildFocusVisibleCss(state, selector) {
  const c = state.focusColor;
  const sz = state.focusSize;
  switch (state.focusStyle) {
    case 'tint':
      return `${selector} {
  background-color: color-mix(in srgb, ${c} 18%, var(--face-color));
}`;
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
  return `/* Click mode */
.clicky-btn {
  position: absolute;
  inset: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  outline: none;
}

.clicky-btn:focus-visible { outline: none; }

.clicky-btn .btn-face {
${sharedFaceCssProps()}
}

@media (hover: hover) {
  .clicky-btn:hover:not(:active):not(.clicky-press) .btn-face,
  .clicky-btn:hover:not(:active):not(.clicky-press) .btn-wall {
    transform: translateY(calc(-1 * var(--hover-lift)));
  }
}

/* Full press cycle — runs resting → pressed → resting on every click.
   Triggered by adding .clicky-press class via JS on pointerdown:
     btn.addEventListener('pointerdown', () => {
       btn.classList.remove('clicky-press');
       void btn.offsetWidth;
       btn.classList.add('clicky-press');
     });
     btn.addEventListener('animationend', e => {
       if (e.animationName === 'clicky-transform-cycle')
         btn.classList.remove('clicky-press');
     });
   The animation runs to completion regardless of click duration. Holding the
   button does NOT keep it pressed — the animation always completes its cycle
   and returns to resting. (To get hold-to-stay-pressed behavior, add a
   .clicky-btn:active .btn-face rule with the pressed property values.) */

@keyframes clicky-transform-cycle {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(var(--press-translate)); }
}

@keyframes clicky-shadow-cycle {
  0%, 100% { box-shadow: var(--face-shadow-resting); }
  50%      { box-shadow: var(--face-shadow-pressed); }
}

@keyframes clicky-color-cycle {
  0%, 100% { background-color: var(--face-color); }
  50%      { background-color: var(--face-pressed); }
}

.clicky-btn.clicky-press .btn-face {
  animation-name: clicky-transform-cycle, clicky-shadow-cycle, clicky-color-cycle;
  animation-duration:
    calc(var(--press-duration) + var(--duration)),
    calc((var(--press-duration) + var(--duration)) * var(--shadow-anim-frac)),
    calc((var(--press-duration) + var(--duration)) * var(--color-anim-frac));
  animation-timing-function: linear, linear, linear;
  animation-delay:
    0s,
    calc((var(--press-duration) + var(--duration)) * var(--shadow-anim-delay-frac)),
    calc((var(--press-duration) + var(--duration)) * var(--color-anim-delay-frac));
  animation-fill-mode: forwards, forwards, forwards;
}

/* The wall mirrors only the cap's transform (reusing the transform-only
   keyframe), so it stays glued to the cap through the press cycle. */
.clicky-btn.clicky-press .btn-wall {
  animation: clicky-transform-cycle calc(var(--press-duration) + var(--duration)) linear forwards;
}

${buildFocusVisibleCss(state, '.clicky-btn:focus-visible .btn-face')}

@media (prefers-reduced-motion: reduce) {
  .clicky-btn .btn-face,
  .clicky-btn:active .btn-face,
  .clicky-btn.clicky-press .btn-face,
  .clicky-btn .btn-wall,
  .clicky-btn.clicky-press .btn-wall { transition: none; animation: none; }
}
`;
}

function buildToggleFaceCss(state) {
  return `/* Toggle mode — hidden checkbox + visible face */
.clicky-toggle {
  position: absolute;
  inset: 0;
  display: block;
  cursor: pointer;
}

.clicky-toggle input[type="checkbox"] {
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
    transform: translateY(0);
    box-shadow: var(--face-shadow-resting);
    background-color: var(--face-color);
  }
  50%  {
    transform: translateY(var(--press-translate));
    box-shadow: var(--face-shadow-pressed);
    background-color: var(--face-pressed);
  }
  100% {
    transform: translateY(var(--toggle-height));
    box-shadow: var(--face-shadow-pressed);
    background-color: var(--face-toggled);
  }
}

@keyframes toggle-press-off {
  0%   {
    transform: translateY(var(--toggle-height));
    box-shadow: var(--face-shadow-pressed);
    background-color: var(--face-toggled);
  }
  50%  {
    transform: translateY(var(--press-translate));
    box-shadow: var(--face-shadow-pressed);
    background-color: var(--face-pressed);
  }
  100% {
    transform: translateY(0);
    box-shadow: var(--face-shadow-resting);
    background-color: var(--face-color);
  }
}

/* Transform-only counterparts of the toggle keyframes, for the wall — it tracks
   the cap's position without touching the cap's box-shadow / background-color. */
@keyframes toggle-xform-on {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(var(--press-translate)); }
  100% { transform: translateY(var(--toggle-height)); }
}

@keyframes toggle-xform-off {
  0%   { transform: translateY(var(--toggle-height)); }
  50%  { transform: translateY(var(--press-translate)); }
  100% { transform: translateY(0); }
}

.clicky-toggle .btn-face {
${sharedFaceCssProps()}
}

@media (hover: hover) {
  .clicky-toggle:hover:not(:has(input:checked)) .btn-face,
  .clicky-toggle:hover:not(:has(input:checked)) .btn-wall {
    transform: translateY(calc(-1 * var(--hover-lift)));
  }
}

.clicky-toggle:has(input:checked) .btn-face,
.clicky-toggle input:checked ~ .btn-face {
${toggledRestStatePropsCss()}
}

/* Wall rest position when toggled on — transform only. */
.clicky-toggle:has(input:checked) .btn-wall,
.clicky-toggle input:checked ~ .btn-wall {
  transform: translateY(var(--toggle-height));
  transition: none;
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
}
`;
}

// ── HTML generation ────────────────────────────────────────────

function getLabels(state) {
  const raw = state.btnLabels.split(',').map(s => s.trim()).filter(Boolean);
  const count = state.btnCount;
  const labels = [];
  for (let i = 0; i < count; i++) {
    labels.push(raw[i] || raw[i % raw.length] || `BTN${i + 1}`);
  }
  return labels;
}

/* Build the inner content of a .btn-face: the label, plus an optional Material
   Symbols icon glyph rendered as a ligature on the configured side. The icon is
   aria-hidden — it is decorative alongside the visible text label. */
function buildFaceInner(state, txt) {
  const label = `<span class="btn-label">${txt}</span>`;
  const name = (state.iconName || '').trim();
  if (!name) return label;
  const icon = `<span class="btn-icon material-symbols-rounded" aria-hidden="true">${escapeHtml(name)}</span>`;
  return state.iconPosition === 'right' ? `${label}${icon}` : `${icon}${label}`;
}

function buildSingleButtonHtml(state, label, extraClass) {
  const extra = extraClass ? ` ${extraClass}` : '';
  const txt = escapeHtml(label);
  const slug = (label || '').toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const labelClass = ` label-${slug || 'btn'}`;
  const faceInner = buildFaceInner(state, txt);
  if (state.mode === 'click') {
    return `<div class="btn-housing"><div class="btn-cell"><button class="clicky-btn${labelClass}${extra}" type="button"><span class="btn-wall"></span><span class="btn-face">${faceInner}</span></button></div></div>`;
  }
  return `<div class="btn-housing"><div class="btn-cell"><label class="clicky-toggle${labelClass}${extra}">
  <input type="checkbox">
  <span class="btn-wall"></span>
  <span class="btn-face">${faceInner}</span>
</label></div></div>`;
}

function buildGridHtml(state, extraClass) {
  const labels = getLabels(state);
  const cells = labels.map(l => buildSingleButtonHtml(state, l, extraClass)).join('\n  ');
  return `<div class="btn-grid">\n  ${cells}\n</div>`;
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
  const merged = { ...defaultClickyConfig, ...config };
  const scope  = opts.scope ?? ':root';
  return buildCss(merged, scope);
}

/**
 * Build the HTML structure for one clicky button (housing -> cell -> face).
 * @param {object} args
 * @param {string} args.label — visible text on the face
 * @param {string} [args.tag="button"] — element tag for click mode
 * @param {Record<string,string>} [args.attrs] — extra attributes
 * @param {string} [args.extraClass]
 * @param {Partial<ClickyConfig>} [args.config] — overrides on defaults
 * @returns {string} HTML string
 */
function buildClickyHtml({ label, tag = 'button', attrs = {}, extraClass = '', config: userConfig = {} }) {
  const config = { ...defaultClickyConfig, ...userConfig };
  const txt = escapeHtml(label);
  const slug = (label || '').toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const labelClass = `label-${slug || 'btn'}`;
  const cls = [extraClass, labelClass].filter(Boolean).join(' ');

  const attrStr = Object.entries(attrs)
    .map(([k, v]) => ` ${escapeHtml(k)}="${escapeHtml(v)}"`)
    .join('');

  if (config.mode === 'toggle') {
    return `<div class="btn-housing"><div class="btn-cell"><label class="clicky-toggle ${cls}"${attrStr}>
  <input type="checkbox">
  <span class="btn-wall"></span>
  <span class="btn-face">${buildFaceInner(config, txt)}</span>
</label></div></div>`;
  }

  const tagName = tag || 'button';
  const typeAttr = tagName === 'button' ? ' type="button"' : '';
  return `<div class="btn-housing"><div class="btn-cell"><${tagName} class="clicky-btn ${cls}"${typeAttr}${attrStr}><span class="btn-wall"></span><span class="btn-face">${buildFaceInner(config, txt)}</span></${tagName}></div></div>`;
}

/**
 * Lower-level access to the CSS custom property map.
 * @param {Partial<ClickyConfig>} [config={}]
 * @returns {Record<string,string>}
 */
function buildClickyVars(config = {}) {
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
  sharedFaceCssProps,
  pressedStatePropsCss,
  toggledRestStatePropsCss,
  buildFocusVisibleCss,
  buildClickFaceCss,
  buildToggleFaceCss,
  getTransformEasing,
  getLabels,
  buildSingleButtonHtml,
  buildGridHtml,
  hexToRgba,
  darkenColor,
  escapeHtml,
  EASING_PRESETS,
  SHADOW_EASING_PRESS,
  SHADOW_EASING_RELEASE,
};

export {
  defaultClickyConfig,
  buildClickyCss,
  buildClickyHtml,
  buildClickyVars,
  internals,
  EASING_PRESETS,
  SHADOW_EASING_PRESS,
  SHADOW_EASING_RELEASE,
  hexToRgba,
  escapeHtml,
};
