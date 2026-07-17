'use strict';

/**
 * Sidecar annotation map — the schema-registry-architect pattern's "small
 * sidecar map keyed by a stable id" for producers that have no standalone
 * declaration to hang a TSDoc block on: an emitted DOM element/CSS selector
 * (many share one builder function), a CSS custom-property GROUP (grouping
 * related `--*` vars is preferred over 71+ separate TSDoc blocks — see
 * agent-schema-registry-architect's brief), and a keyframe GROUP (several
 * keyframes are emitted inline inside one template literal, not as their own
 * declarations).
 *
 * Every entry below carries the three required tags:
 *   - displayName        — human-legible role name
 *   - strategicPurpose    — WHY it exists (sourced from the load-bearing
 *                            comments already in lib/clicky-button.js, never
 *                            invented — see the schema-registry-architect
 *                            invariant against fabricated purposes)
 *   - tacticalObjective   — WHAT it does at its boundary
 *
 * plus `producedBy` — a free-text pointer (function + file) to where the
 * artifact is actually emitted, for a human tracing the annotation back to
 * source. It is NOT machine-verified; scripts/gen-artifact-registry.mjs
 * verifies EXISTENCE/coverage of the artifact itself (via HTML/CSS/keyframe
 * discovery), not the accuracy of this pointer string.
 *
 * THIS FILE IS HAND-MAINTAINED. It is the source of truth the generator
 * reads FROM — never the reverse. If a var/element/keyframe discovered by
 * the generator has no entry here, that is a real gap: add the entry (from
 * ground truth), don't patch the generated manifest.
 */

