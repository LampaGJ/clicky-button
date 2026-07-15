/* ============================================================
   CLICKY BUTTON GENERATOR — app.js
   Generator UI only. All pure CSS/HTML producers live in
   lib/clicky-button.js as an importable ES module.
   ============================================================ */

'use strict';

// Dev cache-buster: propagate ?v= from index.html through to the lib module
// so edits to clicky-button.js show up on a normal refresh (no need to clear cache).
const __v = new URL(import.meta.url).searchParams.get('v');
const __libUrl = __v ? `./lib/clicky-button.js?v=${__v}` : './lib/clicky-button.js';
const {
  defaultClickyConfig,
  buildClickyCss,
  buildClickyVars,
  internals,
  EASING_PRESETS,
} = await import(__libUrl);
const { clickyEnhancerJs } = await import(
  __v ? `./lib/clicky-button-enhancer.js?v=${__v}` : './lib/clicky-button-enhancer.js'
);

const {
  buildCss,
  buildGridCss,
  buildSingleButtonHtml,
  buildGridHtml,
  buildSegmentedHousingHtml,
  slugify,
  getLabels,
  buildFocusVisibleCss,
  KEYCAP_Y,
  pressedStatePropsCss,
  toggledRestStatePropsCss,
} = internals;

// Segmented housing / tri-state preview (issues #36/#37) — bypasses
// validateClickyConfig the same way buildGridHtml already does (the
// generator's `state` carries UI-only keys like previewBg/view3dRotateX that
// the public, validated buildClickyGroupHtml would reject). Machine `values`
// for the preview's radio group are derived straight from the resolved
// labels' slugs so they always line up 1:1; `checked` defaults to the first
// (tacit) segment.
function buildGroupPreviewHtml(previewState) {
  if (previewState.housingLayout !== 'segmented') return buildGridHtml(previewState);
  const groupLabel = previewState.groupLabel || 'Segmented group';
  if (previewState.mode === 'radio') {
    const labels = getLabels(previewState);
    const values = labels.map(l => slugify(l) || 'value');
    return buildSegmentedHousingHtml(previewState, { name: 'preview-tristate', values, checked: values[0] }, groupLabel);
  }
  return buildSegmentedHousingHtml(previewState, {}, groupLabel);
}

// ── State ─────────────────────────────────────────────────────
// Default style the configurator boots with — the "Amber Contact sales today"
// preset, relabeled SUBMIT as a single button. These are overrides on top of
// the library's neutral defaultClickyConfig (the library default stays generic;
// only the configurator's starting point is opinionated). Reverse-engineered
// from amber-contact-sales-today.css (gitignored).
const CONFIGURATOR_DEFAULT = {
  btnCount:                  1,
  btnLabels:                 'SUBMIT',
  containerWidth:            400,
  radiusRatio:               50,   // clamps to a full pill at this geometry
  faceColor:                 '#fdd34c',
  pressDarken:               26,
  pressDepthRatio:           32,
  buttonWallShadowAlpha:     40,
  buttonWallShadowEdgeRatio: 30,
  buttonWallGradientSpread:  65,
  cavityWallShadowAlpha:     40,
  cavityWallShadowEdgeRatio: 30,
  cavityWallGradientSpread:  65,
  rimHeightRatio:            15,
  highlightOpacity:          0,
  ambientPressReduction:     75,
  frameBevelAlpha:           75,
  frameBevelWidth:           3,
  iconName:                  'send',  // paper-airplane glyph on the SUBMIT face
};

const state = {
  ...defaultClickyConfig,
  ...CONFIGURATOR_DEFAULT,
  // Generator-UI-only keys (never exported to consumers)
  previewBg:    'light',
  view3dRotateX:  50,
  view3dRotateY: -20,
  // Icon-only accessible name (issue #32) — read by buildGridHtml as
  // state.iconOnlyAriaLabel and applied to every empty-label cell.
  iconOnlyAriaLabel: '',
};

// ── DOM helpers ───────────────────────────────────────────────
const $ = id => document.getElementById(id);

const previewStage    = $('preview-stage');
const previewStage3d  = $('preview-stage-3d');
const stateTestStage  = $('state-test-stage');
const previewStyle    = $('preview-style');

// ── Preview update ────────────────────────────────────────────
function updatePreview() {
  const css = buildCss(state, ':root');

  // ── State test panel ──────────────────────────────────────────────────
  const labels = getLabels(state);
  const firstLabel = labels[0] || 'BTN';

  function stateItem(caption, extraClass) {
    const html = buildSingleButtonHtml(state, firstLabel, extraClass);
    return `<div class="state-test-item">
      ${html}
      <div class="state-test-caption">${caption}</div>
    </div>`;
  }

  stateTestStage.innerHTML =
    stateItem('STARTING',     'state-resting') +
    stateItem('HOVER',        'state-hover') +
    stateItem('PRESSED MAX',  'state-pressed-max') +
    stateItem('TOGGLE POINT', 'state-toggle-point');

  // ── Working preview ───────────────────────────────────────────────────
  previewStage.innerHTML = buildGroupPreviewHtml(state);

  // ── 3D view ───────────────────────────────────────────────────────────
  previewStage3d.innerHTML = buildGroupPreviewHtml(state);
  previewStage3d.style.setProperty('--view3d-rx', `${state.view3dRotateX}deg`);
  previewStage3d.style.setProperty('--view3d-ry', `${state.view3dRotateY}deg`);

  // ── Preview background ───────────────────────────────────────────────
  const canvas = document.querySelector('.preview-canvas');
  if (canvas) {
    canvas.className = `preview-canvas bg-${state.previewBg}`;
  }

  // ── Icon-only aria-label field (issue #32) ────────────────────────────
  // Shown only once the Labels field is emptied — that's the point at which
  // an icon-only button (and its required accessible name) becomes possible.
  const iconOnlyAriaRow = $('icon-only-aria-row');
  if (iconOnlyAriaRow) {
    iconOnlyAriaRow.style.display = state.btnLabels.trim() === '' ? '' : 'none';
  }

  // ── State-test overrides ─────────────────────────────────────────────
  // Generated from the same generation-time property helpers as the live
  // press/toggle CSS (KEYCAP_Y, pressedStatePropsCss, toggledRestStatePropsCss)
  // so the frozen swatches can never drift from the real thing — this
  // replaces styles.css's hand-authored third duplicate (issue #13).
  const frameEnabled = state.frameEnabled;
  // Conic-gradient corner bevel (issue #18) — when active, the frame bevel is
  // painted by the (state-independent) `.btn-housing::after` ring instead of
  // these box-shadow inset lines, so this frozen-swatch override must drop
  // them too or the flat edges would double up (straight inset UNDER the
  // ring, both at --frame-bevel-alpha).
  const bevelInsets = (frameEnabled && !state.frameBevelConic)
    ? `inset 0 var(--frame-bevel-width) 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha)),
    inset 0 calc(-1 * var(--frame-bevel-width)) 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)),
    inset var(--frame-bevel-width) 0 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha)),
    inset calc(-1 * var(--frame-bevel-width)) 0 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)),`
    : '';

  // Appends " !important" before every declaration-terminating semicolon.
  // Safe here because none of these declaration VALUES contain a semicolon.
  function important(cssProps) {
    return cssProps.replace(/;/g, ' !important;');
  }

  // Explicit freeze override — always emitted LAST in each rule below so it
  // wins over pressedStatePropsCss/toggledRestStatePropsCss's real (non-none)
  // transition, per U1/U2.
  const FREEZE = '  transition: none !important;\n  animation: none !important;';

  const stateTestCss = `
/* State-test panel: frozen swatches generated from the same generation-time
   property helpers as the live press/toggle CSS — see issue #13. */
.state-resting .btn-face {
  transform: ${KEYCAP_Y.rest} !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  box-shadow: var(--face-shadow-resting) !important;
  background-color: var(--face-color) !important;
${FREEZE}
}
.state-resting .btn-wall {
  transform: ${KEYCAP_Y.rest} !important;
${FREEZE}
}

.state-hover .btn-wall {
  transform: ${KEYCAP_Y.hover} !important;
${FREEZE}
}
.state-hover .btn-face {
  transform: ${KEYCAP_Y.hover} !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  box-shadow: var(--face-shadow-resting) !important;
  background-color: var(--face-color) !important;
${FREEZE}
}

.state-pressed-max .btn-face {
${important(pressedStatePropsCss('  '))}
  padding-top: var(--press-translate) !important;
${FREEZE}
}
.state-pressed-max .btn-wall {
  transform: ${KEYCAP_Y.pressed} !important;
${FREEZE}
}

.state-toggle-point .btn-face {
${important(toggledRestStatePropsCss('  '))}
  padding-top: max(0px, var(--toggle-height)) !important;
${FREEZE}
}
.state-toggle-point .btn-wall {
  transform: ${KEYCAP_Y.toggled} !important;
${FREEZE}
}

/* State-test panel: frozen housing shadow for pressed states */
.btn-housing:has(.state-pressed-max),
.btn-housing:has(.state-toggle-point) {
  box-shadow:
    ${bevelInsets}
    var(--housing-shadow-pressed) !important;
  transition: none !important;
}`;

  previewStyle.textContent = css + stateTestCss;

  // ── Interaction handlers ─────────────────────────────────────────
  [previewStage, previewStage3d, stateTestStage].forEach(container => {
    if (!container) return;
    container.querySelectorAll('.clicky-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        toggle.classList.add('toggle-did-interact');
      }, { once: true });
    });
    // Full press cycle on pointerdown. Reflow trick ensures rapid re-clicks
    // restart the animation cleanly from 0%. Keep .clicky-press applied while
    // the mouse is still over the button so the post-animation hover-lift
    // doesn't engage and visibly "rise" after the press completes.
    container.querySelectorAll('.clicky-btn').forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        btn.classList.remove('clicky-press');
        void btn.offsetWidth;
        btn.classList.add('clicky-press');
      });
      btn.addEventListener('pointerleave', () => {
        btn.classList.remove('clicky-press');
      });
      btn.addEventListener('animationend', e => {
        if (e.animationName.startsWith('clicky-transform-cycle') && !btn.matches(':hover')) {
          btn.classList.remove('clicky-press');
        }
      });
    });
  });

}

