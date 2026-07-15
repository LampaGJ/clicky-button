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
