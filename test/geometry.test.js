import { describe, it, expect } from 'vitest';
import { buildClickyVars, internals } from '../lib/clicky-button.js';

const { clampRadiusCorners } = internals;

describe('per-corner radius adjacent-sum clamp (issue #35)', () => {
  it('leaves corners untouched when no edge sum exceeds the box', () => {
    const [tl, tr, br, bl] = clampRadiusCorners(10, 10, 10, 10, 100, 50);
    expect([tl, tr, br, bl]).toEqual([10, 10, 10, 10]);
  });

  it('proportionally shrinks ALL four corners when one edge sum overflows (CSS border-radius spec algorithm)', () => {
    // Top edge (tl+tr) = 120 > width 100 → f = 100/120 = 0.8333...; every
    // corner (not just tl/tr) is scaled by that same factor, matching how a
    // real browser clamps border-radius live.
    const width = 100, height = 200;
    const [tl, tr, br, bl] = clampRadiusCorners(60, 60, 10, 10, width, height);
    const f = width / 120;
    expect(tl).toBeCloseTo(60 * f, 6);
    expect(tr).toBeCloseTo(60 * f, 6);
    expect(br).toBeCloseTo(10 * f, 6);
    expect(bl).toBeCloseTo(10 * f, 6);
    // The clamped pair must land exactly on the edge length, not merely under it.
    expect(tl + tr).toBeCloseTo(width, 6);
  });

  it('picks the SMALLEST scale factor across all four edges when several overflow at once', () => {
    // width=100: top(tl+tr)=140 → f=100/140≈0.714; bottom(bl+br)=100 → f=1.
    // height=60: left(tl+bl)=110 → f=60/110≈0.545; right(tr+br)=90 → f=60/90≈0.667.
    // The binding constraint is the left edge (smallest f) — every corner
    // scales by IT, not by whichever edge each individual corner touches.
    const [tl, tr, br, bl] = clampRadiusCorners(70, 70, 30, 40, 100, 60);
    const f = 60 / 110;
    expect(tl).toBeCloseTo(70 * f, 6);
    expect(tr).toBeCloseTo(70 * f, 6);
    expect(br).toBeCloseTo(30 * f, 6);
    expect(bl).toBeCloseTo(40 * f, 6);
  });

  it('buildClickyVars applies the clamp end-to-end: adjacent px sums never exceed the box', () => {
    // Two corners each requesting the full half-width would overflow the top
    // edge if taken at face value — the generation-time wall math (which
    // reads --radius-tl/--radius-tr directly, not a live CSS calc) must see
    // the ALREADY-shrunk values, or the wall silhouette would desync from
    // the cap the browser actually renders.
    const vars = buildClickyVars({
      containerWidth: 200,
      containerHeight: 100,
      radiusCorners: { tl: 100, tr: 100, br: 0, bl: 0 }, // 100% ratio each — deliberately extreme
    });
    const tl = parseFloat(vars['--radius-tl']);
    const tr = parseFloat(vars['--radius-tr']);
    const br = parseFloat(vars['--radius-br']);
    const bl = parseFloat(vars['--radius-bl']);
    expect(tl + tr).toBeLessThanOrEqual(200 + 1); // +1 rounding slack
    expect(bl + br).toBeLessThanOrEqual(200 + 1);
    expect(tl + bl).toBeLessThanOrEqual(100 + 1);
    expect(tr + br).toBeLessThanOrEqual(100 + 1);
    // tl and tr were requested equal, so they must still be equal post-shrink.
    expect(tl).toBe(tr);
  });
});

describe('parallelogram skew geometry (issue #34)', () => {
  it('default (skewAngle 0) widens the housing by nothing', () => {
    const vars = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false });
    // frameless ⇒ housing-width === container-width when there's no skew.
    expect(vars['--housing-width']).toBe('180px');
  });

  it('non-zero skewAngle widens --housing-width by containerHeight * tan(angle)', () => {
    const containerWidth = 180, containerHeight = 88, skewAngle = 12;
    const vars = buildClickyVars({ containerWidth, containerHeight, frameEnabled: false, skewAngle });
    const expectedWiden = Math.ceil(containerHeight * Math.abs(Math.tan(skewAngle * Math.PI / 180)));
    expect(vars['--housing-width']).toBe(`${containerWidth + expectedWiden}px`);
  });

  it('skewAngle is hard-clamped to ±18deg in the actual geometry, not just validated', () => {
    const vars = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false, skewAngle: 60 });
    const expectedWiden = Math.ceil(88 * Math.abs(Math.tan(18 * Math.PI / 180)));
    expect(vars['--housing-width']).toBe(`${180 + expectedWiden}px`);
  });

  it('negative skewAngle widens the housing by the same magnitude as its positive counterpart', () => {
    const pos = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false, skewAngle: 15 });
    const neg = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false, skewAngle: -15 });
    expect(neg['--housing-width']).toBe(pos['--housing-width']);
  });
});