// ── Controls wiring ───────────────────────────────────────────
const controlRegistry = [];

function wireRangeNum(rangeId, numId, stateKey, transform) {
  const range = $(rangeId), num = $(numId);
  if (!range || !num) return;
  controlRegistry.push({ type: 'range', rangeId, numId, stateKey });
  const apply = val => {
    state[stateKey] = transform ? transform(val) : val;
    updatePreview();
  };
  range.addEventListener('input', () => {
    const v = parseFloat(range.value);
    num.value = v;
    apply(v);
  });
  num.addEventListener('input', () => {
    let v = parseFloat(num.value);
    if (isNaN(v)) return;
    v = Math.min(parseFloat(num.max || Infinity), Math.max(parseFloat(num.min || -Infinity), v));
    range.value = num.value = v;
    apply(v);
  });
}

function wireColor(id, stateKey) {
  const el = $(id);
  if (!el) return;
  controlRegistry.push({ type: 'color', id, stateKey });
  el.addEventListener('input', () => { state[stateKey] = el.value; updatePreview(); });
}

function wireSelect(id, stateKey, onChange) {
  const el = $(id);
  if (!el) return;
  controlRegistry.push({ type: 'select', id, stateKey });
  el.addEventListener('change', () => {
    state[stateKey] = el.value;
    if (onChange) onChange(el.value);
    updatePreview();
  });
}

function wireCheckbox(id, stateKey, onChange) {
  const el = $(id);
  if (!el) return;
  controlRegistry.push({ type: 'checkbox', id, stateKey });
  el.addEventListener('change', () => {
    state[stateKey] = el.checked;
    if (onChange) onChange(el.checked);
    updatePreview();
  });
}

function wireText(id, stateKey) {
  const el = $(id);
  if (!el) return;
  controlRegistry.push({ type: 'text', id, stateKey });
  el.addEventListener('input', () => { state[stateKey] = el.value; updatePreview(); });
}

function depRow(rowId, visible) {
  const row = $(rowId);
  if (!row) return;
  // Real .disabled (styled via styles.css's input:disabled/select:disabled
  // rule, U15b/#27) is now authoritative — no row-level opacity/pointerEvents
  // toggle needed, avoiding a double-dim stack.
  row.querySelectorAll('input, select').forEach(el => el.disabled = !visible);
}

// ── Per-corner radius (issue #35) ──────────────────────────────
// state.radiusCorners is null (uniform legacy path, byte-identical default
// output) until "Per-Corner Radius" is checked. Locked (default) mirrors one
// corner input to all four — same single-slider UX as today's uniform
// Button Radius control; unlocking exposes four independent corners.
const RADIUS_CORNER_KEYS = ['tl', 'tr', 'br', 'bl'];

function currentRadiusCorners() {
  return state.radiusCorners || RADIUS_CORNER_KEYS.reduce((acc, k) => {
    acc[k] = state.radiusRatio;
    return acc;
  }, {});
}

function syncRadiusCornerRows() {
  const active = !!state.radiusCorners;
  const enableEl = $('btn-radius-per-corner');
  if (enableEl) enableEl.checked = active;
  const uniformRow = $('uniform-radius-row');
  if (uniformRow) uniformRow.style.display = active ? 'none' : '';
  ['radius-corners-lock-row', 'radius-tl-row', 'radius-tr-row', 'radius-br-row', 'radius-bl-row']
    .forEach(id => { const row = $(id); if (row) row.style.display = active ? '' : 'none'; });
  const corners = currentRadiusCorners();
  RADIUS_CORNER_KEYS.forEach(k => {
    const range = $(`btn-radius-${k}`), num = $(`btn-radius-${k}-num`);
    if (range) range.value = corners[k];
    if (num) num.value = corners[k];
  });
}

function wireRadiusCorners() {
  const enableEl = $('btn-radius-per-corner');
  if (enableEl) {
    enableEl.addEventListener('change', () => {
      state.radiusCorners = enableEl.checked ? currentRadiusCorners() : null;
      syncRadiusCornerRows();
      updatePreview();
    });
  }

  const lockEl = $('btn-radius-corners-lock');
  RADIUS_CORNER_KEYS.forEach(k => {
    const range = $(`btn-radius-${k}`), num = $(`btn-radius-${k}-num`);
    if (!range || !num) return;
    const apply = rawVal => {
      const v = parseFloat(rawVal);
      if (isNaN(v)) return;
      if (!state.radiusCorners) state.radiusCorners = currentRadiusCorners();
      if (lockEl && lockEl.checked) {
        RADIUS_CORNER_KEYS.forEach(kk => { state.radiusCorners[kk] = v; });
        syncRadiusCornerRows();
      } else {
        state.radiusCorners[k] = v;
      }
      updatePreview();
    };
    range.addEventListener('input', () => { num.value = range.value; apply(range.value); });
    num.addEventListener('input',   () => { range.value = num.value;  apply(num.value); });
  });

  syncRadiusCornerRows();
}

