import { describe, it, expect } from 'vitest';
import * as mod from '../lib/clicky-button.js';
import { buildClickyCss, buildClickyHtml, buildClickyVars, internals } from '../lib/clicky-button.js';

describe('smoke: DOM-less environment', () => {
  it('runs with no document/window globals', () => {
    expect(typeof document).toBe('undefined');
    expect(typeof window).toBe('undefined');
  });
});

describe('smoke: public API', () => {
  it('imports and exposes the documented surface', () => {
    expect(mod.buildClickyCss).toBeTypeOf('function');
    expect(mod.buildClickyHtml).toBeTypeOf('function');
    expect(mod.buildClickyVars).toBeTypeOf('function');
    expect(mod.defaultClickyConfig).toBeTypeOf('object');
    expect(mod.internals).toBeTypeOf('object');
  });

  it('buildClickyCss() returns non-empty CSS with structural selectors, no NaN', () => {
    const css = buildClickyCss();
    expect(css.length).toBeGreaterThan(0);
    expect(css).toContain('.btn-grid');
    expect(css).toContain('.btn-housing');
    expect(css).toContain('.clicky-btn');
    expect(css).not.toContain('NaN');
  });

  it('buildClickyCss({mode:"toggle"}) returns non-empty CSS', () => {
    expect(buildClickyCss({ mode: 'toggle' }).length).toBeGreaterThan(0);
  });

  it('buildClickyHtml returns markup containing the label', () => {
    expect(buildClickyHtml({ label: 'PLAY' })).toContain('PLAY');
  });

  it('buildClickyVars() returns a non-empty custom-property map', () => {
    expect(Object.keys(buildClickyVars()).length).toBeGreaterThan(0);
  });

  it('internals exposes pressedStatePropsCss', () => {
    expect(internals.pressedStatePropsCss).toBeTypeOf('function');
  });
});
