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
  it('frameBevelConic:false emits neither the ring nor its stop vars — the OFF path (the conic bevel now DEFAULTS on, so set it off explicitly)', () => {
    const css = buildClickyCss({ frameBevelConic: false });
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

// Root fixes for the v2 element tree's "reflected light must not dim on
// press" defect (epic #56 §5: #73/#74 both IN v1). Both effects currently
// share an element with `.btn-face`'s own press-darkened background-color/
// box-shadow — a real highlight cannot dim because the key moved. These
// tests would FAIL against the pre-#73/#74 implementation: the gate simply
// didn't exist, so the gradient/rim were unconditionally baked into the
// shared, co-animating rule whenever specularAlpha/the highlight were in
// use — there was no way to observe them living anywhere else.
describe('independent specular & rim light (issues #73/#74)', () => {
  // `.btn-face`'s resting rule appears more than once in the source text
  // (":root .clicky-btn .btn-face {" / ":active" / ".clicky-press" /
  // ":focus-visible" variants) — anchor on the exact resting-state opening
  // line (sharedFaceCssProps' output, the one with the animating
  // background-color) and slice to its closing brace.
  function extractRule(css, openLine) {
    const start = css.indexOf(openLine);
    expect(start, `expected to find "${openLine}" in the generated CSS`).toBeGreaterThanOrEqual(0);
    const end = css.indexOf('\n}', start);
    return css.slice(start, end);
  }

  it('#73 specularIndependent:false inlines the hotspot on .btn-face itself — the OFF path (independent specular now DEFAULTS on, so set it off explicitly)', () => {
    const css = buildClickyCss({ specularAlpha: 40, specularIndependent: false });
    const faceRule = extractRule(css, ':root .clicky-btn .btn-face {');
    expect(faceRule).toContain('radial-gradient(circle at var(--light-x) var(--light-y)');
    expect(faceRule).toContain('background-blend-mode: soft-light');
    // Same rule that also carries the press-darkened background-color.
    expect(faceRule).toContain('background-color: var(--face-color);');
  });

  it('#73 specularIndependent moves the hotspot OFF .btn-face (which still press-darkens) and onto its own .btn-face::after layer', () => {
    const css = buildClickyCss({ specularIndependent: true, specularAlpha: 40 });

    const faceRule = extractRule(css, ':root .clicky-btn .btn-face {');
    expect(faceRule).not.toContain('radial-gradient');
    expect(faceRule).not.toContain('background-blend-mode');
    // .btn-face's own background-color still press-darkens — untouched.
    expect(faceRule).toContain('background-color: var(--face-color);');

    expect(css).toContain('.btn-face::after {');
    const afterRule = extractRule(css, ':root .btn-face::after {');
    expect(afterRule).toContain('radial-gradient(circle at var(--light-x) var(--light-y)');
    // The whole point: this layer never reads the press/toggle-darkened
    // face colors, so it can never dim because the key moved.
    expect(afterRule).not.toContain('--face-pressed');
    expect(afterRule).not.toContain('--face-toggled');
    expect(afterRule).not.toContain('background-blend-mode');
  });

  it('#73 specularIndependent with specularAlpha at 0 emits neither the inline gradient nor the overlay (nothing to show)', () => {
    const css = buildClickyCss({ specularIndependent: true });
    expect(css).not.toContain('.btn-face::after');
    expect(css).not.toContain('radial-gradient');
  });

  it('#74 rimIndependent:false bakes the rim into the shared press-co-animated box-shadow stack — the OFF path (independent rim now DEFAULTS on, so set it off explicitly)', () => {
    const vars = buildClickyVars({ rimIndependent: false });
    // L3, the rim highlight, present unconditionally in BOTH the resting
    // and pressed face-shadow strings — the SAME property whose L1/L2
    // layers activate (and spatially overlay it) only while pressed.
    expect(vars['--face-shadow-resting']).toContain('rgba(255, 255, 255, 0.300)');
    expect(vars['--face-shadow-pressed']).toContain('rgba(255, 255, 255, 0.300)');
  });

  it('#74 rimIndependent neutralizes the shared-stack rim and hosts a standalone --rim-shadow on .btn-face::before instead', () => {
    const vars = buildClickyVars({ rimIndependent: true });
    // Neutralized (L0's transparent placeholder), not merely duplicated —
    // otherwise the old, still-dimming copy would remain visible alongside
    // the new independent one.
    expect(vars['--face-shadow-resting']).not.toContain('rgba(255, 255, 255');
    expect(vars['--face-shadow-pressed']).not.toContain('rgba(255, 255, 255');
    expect(vars['--rim-shadow']).toContain('rgba(255, 255, 255, 0.300)');
    // Identical geometry either way — moving it changes WHERE it lives,
    // never the highlight itself.
    expect(vars['--rim-shadow']).toContain('inset 0');

    const css = buildClickyCss({ rimIndependent: true });
    expect(css).toContain('.btn-face::before {');
    const beforeRule = extractRule(css, ':root .btn-face::before {');
    expect(beforeRule).toContain('var(--rim-shadow)');
  });

  it('#68 + #74 together: the bevel and the independent rim share ONE box-shadow property on .btn-face::before, never two competing rules', () => {
    const css = buildClickyCss({ bevelStyle: 'beveled', rimIndependent: true });
    const matches = [...css.matchAll(/:root \.btn-face::before \{/g)];
    expect(matches.length).toBe(1);
    const beforeRule = extractRule(css, ':root .btn-face::before {');
    expect(beforeRule).toContain('rgba(255, 255, 255, var(--frame-bevel-alpha))');
    expect(beforeRule).toContain('rgba(0, 0, 0, var(--frame-bevel-alpha-shadow))');
    expect(beforeRule).toContain('var(--rim-shadow)');
  });
});

// Correctness fixes ship ON (2026-07-15): these are not opt-in features, they
// are the button being correct. "off emits nothing" (D3) was a DEVELOPMENT
// discipline for landing each feature verifiably — not the shipping default.
// This guards against a silent flip-back to the broken behaviour.
describe('correctness fixes default ON', () => {
  it('the conic corner bevel, unclipped focus ring, and independent specular/rim are on by default', () => {
    expect(defaultClickyConfig.frameBevelConic, 'conic bevel (fixes the corner collision #18/#90)').toBe(true);
    expect(defaultClickyConfig.focusUnclipped, 'unclipped focus ring (fixes WCAG 2.4.7 #58)').toBe(true);
    expect(defaultClickyConfig.specularIndependent, 'specular must not dim on press #73').toBe(true);
    expect(defaultClickyConfig.rimIndependent, 'rim must not dim on press #74').toBe(true);
  });

  it('the default button emits the conic ring and the independent rim', () => {
    const css = buildClickyCss();
    expect(css).toContain('.btn-housing::after');           // conic ring on
    expect(css).toContain('conic-gradient(');
    // Rim is on by default (topHighlight), so rimIndependent takes effect:
    // the highlight lives on its own --rim-shadow, not baked into the shared
    // press-co-animated face-shadow stack.
    expect(css).toContain('--rim-shadow');
  });

  it('independent specular is on but inert until specularAlpha > 0 (no hotspot to relocate)', () => {
    // The flip is a correctness guarantee for WHEN specular is used, not a
    // visible default change: default specularAlpha is 0.
    expect(defaultClickyConfig.specularAlpha).toBe(0);
    expect(buildClickyCss()).not.toContain('.btn-face::after');
    expect(buildClickyCss({ specularAlpha: 40 })).toContain('.btn-face::after');
  });

  it('style features stay OFF by default (opt-in): glow, bevelStyle, tolerance', () => {
    const css = buildClickyCss();
    expect(css).not.toContain('--glow-shadow');
    expect(defaultClickyConfig.glowColor).toBe('');
    expect(defaultClickyConfig.bevelStyle).toBe('none');
    expect(defaultClickyConfig.faceTolerance).toBe(0);
  });
});