function initControls() {
  const speedEl    = $('master-speed');
  const speedRead  = $('master-speed-readout');
  const updateSpeedReadout = () => {
    const speedMult = Math.pow(10, state.speedFactor);
    speedRead.textContent = `${speedMult < 0.1 ? speedMult.toFixed(2) : speedMult.toFixed(2)}×`;
  };
  if (speedEl) {
    speedEl.addEventListener('input', () => {
      state.speedFactor = parseFloat(speedEl.value);
      updateSpeedReadout();
      updatePreview();
    });
    updateSpeedReadout();
  }

  // Container & Grid
  wireRangeNum('container-width',  'container-width-num',  'containerWidth');
  wireRangeNum('container-height', 'container-height-num', 'containerHeight');
  wireRangeNum('btn-count',        'btn-count-num',        'btnCount',
    v => Math.round(v));
  wireText('btn-labels', 'btnLabels');
  wireText('btn-icon-only-aria', 'iconOnlyAriaLabel');
  $('btn-shape-circle-preset')?.addEventListener('click', () => applyShapePreset('circle'));
  $('btn-shape-square-preset')?.addEventListener('click', () => applyShapePreset('square'));
  wireSelect('grid-direction', 'gridDirection');
  wireSelect('grid-wrap',      'gridWrap');
  wireRangeNum('grid-gap', 'grid-gap-num', 'gridGap');
  wireSelect('grid-justify', 'gridJustify');
  wireSelect('grid-align',   'gridAlign');

  // Segmented housing (issue #36) — 'segmented' shares one housing across N
  // flex-child segments; validateClickyConfig rejects it combined with the
  // default gridWrap 'wrap' (a wrapped segment strip is meaningless), so
  // switching layouts here force-corrects gridWrap to keep any later export
  // (buildClickyCss/buildClickyGroupHtml, which DO validate) from throwing.
  wireSelect('housing-layout', 'housingLayout', on => {
    const segmented = on === 'segmented';
    depRow('group-label-row', segmented);
    depRow('segment-divider-row', segmented);
    if (segmented && state.gridWrap === 'wrap') {
      state.gridWrap = 'nowrap';
      const gw = $('grid-wrap');
      if (gw) gw.value = 'nowrap';
    }
  });
  wireText('group-label', 'groupLabel');
  wireRangeNum('segment-divider-width', 'segment-divider-width-num', 'segmentDividerWidth');

  // Appearance
  wireRangeNum('btn-radius',        'btn-radius-num',        'radiusRatio');
  wireRadiusCorners();
  wireRangeNum('btn-chrome-radius', 'btn-chrome-radius-num', 'chromeRadiusRatio');
  wireRangeNum('btn-skew-x-angle',  'btn-skew-x-angle-num',  'skewXAngle', v => Math.round(v));
  wireRangeNum('btn-skew-y-angle',  'btn-skew-y-angle-num',  'skewYAngle', v => Math.round(v));
  wireColor('btn-face-color', 'faceColor');
  wireColor('btn-text-color', 'textColor');
  wireCheckbox('btn-text-wrap', 'textWrap');
  wireRangeNum('btn-font-size',     'btn-font-size-num',     'fontSizeRatio');
  wireSelect('btn-font-weight', 'fontWeight');
  wireRangeNum('btn-letter-spacing','btn-letter-spacing-num','letterSpacing',
    v => parseFloat(v.toFixed(3)));

  // Icon
  wireSelect('btn-icon-position', 'iconPosition');
  wireSelect('btn-icon-placement', 'iconPlacement', on => depRow('icon-inset-row', on === 'edge'));
  wireRangeNum('btn-icon-inset', 'btn-icon-inset-num', 'iconInset');
  wireRangeNum('btn-icon-size', 'btn-icon-size-num', 'iconScale', v => parseFloat(v.toFixed(2)));
  wireRangeNum('btn-icon-gap',  'btn-icon-gap-num',  'iconGap');
  wireCheckbox('btn-icon-use-color', 'iconUseColor', on => depRow('icon-color-row', on));
  wireColor('btn-icon-color', 'iconColor');
  wireCheckbox('btn-icon-fill', 'iconFill');
  const iconNameInput = $('btn-icon-name');
  if (iconNameInput) {
    iconNameInput.addEventListener('input', () => {
      state.iconName = iconNameInput.value.trim();
      syncIconPicker();
      updatePreview();
    });
  }
  const iconSvgInput = $('btn-icon-svg');
  if (iconSvgInput) {
    iconSvgInput.addEventListener('input', () => {
      applyIconSvgInput(iconSvgInput.value);
    });
  }

  // Face
  wireCheckbox('btn-use-press-color', 'usePressColor', on => depRow('press-color-row', on));
  wireColor('btn-press-color', 'pressColor');
  wireCheckbox('btn-use-toggle-color', 'useToggleColor', on => depRow('toggle-color-row', on));
  wireColor('btn-toggle-color', 'toggleColor');
  wireRangeNum('btn-press-darken',      'btn-press-darken-num',      'pressDarken');
  wireRangeNum('btn-face-edge-alpha',   'btn-face-edge-alpha-num',   'faceEdgeAlpha');
  wireRangeNum('btn-specular-alpha',    'btn-specular-alpha-num',    'specularAlpha');
  wireRangeNum('btn-light-angle-x',     'btn-light-angle-x-num',     'lightAngleX');
  wireRangeNum('btn-light-angle-y',     'btn-light-angle-y-num',     'lightAngleY');
  wireRangeNum('btn-specular-size',     'btn-specular-size-num',     'specularSize');

  // Depth (shared geometry for both walls)
  wireRangeNum('btn-press-depth',       'btn-press-depth-num',       'pressDepthRatio');
  wireRangeNum('btn-wall-h',            'btn-wall-h-num',            'wallHRatio');

  // Button wall (moving side of the keycap)
  wireCheckbox('btn-use-button-wall-color', 'useButtonWallColor', on => depRow('button-wall-color-row', on));
  wireColor('btn-button-wall-color', 'buttonWallColor');
  wireRangeNum('btn-button-wall-shadow-alpha',      'btn-button-wall-shadow-alpha-num',      'buttonWallShadowAlpha');
  wireRangeNum('btn-button-wall-shadow-edge-ratio', 'btn-button-wall-shadow-edge-ratio-num', 'buttonWallShadowEdgeRatio');
  wireRangeNum('btn-button-wall-gradient-spread',   'btn-button-wall-gradient-spread-num',   'buttonWallGradientSpread');

  // Button cavity (static housing slot)
  wireCheckbox('btn-use-cavity-wall-color', 'useCavityWallColor', on => depRow('cavity-wall-color-row', on));
  wireColor('btn-cavity-wall-color', 'cavityWallColor');
  wireRangeNum('btn-cavity-wall-shadow-alpha',      'btn-cavity-wall-shadow-alpha-num',      'cavityWallShadowAlpha');
  wireRangeNum('btn-cavity-wall-shadow-edge-ratio', 'btn-cavity-wall-shadow-edge-ratio-num', 'cavityWallShadowEdgeRatio');
  wireRangeNum('btn-cavity-wall-gradient-spread',   'btn-cavity-wall-gradient-spread-num',   'cavityWallGradientSpread');

  // Face shadows
  wireRangeNum('btn-inset-depth',       'btn-inset-depth-num',       'insetDepthRatio');
  wireRangeNum('btn-inset-blur',        'btn-inset-blur-num',        'insetBlurRatio');
  wireRangeNum('btn-inset-alpha-top',   'btn-inset-alpha-top-num',   'insetAlphaTop');
  wireRangeNum('btn-inset-alpha-bot',   'btn-inset-alpha-bot-num',   'insetAlphaBot');

  // Rim highlight
  wireCheckbox('btn-top-highlight', 'topHighlight', on => {
    depRow('highlight-color-row',   on);
    depRow('highlight-opacity-row', on);
  });
  wireColor('btn-highlight-color', 'highlightColor');
  wireRangeNum('btn-highlight-opacity','btn-highlight-opacity-num','highlightOpacity');
  wireRangeNum('btn-rim-height',       'btn-rim-height-num',       'rimHeightRatio');

  // Chrome bevel frame
  wireCheckbox('btn-frame-enabled', 'frameEnabled', on => {
    depRow('frame-width-row',          on);
    depRow('frame-color-hi-row',       on);
    depRow('frame-color-row',          on);
    depRow('frame-color-lo-row',       on);
    depRow('frame-bevel-alpha-row',    on);
    depRow('frame-bevel-width-row',    on);
    depRow('frame-bevel-conic-row',    on);
  });
  wireRangeNum('btn-frame-width',       'btn-frame-width-num',       'frameWidth');
  wireColor('btn-frame-color-hi', 'frameColorHi');
  wireColor('btn-frame-color',    'frameColor');
  wireColor('btn-frame-color-lo', 'frameColorLo');
  wireRangeNum('btn-frame-bevel-alpha', 'btn-frame-bevel-alpha-num', 'frameBevelAlpha');
  wireRangeNum('btn-frame-bevel-width', 'btn-frame-bevel-width-num', 'frameBevelWidth');
  // Conic-gradient corner bevel (issue #18) — replaces the straight-edge
  // bevel insets with a `.btn-housing::after` ring whose stops are computed
  // per-instance against the real chrome radius (see
  // computeFrameBevelConicStops in lib/clicky-button.js).
  wireCheckbox('btn-frame-bevel-conic', 'frameBevelConic');

  // Ambient shadow
  wireRangeNum('btn-ambient-intensity',    'btn-ambient-intensity-num',    'ambientIntensity');
  wireRangeNum('btn-ambient-blur-mult',    'btn-ambient-blur-mult-num',    'ambientBlurMult',
    v => parseFloat(v.toFixed(2)));
  wireRangeNum('btn-ambient-y-mult',       'btn-ambient-y-mult-num',       'ambientYMult',
    v => parseFloat(v.toFixed(2)));
  wireRangeNum('btn-ambient-press-reduction', 'btn-ambient-press-reduction-num', 'ambientPressReduction');
  wireRangeNum('btn-contact-intensity', 'btn-contact-intensity-num', 'contactIntensity');

  // Interaction
  const toggleHeightRow  = $('toggle-height-row');
  function syncToggleHeightRowVisibility() {
    // mode 'radio' (issue #37) reuses the toggle CSS wholesale — including
    // --toggle-height — so this row is relevant there too.
    const show = state.mode === 'toggle' || state.mode === 'radio';
    if (toggleHeightRow) toggleHeightRow.style.display = show ? '' : 'none';
  }
  // Tri-state filter preset (issue #37) — generator UI per the critic's
  // pinned split: appearance (colors, geometry, housingLayout, mode) lives
  // in config/state and is applied here in ONE shot; per-instance identity
  // (radio `name`/`values`/`checked`) stays a call-time concern, wired
  // directly in buildGroupPreviewHtml for the live preview.
  function applyTriStatePreset() {
    Object.assign(state, {
      mode:          'radio',
      housingLayout: 'segmented',
      gridWrap:      'nowrap',
      btnCount:      3,
      btnLabels:     'Tacit,Include,Exclude',
      groupLabel:    'Tri-state filter',
      variants: {
        include: { toggleColor: '#2e9e4f' },
        exclude: { toggleColor: '#c0392b' },
      },
    });
    syncAllControls();
    syncToggleHeightRowVisibility();
    depRow('group-label-row', true);
    depRow('segment-divider-row', true);
    updatePreview();
  }
  document.querySelectorAll('input[name="btn-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        if (radio.value === 'radio') {
          // Tri-state (issue #37) is built on segmented housing ONLY —
          // validateClickyConfig rejects mode:'radio' without
          // housingLayout:'segmented' — so picking this pill applies the
          // full generator preset (per the critic's "appearance in config"
          // pattern) rather than leaving an invalid half-configured state.
          applyTriStatePreset();
        } else {
          state.mode = radio.value;
          syncToggleHeightRowVisibility();
          updatePreview();
        }
      }
    });
  });
  syncToggleHeightRowVisibility();
  wireRangeNum('btn-duration',       'btn-duration-num',       'duration');
  wireRangeNum('btn-press-duration', 'btn-press-duration-num', 'pressDuration');
  wireRangeNum('btn-toggle-height',  'btn-toggle-height-num',  'toggleHeightRatio');

  // Per-property animation timing
  wireRangeNum('btn-shadow-anim-delay', 'btn-shadow-anim-delay-num', 'shadowAnimDelay');
  wireRangeNum('btn-color-anim-delay',  'btn-color-anim-delay-num',  'colorAnimDelay');

  wireSelect('btn-easing-preset', 'easingPreset', val => {
    const customRow = $('custom-bezier-row');
    if (customRow) customRow.style.display = val === 'custom' ? 'grid' : 'none';
    if (val !== 'custom' && EASING_PRESETS[val]) {
      const [x1, y1, x2, y2] = EASING_PRESETS[val];
      $('bz-x1').value = state.bzX1 = x1;
      $('bz-y1').value = state.bzY1 = y1;
      $('bz-x2').value = state.bzX2 = x2;
      $('bz-y2').value = state.bzY2 = y2;
    }
  });

  ['bz-x1','bz-y1','bz-x2','bz-y2'].forEach(id => {
    const el = $(id);
    if (!el) return;
    const key = id === 'bz-x1' ? 'bzX1' : id === 'bz-y1' ? 'bzY1'
              : id === 'bz-x2' ? 'bzX2' : 'bzY2';
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      if (!isNaN(v)) { state[key] = v; updatePreview(); }
    });
  });

  wireCheckbox('btn-overshoot', 'overshoot');

  // Border & Focus
  wireRangeNum('btn-border-width', 'btn-border-width-num', 'borderWidth');
  wireColor('btn-border-color', 'borderColor');
  wireSelect('btn-border-style', 'borderStyle');
  wireRangeNum('btn-hover-lift', 'btn-hover-lift-num', 'hoverLift');
  wireSelect('btn-focus-style', 'focusStyle');
  wireColor('btn-focus-color', 'focusColor');
  wireRangeNum('btn-focus-size', 'btn-focus-size-num', 'focusSize');

  // Preview background
  document.querySelectorAll('input[name="preview-bg"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) { state.previewBg = radio.value; updatePreview(); }
    });
  });

  // ── 3D view — pointer-drag rotation ────────────────────────────────────
  (function init3dDrag() {
    if (!previewStage3d) return;
    let dragging   = false;
    let lastX      = 0;
    let lastY      = 0;
    let totalMoved = 0;
    const SENS     = 0.4;
    const TAP_PX   = 4;

    function apply3dAngles() {
      previewStage3d.style.setProperty('--view3d-rx', `${state.view3dRotateX}deg`);
      previewStage3d.style.setProperty('--view3d-ry', `${state.view3dRotateY}deg`);
    }

    previewStage3d.addEventListener('pointerdown', e => {
      dragging   = true;
      lastX      = e.clientX;
      lastY      = e.clientY;
      totalMoved = 0;
      previewStage3d.setPointerCapture(e.pointerId);
      previewStage3d.classList.add('dragging');
      e.preventDefault();
    });

    previewStage3d.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      totalMoved += Math.abs(dx) + Math.abs(dy);

      state.view3dRotateY = Math.max(-90, Math.min(90,  state.view3dRotateY + dx * SENS));
      state.view3dRotateX = Math.max(0,   Math.min(90,  state.view3dRotateX + dy * SENS));
      apply3dAngles();
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      previewStage3d.classList.remove('dragging');
      if (totalMoved < TAP_PX) {
        state.view3dRotateX =  50;
        state.view3dRotateY = -20;
        apply3dAngles();
      }
    }

    previewStage3d.addEventListener('pointerup',     endDrag);
    previewStage3d.addEventListener('pointercancel', endDrag);
  })();

    // Boot-time depRow sync — the inline style="opacity:0.4;pointer-events:none"
    // rows in index.html only *look* disabled on first paint; without an
    // explicit call here they aren't semantically/functionally disabled
    // (.disabled) until the user first toggles the controlling checkbox.
    depRow('press-color-row',       state.usePressColor);
    depRow('toggle-color-row',      state.useToggleColor);
    depRow('button-wall-color-row', state.useButtonWallColor);
    depRow('cavity-wall-color-row', state.useCavityWallColor);
    depRow('icon-color-row',        state.iconUseColor);
    depRow('icon-inset-row',        state.iconPlacement === 'edge');
    depRow('frame-width-row',          state.frameEnabled);
    depRow('frame-color-hi-row',       state.frameEnabled);
    depRow('frame-color-row',          state.frameEnabled);
    depRow('frame-color-lo-row',       state.frameEnabled);
    depRow('frame-bevel-alpha-row',    state.frameEnabled);
    depRow('frame-bevel-width-row',    state.frameEnabled);
    depRow('frame-bevel-conic-row',    state.frameEnabled);
    depRow('group-label-row',          state.housingLayout === 'segmented');
    depRow('segment-divider-row',      state.housingLayout === 'segmented');

}


