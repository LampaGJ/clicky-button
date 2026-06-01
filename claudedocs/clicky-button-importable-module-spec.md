---
type: spec
status: active
related:
  - ../app.js
  - ../index.html
  - ../styles.css
---

# Spec — Turn Clicky Button Generator into an Importable ES Module

## Motivation

`app.js` is a 1,472-line monolithic IIFE that builds both the
generator UI (Tweakpane, preview panels, export textareas) AND the
pure CSS/HTML producers that downstream projects actually want. The
producers read directly from a module-level mutable `state` object
and write directly to global DOM nodes, so there is no clean
import surface.

A real consumer today is **SnapStreamMedia/pitch** at
`/Users/graham/Projects/button/map/rapid-response/`, which
hand-rolls the housing/cell/face CSS for one CTA. Every framework
change requires re-implementing it there. The same pattern will
recur in any new project that wants a clicky button.

**Goal:** extract the pure producers (`buildCss`, `buildHtml`,
`buildHousingShadow`, `buildFaceShadow`, the geometry/clamp logic in
`buildVarMap`, all the CSS-string helpers) into an importable ES
module that:

1. Takes a config object as input (no global state mutation).
2. Returns CSS / HTML strings or a structured object the caller can
   inject into its DOM or stylesheet however it wants.
3. Has zero DOM dependencies — usable from Node, a browser, a
   build script, a server-rendered React component, anywhere.
4. Is consumed by the existing generator UI (so the generator
   continues to work, now just as one consumer of the module).

## Current state — function inventory

`/Users/graham/Projects/button/app.js` contains 39 top-level
functions / consts. Classify them into three buckets:

### A. PURE PRODUCERS (these become the module)

All read from `state` directly today; refactor to take a `state`
parameter explicitly.

| Function | Line | Responsibility |
|---|---|---|
| `buildHousingShadow(pressed)` | 232 | Ambient drop-shadow on `.btn-housing` |
| `buildFaceShadow(pressed)` | 249 | 5-layer inset shadow on `.btn-face` |
| `buildVarMap()` | 320 | All CSS custom properties + geometry clamps |
| `buildCss(scopeSelector)` | 514 | Top-level CSS string assembler |
| `buildGridCss()` | 528 | Grid container CSS |
| `toggledRestStatePropsCss(indent)` | 661 | Toggled-on resting CSS block |
| `sharedFaceCssProps(indent)` | 681 | Shared face CSS block |
| `pressedStatePropsCss(indent)` | 729 | Pressed-state CSS block |
| `buildFocusVisibleCss(selector)` | 772 | Focus ring CSS |
| `buildClickFaceCss()` | 798 | Click-mode face rules |
| `buildToggleFaceCss()` | 839 | Toggle-mode face rules |
| `getLabels()` | 1016 | Parse comma-separated label string |
| `buildSingleButtonHtml(label, extraClass)` | 1026 | One-button HTML snippet |
| `buildGridHtml(extraClass)` | 1046 | Full grid HTML snippet |
| `hexToRgba(hex, alpha)` | 1450 | Colour util |
| `escapeHtml(str)` | 1460 | HTML escape util |
| `getTransformEasing()` | 183 | Resolve easing preset → cubic-bezier |
| `EASING_PRESETS` (const) | 64 | Easing dictionary |
| `state` (const → default config) | 88 | Default config object |
| `SHADOW_EASING_PRESS`, `SHADOW_EASING_RELEASE` | 206, 210 | Easing constants |

### B. DOM-COUPLED INTERNALS (stay in generator UI, NOT in module)

| Function | Line | Why it stays |
|---|---|---|
| `$` helper | 173 | DOM lookup |
| `previewStage*`, `stateTestStage`, `previewStyle`, `exportHtmlTA`, `exportCssTA` | 175–180 | DOM refs |
| `updatePreview()` | 1053 | Imperative DOM updates |
| `updateExport()` | 1129 | Imperative textarea updates |
| `wireRangeNum`, `wireColor`, `wireSelect`, `wireCheckbox`, `wireText`, `depRow` | 1146–1199 | Tweakpane/input wiring |
| `initControls()` | 1206 | Wires every input to mutate `state` then call `updatePreview` |
| `initExportTabs()`, `initCopyButtons()` | 1414, 1427 | UI plumbing |

### C. GENERATOR-ONLY BEHAVIOUR

The 3D-view drag-to-rotate panel (look for `previewStage3d`
references) is a generator-only UX feature. Stays in
`generator-ui.js` or similar.

