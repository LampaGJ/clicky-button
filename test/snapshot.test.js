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
});

describe('snapshot: buildClickyHtml', () => {
  it('click mode', async () => {
    await expect(buildClickyHtml({ label: 'PLAY' })).toMatchFileSnapshot('__snapshots__/html-click.html');
  });

  it('toggle mode', async () => {
    await expect(buildClickyHtml({ label: 'PLAY', config: { mode: 'toggle' } }))
      .toMatchFileSnapshot('__snapshots__/html-toggle.html');
  });
});