// ── Icon picker ──────────────────────────────────────────────
// Curated Material Symbols (Rounded) chosen for instant recognition on button
// faces. Rendered as ligatures, so `name` must be a real Material Symbols
// codepoint name. The user may also free-type any other valid symbol name.
const ICON_CHOICES = [
  // Actions / Submit
  { name: 'send',          label: 'Send',          group: 'Actions' },
  { name: 'upload',        label: 'Upload',        group: 'Actions' },
  { name: 'download',      label: 'Download',      group: 'Actions' },
  { name: 'save',          label: 'Save',          group: 'Actions' },
  { name: 'print',         label: 'Print',         group: 'Actions' },
  { name: 'share',         label: 'Share',         group: 'Actions' },
  { name: 'edit',          label: 'Edit',          group: 'Actions' },
  { name: 'delete',        label: 'Delete',        group: 'Actions' },
  { name: 'add',           label: 'Add',           group: 'Actions' },
  { name: 'remove',        label: 'Remove',        group: 'Actions' },
  { name: 'search',        label: 'Search',        group: 'Actions' },
  { name: 'refresh',       label: 'Refresh',       group: 'Actions' },
  { name: 'login',         label: 'Log in',        group: 'Actions' },
  { name: 'logout',        label: 'Log out',       group: 'Actions' },
  // Confirmation / Status
  { name: 'check_circle',  label: 'Confirm',       group: 'Confirmation' },
  { name: 'cancel',        label: 'Cancel',        group: 'Confirmation' },
  { name: 'close',         label: 'Close',         group: 'Confirmation' },
  { name: 'done',          label: 'Done',          group: 'Confirmation' },
  { name: 'lock',          label: 'Lock',          group: 'Confirmation' },
  { name: 'lock_open',     label: 'Unlock',        group: 'Confirmation' },
  // Navigation / Arrows
  { name: 'arrow_forward', label: 'Next',          group: 'Navigation' },
  { name: 'arrow_back',    label: 'Back',          group: 'Navigation' },
  { name: 'arrow_upward',  label: 'Up',            group: 'Navigation' },
  { name: 'arrow_downward',label: 'Down',          group: 'Navigation' },
  { name: 'chevron_right', label: 'Continue',      group: 'Navigation' },
  { name: 'open_in_new',   label: 'Open link',     group: 'Navigation' },
  { name: 'home',          label: 'Home',          group: 'Navigation' },
  // Media controls
  { name: 'play_arrow',    label: 'Play',          group: 'Media' },
  { name: 'pause',         label: 'Pause',         group: 'Media' },
  { name: 'stop',          label: 'Stop',          group: 'Media' },
  { name: 'skip_next',     label: 'Skip next',     group: 'Media' },
  { name: 'skip_previous', label: 'Skip previous', group: 'Media' },
  { name: 'mic',           label: 'Record',        group: 'Media' },
  // Commerce
  { name: 'shopping_cart', label: 'Add to cart',   group: 'Commerce' },
  { name: 'shopping_bag',  label: 'Shop',          group: 'Commerce' },
  { name: 'payments',      label: 'Pay',           group: 'Commerce' },
  { name: 'star',          label: 'Favorite',      group: 'Commerce' },
  // Communication
  { name: 'mail',          label: 'Email',         group: 'Communication' },
  { name: 'phone',         label: 'Call',          group: 'Communication' },
  { name: 'chat',          label: 'Chat',          group: 'Communication' },
  { name: 'notifications', label: 'Notify',        group: 'Communication' },
];

