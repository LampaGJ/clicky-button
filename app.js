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

const {
  buildCss,
  buildGridCss,
  buildSingleButtonHtml,
  buildGridHtml,
  getLabels,
  buildFocusVisibleCss,
} = internals;

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
  previewStage.innerHTML = buildGridHtml(state);

  // ── 3D view ───────────────────────────────────────────────────────────
  previewStage3d.innerHTML = buildGridHtml(state);
  previewStage3d.style.setProperty('--view3d-rx', `${state.view3dRotateX}deg`);
  previewStage3d.style.setProperty('--view3d-ry', `${state.view3dRotateY}deg`);

  // ── Preview background ───────────────────────────────────────────────
  const canvas = document.querySelector('.preview-canvas');
  if (canvas) {
    canvas.className = `preview-canvas bg-${state.previewBg}`;
  }

  // ── State-test overrides ─────────────────────────────────────────────
  const frameEnabled = state.frameEnabled;
  const bevelInsets = frameEnabled
    ? `inset 0 1px 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha)),
    inset 0 -1px 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)),
    inset 1px 0 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha)),
    inset -1px 0 0 0 rgba(0, 0, 0, var(--frame-bevel-alpha-shadow)),`
    : '';
  const stateTestCss = `
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
        if (e.animationName === 'clicky-transform-cycle' && !btn.matches(':hover')) {
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
  row.style.opacity       = visible ? '1' : '0.4';
  row.style.pointerEvents = visible ? '' : 'none';
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
  wireSelect('grid-direction', 'gridDirection');
  wireSelect('grid-wrap',      'gridWrap');
  wireRangeNum('grid-gap', 'grid-gap-num', 'gridGap');
  wireSelect('grid-justify', 'gridJustify');
  wireSelect('grid-align',   'gridAlign');

  // Appearance
  wireRangeNum('btn-radius',        'btn-radius-num',        'radiusRatio');
  wireRangeNum('btn-chrome-radius', 'btn-chrome-radius-num', 'chromeRadiusRatio');
  wireColor('btn-face-color', 'faceColor');
  wireColor('btn-text-color', 'textColor');
  wireCheckbox('btn-text-wrap', 'textWrap');
  wireRangeNum('btn-font-size',     'btn-font-size-num',     'fontSizeRatio');
  wireSelect('btn-font-weight', 'fontWeight');
  wireRangeNum('btn-letter-spacing','btn-letter-spacing-num','letterSpacing',
    v => parseFloat(v.toFixed(3)));

  // Icon
  wireSelect('btn-icon-position', 'iconPosition');
  wireRangeNum('btn-icon-size', 'btn-icon-size-num', 'iconSize');
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

  // Face
  wireCheckbox('btn-use-press-color', 'usePressColor', on => depRow('press-color-row', on));
  wireColor('btn-press-color', 'pressColor');
  wireCheckbox('btn-use-toggle-color', 'useToggleColor', on => depRow('toggle-color-row', on));
  wireColor('btn-toggle-color', 'toggleColor');
  wireRangeNum('btn-press-darken',      'btn-press-darken-num',      'pressDarken');
  wireRangeNum('btn-face-edge-alpha',   'btn-face-edge-alpha-num',   'faceEdgeAlpha');

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
  });
  wireRangeNum('btn-frame-width',       'btn-frame-width-num',       'frameWidth');
  wireColor('btn-frame-color-hi', 'frameColorHi');
  wireColor('btn-frame-color',    'frameColor');
  wireColor('btn-frame-color-lo', 'frameColorLo');
  wireRangeNum('btn-frame-bevel-alpha', 'btn-frame-bevel-alpha-num', 'frameBevelAlpha');
  wireRangeNum('btn-frame-bevel-width', 'btn-frame-bevel-width-num', 'frameBevelWidth');

  // Ambient shadow
  wireRangeNum('btn-ambient-intensity',    'btn-ambient-intensity-num',    'ambientIntensity');
  wireRangeNum('btn-ambient-blur-mult',    'btn-ambient-blur-mult-num',    'ambientBlurMult',
    v => parseFloat(v.toFixed(2)));
  wireRangeNum('btn-ambient-y-mult',       'btn-ambient-y-mult-num',       'ambientYMult',
    v => parseFloat(v.toFixed(2)));
  wireRangeNum('btn-ambient-press-reduction', 'btn-ambient-press-reduction-num', 'ambientPressReduction');

  // Interaction
  const toggleHeightRow  = $('toggle-height-row');
  function syncToggleHeightRowVisibility() {
    const show = state.mode === 'toggle';
    if (toggleHeightRow) toggleHeightRow.style.display = show ? '' : 'none';
  }
  document.querySelectorAll('input[name="btn-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        state.mode = radio.value;
        syncToggleHeightRowVisibility();
        updatePreview();
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
  syncIconPicker();
}

function renderStylePicker() {
  const container = $('style-picker');
  if (!container) return;
  const styles = loadSavedStyles();

  const exportBtn = `<button id="style-export-btn" title="Export HTML &amp; CSS">Export</button>`;
  if (styles.length === 0) {
    container.innerHTML = `<button id="style-save-btn" title="Save current button style">+ Save</button>${exportBtn}`;
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
  const htmlSnippet = buildGridHtml(state);
  const slug = slugifyFilename(styleName);
  // Exported buttons that use an icon need the Material Symbols Rounded webfont.
  const iconFontLink = (state.iconName || '').trim()
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
<body style="padding:40px;background:#f4f1ed;">
${htmlSnippet}
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
