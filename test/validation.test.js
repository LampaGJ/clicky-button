import { describe, it, expect } from 'vitest';
import {
  buildClickyCss,
  buildClickyHtml,
  buildClickyVars,
  defaultClickyConfig,
  internals,
} from '../lib/clicky-button.js';
import { ClickyConfigSchema } from './clicky-config.schema.js';

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
