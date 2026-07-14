import { describe, it, expect } from 'vitest';
import {
  buildClickyCss,
  buildClickyHtml,
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