function renderIconPicker() {
  const container = $('icon-picker');
  if (!container) return;
  const noneSwatch = `<button type="button" class="icon-swatch icon-swatch--none" data-icon="" title="No icon">None</button>`;
  const swatches = ICON_CHOICES.map(ic =>
    `<button type="button" class="icon-swatch" data-icon="${ic.name}" title="${ic.label} — ${ic.name}"><span class="material-symbols-rounded">${ic.name}</span></button>`
  ).join('');
  container.innerHTML = noneSwatch + swatches;
  container.querySelectorAll('.icon-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      state.iconName = sw.dataset.icon;
      const nameInput = $('btn-icon-name');
      if (nameInput) nameInput.value = state.iconName;
      syncIconPicker();
      updatePreview();
    });
  });
  syncIconPicker();
}

// ── Inline SVG icon intake (issue #31) ─────────────────────────
// Sanitize-on-intake, in the GENERATOR — never at render/export time. The
// clean string is what gets stored in state.iconSvg; lib/clicky-button.js
// embeds it verbatim and does zero sanitization of its own (see the trust
// model on the ClickyConfig typedef). DOMPurify is vendored locally
// (assets/purify.min.js, loaded via a plain <script> in index.html) — no
// CDN hot-link, so the page keeps a fully offline-capable asset story.
function sanitizeAndNormalizeSvg(raw) {
  if (typeof DOMPurify === 'undefined') return ''; // purify.min.js failed to load
  const clean = DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject', 'use', 'animate', 'set', 'animateTransform'],
    FORBID_ATTR: ['href', 'xlink:href'], // blocks external refs so the zero-network claim holds
  });
  const trimmed = (clean || '').trim();
  if (!/^<svg[\s>]/i.test(trimmed)) return '';

  const doc = new DOMParser().parseFromString(trimmed, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return '';
  const svgEl = doc.documentElement;
  if (!svgEl || svgEl.nodeName.toLowerCase() !== 'svg') return '';

  // Require a viewBox — synthesize from width/height if given, else reject
  // (sizing is CSS-owned; without either there's no coordinate system).
  if (!svgEl.hasAttribute('viewBox')) {
    const w = parseFloat(svgEl.getAttribute('width'));
    const h = parseFloat(svgEl.getAttribute('height'));
    if (w > 0 && h > 0) {
      svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    } else {
      return '';
    }
  }
  // Strip root width/height so CSS (1em sizing, see buildIconSvgCss) owns it.
  svgEl.removeAttribute('width');
  svgEl.removeAttribute('height');
  // Root fill normalization — a presentation ATTRIBUTE, not CSS. A CSS rule
  // (`.btn-icon-svg svg { fill: currentColor }`) would beat every inner
  // element's own explicit fill and flatten multicolor icons to one color;
  // setting the attribute only on the ROOT, only when absent, lets currentColor
  // cascade through SVG's normal fill inheritance without clobbering anything.
  if (!svgEl.hasAttribute('fill')) {
    svgEl.setAttribute('fill', 'currentColor');
  }
  return new XMLSerializer().serializeToString(svgEl);
}

