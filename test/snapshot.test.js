import { describe, it, expect } from 'vitest';
import { buildClickyCss, buildClickyHtml } from '../lib/clicky-button.js';

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