// ── DOM / CSS-selector elements ──────────────────────────────────────────
// id → { selector, producedBy, displayName, strategicPurpose, tacticalObjective }
// `selector` is the literal class name (or `<class>::before` for a
// pseudo-element) the generator's HTML/CSS discovery pass looks for.
export const ELEMENT_ANNOTATIONS = {
  'btn-grid': {
    selector: 'btn-grid',
    producedBy: 'buildGridCss (lib/clicky-button.js)',
    displayName: 'Button Grid Wrapper',
    strategicPurpose:
      'The flex container that arranges N button housings per the Grid ' +
      'Layout controls (direction/wrap/gap/justify/align) — the top-level ' +
      'layout knob a consumer tunes independent of any single button’s ' +
      'own geometry.',
    tacticalObjective:
      'Flex row/column wrapper (`.btn-grid`) reading the `--grid-*` vars; ' +
      'wraps every housing buildGridHtml/buildClickyGroupHtml emits.',
  },
  'btn-scale': {
    selector: 'btn-scale',
    producedBy: 'buildGridCss (lib/clicky-button.js)',
    displayName: 'Responsive Sizing Boundary',
    strategicPurpose:
      'The unconditional container-query boundary (issue #96) that makes ' +
      'a single generated button reflow to any container size and aspect ' +
      'ratio — a consumer sizes it (flex stretch, width/height, ' +
      'aspect-ratio) and every box measurement below resolves against it ' +
      'via cq units, so the exported button "takes up the available ' +
      'space" instead of being frozen at its authored px size.',
    tacticalObjective:
      'A `container-type: size` wrapper defaulting to the authored ' +
      '`--housing-width-base`/`--housing-height-base` footprint; carries ' +
      'no paint (no overflow/isolation) so it never clips the glow halo. ' +
      'Wraps the slot/housing in every HTML builder.',
  },
  'btn-housing': {
    selector: 'btn-housing',
    producedBy: 'buildGridCss (lib/clicky-button.js)',
    displayName: 'Chrome Housing',
    strategicPurpose:
      'The chrome-framed slot a keycap sits in — carries the frame ' +
      'gradient/bevel and the ambient/contact drop-shadow that reads as ' +
      'the whole button "sitting" above the page, independent of the key ' +
      'inside it.',
    tacticalObjective:
      'Positions/sizes via `--housing-width`/`--housing-height`, paints ' +
      'the 3-stop chrome gradient (or transparent when frameless), ' +
      'applies the bevel box-shadow or drop-shadow filter (issue #54 ' +
      'frameless fix), and — when skew is active — carries the ' +
      'parallelogram shear as the shared clip boundary (issue #40).',
  },
  'btn-housing--segmented': {
    selector: 'btn-housing--segmented',
    producedBy: 'buildGridCss (lib/clicky-button.js)',
    displayName: 'Segmented Housing Variant',
    strategicPurpose:
      'Issue #36’s shared-housing primitive — lets N buttons (e.g. a ' +
      'tri-state radio group, issue #37) read as one continuous physical ' +
      'strip instead of N separate housings, without duplicating the ' +
      'chrome/shadow rules `.btn-housing` already owns.',
    tacticalObjective:
      'Modifier class switching `.btn-cell` from absolute positioning to ' +
      'flex-row children with no gap; only emitted when `housingLayout: ' +
      "'segmented'`.",
  },
  'btn-cell': {
    selector: 'btn-cell',
    producedBy: 'buildGridCss (lib/clicky-button.js)',
    displayName: 'Button Cell (Cap Clip + Containing Block)',
    strategicPurpose:
      'The clip boundary that gives the cap its rounded silhouette and ' +
      'the containing block every absolutely-positioned descendant ' +
      '(`.clicky-btn`/`.clicky-toggle`, `.btn-face`) relies on — without ' +
      'it those descendants would escape to the shared housing and every ' +
      'segment’s face would stack on the last one painted (issue #36, ' +
      'browser-verified regression).',
    tacticalObjective:
      'Absolutely-positioned, `container-type: size` box per button; the ' +
      'position/inset formula depends on skew (housing-relative ' +
      'centering) vs. the legacy fixed frame-width inset (byte-identical ' +
      'default path, D3).',
  },
  'btn-cell::before': {
    selector: 'btn-cell::before',
    producedBy: 'buildGridCss (lib/clicky-button.js)',
    displayName: 'Cavity (`.btn-cell::before`)',
    strategicPurpose:
      'The revealed housing slot behind a descending key — the visual ' +
      'payoff of "depth". Its top-edge and square-top corrections ' +
      '(issues #54/#55) exist because a naive implementation either ' +
      'leaked the recess in too early or drew a third, cusp-producing ' +
      'arc at the top corners.',
    tacticalObjective:
      'Pseudo-element whose `top` sits exactly at `--wall-h` (the flush ' +
      'point) and whose square top + `.btn-cell`’s own clip arc together ' +
      'supply the correct rounded silhouette; painted with the ' +
      'cavity-wall color/gradient vars.',
  },
  'btn-face::before': {
    selector: 'btn-face::before',
    producedBy: 'buildFaceEdgeCss (lib/clicky-button.js)',
    displayName: 'Face-Edge Bevel + Independent Rim (Issues #68/#74)',
    strategicPurpose:
      'Epic #56\'s "face-edge" role, the owner-named v1 example of a ' +
      'boundary-ring overlay — a real, physically-motivated additive ' +
      'layer distinct from `.btn-face`\'s own flush-gated recess shadow ' +
      '(#56 §4: "the existing recess inset-shadow stack must stay ' +
      'owned by .btn-face itself; edge/top are additive overlays ' +
      'only"). Also hosts issue #74\'s root fix: the rim highlight is ' +
      'reflected light and must not dim when `.btn-face`\'s own ' +
      'background-color press-darkens, which is exactly what happened ' +
      'while the rim lived as L3 of the shared `--face-shadow-*` stack.',
    tacticalObjective:
      'Gated on `bevelStyle: \'beveled\'` and/or `rimIndependent` (D3, ' +
      'either or both may be active); merges whichever gate(s) are on ' +
      'into ONE box-shadow layer list (a single element has only one ' +
      'box-shadow property) — the bevel\'s highlight-top-left/' +
      'shadow-bottom-right insets reusing the EXISTING ' +
      '`--frame-bevel-alpha`/`--frame-bevel-alpha-shadow` vars, and/or ' +
      'the rim reading `--rim-shadow` (buildVarMap, from buildRimLayer — ' +
      'the SAME geometry the legacy shared-stack rim used, computed ' +
      'once). Carries no transform of its own (inherits KEYCAP_Y/skew ' +
      'for free as a descendant of the already-transformed `.btn-face`, ' +
      'per #56 §3).',
  },
  'btn-face::after': {
    selector: 'btn-face::after',
    producedBy: 'buildFaceTopCss (lib/clicky-button.js)',
    displayName: 'Face-Top Independent Specular (Issue #73)',
    strategicPurpose:
      'Epic #56\'s "face-top" role — the independent-specular root fix: ' +
      'the specular hotspot is reflected light and must not dim because ' +
      'the key moved, but the default path blends the SAME gradient ' +
      'against `.btn-face`\'s own animating `--face-pressed`/' +
      '`--face-toggled` background-color via `background-blend-mode`, ' +
      'so press-darken darkens the highlight too — physically wrong.',
    tacticalObjective:
      'Gated on `specularIndependent` (and `specularAlpha > 0`, matching ' +
      'sharedFaceCssProps\' own gate) so default output stays ' +
      'byte-identical (D3); paints the SAME radial-gradient hotspot ' +
      '(`--light-x`/`--light-y`/`--specular-alpha`/`--specular-size`) but ' +
      'via plain alpha compositing — no blend mode — so its value never ' +
      're-derives from whatever is painted underneath. Carries no ' +
      'transform of its own (inherits KEYCAP_Y/skew for free as a ' +
      'descendant of the already-transformed `.btn-face`, per #56 §3).',
  },
  'btn-wall': {
    selector: 'btn-wall',
    producedBy: 'buildButtonWallCss (lib/clicky-button.js)',
    displayName: 'Button Wall (Moving Keycap Side)',
    strategicPurpose:
      'A real element, not a drop-shadow, so the moving side of the ' +
      'keycap can carry its own independent left-right gradient while ' +
      'still hugging the cap’s rounded silhouette at any corner radius ' +
      '— and so it can mirror the cap’s transform through parallel ' +
      'hover/press/toggle rules (issue #12’s single source of truth, ' +
      'KEYCAP_Y).',
    tacticalObjective:
      'True-extrusion geometry (starts below the cap’s corner arcs, ' +
      'square-topped, rounded only at the bottom) painted behind ' +
      '`.btn-face`, background gradient from the button-wall vars, ' +
      'mirrors `.btn-face`’s transform via KEYCAP_Y.',
  },
  'clicky-btn': {
    selector: 'clicky-btn',
    producedBy: 'buildClickFaceCss (lib/clicky-button.js)',
    displayName: 'Click-Mode Button Element',
    strategicPurpose:
      'Click mode’s interactive element — a spring that always ' +
      'completes its press-and-release cycle once triggered (JS-driven ' +
      '`.clicky-press`) while also supporting a plain, JS-free `:active` ' +
      'hold (keyboard Space, static tap) with no dependency on the ' +
      'enhancer script.',
    tacticalObjective:
      '`<button>` carrying `:hover`/`:active`/`:focus-visible` state ' +
      'rules and the clicky-transform-cycle/clicky-shadow-cycle/' +
      'clicky-color-cycle/clicky-icon-color-cycle keyframe bindings.',
  },
  'clicky-toggle': {
    selector: 'clicky-toggle',
    producedBy: 'buildToggleFaceCss (lib/clicky-button.js)',
    displayName: 'Toggle/Radio-Mode Button Element',
    strategicPurpose:
      'Toggle mode’s persistent on/off (or, for radio — issue #37 — ' +
      'tri-state) element, built on a visually-hidden native `<input>` ' +
      'so the checked state is real form state, not a JS-tracked class — ' +
      '`:has(input:checked)` reads it without any script.',
    tacticalObjective:
      '`<label>` wrapping a visually-hidden checkbox/radio input plus ' +
      '`.btn-wall`/`.btn-face`; carries the toggle-press-on/off, ' +
      'toggle-xform-on/off, toggle-icon-color-on/off keyframe bindings ' +
      'for the `.toggle-did-interact` JS-driven bounce.',
  },
  'btn-face': {
    selector: 'btn-face',
    producedBy: 'sharedFaceCssProps (lib/clicky-button.js)',
    displayName: 'Button Face (Cap Top Surface)',
    strategicPurpose:
      'The visible top surface of the keycap — the element that actually ' +
      'reads as "pressed" via its inset box-shadow and background-color ' +
      'darken, shared byte-for-byte between click and toggle mode ' +
      '(sharedFaceCssProps) so the two modes can never drift apart on ' +
      'the properties they share.',
    tacticalObjective:
      'Flex container centering the label/icon, painted with ' +
      '`--face-color`/`--face-pressed`/`--face-toggled`, clipped to the ' +
      'same border-radius as `.btn-cell`, carrying the multi-layer inset ' +
      'box-shadow buildFaceShadow computes.',
  },
  'btn-label': {
    selector: 'btn-label',
    producedBy: 'buildButtonWallCss (lib/clicky-button.js)',
    displayName: 'Button Label',
    strategicPurpose:
      'Wraps the visible text so it can be clipped/truncated ' +
      'independently of the icon and the face’s own padding/flex ' +
      'layout.',
    tacticalObjective:
      '`<span class="btn-label">` — block, min-width 0, overflow ' +
      'hidden, inherits the face’s white-space setting.',
  },
  'btn-icon': {
    selector: 'btn-icon',
    producedBy: 'buildButtonWallCss (lib/clicky-button.js)',
    displayName: 'Button Icon',
    strategicPurpose:
      'A decorative, `aria-hidden` glyph beside the label — either a ' +
      'Material Symbols ligature (self-contained font declaration, so ' +
      'exported buttons need only the webfont `<link>`) or inline SVG ' +
      '(issue #31), sized off `--icon-size` with the em-trap explicitly ' +
      'documented (buildIconSvgCss) so a future edit doesn’t ' +
      'reintroduce double-scaling.',
    tacticalObjective:
      '`<span class="btn-icon">` sized/colored from the icon vars, FILL ' +
      'driven by `--icon-fill`, optionally repositioned to the face edge ' +
      '(buildIconPlacementCss, issue #30) or sized as inline SVG ' +
      '(buildIconSvgCss, issue #31).',
  },
  'btn-divider': {
    selector: 'btn-divider',
    producedBy: 'buildGridCss / segmentedCss branch (lib/clicky-button.js)',
    displayName: 'Segment Divider',
    strategicPurpose:
      'A thin metal-bead ridge BETWEEN adjacent segments in a segmented ' +
      'housing, deliberately NOT a shared trough — each segment keeps ' +
      'its own cavity so the revealed-darkness still visually correlates ' +
      'with which segment is actually pressed (issue #36’s pinned ' +
      'reasoning).',
    tacticalObjective:
      'Fixed-width flex child (`--segment-divider-width`) with a ' +
      'diagonal highlight/shadow gradient; only emitted between segments ' +
      "when `housingLayout: 'segmented'`.",
  },
  'seg-first': {
    selector: 'seg-first',
    producedBy:
      'buildGridCss / segmentedCss branch (lib/clicky-button.js); class ' +
      'assigned in buildSegmentedHousingHtml',
    displayName: 'First-Segment Corner Class',
    strategicPurpose:
      'Only the outer edge of the first/last segment in a shared housing ' +
      'should keep the real corner radius — the inner edges square off ' +
      'so adjoining segments read as one continuous strip, not N rounded ' +
      'buttons touching.',
    tacticalObjective:
      'Modifier class applied to `.btn-cell`/`::before`/`.btn-face` on ' +
      'the first segment, setting `border-radius: <tl> 0 0 <bl>`.',
  },
  'seg-last': {
    selector: 'seg-last',
    producedBy:
      'buildGridCss / segmentedCss branch (lib/clicky-button.js); class ' +
      'assigned in buildSegmentedHousingHtml',
    displayName: 'Last-Segment Corner Class',
    strategicPurpose:
      'Same reasoning as seg-first, mirrored for the trailing edge of a ' +
      'segmented strip.',
    tacticalObjective:
      'Modifier class applied to `.btn-cell`/`::before`/`.btn-face` on ' +
      'the last segment, setting `border-radius: 0 <tr> <br> 0`.',
  },
};