function applyIconSvgInput(rawValue) {
  const errorRow = $('icon-svg-error-row');
  const raw = (rawValue || '').trim();
  if (!raw) {
    state.iconSvg = '';
    if (errorRow) errorRow.style.display = 'none';
    updatePreview();
    return;
  }
  const normalized = sanitizeAndNormalizeSvg(raw);
  if (!normalized) {
    state.iconSvg = '';
    if (errorRow) errorRow.style.display = '';
    updatePreview();
    return;
  }
  if (errorRow) errorRow.style.display = 'none';
  state.iconSvg = normalized;
  updatePreview();
}

function syncIconPicker() {
  const container = $('icon-picker');
  const current = (state.iconName || '').trim();
  if (container) {
    container.querySelectorAll('.icon-swatch').forEach(sw => {
      sw.classList.toggle('selected', sw.dataset.icon === current);
    });
  }
  const nameInput = $('btn-icon-name');
  if (nameInput && nameInput.value !== current) nameInput.value = current;
  depRow('icon-color-row', !!state.iconUseColor);
}

// ── Material presets (rubber / plastic / metal / glass) ────────
// Config bundles over existing sliders (item #7 dissent) — pure data, no lib
// changes. Values are pasted verbatim from the expert-review comment on
// issue #19 (3D-illusion designer sign-off) — do not invent replacements.
// Applied via the existing applyStyleConfig()/syncAllControls() round-trip,
// the same mechanism the saved-style picker uses.
const MATERIAL_PRESETS = {
  rubber: {
    radiusRatio: 30, chromeRadiusRatio: 20, faceColor: '#3f4142', textColor: '#e8e8e8',
    wallHRatio: 22, pressDepthRatio: 30, pressDarken: 18,
    insetDepthRatio: 10, insetBlurRatio: 20, insetAlphaTop: 40, insetAlphaBot: 20, faceEdgeAlpha: 5,
    topHighlight: true, highlightColor: '#ffffff', highlightOpacity: 15, rimHeightRatio: 10,
    buttonWallShadowAlpha: 60, buttonWallShadowEdgeRatio: 35, buttonWallGradientSpread: 40,
    cavityWallShadowAlpha: 60, cavityWallShadowEdgeRatio: 35, cavityWallGradientSpread: 40,
    ambientIntensity: 25, ambientBlurMult: 4.5, ambientYMult: 2.0, ambientPressReduction: 50,
    frameEnabled: false,
    duration: 260, pressDuration: 140, easingPreset: 'soft', overshoot: false,
    specularAlpha: 8, lightAngleX: 50, lightAngleY: 25, specularSize: 70,
    contactIntensity: 20,
  },
  plastic: {
    radiusRatio: 14, chromeRadiusRatio: 16, faceColor: '#e6e6ea', textColor: '#1a1a1a',
    wallHRatio: 8, pressDepthRatio: 10, pressDarken: 10,
    insetDepthRatio: 5, insetBlurRatio: 4, insetAlphaTop: 65, insetAlphaBot: 35, faceEdgeAlpha: 15,
    topHighlight: true, highlightColor: '#ffffff', highlightOpacity: 35, rimHeightRatio: 6,
    buttonWallShadowAlpha: 90, buttonWallShadowEdgeRatio: 60, buttonWallGradientSpread: 10,
    cavityWallShadowAlpha: 90, cavityWallShadowEdgeRatio: 60, cavityWallGradientSpread: 10,
    ambientIntensity: 20, ambientBlurMult: 2.0, ambientYMult: 1.0, ambientPressReduction: 50,
    frameEnabled: true, frameWidth: 6, frameBevelAlpha: 50, frameBevelWidth: 1,
    duration: 90, pressDuration: 50, easingPreset: 'snappy', overshoot: true,
    specularAlpha: 20, lightAngleX: 50, lightAngleY: 25, specularSize: 40,
    contactIntensity: 10,
  },
  metal: {
    radiusRatio: 10, chromeRadiusRatio: 14, faceColor: '#b0b8c0', textColor: '#12161a',
    wallHRatio: 12, pressDepthRatio: 14, pressDarken: 14,
    insetDepthRatio: 6, insetBlurRatio: 6, insetAlphaTop: 60, insetAlphaBot: 30, faceEdgeAlpha: 10,
    topHighlight: true, highlightColor: '#eef3f8', highlightOpacity: 25, rimHeightRatio: 6,
    buttonWallShadowAlpha: 90, buttonWallShadowEdgeRatio: 65, buttonWallGradientSpread: 15,
    useCavityWallColor: true, cavityWallColor: '#9aa4ad',
    cavityWallShadowAlpha: 90, cavityWallShadowEdgeRatio: 65, cavityWallGradientSpread: 15,
    ambientIntensity: 20, ambientBlurMult: 1.5, ambientYMult: 1.0, ambientPressReduction: 50,
    frameEnabled: true, frameWidth: 20, frameColorHi: '#eef2f6', frameColor: '#9aa4ad', frameColorLo: '#5b6670',
    frameBevelAlpha: 70, frameBevelWidth: 2,
    duration: 130, pressDuration: 70, easingPreset: 'black', overshoot: true,
    specularAlpha: 12, lightAngleX: 40, lightAngleY: 20, specularSize: 30,
    contactIntensity: 15,
  },
  glass: {
    radiusRatio: 22, chromeRadiusRatio: 18, faceColor: '#eaf6fb', textColor: '#1a2a33',
    wallHRatio: 14, pressDepthRatio: 16, pressDarken: 8,
    insetDepthRatio: 8, insetBlurRatio: 14, insetAlphaTop: 20, insetAlphaBot: 10, faceEdgeAlpha: 0,
    topHighlight: true, highlightColor: '#ffffff', highlightOpacity: 45, rimHeightRatio: 10,
    buttonWallShadowAlpha: 35, buttonWallShadowEdgeRatio: 20, buttonWallGradientSpread: 55,
    cavityWallShadowAlpha: 35, cavityWallShadowEdgeRatio: 20, cavityWallGradientSpread: 55,
    ambientIntensity: 15, ambientBlurMult: 4.0, ambientYMult: 1.75, ambientPressReduction: 50,
    frameEnabled: true, frameWidth: 8, frameBevelAlpha: 30, frameBevelWidth: 1,
    duration: 150, pressDuration: 80, easingPreset: 'clear', overshoot: true,
    specularAlpha: 55, lightAngleX: 45, lightAngleY: 20, specularSize: 80,
    contactIntensity: 10,
  },
};