## Target architecture

```
button/
├── lib/
│   ├── clicky-button.js          ← NEW: importable ES module
│   ├── clicky-button.css         ← optional: a stylesheet that just
│   │                                contains the static parts (grid
│   │                                layout, focus baseline) that
│   │                                don't depend on state.
│   └── defaults.js               ← NEW: the default `state` object,
│                                    exported for consumers who want
│                                    "give me a sensible button".
├── app.js                         ← becomes generator UI only;
│                                     imports from lib/, owns Tweakpane
│                                     wiring + updatePreview/updateExport
├── index.html                     ← unchanged
└── styles.css                     ← generator-UI styles only
```

## Module API

`lib/clicky-button.js` exports:

```js
// ── Public API ──────────────────────────────────────────────

/**
 * Default config for a click-mode button (the resting state of the
 * generator's `state` object). Consumers spread this and override
 * the keys they care about.
 */
export const defaultClickyConfig = { /* … all keys from state ── */ };

/**
 * Build the full CSS string for a clicky button.
 * @param {Partial<ClickyConfig>} config — overrides on defaults
 * @param {object} [opts]
 * @param {string} [opts.scope=":root"] — selector to scope custom
 *   properties under. Use `:root` for global, or a class like
 *   `.contact-cta-host` to scope per-instance.
 * @returns {string} CSS — ready to inject into a <style> tag or
 *   write to a .css file.
 */
export function buildClickyCss(config, opts);

/**
 * Build the HTML structure for one clicky button (housing → cell →
 * face). The CSS from `buildClickyCss` styles whatever HTML this
 * returns.
 * @param {object} args
 * @param {string} args.label — visible text on the face
 * @param {string} [args.tag="button"] — `button` | `a` | etc.
 * @param {Record<string,string>} [args.attrs] — extra attributes
 *   (href, aria-label, etc.)
 * @param {string} [args.extraClass]
 * @returns {string} HTML string
 */
export function buildClickyHtml(args);

/**
 * Lower-level access to the CSS custom property map. Useful when
 * you want to use the chrome / face VARS in your own CSS rather
 * than the generated ruleset.
 * @returns {Record<string,string>} e.g. { "--face-color": "#c8c0b4", … }
 */
export function buildClickyVars(config);

/**
 * Granular access to the individual builder fragments — for
 * advanced consumers who want to compose their own ruleset.
 */
export const internals = {
  buildHousingShadow,
  buildFaceShadow,
  sharedFaceCssProps,
  pressedStatePropsCss,
  toggledRestStatePropsCss,
  buildFocusVisibleCss,
  buildClickFaceCss,
  buildToggleFaceCss,
  buildGridCss,
  hexToRgba,
};
```

### Config object shape

`ClickyConfig` is the existing `state` object, documented and
type-narrowed. Group the ~50 keys into sections that mirror the
generator's Tweakpane panels:

```js
/**
 * @typedef {object} ClickyConfig
 *
 * // ── Container ─────────────────────────────────────────────
 * @property {number} containerWidth   — px, 80–400 typical
 * @property {number} containerHeight  — px, 40–200 typical
 *
 * // ── Grid (multi-button layouts) ───────────────────────────
 * @property {number} btnCount
 * @property {string} btnLabels         — comma-separated
 * @property {'row'|'column'} gridDirection
 * @property {'wrap'|'nowrap'} gridWrap
 * @property {number} gridGap           — px
 * @property {'center'|'flex-start'|…} gridJustify
 * @property {'center'|'flex-start'|…} gridAlign
 *
 * // ── Appearance ────────────────────────────────────────────
 * @property {number} radiusRatio       — %, of containerWidth
 * @property {number} chromeRadiusRatio — %, of housing width
 * @property {string} faceColor         — hex
 * @property {string} textColor         — hex
 * @property {number} fontSizeRatio     — %, of cqi
 * @property {string} fontWeight
 * @property {number} letterSpacing     — em
 *
 * // ── Shadow & depth ───────────────────────────────────────
 * @property {number} wallHRatio        — %, of cqb (height)
 * @property {number} pressDepthRatio   — %, of cqb
 * // Button wall (moving side of the keycap) — drop-shadow band in buildFaceShadow
 * @property {boolean} useButtonWallColor — false: button-wall base = faceColor
 * @property {string} buttonWallColor    — hex; used only when useButtonWallColor
 * @property {number} buttonWallShadowAlpha — %
 * @property {number} buttonWallShadowEdgeRatio — %
 * @property {number} buttonWallGradientSpread — 0–100
 * // Cavity wall (static housing slot) — .btn-cell::before
 * @property {boolean} useCavityWallColor — false: cavity-wall base = frameColor
 * @property {string} cavityWallColor    — hex; used only when useCavityWallColor
 * @property {number} cavityWallShadowAlpha — %
 * @property {number} cavityWallShadowEdgeRatio — %
 * @property {number} cavityWallGradientSpread — 0–100
 * @property {number} insetDepthRatio   — %
 * @property {number} insetBlurRatio    — %
 * @property {number} insetAlphaTop     — %
 * @property {number} insetAlphaBot     — %
 * @property {boolean} topHighlight
 * @property {string} highlightColor    — hex
 * @property {number} highlightOpacity  — %
 * @property {number} rimHeightRatio    — %
 * @property {number} channelHeight     — px
 * @property {boolean} usePressColor
 * @property {string} pressColor        — hex
 *
 * // ── Ambient shadow ───────────────────────────────────────
 * @property {number} ambientIntensity        — %
 * @property {number} ambientBlurMult         — × wall_h_px
 * @property {number} ambientYMult            — × wall_h_px
 * @property {number} ambientPressReduction   — %
 *
 * // ── Chrome frame ─────────────────────────────────────────
 * @property {boolean} frameEnabled
 * @property {number}  frameWidth        — px
 * @property {string}  frameColorHi      — hex
 * @property {string}  frameColor        — hex
 * @property {string}  frameColorLo      — hex
 * @property {number}  frameBevelAlpha   — %
 *
 * // ── Interaction ──────────────────────────────────────────
 * @property {'click'|'toggle'} mode
 * @property {number} speedFactor        — log10, -2..0
 * @property {number} duration           — ms (release)
 * @property {number} pressDuration      — ms
 * @property {keyof typeof EASING_PRESETS} easingPreset
 * @property {boolean} overshoot
 * @property {number} bzX1, bzY1, bzX2, bzY2  — cubic-bezier control points
 * @property {number} toggleHeightRatio  — %
 *
 * // ── Border ───────────────────────────────────────────────
 * @property {number} borderWidth        — px
 * @property {string} borderColor        — hex
 * @property {string} borderStyle
 * @property {string} focusColor         — hex
 * @property {number} focusSize          — px
 * @property {'tint'|'glow'|'outline'|'none'} focusStyle
 *
 * // ── Hover ────────────────────────────────────────────────
 * @property {number} hoverLift          — px (0 disables)
 */
```

## Refactor steps

### Step 1 — extract pure helpers (no behaviour change)

1. Create `lib/clicky-button.js`.
2. Move `EASING_PRESETS`, `SHADOW_EASING_PRESS`, `SHADOW_EASING_RELEASE`,
   `hexToRgba`, `escapeHtml`, `getLabels` verbatim. None reference
   `state`.
3. In `app.js`, replace local definitions with `import { … } from './lib/clicky-button.js'`.
4. Verify generator UI still works (open `index.html`, dial controls,
   confirm preview updates).

### Step 2 — parameterise the state-readers

Refactor each of these to take `state` as an explicit first arg:

- `getTransformEasing(state)`
- `buildHousingShadow(state, pressed)`
- `buildFaceShadow(state, pressed)`
- `buildVarMap(state)`
- `buildCss(state, scopeSelector)`
- `buildGridCss(state)`
- `toggledRestStatePropsCss(state, indent)`
- `sharedFaceCssProps(state, indent)`
- `pressedStatePropsCss(state, indent)`
- `buildClickFaceCss(state)`
- `buildToggleFaceCss(state)`
- `buildFocusVisibleCss(state, selector)`
- `buildSingleButtonHtml(state, label, extraClass)` — or just take what it needs
- `buildGridHtml(state, extraClass)` — or move into module
- `updatePreview()` / `updateExport()` — stay in `app.js`, pass the
  module-level mutable `state` into the builders.

At this point `app.js` is unchanged in behaviour but now imports
all builders from the module. Module functions are pure (input →
output, no side effects, no global reads).

### Step 3 — define `defaultClickyConfig`

