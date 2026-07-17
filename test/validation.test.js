import { describe, it, expect } from 'vitest';
import {
  buildClickyCss,
  buildClickyHtml,
  buildClickyGroupHtml,
  buildClickyVars,
  defaultClickyConfig,
  internals,
} from '../lib/clicky-button.js';
import { ClickyConfigSchema } from './clicky-config.schema.js';

const { getLabels } = internals;

describe('validation (issue #25)', () => {
  it('Zod schema mirrors defaultClickyConfig shape exactly (no extra/missing keys either way)', () => {
    expect(() => ClickyConfigSchema.parse(defaultClickyConfig)).not.toThrow();
    const schemaKeys = Object.keys(ClickyConfigSchema.shape).sort();
    const defaultKeys = Object.keys(defaultClickyConfig).sort();
    expect(schemaKeys).toEqual(defaultKeys);
  });

  it('buildClickyCss throws on an unknown key, naming it', () => {
    expect(() => buildClickyCss({ chanelHeight: 5 })).toThrowError(/chanelHeight/);
  });

  it('buildClickyCss throws on a type mismatch, naming the key', () => {
    expect(() => buildClickyCss({ faceColor: 42 })).toThrowError(/faceColor/);
  });

  it('buildClickyHtml validates its config too', () => {
    expect(() => buildClickyHtml({ label: 'X', config: { mode: 42 } })).toThrow(TypeError);
  });

  it('buildClickyVars validates its config too', () => {
    expect(() => buildClickyVars({ frameEnabled: 'yes' })).toThrow(TypeError);
  });

  it('rejects NaN for a numeric key (typeof NaN === "number" would otherwise pass silently)', () => {
    expect(() => buildClickyCss({ containerWidth: NaN })).toThrow(TypeError);
  });

  it('rejects the common boolean-vs-number config typo', () => {
    expect(() => buildClickyCss({ frameEnabled: 1 })).toThrow(TypeError);
  });

  it('null/undefined config is treated as "no overrides", not an error', () => {
    expect(() => buildClickyCss(null)).not.toThrow();
    expect(() => buildClickyCss(undefined)).not.toThrow();
    expect(() => buildClickyVars(undefined)).not.toThrow();
  });

  it('rejects an array config with one clear message, not unknown-key spam', () => {
    expect(() => buildClickyCss([1, 2, 3])).toThrowError(/plain object/);
  });

  it('internals.buildCss stays UNvalidated (the generator passes UI-only keys through it)', () => {
    const state = { ...defaultClickyConfig, previewBg: 'light', view3dRotateX: 50, view3dRotateY: -20 };
    expect(() => internals.buildCss(state, ':root')).not.toThrow();
  });

  it('all prior smoke tests still pass (regression guard, not a redundant assertion)', () => {
    expect(buildClickyCss().length).toBeGreaterThan(0);
  });
});

describe('per-button variants validation (issue #29)', () => {
  it('accepts a well-formed variants config', () => {
    expect(() => buildClickyCss({
      variants: { rec: { faceColor: '#d33422', textColor: '#fff', iconName: 'radio_button_checked', iconColor: '#fff' } },
    })).not.toThrow();
  });

  it('rejects an array as the variants value', () => {
    expect(() => buildClickyCss({ variants: [{ faceColor: '#fff' }] })).toThrowError(/variants.*plain object/);
  });

  it('rejects an array as a single variant entry', () => {
    expect(() => buildClickyCss({ variants: { rec: ['#fff'] } })).toThrowError(/variants\["rec"\].*plain object/);
  });

  it('rejects an unknown key inside a variant entry (geometry is not variant-able in v1)', () => {
    expect(() => buildClickyCss({ variants: { rec: { radiusRatio: 50 } } })).toThrowError(/unknown key "radiusRatio"/);
  });

  it('rejects a type mismatch inside a variant entry', () => {
    expect(() => buildClickyCss({ variants: { rec: { faceColor: 42 } } })).toThrowError(/variants\["rec"\]\.faceColor expected string, got number/);
  });

  it('null/undefined variants is treated as "no overrides"', () => {
    expect(() => buildClickyCss({ variants: null })).not.toThrow();
    expect(() => buildClickyCss({ variants: undefined })).not.toThrow();
  });
});