// ── Square / circle quick-preset (issue #32) ───────────────────
// No new CSS mechanism needed — buildVarMap already clamps radius via
// maxRadiusPx = min(width/2, faceH/2, height/2). Equal width/height +
// radiusRatio: 100 produces a true circle for free; a lower radiusRatio at
// the same dimensions gives a rounded square. Good defaults for icon-only
// buttons in particular.
const SHAPE_PRESETS = {
  circle: { containerWidth: 64, containerHeight: 64, radiusRatio: 100 },
  square: { containerWidth: 64, containerHeight: 64, radiusRatio: 16 },
};

function applyShapePreset(name) {
  const preset = SHAPE_PRESETS[name];
  if (!preset) return;
  Object.assign(state, preset);
  syncAllControls();
  updatePreview();
}

function renderMaterialPicker() {
  const toolbar = document.querySelector('.preview-toolbar');
  const stylePicker = $('style-picker');
  if (!toolbar || !stylePicker) return;
  const container = document.createElement('div');
  // Reuses .toolbar-style-picker's existing select styling — no styles.css
  // changes needed for this unit (kept in-scope to app.js per the issue).
  container.className = 'toolbar-style-picker toolbar-material-picker';
  container.innerHTML = `<select id="material-preset-select" title="Apply a material preset">
    <option value="" selected disabled>Material…</option>
    <option value="rubber">Rubber</option>
    <option value="plastic">Plastic</option>
    <option value="metal">Metal</option>
    <option value="glass">Glass</option>
  </select>`;
  toolbar.insertBefore(container, stylePicker);
  container.querySelector('#material-preset-select').addEventListener('change', e => {
    const preset = MATERIAL_PRESETS[e.target.value];
    if (preset) applyStyleConfig(preset);
  });
}

// ── Style picker ─────────────────────────────────────────────

const STYLE_STORAGE_KEY = 'clicky-button-styles';

const COLOR_NAMES = [
  ['#ff0000','Red'],['#ff4500','OrangeRed'],['#ff6347','Tomato'],['#ff8c00','DarkOrange'],
  ['#ffa500','Orange'],['#ffd700','Gold'],['#ffff00','Yellow'],['#fdd34c','Amber'],
  ['#adff2f','GreenYellow'],['#00ff00','Green'],['#2e8b57','SeaGreen'],['#008080','Teal'],
  ['#00bfff','SkyBlue'],['#1e90ff','DodgerBlue'],['#0000ff','Blue'],['#4b0082','Indigo'],
  ['#8b00ff','Violet'],['#ff00ff','Magenta'],['#ff69b4','HotPink'],['#ff1493','DeepPink'],
  ['#ffffff','White'],['#f5f5f5','WhiteSmoke'],['#e8e8ec','Silver'],['#c8c0b4','Warm Gray'],
  ['#b8bcc0','Cool Gray'],['#a9a9a9','Gray'],['#808080','MidGray'],['#555555','Charcoal'],
  ['#333333','DarkGray'],['#1a1a1a','NearBlack'],['#000000','Black'],
  ['#8b4513','SaddleBrown'],['#a0522d','Sienna'],['#d2691e','Chocolate'],['#deb887','BurlyWood'],
  ['#f5deb3','Wheat'],['#faebd7','AntiqueWhite'],['#ffe4c4','Bisque'],['#b8b0a4','Taupe'],
];

function approxColorName(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  let best = 'Custom';
  let bestDist = Infinity;
  for (const [h, name] of COLOR_NAMES) {
    const hr = parseInt(h.slice(1, 3), 16);
    const hg = parseInt(h.slice(3, 5), 16);
    const hb = parseInt(h.slice(5, 7), 16);
    const d = (r - hr) ** 2 + (g - hg) ** 2 + (b - hb) ** 2;
    if (d < bestDist) { bestDist = d; best = name; }
  }
  return best;
}

function getDefaultStyleName() {
  const colorName = approxColorName(state.faceColor);
  const labels = state.btnLabels.split(',').map(s => s.trim()).filter(Boolean);
  const firstLabel = labels[0] || 'Button';
  const label = firstLabel.charAt(0).toUpperCase() + firstLabel.slice(1).toLowerCase();
  return `${colorName} ${label}`;
}