Move the `const state = { … }` literal into `lib/defaults.js` (or
into `clicky-button.js` if you'd rather have one file). Rename
`state` → `defaultClickyConfig` in the module. In `app.js`:

```js
import { defaultClickyConfig } from './lib/defaults.js';
let state = { ...defaultClickyConfig };
```

The mutable `state` lives in `app.js` only; the module never
mutates anything.

### Step 4 — design the public surface

In `lib/clicky-button.js`:

```js
export function buildClickyCss(userConfig = {}, opts = {}) {
  const config = { ...defaultClickyConfig, ...userConfig };
  const scope  = opts.scope ?? ':root';
  return buildCss(config, scope);
}

export function buildClickyHtml({ label, tag = 'button', attrs = {}, extraClass = '' }) {
  // Reuse buildSingleButtonHtml but rebuild slightly to allow <a> /
  // arbitrary tag + attrs (the existing one assumed <button>).
  // …
}

export function buildClickyVars(userConfig = {}) {
  const config = { ...defaultClickyConfig, ...userConfig };
  return buildVarMap(config);
}

export const internals = { /* … */ };
```

### Step 5 — replace deck consumer with the module

In `/Users/graham/Projects/button/map/rapid-response/`:

```js
// e.g. in a small bootstrap script the deck loads
import { buildClickyCss, buildClickyHtml } from '../../lib/clicky-button.js';

const cssText = buildClickyCss({
  faceColor: '#fdd34c',        // gold
  textColor: '#1a1a1a',
  fontSizeRatio: 18,
  containerWidth: 320,
  containerHeight: 72,
  letterSpacing: 0.08,
  // …
}, { scope: '.contact-cta-host' });

document.head.appendChild(Object.assign(
  document.createElement('style'),
  { textContent: cssText }
));
```

Or — preferable for a static site — pre-generate the CSS once and
commit the output, so there's no JS dependency at runtime.

### Step 6 — generator UI imports from the module

`app.js` becomes:

```js
import {
  defaultClickyConfig,
  buildClickyCss,
  buildClickyHtml,
  internals,
} from './lib/clicky-button.js';

let state = { ...defaultClickyConfig };

// … all the wire-* / init* / updatePreview / updateExport stays.
```

Smoke-test: every Tweakpane control changes the preview the same
way it did before. Nothing in the user-facing UI changes.

## Acceptance criteria

1. **Module is pure.** `lib/clicky-button.js` has zero references
   to `document`, `window`, or any global mutable state. All exports
   are deterministic given the same input.
2. **Generator UI continues to work.** Open `index.html`, every
   control still updates the live preview, exports still copy
   working CSS / HTML.
3. **Pre-existing exported CSS still matches.** Snapshot the
   current `updateExport()` output for the default config and
   3–4 distinct configs (toggle mode, no frame, square buttons,
   coloured face). The module-generated CSS for the same configs
   must be byte-identical (or only differ in whitespace).
4. **Deck consumer.** The rapid-response slide-10 CTA renders
   using `buildClickyCss({ faceColor: 'var(--gold)', … })` and
   visually matches the current hand-rolled implementation —
   same press-feel, same chrome surround, same wall behaviour.
5. **Module loads with no DOM.** `node -e "import('./lib/clicky-button.js').then(m => console.log(m.buildClickyCss({}).length))"` returns a positive number without throwing.
6. **Type docs.** JSDoc `@typedef ClickyConfig` covers every key
   in `defaultClickyConfig` so editors give consumers autocomplete.

## Out of scope

- Rewriting the generator UI itself. Tweakpane wiring,
  preview panels, 3D-view drag — all stay as imperative DOM code
  in `app.js`.
- TypeScript conversion. JSDoc types are sufficient.
- Build tooling. The module is plain ES2022; no bundler step needed.
- Publishing to npm. Local relative imports only for now.

## Notes for the implementing agent

- `cqb` (container query block) and `cqi` (container query inline)
  resolve inside `container-type: size` on `.btn-cell` — keep that
  intact. The generated CSS depends on it.
- The 5-layer `box-shadow` invariant in `buildFaceShadow` (same
  layer count + `inset` flag in resting AND pressed) is what makes
  CSS interpolate smoothly between the two states. Don't collapse
  the "transparent placeholder" Layer 0 even though it looks
  pointless.
- Geometry clamps in `buildVarMap` (`wallHRatioClamped`,
  `fwMaxByWidth`, `pressDepth_px` bounds, `maxRadiusPx`) silently
  saturate slider values so users can't break the layout. Preserve
  the clamps; downstream consumers benefit from the same safety
  net.
- `state.btnCount` / `state.btnLabels` / `state.gridDirection` are
  generator conveniences for the multi-button preview grid. The
  module's `buildClickyHtml` should default to single-button output;
  grid HTML stays a separate `internals` helper.