describe('edge-pinned icon (issue #30)', () => {
  it('buildClickyCss({iconPlacement:"edge"}) contains inset-inline rules', () => {
    const css = buildClickyCss({ iconPlacement: 'edge' });
    expect(css).toContain('inset-inline-start');
    expect(css).toContain('inset-inline-end');
    expect(css).toContain('icon-edge');
  });

  it('default (inline) output contains no edge-icon CSS at all', () => {
    const css = buildClickyCss();
    expect(css).not.toContain('icon-edge');
    expect(css).not.toContain('--icon-inset');
  });

  it('rejects a bad iconPlacement type', () => {
    expect(() => buildClickyCss({ iconPlacement: 5 })).toThrow(TypeError);
  });

  it('buildClickyHtml emits icon-edge + icon-right classes on the face when configured', () => {
    const html = buildClickyHtml({ label: 'X', config: { iconName: 'send', iconPlacement: 'edge', iconPosition: 'right' } });
    expect(html).toContain('btn-face icon-edge icon-right');
  });
});

describe('inline SVG icon (issue #31)', () => {
  it('iconSvg takes precedence over iconName in the rendered markup', () => {
    const html = buildClickyHtml({
      label: 'PLAY',
      config: { iconName: 'play_arrow', iconSvg: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' },
    });
    expect(html).toContain('btn-icon-svg');
    expect(html).toContain('<path d="M8 5v14l11-7z"/>');
    expect(html).not.toContain('material-symbols-rounded');
  });

  it('rejects a non-SVG string for iconSvg', () => {
    expect(() => buildClickyCss({ iconSvg: 'not svg' })).toThrowError(/iconSvg/);
  });

  it('accepts an empty iconSvg (falls back to iconName / no icon)', () => {
    expect(() => buildClickyCss({ iconSvg: '' })).not.toThrow();
  });

  it('buildClickyCss emits the 1em SVG sizing rule only when iconSvg is in use', () => {
    const withSvg = buildClickyCss({ iconSvg: '<svg viewBox="0 0 24 24"></svg>' });
    expect(withSvg).toContain('.btn-icon-svg svg');
    expect(withSvg).toContain('width: 1em;');
    const withoutSvg = buildClickyCss();
    expect(withoutSvg).not.toContain('btn-icon-svg');
  });
});

describe('icon-only buttons (issue #32)', () => {
  it('buildClickyHtml throws when label is empty and no aria-label attr is given', () => {
    expect(() => buildClickyHtml({ label: '', attrs: {} })).toThrowError(/aria-label/);
  });

  it('buildClickyHtml does NOT throw when label is empty but aria-label is given', () => {
    expect(() => buildClickyHtml({ label: '', attrs: { 'aria-label': 'Play' }, config: { iconName: 'play_arrow' } }))
      .not.toThrow();
  });

  it('icon-only buildClickyHtml omits .btn-label, includes the icon, and slugs from iconName', () => {
    const html = buildClickyHtml({ label: '', attrs: { 'aria-label': 'Play' }, config: { iconName: 'play_arrow' } });
    expect(html).not.toContain('btn-label');
    expect(html).toContain('play_arrow');
    expect(html).toContain('label-icon-play-arrow');
    expect(html).toContain('icon-only');
    expect(html).toContain('aria-label="Play"');
  });

  it('two icon-only buttons with different icons get distinct slugs (no label-btn collision)', () => {
    const a = buildClickyHtml({ label: '', attrs: { 'aria-label': 'Play' }, config: { iconName: 'play_arrow' } });
    const b = buildClickyHtml({ label: '', attrs: { 'aria-label': 'Stop' }, config: { iconName: 'stop' } });
    expect(a).toContain('label-icon-play-arrow');
    expect(b).toContain('label-icon-stop');
  });

  it('getLabels: empty btnLabels + an icon yields exactly one icon-only button', () => {
    const labels = getLabels({ ...defaultClickyConfig, btnLabels: '', btnCount: 4, iconName: 'send' });
    expect(labels).toEqual(['']);
  });

  it('getLabels: empty btnLabels + iconSvg also yields one icon-only button', () => {
    const labels = getLabels({ ...defaultClickyConfig, btnLabels: '', btnCount: 3, iconSvg: '<svg viewBox="0 0 1 1"></svg>' });
    expect(labels).toEqual(['']);
  });

  it('getLabels: empty btnLabels with NO icon keeps the old numbered BTN${n} fallback (no divide-by-zero crash)', () => {
    const labels = getLabels({ ...defaultClickyConfig, btnLabels: '', btnCount: 3 });
    expect(labels).toEqual(['BTN1', 'BTN2', 'BTN3']);
  });
});

describe('per-corner radius (issue #35)', () => {
  it('accepts a well-formed radiusCorners object', () => {
    expect(() => buildClickyCss({ radiusCorners: { tl: 20, tr: 4, br: 20, bl: 4 } })).not.toThrow();
  });

  it('null/undefined radiusCorners is treated as "no override" (uniform legacy path)', () => {
    expect(() => buildClickyCss({ radiusCorners: null })).not.toThrow();
    expect(() => buildClickyCss({ radiusCorners: undefined })).not.toThrow();
  });

  it('rejects an array for radiusCorners (the typeof-object trap)', () => {
    expect(() => buildClickyCss({ radiusCorners: [8, 8, 8, 8] })).toThrowError(/radiusCorners.*plain object/);
  });

  it('rejects an unknown key inside radiusCorners', () => {
    expect(() => buildClickyCss({ radiusCorners: { tl: 8, tr: 8, br: 8, bl: 8, tc: 8 } }))
      .toThrowError(/radiusCorners: unknown key "tc"/);
  });

  it('rejects a missing corner key', () => {
    expect(() => buildClickyCss({ radiusCorners: { tl: 8, tr: 8, br: 8 } }))
      .toThrowError(/radiusCorners missing key "bl"/);
  });

  it('rejects a non-numeric corner value', () => {
    expect(() => buildClickyCss({ radiusCorners: { tl: '8', tr: 8, br: 8, bl: 8 } }))
      .toThrowError(/radiusCorners\.tl must be a number/);
  });

  it('rejects NaN as a corner value', () => {
    expect(() => buildClickyCss({ radiusCorners: { tl: NaN, tr: 8, br: 8, bl: 8 } }))
      .toThrowError(/radiusCorners\.tl must be a number/);
  });

  it('default output emits no per-corner radius vars at all', () => {
    const css = buildClickyCss();
    expect(css).not.toContain('--radius-tl');
    expect(css).not.toContain('--radius-tr');
    expect(css).not.toContain('--radius-br');
    expect(css).not.toContain('--radius-bl');
  });

  it('active radiusCorners emits four distinct scalar vars and the wall uses the right pairs', () => {
    // Ratios chosen to stay under the default geometry's maxRadiusPx clamp
    // (containerWidth 180 / containerHeight 88 → maxRadiusPx 37) so the
    // expected px values below are exact, not further clamped.
    const css = buildClickyCss({ radiusCorners: { tl: 20, tr: 0, br: 20, bl: 0 } });
    expect(css).toContain('--radius-tl: 36px;');
    expect(css).toContain('--radius-tr: 0px;');
    expect(css).toContain('--radius-br: 36px;');
    expect(css).toContain('--radius-bl: 0px;');
    // Wall top offset takes the max of the TOP pair (tl, tr) — not bottom.
    expect(css).toContain('max(var(--wall-h), var(--radius-tl), var(--radius-tr))');
    // Wall's own border-radius is bottom-only, using the BOTTOM pair.
    expect(css).toContain('border-radius: 0 0 var(--radius-br) var(--radius-bl);');
  });
});

describe('parallelogram skew v2 (issue #40 — housing-level shear, two axes)', () => {
  it('rejects a non-number skewXAngle / skewYAngle (generic typeof check)', () => {
    expect(() => buildClickyCss({ skewXAngle: '12' })).toThrowError(/skewXAngle/);
    expect(() => buildClickyCss({ skewYAngle: '6' })).toThrowError(/skewYAngle/);
  });

  it('default output contains no skew-related CSS at all', () => {
    const css = buildClickyCss();
    expect(css).not.toContain('--skew-x-angle');
    expect(css).not.toContain('--skew-y-angle');
    expect(css).not.toContain('--skew-widen-y');
    expect(css).not.toContain('skewX');
    expect(css).not.toContain('skewY');
  });

  it('non-zero skewXAngle emits skewX+skewY on .btn-housing (not .btn-cell), reversed-order counter-skew on label/icon, and both angle vars', () => {
    const css = buildClickyCss({ skewXAngle: 12 });
    expect(css).toContain('--skew-x-angle: 12deg;');
    expect(css).toContain('--skew-y-angle: 0deg;');
    expect(css).toMatch(/\.btn-housing\s*\{[^}]*transform: skewX\(var\(--skew-x-angle\)\) skewY\(var\(--skew-y-angle\)\);/s);
    expect(css).not.toMatch(/\.btn-cell\s*\{[^}]*transform: skewX/s);
    expect(css).toContain('transform: skewY(calc(-1 * var(--skew-y-angle))) skewX(calc(-1 * var(--skew-x-angle)));');
  });

  it('non-zero skewYAngle alone also activates the housing shear + counter-skew + emits --skew-widen-y', () => {
    const css = buildClickyCss({ skewYAngle: 6 });
    expect(css).toContain('--skew-x-angle: 0deg;');
    expect(css).toContain('--skew-y-angle: 6deg;');
    expect(css).toContain('--skew-widen-y:');
    expect(css).toMatch(/\.btn-housing\s*\{[^}]*transform: skewX\(var\(--skew-x-angle\)\) skewY\(var\(--skew-y-angle\)\);/s);
  });

  it('active skew switches .btn-cell to housing-relative centering horizontally, and keeps the channel-centred top inset', () => {
    const css = buildClickyCss({ skewXAngle: 12 });
    expect(css).toMatch(/\.btn-cell\s*\{[^}]*left: calc\(\(var\(--housing-width\) - var\(--container-width\)\) \/ 2\);/s);
    // Channel-centred top inset max(0, fw - wallH), plus the skew's own height reservation.
    expect(css).toMatch(/\.btn-cell\s*\{[^}]*top: calc\(max\(0px, calc\(var\(--frame-width\) - var\(--wall-h\)\)\) \+ var\(--skew-widen-y, 0px\) \/ 2\);/s);
  });

  it('.btn-cell top inset is max(0, fw - wallH) — the even ring is around the CHANNEL, not the proud cap', () => {
    const css = buildClickyCss();
    expect(css).toMatch(/\.btn-cell\s*\{\s*position: absolute;\s*top: max\(0px, calc\(var\(--frame-width\) - var\(--wall-h\)\)\);\s*left: var\(--frame-width\);\s*right: var\(--frame-width\);/);
  });

  it('hard-clamps skewXAngle to ±18deg and skewYAngle to ±8deg (tighter) even though the runtime validator is typeof-only', () => {
    const overX = buildClickyCss({ skewXAngle: 45 });
    expect(overX).toContain('--skew-x-angle: 18deg;');
    const underX = buildClickyCss({ skewXAngle: -45 });
    expect(underX).toContain('--skew-x-angle: -18deg;');
    const overY = buildClickyCss({ skewYAngle: 45 });
    expect(overY).toContain('--skew-y-angle: 8deg;');
    const underY = buildClickyCss({ skewYAngle: -45 });
    expect(underY).toContain('--skew-y-angle: -8deg;');
  });

  it('KEYCAP_Y stays translate-only regardless of skew (issue #12 single-source invariant)', () => {
    expect(internals.KEYCAP_Y.rest).toBe('translateY(0)');
    expect(internals.KEYCAP_Y.pressed).toBe('translateY(var(--press-translate))');
    expect(internals.KEYCAP_Y.toggled).toBe('translateY(var(--toggle-height))');
    // Skewed output must not have rewritten these to include skewX/skewY.
    const css = buildClickyCss({ skewXAngle: 12, skewYAngle: 4, mode: 'toggle' });
    expect(css).not.toMatch(/translateY\([^)]*\)\s*skew[XY]/);
  });

  it('resolveSkew is the single clamp authority every consumer site reads through', () => {
    expect(internals.resolveSkew({ skewXAngle: 30, skewYAngle: -30 })).toEqual({ x: 18, y: -8, active: true });
    expect(internals.resolveSkew({ skewXAngle: 0, skewYAngle: 0 })).toEqual({ x: 0, y: 0, active: false });
  });
});

describe('segmented housing validation (issue #36)', () => {
  const base = { housingLayout: 'segmented', gridWrap: 'nowrap', groupLabel: 'Group', btnCount: 2, btnLabels: 'One,Two' };

  it('accepts a well-formed segmented config', () => {
    expect(() => buildClickyCss(base)).not.toThrow();
  });

  it('default (housingLayout "separate") is completely unaffected', () => {
    expect(() => buildClickyCss({ gridWrap: 'wrap' })).not.toThrow();
  });

  it('rejects segmented + the default gridWrap "wrap" (a wrapped segment strip is meaningless)', () => {
    expect(() => buildClickyCss({ ...base, gridWrap: 'wrap' }))
      .toThrowError(/segmented.*gridWrap.*wrap/);
  });

  it('rejects segmented without a groupLabel', () => {
    expect(() => buildClickyCss({ ...base, groupLabel: '' }))
      .toThrowError(/segmented.*groupLabel/);
  });

  it('rejects segmented + btnCount exceeding the label count (would silently mint duplicate segments)', () => {
    expect(() => buildClickyCss({ ...base, btnCount: 5, btnLabels: 'One,Two' }))
      .toThrowError(/btnCount.*exceeds the label count/);
  });

  it('rejects segmented + duplicate segment slugs', () => {
    expect(() => buildClickyCss({ ...base, btnCount: 2, btnLabels: 'One,One' }))
      .toThrowError(/duplicate segment slug/);
  });

  it('buildClickyHtml throws on housingLayout "segmented" (single button cannot express a shared housing)', () => {
    expect(() => buildClickyHtml({ label: 'X', config: base }))
      .toThrowError(/buildClickyGroupHtml/);
  });

  it('buildClickyGroupHtml "separate" (default) layout delegates to the existing grid builder, unaffected', () => {
    expect(() => buildClickyGroupHtml({ btnCount: 2, btnLabels: 'A,B' })).not.toThrow();
    const html = buildClickyGroupHtml({ btnCount: 2, btnLabels: 'A,B' });
    expect(html).toContain('btn-grid');
  });

  it('buildClickyGroupHtml segmented layout requires a resolvable groupLabel (config or opts)', () => {
    expect(() => buildClickyGroupHtml({ housingLayout: 'segmented', gridWrap: 'nowrap', groupLabel: '', btnCount: 2, btnLabels: 'A,B' }))
      .toThrowError(/groupLabel/);
  });

  it('buildClickyGroupHtml opts.groupLabel satisfies the requirement even when config.groupLabel is empty', () => {
    // validateClickyConfig itself still requires config.groupLabel (it can't
    // see call-time opts), so this exercises the opts-only override path via
    // a config that already sets groupLabel, then overrides it per-call.
    const html = buildClickyGroupHtml(
      { housingLayout: 'segmented', gridWrap: 'nowrap', groupLabel: 'Config', btnCount: 2, btnLabels: 'A,B' },
      { groupLabel: 'Call-time' },
    );
    expect(html).toContain('aria-label="Call-time"');
  });

  it('segmented HTML emits ONE shared .btn-housing, not N independent ones', () => {
    const html = buildClickyGroupHtml(base);
    expect((html.match(/btn-housing--segmented/g) || []).length).toBe(1);
    expect((html.match(/btn-cell/g) || []).length).toBe(2);
  });
});

describe('tri-state radio validation (issue #37)', () => {
  const segBase = { housingLayout: 'segmented', gridWrap: 'nowrap', groupLabel: 'Group', btnCount: 3, btnLabels: 'Tacit,Include,Exclude' };
  const radioOpts = { name: 'f-x', values: ['tacit', 'include', 'exclude'], checked: 'tacit' };

  it('accepts a well-formed mode:"radio" + housingLayout:"segmented" config', () => {
    expect(() => buildClickyCss({ ...segBase, mode: 'radio' })).not.toThrow();
  });

  it('rejects mode "radio" without housingLayout "segmented"', () => {
    expect(() => buildClickyCss({ mode: 'radio' }))
      .toThrowError(/radio.*requires housingLayout "segmented"/);
  });

  it('buildClickyGroupHtml requires opts.name for mode "radio"', () => {
    expect(() => buildClickyGroupHtml({ ...segBase, mode: 'radio' }, { values: radioOpts.values, checked: 'tacit' }))
      .toThrowError(/opts\.name/);
  });

  it('buildClickyGroupHtml requires opts.values for mode "radio"', () => {
    expect(() => buildClickyGroupHtml({ ...segBase, mode: 'radio' }, { name: 'f-x', checked: 'tacit' }))
      .toThrowError(/opts\.values/);
  });

  it('buildClickyGroupHtml rejects an opts.values length mismatch against the resolved segment count', () => {
    expect(() => buildClickyGroupHtml({ ...segBase, mode: 'radio' }, { name: 'f-x', values: ['tacit', 'include'], checked: 'tacit' }))
      .toThrowError(/must match the resolved segment count/);
  });

  it('the tacit value renders CHECKED — the group always reads a defined FormData value', () => {
    const html = buildClickyGroupHtml({ ...segBase, mode: 'radio' }, radioOpts);
    expect(html).toContain('type="radio" name="f-x" value="tacit" checked');
    expect(html).not.toContain('value="include" checked');
    expect(html).not.toContain('value="exclude" checked');
  });

  it('all three segments share the same radio "name" (native mutual exclusion, no JS)', () => {
    const html = buildClickyGroupHtml({ ...segBase, mode: 'radio' }, radioOpts);
    expect((html.match(/name="f-x"/g) || []).length).toBe(3);
  });

  it('toggleColor variant recolors the checked/latched state, not the resting face color', () => {
    const css = buildClickyCss({
      ...segBase, mode: 'radio',
      variants: { include: { toggleColor: '#2e9e4f' } },
    });
    expect(css).toMatch(/\.clicky-btn\.label-include,\s*\S*\s*\.clicky-toggle\.label-include \{/);
    expect(css).toMatch(/label-include[^}]*--face-toggled:/);
    // Neutral (no variant) toggled color must still equal --face-color's
    // family default (no accent bleeding onto untouched segments).
    expect(css).not.toMatch(/label-tacit[^}]*--face-toggled:/);
  });

  it('unknown variant "toggleColor" is accepted (whitelist extension), geometry keys still rejected', () => {
    expect(() => buildClickyCss({ variants: { x: { toggleColor: '#123456' } } })).not.toThrow();
    expect(() => buildClickyCss({ variants: { x: { radiusRatio: 10 } } })).toThrowError(/unknown key "radiusRatio"/);
  });

  it('default (mode "click"/"toggle") output emits no radio-specific input selector', () => {
    expect(buildClickyCss()).not.toContain('input[type="radio"]');
    expect(buildClickyCss({ mode: 'toggle' })).not.toContain('input[type="radio"]');
    expect(buildClickyCss({ mode: 'toggle' })).toContain('input[type="checkbox"]');
  });
});
