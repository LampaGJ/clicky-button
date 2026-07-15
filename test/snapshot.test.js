import { describe, it, expect } from 'vitest';
import { buildClickyCss, buildClickyHtml, buildClickyGroupHtml } from '../lib/clicky-button.js';

describe('snapshot: buildClickyCss', () => {
  it('defaults', async () => {
    await expect(buildClickyCss()).toMatchFileSnapshot('__snapshots__/css-defaults.css');
  });

  it('toggle mode', async () => {
    await expect(buildClickyCss({ mode: 'toggle' })).toMatchFileSnapshot('__snapshots__/css-toggle.css');
  });

  it('frame disabled + explicit borderWidth', async () => {
    await expect(buildClickyCss({ frameEnabled: false, borderWidth: 2 }))
      .toMatchFileSnapshot('__snapshots__/css-no-frame-border.css');
  });

  it('scoped selector + icon + color hardening (item #3 + item #4 together, the spec headline case)', async () => {
    await expect(buildClickyCss({ iconName: 'send', faceColor: 'var(--gold)' }, { scope: '.contact-cta-host' }))
      .toMatchFileSnapshot('__snapshots__/css-scoped-icon-gold.css');
  });

  it('realism pack (specular/contact/press-darken)', async () => {
    await expect(buildClickyCss({ specularAlpha: 40, contactIntensity: 40, pressDarken: 26 }))
      .toMatchFileSnapshot('__snapshots__/css-realism-pack.css');
  });

  it('toggle + frame-off + outline focus (folds three otherwise-uncovered branches into one case)', async () => {
    await expect(buildClickyCss({ mode: 'toggle', frameEnabled: false, focusStyle: 'outline' }))
      .toMatchFileSnapshot('__snapshots__/css-toggle-no-frame-outline.css');
  });

  it('per-button variants (issue #29): color + icon family override on one slug', async () => {
    await expect(buildClickyCss({
      variants: {
        save: { faceColor: '#2e7d32', textColor: '#fff', iconName: 'save', iconColor: '#fff' },
      },
    })).toMatchFileSnapshot('__snapshots__/css-variants.css');
  });

  it('edge-pinned icon (issue #30)', async () => {
    await expect(buildClickyCss({ iconName: 'send', iconPlacement: 'edge', iconInset: 16 }))
      .toMatchFileSnapshot('__snapshots__/css-icon-edge.css');
  });

  it('inline SVG icon (issue #31)', async () => {
    await expect(buildClickyCss({ iconSvg: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>' }))
      .toMatchFileSnapshot('__snapshots__/css-icon-svg.css');
  });

  it('per-corner radius (issue #35)', async () => {
    await expect(buildClickyCss({ radiusCorners: { tl: 24, tr: 4, br: 24, bl: 4 } }))
      .toMatchFileSnapshot('__snapshots__/css-radius-corners.css');
  });

  it('parallelogram skew (issue #34)', async () => {
    await expect(buildClickyCss({ skewAngle: 12 }))
      .toMatchFileSnapshot('__snapshots__/css-skew.css');
  });

  it('per-corner radius + skew combined (issues #34 + #35)', async () => {
    await expect(buildClickyCss({
      radiusCorners: { tl: 24, tr: 4, br: 24, bl: 4 },
      skewAngle: 10,
    })).toMatchFileSnapshot('__snapshots__/css-radius-skew-combined.css');
  });

  it('conic-gradient corner bevel (issue #18) — non-square default housing, stop angles aspect/radius-correct', async () => {
    await expect(buildClickyCss({ frameBevelConic: true }))
      .toMatchFileSnapshot('__snapshots__/css-frame-bevel-conic.css');
  });
});

describe('snapshot: buildClickyHtml', () => {
  it('click mode', async () => {
    await expect(buildClickyHtml({ label: 'PLAY' })).toMatchFileSnapshot('__snapshots__/html-click.html');
  });

  it('toggle mode', async () => {
    await expect(buildClickyHtml({ label: 'PLAY', config: { mode: 'toggle' } }))
      .toMatchFileSnapshot('__snapshots__/html-toggle.html');
  });

  it('inline SVG icon, precedence over iconName (issue #31)', async () => {
    await expect(buildClickyHtml({
      label: 'PLAY',
      config: { iconName: 'play_arrow', iconSvg: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' },
    })).toMatchFileSnapshot('__snapshots__/html-icon-svg.html');
  });
});

describe('snapshot: segmented housing (issue #36)', () => {
  const segmentedConfig = {
    housingLayout: 'segmented',
    gridWrap: 'nowrap',      // segmented rejects the default 'wrap' — see validation.test.js
    groupLabel: 'View mode',
    btnCount: 3,
    btnLabels: 'One,Two,Three',
  };

  it('CSS: 3-way segmented group (outer corners real, inner squared, housing-shadow swap dropped)', async () => {
    await expect(buildClickyCss(segmentedConfig)).toMatchFileSnapshot('__snapshots__/css-segmented.css');
  });

  it('HTML: 3-way segmented group via the public buildClickyGroupHtml', async () => {
    await expect(buildClickyGroupHtml(segmentedConfig)).toMatchFileSnapshot('__snapshots__/html-segmented.html');
  });
});

describe('snapshot: tri-state radio (issue #37, slicer-dev-v1 example)', () => {
  // tacit-include / include-only / exclude-any-with, per the pinned design:
  // tacit is neutral (no accent), include gets a positive-green latch accent,
  // exclude gets a negative-red latch accent — both accents ride the
  // extended toggleColor variant (issue #37), never a literal one-off color.
  const triStateConfig = {
    housingLayout: 'segmented',
    mode: 'radio',
    gridWrap: 'nowrap',
    groupLabel: 'Sci-fi',
    btnCount: 3,
    btnLabels: 'Tacit,Include,Exclude',
    variants: {
      include: { toggleColor: '#2e9e4f' },
      exclude: { toggleColor: '#c0392b' },
    },
  };
  const triStateOpts = { name: 'f-scifi', values: ['tacit', 'include', 'exclude'], checked: 'tacit' };

  it('CSS: tacit (neutral) / include (positive) / exclude (negative) accents', async () => {
    await expect(buildClickyCss(triStateConfig)).toMatchFileSnapshot('__snapshots__/css-tristate.css');
  });

  it('HTML: 3-radio group with the tacit value pre-checked (FormData contract)', async () => {
    await expect(buildClickyGroupHtml(triStateConfig, triStateOpts))
      .toMatchFileSnapshot('__snapshots__/html-tristate.html');
  });
});
