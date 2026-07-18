# Clicky Button Generator

Design tactile, skeuomorphic **"clicky" buttons** in the browser — tune every detail with live sliders, watch them press and toggle in 2D and 3D, then export drop-in HTML + CSS. No build step, no framework, no JavaScript required in the buttons themselves: the press/hover/toggle motion is pure CSS.

**▶ [Open the generator](https://lampagj.github.io/clicky-button/)**

![Clicky Button Generator — the live editor showing an amber SUBMIT button, a 3D view, and the control panel](assets/screenshot.png)

---

## Generate a button in 30 seconds

1. **[Open the generator](https://lampagj.github.io/clicky-button/)** (or run it locally — see [below](#run-it-locally)).
2. **Tweak.** Every control updates the preview instantly. The big preview shows the working buttons; the top strip shows each state frozen side-by-side (resting · hover · pressed · toggled); the right panel shows a 3D view. (Prefer a starting point? The **Gallery preset…** dropdown loads any showcase tile straight into the editor, and **Test in layout** drops your current button into the flexbox playground.)
3. **Pick a mode** — *Click* (springs back) or *Toggle* (stays down) — with the toggle top-right of the preview.
4. **Check it on your background** — flip the preview between *Light / Dark / Neutral*.
5. **Export.** Hit **Export** to download a `.zip` with a standalone `.html` + `.css` (plus an optional `.enhancer.js` progressive-enhancement script — never required, since press/toggle motion is pure CSS) you can drop straight into a page. Hit **+ Save** to keep the current style in the in-app style picker so you can compare variants.

The exported CSS is self-contained and **responsive out of the box** (v2): the button is wrapped in a `.btn-scale` container-query boundary, so it fills whatever space you give it — any size, any aspect ratio — with correct geometry throughout. See [Responsive by default](#responsive-by-default-v2).

---

## Responsive by default (v2)

Every generated button is wrapped in a `.btn-scale` element that is a `container-type: size` boundary. All of the button's geometry — housing, frame, corner radii, wall depth, the frame bevel, and the shadows — is expressed relative to that boundary with CSS container-query units, so **one button fills any container at any size and aspect ratio, live, without regeneration.** The frame band stays proportionally balanced (it scales off the shorter axis), the concentric chrome ring holds, the bevel tracks the corner via `atan2()`, the shadows scale, and the press reveals the recess correctly at every ratio.

Want the formulas behind this — the variable chain, the housing math, the keycap ring? See [How it's built — geometry & responsive sizing](#how-its-built--geometry--responsive-sizing).

By default `.btn-scale` renders at its authored footprint. To make it fill a flex/grid cell, size it in *your* CSS:

```css
.your-toolbar { display: flex; gap: 12px; }
.your-toolbar .btn-scale { flex: 1 1 0; }          /* share the row */
/* or: .btn-scale { width: 100%; height: 100%; }   fill both axes at any ratio */
```

**Try it:** the [gallery](gallery.html) has an interactive flexbox playground — pick `flex-direction`/`justify-content`/`align-items`/`wrap`/`gap`, drag the stage to any size, and watch the buttons re-flow.

> **Migrating from a pre-v2 (0.x) export — breaking change.** v2 adds the `.btn-scale` wrapper, so the emitted markup gains one level: `.btn-grid > .btn-scale > .btn-housing > .btn-cell > …` (was `.btn-grid > .btn-housing > …`). Re-export your buttons, or update any consumer CSS/JS keyed to the old DOM depth. The container query moved off `.btn-cell` (no longer a container) onto `.btn-scale`; if you referenced that, move it up one level. Everything else (config API, `--clicky-*` theming contract, class names) is unchanged.

---

## How it's built — geometry & responsive sizing

Everything below is what makes a button *look* like a physical key and *fill any container* live. If you just want to use the output you can skip this — it's the reference for anyone hacking on `lib/clicky-button.js`.

### The element tree

```
.btn-grid                 flex container for one or more buttons
└─ .btn-scale             ← the container-query boundary (container-type: size)
   └─ .btn-housing        the chrome frame / outer shell (overflow: hidden — it clips)
      └─ .btn-cell        the keycap slot (overflow: hidden — it clips too)
         ├─ .btn-face     the cap's top surface (what you read/press)
         ├─ .btn-wall     the moving SIDE of the key (the visible band below the cap)
         └─ ::before      the cavity — the STATIC housing slot revealed on press
```

`.btn-scale` is the **single** container-query boundary. `.btn-cell` is deliberately *not* one: CSS container-query units inside a custom property resolve against the *using* element's nearest container, so two nested containers would resolve the shared geometry vars against two different boxes and break the concentric ring. One boundary → every var resolves in one space.

### Two layers: a px fallback + a live container-query override

`buildClickyCss` emits each geometry value **twice**:

1. A **base px fallback** — computed once in JS (`buildClickyVars`) at the authored size. This is what non-container-query engines get, and it's byte-stable.
2. A **live override** inside `@supports (width: 1cqi)` — every geometry var re-expressed in container-query units against `.btn-scale`. This is what makes it responsive: the values recompute continuously as the boundary resizes, with **no regeneration**.

### The variable chain (the live override)

Every value derives from the boundary (`100cqw` × `100cqh`):

| Variable | Expression | Why |
|---|---|---|
| `--housing-width` / `--housing-height` | `100cqw` / `100cqh` | the boundary itself |
| `--frame-width` | `k·cqmin` where `k = frameWidth / min(housingW, housingH) × 100` | frame scales off the **shorter** axis (`cqmin`) so the ring stays a balanced uniform band at any ratio instead of fattening on the long side |
| `--container-width` | `100cqw − 2·--frame-width` | the cap's content box, inside the frame |
| `--container-height` | `100cqh − 2·--frame-width` | ″ |
| `--wall-h` | `--container-height × wallHRatio` | the visible side band of the key |
| `--press-translate` | `--container-height × pressDepthRatio` | how far the key travels on press |
| `--radius` | `min(--container-width × radiusRatio, --container-width/2, (--container-height − --wall-h)/2, --container-height/2)` | cap corner radius, clamped so it can never exceed the geometry (half-width, half-face, half-height) |
| `--radius-bot` | `min(--radius + --frame-width [+ offset], --housing-width/2, --housing-height/2)` | the **chrome** corner radius — a *textual* reference to `--radius + --frame-width`, so the concentric-ring invariant `Rₕ = R + fw` holds at every size by construction |

Because they're all relative to the boundary and resolve live, **one button fills any container at any size and aspect ratio.**

### The housing footprint (how `.btn-scale`'s px size is chosen)

The authored px size (the fallback, and the default footprint) comes from the config:

- **Width:** `W₀ = containerWidth + 2·fw` (segmented group: `N·containerWidth + dividers + 2·fw`).
- **Height:** `H₀ = max(fw, wallH) + faceH + fw`, where `faceH = containerHeight − wallH`. This is the **even ring around the channel** (see below): it reserves exactly `fw` of chrome around the *slot the key sinks into*, not around the proud resting key.
- **Skew:** a parallelogram reserves extra width/height (`widenX`, `widenY`) for the shear. `.btn-scale` is the full widened box, and the base dimensions are recovered live via `W₀ = housingW − housingH·tanX` (the `tanX·tanY` cross-term cancels); the skew angles are baked constants since they aren't responsive.

### The keycap anatomy & the even ring

A real key is modelled as a proud cap over a slot:

- **`.btn-face`** (cap top): `top: 0`, `height: calc(100% − --wall-h)`, inset `--frame-width` on the sides.
- **`.btn-wall`** (moving side): sits below the cap and is shifted straight down by `--wall-h` — a real rounded element, not a drop-shadow, so it hugs the cap's silhouette at any corner radius.
- **`.btn-cell::before`** (cavity / slot): pinned statically at `top: --wall-h` (the *flush line*).

The chrome ring is measured around the **channel** (the slot), not the resting cap — three coupled rules make it read right for a *proud* key:

1. **`cellTop = max(0, fw − wallH)`** — a proud cap (`wallH ≥ fw`) sits **flush at the top**, fully obscuring the top chrome band. The cap *is* the top edge.
2. The cell is pinned by **top + bottom** (`top: cellTop; bottom: --frame-width`), never a fixed height, so the bottom and side rings are always exactly `--frame-width` regardless of how proud the cap is.
3. The **housing's top corners shrink to hug the cap**: `border-radius` top = `max(0, --radius-bot − min(fw, wallH))`, bottom = `--radius-bot`. A proud cap's rounded corner then has no *larger* housing corner peeking past it — no gap, no pinch. A flat cap (`wallH 0`) subtracts 0 → uniform `--radius-bot` ring, unchanged.

### The press (pure CSS, no JS)

On `:active` / `:checked`, the cap **and** wall translate down by `--press-translate`. The cavity never moves — the descending cap simply *uncovers* the fixed slot:

- **Before flush** (travel < `--wall-h`): the band above the cap is the **housing surface** (the chrome plate).
- **After flush** (travel > `--wall-h`): the cap drops below the plate and the band above it is the **channel** — the dark recess (`--cavity-wall-color` + a multiplied shadow gradient).

Because the cavity is static and only the opaque cap moves over it, there's no channel animation and no bounce. The face's inset "recess" shadow is flush-gated (it only ramps once the key is actually below the plate), timed off `flushFrac = wallH / pressDepth`.

### Bevel & shadows

The frame bevel is a conic gradient whose corner stop-angles track the live aspect ratio via `atan2()`, so the highlight/shadow stay on the true corners at any size. The ambient/contact drop-shadows and the travelling glow all scale off the live `--wall-h`, so depth reads consistently as the button resizes.

> **Verifying geometry:** every formula above is checked against the *rendered* values in real WebKit (`getBoundingClientRect` / computed styles / resolved custom properties), not just JS math — the container-query resolution can diverge from config-space arithmetic, so DOM readback is the source of truth.

---

## What you can modify

Controls are grouped into cards. Everything is live and reversible (there's a **Reset to defaults**).

| Card | Controls |
|---|---|
| **Size & Shape** | Width, Height, Button corner radius, Chrome (housing) corner radius |
| **Typography** | Text color, text wrap, font size, font weight, letter spacing |
| **Grid Layout** | Button count, labels, flex direction, wrap, gap, justify, align |
| **Face** | Face color, alternate Pressed color, alternate Toggle color, press-darken amount, face edge shadow |
| **Chrome Frame** | Frame on/off, frame width, three-stop chrome gradient (Hi / Mid / Lo), bevel intensity & width |
| **Depth** | Press depth (how far the key travels), wall band height (the visible side of the key) |
| **Button Wall** | The *moving side of the keycap*: color (defaults to face color) + its own alpha, edge-darken, and gradient-spread |
| **Button Cavity** | The *static housing slot* revealed on press: color (defaults to chrome) + its own alpha, edge-darken, and gradient-spread |
| **Face Shadows** | Inset shadow Y offset & blur, top/bottom inset alpha (the recessed-when-pressed look) |
| **Rim Highlight** | On/off, highlight color, alpha (the lit top edge) |
| **Ambient Shadow** | Drop-shadow intensity, blur, Y offset, and how much it shrinks while pressed |
| **Timing & Easing** | Release & press durations, easing preset or custom cubic-bézier, overshoot, toggle-rest feel |
| **Animation Timing** | Per-property delays for the shadow and color transitions |
| **Hover, Focus & Border** | Hover lift, focus style/color/size, border width/color/style |

### The two walls

This generator models a real keycap as two independently-styled surfaces, which is what gives it depth:

- **Button wall** — the side of the key itself. It moves *with* the key when pressed and defaults to the face color.
- **Button cavity** — the fixed slot inside the housing, revealed *above* the key as it descends. Defaults to the chrome color.

Each has its own color toggle, alpha, edge-darken, and gradient-spread, so you can make the key read as anything from a soft rubber dome to a hard plastic chiclet in a metal frame.

---

## Use the output

### Option A — drop-in HTML + CSS (no dependencies)

Unzip the **Export** download and reference the CSS (the optional `.enhancer.js` file adds a full symmetric press bounce — see the commented-out `<script>` tag in the exported HTML; never required, since press/toggle motion is already pure CSS):

```html
<link rel="stylesheet" href="my-button.css">
<!-- ...the .html file shows the exact markup; copy the .btn-grid block -->
```

### Option B — generate at runtime with the ES module

`lib/clicky-button.js` is a dependency-free ES module that produces the same CSS and HTML programmatically:

```js
import { buildClickyCss, buildClickyHtml } from './lib/clicky-button.js';

// Inject scoped CSS once...
const style = document.createElement('style');
style.textContent = buildClickyCss({ faceColor: '#c8c0b4', mode: 'click' }, { scope: ':root' });
document.head.appendChild(style);

// ...and stamp out markup.
document.querySelector('#play').outerHTML = buildClickyHtml({ label: 'PLAY' });
```

Public API: `buildClickyCss(config?, opts?)`, `buildClickyHtml({ label, tag, attrs, config? })`, `buildClickyGroupHtml(config?, opts?)` (a shared housing across multiple `.btn-cell` children — required, not `buildClickyHtml`, whenever `housingLayout` is `'segmented'`), `buildClickyVars(config?)` (the raw CSS custom-property map), and `defaultClickyConfig` (every option with its default). Full config reference: the `@typedef {object} ClickyConfig` block at the top of [`lib/clicky-button.js`](lib/clicky-button.js) — the live, authoritative contract (the earlier design spec is archived at [`claudedocs/past/clicky-button-importable-module-spec.md`](claudedocs/past/clicky-button-importable-module-spec.md)).

### Use as a package

*(Future — once published. Currently `"private": true` in `package.json`; see [Project layout](#project-layout) to use the module directly from a clone instead.)*

```bash
npm install clicky-button
```

```js
// Generate CSS + HTML programmatically
import { buildClickyCss, buildClickyHtml, buildClickyGroupHtml, buildClickyVars, defaultClickyConfig } from 'clicky-button';

const css = buildClickyCss({ faceColor: '#c8c0b4', mode: 'click' }, { scope: ':root' });
const html = buildClickyHtml({ label: 'PLAY' });

// Optional progressive-enhancement script (adds a full symmetric press bounce;
// never required — press/toggle motion is already pure CSS)
import { enhanceClickyButtons } from 'clicky-button/enhancer';
enhanceClickyButtons(document.querySelector('.btn-grid'));
```

**CSS-var theming contract:** `buildClickyCss` emits a scoped block of `--clicky-*` custom properties (scope selector via `opts.scope`, default `:root`) that `buildClickyHtml`/`buildClickyGroupHtml`'s markup reads at render time — regenerate the CSS block (not the HTML) to retheme already-rendered buttons, or scope multiple configs side-by-side by giving each its own `opts.scope` selector instead of `:root`.

---

## Run it locally

It's a static site, but it loads its library as an ES module, so it needs to be served over HTTP (not opened as a `file://`):

```bash
git clone https://github.com/LampaGJ/clicky-button.git
cd clicky-button
python3 -m http.server 8000      # or: npx serve
# open http://localhost:8000
```

---

## Project layout

| File | Purpose |
|---|---|
| `index.html` | The generator UI (control panel + previews) |
| `app.js` | Wires the controls to state, live preview, save/export |
| `styles.css` | Styling for the generator app itself |
| `lib/clicky-button.js` | The importable, dependency-free button engine |
| `presets.js` | Shared catalog — material styles + the 30 gallery tiles — imported by both `app.js` and `gallery.html` so the generator's Gallery-preset dropdown and the gallery showcase never drift |
| `gallery.html` | Interactive **flexbox playground** (drop the responsive button into a resizable flex container) + a **showcase gallery** of variation tiles, all generated live from `lib/clicky-button.js` |
| `CHANGELOG.md` | Release notes (see it for the v2 responsive-engine breaking change) |
| `claudedocs/` | Config spec & design notes |