// Modifier/state/per-instance classes the discovery pass will see in
// generated HTML that are NOT independent structural producers (they are
// behavior hooks or per-instance dynamic slugs derived FROM a label/icon
// name, not a fixed emitted element) — excluded from element gap-tracking
// so they never falsely show up as "missing" annotations. `label-<slug>`
// is a regex since the slug itself is caller-controlled data, not a fixed
// id.
export const ELEMENT_EXCLUDE_EXACT = new Set([
  'icon-only',
  'material-symbols-rounded',
  'btn-icon-svg',
  'icon-edge',
  'icon-left',
  'icon-right',
  'clicky-press',
  'toggle-did-interact',
]);
export const ELEMENT_EXCLUDE_PATTERNS = [/^label-/];

// ── CSS custom-property groups ────────────────────────────────────────────
// id → { vars: [...], displayName, strategicPurpose, tacticalObjective }
// Every `--*` var buildVarMap can ever emit (across every feature branch)
// must appear in EXACTLY ONE group's `vars` array — enforced by
// scripts/gen-artifact-registry.mjs via a live diff against buildClickyVars
// output across a representative config matrix (never hand-counted).
export const CSS_VAR_GROUPS = {
  'grid-layout': {
    vars: ['--grid-direction', '--grid-wrap', '--grid-gap', '--grid-justify', '--grid-align'],
    displayName: 'Grid Layout Vars',
    strategicPurpose:
      'Backs the Grid Layout control card (flex direction/wrap/gap/' +
      'justify/align) — the only var group that governs `.btn-grid` ' +
      'rather than any individual button.',
    tacticalObjective:
      "Feeds `.btn-grid`'s flex-direction/flex-wrap/gap/justify-content/" +
      'align-items directly, one-to-one with the matching config keys.',
  },
  'housing-geometry': {
    vars: ['--housing-width', '--housing-height', '--container-width', '--container-height', '--housing-width-base', '--housing-height-base'],
    displayName: 'Housing & Container Dimensions',
    strategicPurpose:
      'The base pixel geometry every other measurement (radius clamps, ' +
      'wall height, press depth, shadow layering) is computed relative ' +
      'to — segment-aware (W0 grows with segmentCount) and skew-aware ' +
      '(widened to reserve space for the sheared parallelogram, issue ' +
      '#40).',
    tacticalObjective:
      '`--housing-width`/`--housing-height` (post skew-widen), ' +
      '`--container-width`/`--container-height` (the caller’s raw ' +
      'config values, unwidened); `--housing-width-base`/' +
      '`--housing-height-base` are the always-px authored footprint that ' +
      'sizes the `.btn-scale` responsive wrapper and serves as the no-cq ' +
      'fallback (issue #96).',
  },
  radius: {
    vars: ['--radius', '--radius-bot', '--radius-tl', '--radius-tr', '--radius-br', '--radius-bl'],
    displayName: 'Corner Radius Vars',
    strategicPurpose:
      'Two independent radius families — the face/cap radius (uniform ' +
      '`--radius` or, when `radiusCorners` is set, four independent ' +
      'per-corner scalars, issue #35) and the chrome housing’s own ' +
      'separate, always-uniform `--radius-bot` — must never be ' +
      'conflated, since the housing’s chrome frame and the cap’s face ' +
      'are allowed to look different.',
    tacticalObjective:
      '`--radius`/`--radius-tl/tr/br/bl` clamp to the smaller of the ' +
      'ratio-derived value and the housing’s own half-width/' +
      'half-height (maxRadiusPx), then (per-corner only) the CSS spec’s ' +
      'own adjacent-corner-overlap algorithm (clampRadiusCorners); ' +
      '`--radius-bot` is the chrome housing’s independent ' +
      'derived (concentric) housing radius.',
  },
  skew: {
    vars: ['--skew-x-angle', '--skew-y-angle', '--skew-widen-y'],
    displayName: 'Parallelogram Skew Vars',
    strategicPurpose:
      'Issue #40’s single shared clamp authority (resolveSkew) feeds ' +
      'these — every consumer site (housing transform, wall ' +
      'counter-skew, icon edge transform) must read the SAME resolved ' +
      'angles or a mismatch would desync the reserved space from the ' +
      'transform actually painted.',
    tacticalObjective:
      'Only emitted when either axis is non-zero (byte-identical ' +
      'default output otherwise, D3); `--skew-widen-y` backs ' +
      '`.btn-cell`’s housing-relative vertical centering.',
  },
  segmented: {
    vars: ['--segment-divider-width'],
    displayName: 'Segmented-Housing Vars',
    strategicPurpose:
      'The one var the segmented-housing layout (issue #36) needs ' +
      'beyond the shared radius/geometry vars above — the divider ridge ' +
      'width between adjacent segments.',
    tacticalObjective:
      "Only emitted when `housingLayout: 'segmented'`; feeds " +
      '`.btn-divider`’s flex-basis.',
  },
  'face-color-family': {
    vars: ['--face-color', '--face-pressed', '--face-toggled', '--text-color', '--border'],
    displayName: 'Face Color Family',
    strategicPurpose:
      'The single derivation point (deriveFaceColorFamily, issue #29’s ' +
      'flagged riskiest part) that computes the pressed/toggled face ' +
      'colors from faceColor + the use-flags + pressDarken — both the ' +
      'base var map and buildVariantsCss call the SAME function so a ' +
      'per-button variant can never recompute only some of these and ' +
      'silently desync the press/toggle animation from the base color.',
    tacticalObjective:
      '`--face-color` (base), `--face-pressed`/`--face-toggled` ' +
      '(darkened per pressDarken, optionally substituting pressColor/' +
      'toggleColor), `--text-color`, `--border` (shorthand or "none").',
  },
  typography: {
    vars: ['--font-size', '--font-weight', '--letter-spacing'],
    displayName: 'Typography Vars',
    strategicPurpose:
      'Label sizing/weight/spacing — `--font-size` in particular ' +
      'carries a generation-time px fallback here (this group) ' +
      'alongside a live `cqi`-unit override in the `@supports` block ' +
      '(D5), so pre-container-query browsers still get a valid, frozen ' +
      'layout.',
    tacticalObjective:
      '`--font-size` (px, from fontSizeRatio or a min() default), ' +
      '`--font-weight`, `--letter-spacing` (em).',
  },
  'focus-ring': {
    vars: ['--focus-color', '--focus-size'],
    displayName: 'Focus Ring Vars',
    strategicPurpose:
      'Backs the four selectable focus-visible treatments (tint/glow/' +
      'outline/none, buildFocusVisibleCss) with one shared color/size ' +
      'pair so switching treatments never requires re-tuning the color ' +
      'separately per style.',
    tacticalObjective: '`--focus-color`, `--focus-size` (px).',
  },
  'interaction-affordance': {
    vars: ['--hover-lift', '--text-wrap'],
    displayName: 'Hover Lift & Text Wrap',
    strategicPurpose:
      'Two independent, unrelated-but-small interaction affordances (a ' +
      'hover-only pointer-device rise, and whether the label may wrap) ' +
      'grouped together because neither warrants its own family.',
    tacticalObjective:
      '`--hover-lift` (px, 0 disables the hover transform), ' +
      "`--text-wrap` ('normal' | 'nowrap').",
  },
  icon: {
    vars: [
      '--icon-size', '--icon-gap', '--icon-color', '--icon-fill',
      '--icon-color-pressed', '--icon-inset', '--icon-clearance',
    ],
    displayName: 'Icon Vars',
    strategicPurpose:
      'Covers both icon sources (Material Symbols ligature and inline ' +
      'SVG, issue #31) and both placements (inline beside the label, or ' +
      'edge-pinned via issue #30) from one var family, so a consumer ' +
      'switching source/placement never has to touch a second, parallel ' +
      'set of properties.',
    tacticalObjective:
      '`--icon-size`/`--icon-gap`/`--icon-color`/`--icon-fill`/' +
      '`--icon-color-pressed` always emitted; `--icon-inset`/' +
      "`--icon-clearance` only when iconPlacement is 'edge' (D3).",
  },
  'specular-hotspot': {
    vars: ['--light-x', '--light-y', '--specular-alpha', '--specular-size'],
    displayName: 'Specular Hotspot Vars (Realism Pack #7a)',
    strategicPurpose:
      'An optional glint gradient that reads as a light source hitting ' +
      'the cap — off by default (specularAlpha: 0) so pre-existing ' +
      'exports/snapshots stay byte-identical (D3); the vars are emitted ' +
      'unconditionally (harmless) while the gradient itself is gated on ' +
      'specularAlpha > 0 in sharedFaceCssProps.',
    tacticalObjective:
      '`--light-x`/`--light-y` (%, light-source position), ' +
      '`--specular-alpha`, `--specular-size` (falloff radius).',
  },
  'button-wall-finish': {
    vars: [
      '--button-wall-color', '--button-wall-shadow-alpha',
      '--button-wall-shadow-edge-ratio', '--button-wall-gradient-lo',
      '--button-wall-gradient-hi',
    ],
    displayName: 'Button-Wall Finish Vars',
    strategicPurpose:
      'The moving side of the keycap’s own independent color/alpha/' +
      'edge-darken/gradient-spread family — deliberately separate from ' +
      'the cavity-wall family below so the two surfaces (moving key vs. ' +
      'static housing slot) can be tuned to read as different ' +
      'materials.',
    tacticalObjective:
      '`--button-wall-color` (from deriveFaceColorFamily), plus the L-R ' +
      'multiply-blend gradient stops consumed by `.btn-wall`’s ' +
      'background-image.',
  },
  'cavity-wall-finish': {
    vars: [
      '--cavity-wall-color', '--cavity-wall-shadow-alpha',
      '--cavity-wall-shadow-edge-ratio', '--cavity-wall-gradient-lo',
      '--cavity-wall-gradient-hi',
    ],
    displayName: 'Cavity-Wall Finish Vars',
    strategicPurpose:
      'The static housing slot’s own independent finish family, ' +
      'defaulting to the chrome frame color (or a darkened button-wall ' +
      'color when frameless) so the revealed channel always reads as ' +
      'occluded relative to the wall, never brighter.',
    tacticalObjective:
      '`--cavity-wall-color`, plus the L-R multiply-blend gradient ' +
      'stops consumed by `.btn-cell::before`’s background-image.',
  },
  'ambient-shadow': {
    vars: ['--ambient-color', '--ambient-blur', '--ambient-y', '--ambient-spread'],
    displayName: 'Ambient (Housing) Shadow Vars',
    strategicPurpose:
      'The diffuse drop-shadow that reads as the whole button sitting ' +
      'above the page — shares its geometry source (housingShadowLayers) ' +
      'with the contact-shadow layer below, so the two can never ' +
      'independently drift.',
    tacticalObjective:
      '`--ambient-color`/`--ambient-blur`/`--ambient-y` feed the ' +
      'resting-state box-shadow/filter baseline; `--ambient-spread` is a ' +
      'fixed 0px (no spread on the ambient layer).',
  },
  'housing-shadow': {
    vars: [
      '--housing-shadow', '--housing-shadow-pressed',
      '--housing-drop-shadow', '--housing-drop-shadow-pressed',
    ],
    displayName: 'Housing Shadow (Resting/Pressed) Vars',
    strategicPurpose:
      'Framed housings use the cheaper, compositor-friendlier ' +
      'box-shadow; frameless housings must use drop-shadow instead, ' +
      'since an outer box-shadow is clipped out of its own caster’s ' +
      'transparent border box and leaves a hard-edged unshadowed ' +
      'rectangle as the key presses down (issue #54) — this is why BOTH ' +
      'forms exist, gated on frameEnabled.',
    tacticalObjective:
      '`--housing-shadow`/`--housing-shadow-pressed` (box-shadow ' +
      'strings, always emitted); `--housing-drop-shadow`/' +
      '`--housing-drop-shadow-pressed` (filter strings, only emitted ' +
      'when frameless).',
  },
  'face-shadow': {
    vars: ['--face-shadow-resting', '--face-shadow-pressed'],
    displayName: 'Face Inset Shadow Vars',
    strategicPurpose:
      'The multi-layer inset shadow (buildFaceShadow) that makes the ' +
      'cap read as recessed once pressed — carries the pre-computed px ' +
      'fallback for browsers that can’t parse cq units (D5); the live ' +
      'cqb-unit version is a separate `@supports` override, not this ' +
      'var.',
    tacticalObjective:
      '`--face-shadow-resting` (always the un-pressed layer stack); ' +
      '`--face-shadow-pressed` (the pressed stack, UNLESS the key never ' +
      'travels past flush — resolveShadowTiming’s `animates` gate — in ' +
      'which case it equals resting, since nothing can shadow a key ' +
      'that never enters the channel).',
  },
  'rim-highlight': {
    vars: ['--rim-shadow'],
    displayName: 'Independent Rim Light Var (Issue #74)',
    strategicPurpose:
      'The root fix for the rim highlight dimming under press-darken: ' +
      'as L3 of the shared `--face-shadow-*` stack it co-animated with ' +
      '`.btn-face`\'s own recess layers and background-color; as this ' +
      'standalone var (consumed by the face-edge overlay, ' +
      'buildFaceEdgeCss) it holds its exact resting value through the ' +
      'press.',
    tacticalObjective:
      '`--rim-shadow` — a single inset box-shadow value from ' +
      'buildRimLayer, the SAME geometry (rimHeightRatio/highlightColor/' +
      'highlightOpacity/topHighlight) the legacy shared-stack rim (L3 of ' +
      '`--face-shadow-resting`/`-pressed`) already used; emitted only ' +
      'when `rimIndependent` is on (D3), with a live cqb-unit override in ' +
      'the same `@supports (width: 1cqi)` block as `--face-shadow-*`.',
  },
  'wall-travel': {
    vars: ['--wall-h', '--press-translate', '--toggle-height'],
    displayName: 'Wall Height & Press-Travel Vars',
    strategicPurpose:
      'The core depth-illusion measurements — how tall the visible wall ' +
      'band is, how far the key travels on press, and how far it rests ' +
      'when toggled on — that resolveShadowTiming’s flush-point math ' +
      '(and nearly every geometry consumer in buildVarMap) is ' +
      'ultimately computed relative to.',
    tacticalObjective:
      '`--wall-h` (px, from wallHRatio), `--press-translate` (px, from ' +
      'pressDepthRatio), `--toggle-height` (px, a ratio of ' +
      'press-translate).',
  },
  'frame-chrome': {
    vars: [
      '--frame-width', '--frame-color', '--frame-color-hi', '--frame-color-lo',
      '--frame-bevel-alpha', '--frame-bevel-alpha-shadow', '--frame-bevel-width',
    ],
    displayName: 'Chrome Frame Vars',
    strategicPurpose:
      'The Chrome Frame control card’s straight-edge bevel treatment — ' +
      'the default (frameBevelConic: false) path that stays ' +
      'byte-identical to pre-#18 output; the conic-gradient alternative ' +
      'is a separate var group below.',
    tacticalObjective:
      '`--frame-width` (clamped to the smaller of 25% of containerWidth ' +
      '/ 40% of containerHeight), the 3-stop gradient colors, and the ' +
      'bevel alpha/width feeding the four straight-edge box-shadow ' +
      'insets.',
  },
  'frame-bevel-conic': {
    vars: [
      '--frame-bevel-conic-tr-start', '--frame-bevel-conic-tr-end',
      '--frame-bevel-conic-bl-start', '--frame-bevel-conic-bl-end',
    ],
    displayName: 'Conic Bevel Transition-Zone Vars (Issue #18)',
    strategicPurpose:
      'The straight-edge bevel reads correctly only at the top-left/' +
      'bottom-right corners where both adjoining edges agree on color; ' +
      'at top-right/bottom-left it produces a hard jump on the rounded ' +
      'corner arc. These four stop angles are computed per-instance ' +
      'against THIS housing’s real aspect ratio and chrome radius ' +
      '(computeFrameBevelConicStops) — never hardcoded degrees, since a ' +
      'fixed angle desyncs from a non-square housing or a changed ' +
      'the concentric-derived housing radius.',
    tacticalObjective:
      "Only emitted when `frameBevelConic: true`; feed the " +
      '`.btn-housing::after` conic-gradient ring’s transition-zone stop ' +
      'positions.',
  },
  'animation-duration': {
    vars: ['--duration', '--press-duration'],
    displayName: 'Press/Release Duration Vars',
    strategicPurpose:
      'The two headline timing numbers a consumer tunes (Timing & ' +
      'Easing card) — both scaled by speedFactor (log10 multiplier) and ' +
      'distScale (a travel-distance-derived scale so a deeper key ' +
      'doesn’t feel rushed at the same duration as a shallow one).',
    tacticalObjective:
      '`--duration` (release), `--press-duration` (press) — both ms, ' +
      'both feeding the transition/animation-duration declarations ' +
      'throughout the click/toggle CSS.',
  },
  'shadow-timing': {
    vars: [
      '--shadow-flush-frac', '--shadow-press-delay', '--shadow-press-dur',
      '--shadow-release-dur', '--color-anim-delay-frac', '--color-anim-frac',
    ],
    displayName: 'Per-Property Animation-Delay Vars',
    strategicPurpose:
      'The recess shadow can only appear once the face is physically ' +
      'inside the channel (past flush) — resolveShadowTiming derives ' +
      'that geometrically (flushFrac = wallH / pressDepth) rather than ' +
      'guessing, and these vars carry that derived timing into the ' +
      ':active/checked pure-CSS transitions so the JS-free hold path and ' +
      'the JS-driven full-cycle keyframes agree.',
    tacticalObjective:
      '`--shadow-flush-frac` and its derived `--shadow-press-delay`/' +
      '`--shadow-press-dur`/`--shadow-release-dur` window the ' +
      'recess-shadow transition; `--color-anim-delay-frac`/' +
      '`--color-anim-frac` do the same for the independently-' +
      'configurable color-transition delay.',
  },
  easing: {
    vars: ['--transform-easing', '--shadow-ease-press', '--shadow-ease-release'],
    displayName: 'Easing Curve Vars',
    strategicPurpose:
      'The transform easing is fully configurable (11 presets or a ' +
      'custom cubic-bezier, with an overshoot toggle); the shadow-layer ' +
      'easing is deliberately fixed to linear (SHADOW_EASING_PRESS/' +
      'RELEASE constants) so the recess shadow’s ramp never fights the ' +
      'geometric flush-point timing above with its own curve.',
    tacticalObjective:
      '`--transform-easing` (computed per getTransformEasing); ' +
      "`--shadow-ease-press`/`--shadow-ease-release` (always 'linear').",
  },
  'face-tolerance': {
    vars: ['--face-tolerance'],
    displayName: 'Face Tolerance Gap Var (Issue #76)',
    strategicPurpose:
      'Retires the corner-cusp bug class (issues #54/#55) at its root: ' +
      'H0/W0 (buildVarMap) have zero width terms tying face/wall width ' +
      'to anything but frame-width/skew-widen, so a true parallel ' +
      'horizontal offset — not a position-specific patch — makes ' +
      'wall-arc/cell-arc crossing geometrically impossible at any ' +
      'travel position or radius, by construction.',
    tacticalObjective:
      'Emitted only when faceTolerance > 0 (D3); insets ' +
      '`.btn-face`/`.btn-wall` left/right (faceInsetDecl) and reduces ' +
      'their own per-corner radius by the same amount ' +
      '(faceRadiusBorderDecl) — horizontal-only, the cavity/`.btn-cell`/' +
      'all vertical math are untouched.',
  },
};

