import { describe, it, expect } from 'vitest';
import { buildClickyVars, internals } from '../lib/clicky-button.js';

const { clampRadiusCorners, computeFrameBevelConicStops } = internals;

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

describe('conic-gradient corner bevel stop math (issue #18)', () => {
  it('square housing, small radius: transitions land symmetrically around 45deg/225deg', () => {
    const { trStart, trEnd, blStart, blEnd } = computeFrameBevelConicStops(200, 200, 5);
    expect(trStart).toBeLessThan(45);
    expect(trEnd).toBeGreaterThan(45);
    expect((trStart + trEnd) / 2).toBeCloseTo(45, 6);
    expect(blStart).toBeCloseTo(trStart + 180, 9);
    expect(blEnd).toBeCloseTo(trEnd + 180, 9);
  });

  it('zero chrome radius collapses the ramp to a single hard-cut angle (parity with the old straight-edge seam)', () => {
    const stops = computeFrameBevelConicStops(200, 200, 0);
    expect(stops.trStart).toBe(45);
    expect(stops.trEnd).toBe(45);
    expect(stops.blStart).toBe(225);
    expect(stops.blEnd).toBe(225);
  });

  it('radius equal to the smaller half-dimension (stadium/pill shape) widens the ramp to the full quadrant', () => {
    // 200x100 housing, r = 50 = half the height: the right "edge" run is
    // fully consumed by rounding, so the top-right ramp spans the entire
    // 0-90deg quadrant with no flat black run in between.
    const stops = computeFrameBevelConicStops(200, 100, 50);
    expect(stops.trStart).toBeCloseTo(45, 6);
    expect(stops.trEnd).toBeCloseTo(90, 6);
  });

  it('non-square housing: ramp is NOT centered on 45deg (the exact bug #18 exists to fix)', () => {
    // Wide housing (w=104,h=51 half-extents) skews the ramp toward the
    // narrower (height) axis — asserting it's provably NOT the naive
    // fixed-degree placement a square-only implementation would hardcode.
    const stops = computeFrameBevelConicStops(208, 102, 25);
    const mid = (stops.trStart + stops.trEnd) / 2;
    expect(mid).not.toBeCloseTo(45, 0);
    expect(stops.trStart).toBeLessThan(stops.trEnd);
  });

  it('stop order is always ascending and stays within its quadrant (valid conic-gradient stop list)', () => {
    for (const [w, h, r] of [[400, 80, 10], [80, 400, 10], [150, 150, 0], [150, 150, 75], [321, 97, 33]]) {
      const { trStart, trEnd, blStart, blEnd } = computeFrameBevelConicStops(w, h, r);
      expect(trStart).toBeGreaterThanOrEqual(0);
      expect(trStart).toBeLessThanOrEqual(trEnd);
      expect(trEnd).toBeLessThanOrEqual(90);
      expect(blStart).toBeGreaterThanOrEqual(180);
      expect(blStart).toBeLessThanOrEqual(blEnd);
      expect(blEnd).toBeLessThanOrEqual(270);
    }
  });

  it('buildClickyVars only emits --frame-bevel-conic-* vars when frameBevelConic is true (byte-stable default — D3)', () => {
    const off = buildClickyVars();
    expect('--frame-bevel-conic-tr-start' in off).toBe(false);
    expect('--frame-bevel-conic-tr-end' in off).toBe(false);
    expect('--frame-bevel-conic-bl-start' in off).toBe(false);
    expect('--frame-bevel-conic-bl-end' in off).toBe(false);

    const on = buildClickyVars({ frameBevelConic: true });
    const expected = computeFrameBevelConicStops(
      parseFloat(on['--housing-width']),
      parseFloat(on['--housing-height']),
      parseFloat(on['--radius-bot']),
    );
    expect(parseFloat(on['--frame-bevel-conic-tr-start'])).toBeCloseTo(expected.trStart, 1);
    expect(parseFloat(on['--frame-bevel-conic-tr-end'])).toBeCloseTo(expected.trEnd, 1);
    expect(parseFloat(on['--frame-bevel-conic-bl-start'])).toBeCloseTo(expected.blStart, 1);
    expect(parseFloat(on['--frame-bevel-conic-bl-end'])).toBeCloseTo(expected.blEnd, 1);
    expect(on['--frame-bevel-conic-tr-start'].endsWith('deg')).toBe(true);
  });
});
