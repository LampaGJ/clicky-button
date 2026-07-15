import { describe, it, expect } from 'vitest';
import { buildClickyVars, buildClickyCss, defaultClickyConfig } from '../lib/clicky-button.js';

// WCAG relative luminance for a #rrggbb hex.
function luminance(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe('depth illusion invariants', () => {
  it('frameless: cavity (occluded slot) is darker than the button wall', () => {
    // Dark rubber-style face — the case that shipped inverted (gallery Matte/Deep).
    const dark = buildClickyVars({ frameEnabled: false, faceColor: '#3f4142' });
    expect(luminance(dark['--cavity-wall-color']))
      .toBeLessThan(luminance(dark['--button-wall-color']));

    // Light frameless face — invariant must hold universally.
    const light = buildClickyVars({ frameEnabled: false, faceColor: '#e6e6ea' });
    expect(luminance(light['--cavity-wall-color']))
      .toBeLessThan(luminance(light['--button-wall-color']));
  });

  it('framed: cavity keeps the chrome frameColor fallback', () => {
    const vars = buildClickyVars({ frameEnabled: true });
    expect(vars['--cavity-wall-color']).toBe(defaultClickyConfig.frameColor);
  });

  it('explicit cavity color always wins', () => {
    const vars = buildClickyVars({ frameEnabled: false, useCavityWallColor: true, cavityWallColor: '#123456' });
    expect(vars['--cavity-wall-color']).toBe('#123456');
  });

  it('wall is a true extrusion: square top hidden behind the cap, radius only on the bottom', () => {
    // These declarations exist only in the .btn-wall definition block.
    const css = buildClickyCss();
    expect(css).toContain('border-radius: 0 0 var(--radius) var(--radius);');
    expect(css).toContain('top: calc(max(var(--wall-h), var(--radius)) + var(--hover-lift));');
    expect(css).toContain('height: calc(100% - max(var(--wall-h), var(--radius)));');
  });
});

describe('conic-gradient corner bevel (issue #18)', () => {
  it('default (frameBevelConic: false) emits neither the ring nor its stop vars — byte-identical to pre-#18 (D3)', () => {
    const css = buildClickyCss();
    expect(css).not.toContain('.btn-housing::after');
    expect(css).not.toContain('--frame-bevel-conic');
    expect(css).not.toContain('conic-gradient');
    // The straight-edge inset bevel is still there, unchanged.
    expect(css).toContain('inset 0 var(--frame-bevel-width) 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha))');
  });

  it('frameBevelConic: true replaces (not augments) the straight-edge insets with the ring', () => {
    const css = buildClickyCss({ frameBevelConic: true });
    expect(css).toContain('.btn-housing::after');
    expect(css).toContain('conic-gradient(');
    expect(css).toContain('var(--frame-bevel-conic-tr-start)');
    expect(css).toContain('var(--frame-bevel-conic-tr-end)');
    expect(css).toContain('var(--frame-bevel-conic-bl-start)');
    expect(css).toContain('var(--frame-bevel-conic-bl-end)');
    expect(css).toContain('mask-composite: exclude');
    // Replace, not augment — the old four-line straight inset bevel must be gone.
    expect(css).not.toContain('inset 0 var(--frame-bevel-width) 0 0 rgba(255, 255, 255, var(--frame-bevel-alpha))');
    // The ring is unconditional — it must NOT be re-declared inside the
    // pressed :has() block (no pressed-state counterpart needed — see
    // buildGridCss's conicBevel comment).
    const pressedBlockMatch = css.match(/\.btn-housing:has\(\.clicky-btn:active\)[\s\S]*?\n\}/);
    expect(pressedBlockMatch).not.toBeNull();
    expect(pressedBlockMatch[0]).not.toContain('conic-gradient');
  });

  it('frameEnabled: false suppresses the ring even when frameBevelConic is true (frame off ⇒ no chrome to bevel)', () => {
    const css = buildClickyCss({ frameEnabled: false, frameBevelConic: true });
    expect(css).not.toContain('.btn-housing::after');
    expect(css).not.toContain('conic-gradient(');
  });

  it('the ring uses var(--radius-bot) — the SAME chrome radius var .btn-housing itself uses — never a duplicated/hardcoded radius', () => {
    const css = buildClickyCss({ frameBevelConic: true });
    const ringBlock = css.match(/\.btn-housing::after \{[\s\S]*?\n\}/)[0];
    expect(ringBlock).toContain('border-radius: var(--radius-bot);');
  });
});