// ── Keyframe groups ────────────────────────────────────────────────────
// id → { names: [...], producedBy, displayName, strategicPurpose, tacticalObjective }
export const KEYFRAME_GROUPS = {
  'cavity-top-cycle': {
    names: ['clicky-cavity-top-cycle'],
    producedBy: 'buildClickFaceCss (lib/clicky-button.js)',
    displayName: 'Cavity-Reveal Press Cycle',
    strategicPurpose:
      'Fixes the pressed-state illusion (issue #96): the recessed cavity ' +
      'top is pinned at wall-height, so once the cap descends to/past that ' +
      'edge it vacates a band that nothing covered — bare housing chrome ' +
      'showed above the sinking cap (worst on tall buttons). This animates ' +
      'the cavity top up to track the descending cap so the dark recess ' +
      'fills that band, reading as a key sinking into a hole. Emitted for ' +
      'every config whose press depth reaches wall height (cavityRevealsPress ' +
      '— broader than resolveShadowTiming.animates, which misses the common ' +
      'press-depth === wall-h default).',
    tacticalObjective:
      'Animates `.btn-cell::before` `top` from var(--wall-h) (rest) to ' +
      'max(0px, calc(var(--wall-h) - var(--press-translate))) at the press ' +
      'bottom and back, ramping on the cap DESCENT (0/bottom/100) rather than ' +
      'the flush-gated window, which collapses to a spike when press-depth === ' +
      'wall-h. Held-press/toggle-checked use the same value statically.',
  },
  'glow-channel-cycle': {
    names: ['clicky-glow-channel-cycle'],
    producedBy: 'buildClickFaceCss (lib/clicky-button.js)',
    displayName: 'Lit-Channel Glow Cycle',
    strategicPurpose:
      'The inside half of the owner-ruled glow (#53b, epic #56): an ' +
      'emissive key sinking into its channel must LIGHT the channel walls ' +
      'it is descending into. Emitted only when a glow is configured ' +
      '(slotActive), and gated by construction rather than by new logic — ' +
      'the channel only exists once the visible wall reaches zero, so a key ' +
      'whose travel stops at flush never lights a channel because it never ' +
      'enters one.',
    tacticalObjective:
      'Animates the cavity ::before background-image between its resting and ' +
      'pressed glow gradients across the SAME flush-point offsets ' +
      'clicky-shadow-cycle uses (resolveShadowTiming flushDown/bottom/' +
      'flushUp) — never a parallel timing source. Both stops carry an ' +
      'identical gradient type/stop-count so the colour channel interpolates ' +
      'smoothly instead of flipping at the midpoint.',
  },
  'click-mode-full-cycle': {
    names: ['clicky-transform-cycle', 'clicky-shadow-cycle', 'clicky-color-cycle'],
    producedBy: 'buildClickFaceCss (lib/clicky-button.js)',
    displayName: 'Click-Mode Full Press-Release Cycle',
    strategicPurpose:
      'The JS-driven `.clicky-press` bounce that always completes ' +
      'regardless of click duration — split into three ' +
      'independently-timed keyframes (issue #12/#16) rather than one ' +
      'combined keyframe, since transform/shadow/color each need their ' +
      'own offset math (the recess-shadow timing in particular is ' +
      'geometry-derived and asymmetric between press/release).',
    tacticalObjective:
      'Bound to `.clicky-btn.clicky-press .btn-face` via one ' +
      'animation-name list with matching per-keyframe durations/delays.',
  },
  'click-mode-icon-cycle': {
    names: ['clicky-icon-color-cycle'],
    producedBy: 'buildClickFaceCss (lib/clicky-button.js)',
    displayName: 'Click-Mode Icon Color Cycle',
    strategicPurpose:
      'A parent’s animated background-color does not cascade into a ' +
      'child element’s color — the icon needs its own animation-name ' +
      'list (realism pack #7d) to participate in the same press-darken ' +
      'effect as the face.',
    tacticalObjective:
      'Bound to `.clicky-btn.clicky-press .btn-icon`, timed off the ' +
      'same color-anim-frac/delay-frac vars as the face’s color cycle.',
  },
  'toggle-mode-full-cycle': {
    names: ['toggle-press-on', 'toggle-press-off', 'toggle-xform-on', 'toggle-xform-off'],
    producedBy: 'buildToggleFaceCss (lib/clicky-button.js)',
    displayName: 'Toggle-Mode Full Press-Release Cycle',
    strategicPurpose:
      'Toggle mode’s `.toggle-did-interact` bounce, played once per ' +
      'direction (on/off) rather than split per-property like click ' +
      'mode — the face keyframes (press-on/off) combine transform+' +
      'shadow+color in one pass, with transform-only counterparts ' +
      '(xform-on/off) for the wall so it tracks the cap’s position ' +
      'without touching the cap’s own box-shadow/background-color.',
    tacticalObjective:
      'Bound to `.clicky-toggle.toggle-did-interact` face/wall ' +
      'elements, keyed off whether `input:checked` is entering or ' +
      'leaving.',
  },
  'toggle-mode-icon-cycle': {
    names: ['toggle-icon-color-on', 'toggle-icon-color-off'],
    producedBy: 'buildToggleFaceCss (lib/clicky-button.js)',
    displayName: 'Toggle-Mode Icon Color Cycle',
    strategicPurpose:
      'Same cascade limitation as the click-mode icon cycle above (a ' +
      'parent’s animated background-color doesn’t reach a child’s ' +
      'color) — mirrors toggle-press-on/off for the icon specifically.',
    tacticalObjective:
      'Bound to `.clicky-toggle.toggle-did-interact .btn-icon`, keyed ' +
      'off checked/unchecked direction.',
  },
};

// ── Export bundle ──────────────────────────────────────────────────────
export const EXPORT_BUNDLE_ANNOTATIONS = {
  'export-bundle-zip': {
    producedBy: 'downloadZip (app.js)',
    displayName: 'Export ZIP Bundle',
    strategicPurpose:
      'The generator’s drop-in deliverable (README "Generate a button ' +
      'in 30 seconds" step 5) — a consumer who doesn’t want the ' +
      'runtime ES module still gets a rendering byte-identical to the ' +
      'live preview, with zero build step and zero framework.',
    tacticalObjective:
      'makeZip bundles exactly 3 files — `<slug>.html` (standalone ' +
      'document, buildGroupPreviewHtml markup, conditional Material ' +
      "Symbols font link), `<slug>.css` (buildCss(state, ':root') " +
      'output with a header comment), and `<slug>.enhancer.js` ' +
      '(clickyEnhancerJs, commented out by default in the HTML) — into ' +
      'one downloadable .zip via the dependency-free makeZip writer for ' +
      'browser download.',
  },
};