function loadSavedStyles() {
  try {
    return JSON.parse(localStorage.getItem(STYLE_STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveSavedStyles(styles) {
  localStorage.setItem(STYLE_STORAGE_KEY, JSON.stringify(styles));
}

function extractStyleConfig() {
  const config = {};
  for (const key of Object.keys(defaultClickyConfig)) {
    config[key] = state[key];
  }
  return config;
}

function applyStyleConfig(config) {
  for (const key of Object.keys(defaultClickyConfig)) {
    if (key in config) state[key] = config[key];
  }
  syncAllControls();
  updatePreview();
}

function syncAllControls() {
  for (const ctrl of controlRegistry) {
    switch (ctrl.type) {
      case 'range': {
        const range = $(ctrl.rangeId), num = $(ctrl.numId);
        if (range) range.value = state[ctrl.stateKey];
        if (num) num.value = state[ctrl.stateKey];
        break;
      }
      case 'color':
      case 'select':
      case 'text': {
        const el = $(ctrl.id);
        if (el) el.value = state[ctrl.stateKey];
        break;
      }
      case 'checkbox': {
        const el = $(ctrl.id);
        if (el) el.checked = state[ctrl.stateKey];
        break;
      }
    }
  }
  document.querySelectorAll('input[name="btn-mode"]').forEach(radio => {
    radio.checked = radio.value === state.mode;
  });
  const speedEl = $('master-speed');
  if (speedEl) speedEl.value = state.speedFactor;
  const speedRead = $('master-speed-readout');
  if (speedRead) {
    const m = Math.pow(10, state.speedFactor);
    speedRead.textContent = `${m.toFixed(2)}×`;
  }
  ['bz-x1','bz-y1','bz-x2','bz-y2'].forEach(id => {
    const el = $(id);
    const key = id === 'bz-x1' ? 'bzX1' : id === 'bz-y1' ? 'bzY1'
              : id === 'bz-x2' ? 'bzX2' : 'bzY2';
    if (el) el.value = state[key];
  });
  const iconSvgEl = $('btn-icon-svg');
  if (iconSvgEl) iconSvgEl.value = state.iconSvg || '';
  const iconSvgErrorRow = $('icon-svg-error-row');
  if (iconSvgErrorRow) iconSvgErrorRow.style.display = 'none';
  syncIconPicker();
  // Per-corner radius (issue #35) — not in controlRegistry (radiusCorners is
  // an object, not a scalar the generic range/checkbox sync above can read).
  syncRadiusCornerRows();
}

function renderStylePicker() {
  const container = $('style-picker');
  if (!container) return;
  const styles = loadSavedStyles();

  const exportBtn = `<button id="style-export-btn" title="Export HTML &amp; CSS">Export</button>`;
  if (styles.length === 0) {
    container.innerHTML = `<button id="style-save-btn" title="Save current button style">+ Save</button>${exportBtn}<button id="style-reset-btn" title="Reset button style to defaults">Reset</button>`;
  } else {
    const autoSelect = styles.length === 1;
    container.innerHTML =
      `<select id="style-select" title="Choose a saved button style">` +
      (autoSelect ? '' : `<option value="" selected disabled>Choose button style</option>`) +
      styles.map((s, i) => `<option value="${i}"${autoSelect && i === 0 ? ' selected' : ''}>${s.name}</option>`).join('') +
      `</select>` +
      `<button id="style-save-btn" title="Save current style">+</button>` +
      `<button id="style-update-btn" class="style-picker-delete" title="Update selected style"${autoSelect ? '' : ' style="display:none"'}>Save</button>` +
      `${exportBtn}` +
      `<button id="style-reset-btn" title="Reset button style to defaults">Reset</button>` +
      `<button id="style-delete-btn" class="style-picker-delete" title="Delete selected style">&times;</button>`;
  }

  $('style-save-btn')?.addEventListener('click', () => {
    const name = prompt('Style name:', getDefaultStyleName());
    if (!name) return;
    const styles = loadSavedStyles();
    styles.push({ name, config: extractStyleConfig() });
    saveSavedStyles(styles);
    renderStylePicker();
    const sel = $('style-select');
    if (sel) sel.value = styles.length - 1;
  });

  $('style-select')?.addEventListener('change', e => {
    const idx = parseInt(e.target.value);
    const styles = loadSavedStyles();
    if (styles[idx]) {
      applyStyleConfig(styles[idx].config);
      const updateBtn = $('style-update-btn');
      const deleteBtn = $('style-delete-btn');
      if (updateBtn) updateBtn.style.display = '';
      if (deleteBtn) deleteBtn.style.display = '';
    }
  });

  $('style-update-btn')?.addEventListener('click', () => {
    const sel = $('style-select');
    const idx = parseInt(sel?.value);
    if (isNaN(idx)) return;
    const styles = loadSavedStyles();
    if (!styles[idx]) return;
    styles[idx].config = extractStyleConfig();
    saveSavedStyles(styles);
    const updateBtn = $('style-update-btn');
    if (updateBtn) {
      updateBtn.textContent = 'Saved!';
      setTimeout(() => { updateBtn.textContent = 'Save'; }, 1200);
    }
  });

  $('style-delete-btn')?.addEventListener('click', () => {
    const sel = $('style-select');
    const idx = parseInt(sel?.value);
    if (isNaN(idx)) return;
    const styles = loadSavedStyles();
    if (!styles[idx]) return;
    if (!confirm(`Delete "${styles[idx].name}"?`)) return;
    styles.splice(idx, 1);
    saveSavedStyles(styles);
    renderStylePicker();
  });

  $('style-reset-btn')?.addEventListener('click', () => {
    if (!confirm('Reset button style to defaults? Your saved styles won\'t be affected.')) return;
    applyStyleConfig({ ...defaultClickyConfig, ...CONFIGURATOR_DEFAULT });
  });

  $('style-export-btn')?.addEventListener('click', () => {
    downloadZip(currentStyleName());
  });
}

function currentStyleName() {
  const sel = $('style-select');
  if (sel && sel.value !== '') {
    const styles = loadSavedStyles();
    const idx = parseInt(sel.value);
    if (!isNaN(idx) && styles[idx]) return styles[idx].name;
  }
  return getDefaultStyleName();
}

// ── Minimal ZIP writer (uncompressed, pure JS, no dependencies) ──
function crc32(bytes) {
  if (!crc32.table) {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    crc32.table = t;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = crc32.table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeZip(files) {
  // files: [{name, content}] with content as string
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const data = enc.encode(f.content);
    const c = crc32(data);
    const size = data.length;

    // Local file header
    const lh = new ArrayBuffer(30 + nameBytes.length);
    const lv = new DataView(lh);
    lv.setUint32(0, 0x04034b50, true);  // signature
    lv.setUint16(4, 20, true);          // version
    lv.setUint16(6, 0, true);           // flags
    lv.setUint16(8, 0, true);           // compression (stored)
    lv.setUint16(10, 0, true);          // mod time
    lv.setUint16(12, 0, true);          // mod date
    lv.setUint32(14, c, true);          // crc32
    lv.setUint32(18, size, true);       // compressed size
    lv.setUint32(22, size, true);       // uncompressed size
    lv.setUint16(26, nameBytes.length, true);  // filename length
    lv.setUint16(28, 0, true);          // extra length
    new Uint8Array(lh, 30).set(nameBytes);

    chunks.push(new Uint8Array(lh), data);

    // Central directory entry
    const ce = new ArrayBuffer(46 + nameBytes.length);
    const cv = new DataView(ce);
    cv.setUint32(0, 0x02014b50, true);  // signature
    cv.setUint16(4, 20, true);          // version made by
    cv.setUint16(6, 20, true);          // version needed
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, c, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);     // local header offset
    new Uint8Array(ce, 46).set(nameBytes);
    central.push(new Uint8Array(ce));

    offset += 30 + nameBytes.length + size;
  }

  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const centralOffset = offset;

  // End of central directory
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralOffset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...chunks, ...central, new Uint8Array(eocd)], { type: 'application/zip' });
}

function slugifyFilename(name) {
  return (name || 'clicky-button')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'clicky-button';
}

function downloadZip(styleName) {
  const cssSnippet = buildCss(state, ':root');
  // Segmented housing (issue #36) — must match what the live preview already
  // renders (buildGroupPreviewHtml), or an export taken while housingLayout
  // is 'segmented' would silently ship the old N-separate-housing markup.
  const htmlSnippet = buildGroupPreviewHtml(state);
  const slug = slugifyFilename(styleName);
  // Exported buttons that use a ligature icon need the Material Symbols
  // Rounded webfont — gated on "any LIGATURE icon anywhere": the base
  // iconName OR any per-button variant's iconName (issue #29), but only when
  // iconSvg is empty — non-empty iconSvg wins over iconName everywhere
  // (issue #31), so no button ever actually renders a ligature in that case,
  // and an SVG-only export should ship with no font link at all.
  const hasIconSvg = !!(state.iconSvg || '').trim();
  const anyLigatureIcon = !hasIconSvg && (
    !!(state.iconName || '').trim() ||
    Object.values(state.variants || {}).some(v => !!(v && v.iconName || '').trim())
  );
  const iconFontLink = anyLigatureIcon
    ? `\n  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0..1,0&display=block">`
    : '';

  const standaloneHtml =
`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${styleName || 'Clicky Button'}</title>${iconFontLink}
  <link rel="stylesheet" href="${slug}.css">
</head>
<!-- ontouchstart="" enables :active on iOS Safari without any JS overhead -->
<body style="padding:40px;background:#f4f1ed;" ontouchstart="">
${htmlSnippet}
<!-- Optional progressive enhancement — full symmetric press bounce (never
     required; press/toggle motion above is already pure CSS). Uncomment to
     enable. Note: ES module scripts fail to load under file:// (CORS) —
     this only works when the export is served over http(s), not opened by
     double-clicking the .html file. -->
<!-- <script type="module" src="./${slug}.enhancer.js"></script> -->
</body>
</html>
`;

  const styles = `/*
 * ${styleName || 'Clicky Button'} — generated by Clicky Button Generator
 * Requires container-type: size on .btn-cell (already included).
 */
${cssSnippet}
`;

  const blob = makeZip([
    { name: `${slug}.html`, content: standaloneHtml },
    { name: `${slug}.css`, content: styles },
    { name: `${slug}.enhancer.js`, content: clickyEnhancerJs },
  ]);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Boot ──────────────────────────────────────────────────────
function boot() {
  initControls();
  renderIconPicker();
  renderStylePicker();
  renderMaterialPicker();
  // Reflect the configurator's default state (amber SUBMIT) into every control
  // so the inputs match the preview on first load, then render.
  syncAllControls();
  updatePreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
