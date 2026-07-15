import { describe, it, expect } from 'vitest';
import { buildClickyVars, buildClickyCss, internals } from '../lib/clicky-button.js';

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

describe('parallelogram skew v2 geometry (issue #40 — housing-level shear, both axes + cross-term)', () => {
  const tan = deg => Math.tan(deg * Math.PI / 180);

  it('default (both axes 0) widens the housing by nothing on either axis', () => {
    const vars = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false });
    // frameless ⇒ housing-width === container-width, housing-height ===
    // container-height, when there's no skew.
    expect(vars['--housing-width']).toBe('180px');
    expect(vars['--housing-height']).toBe('88px');
  });

  it('X-only skew widens --housing-width by H0 * tan(x); H0 = containerHeight + frameWidth', () => {
    const containerWidth = 180, containerHeight = 88, skewXAngle = 12;
    const vars = buildClickyVars({ containerWidth, containerHeight, frameEnabled: false, skewXAngle });
    const H0 = containerHeight; // frameless ⇒ fw === 0 ⇒ H0 === containerHeight
    const expectedWidenX = Math.ceil(H0 * Math.abs(tan(skewXAngle)));
    expect(vars['--housing-width']).toBe(`${containerWidth + expectedWidenX}px`);
    // No Y skew ⇒ no height widen.
    expect(vars['--housing-height']).toBe(`${containerHeight}px`);
  });

  it('Y-only skew widens --housing-height by W0 * tan(y); W0 = containerWidth + 2*frameWidth', () => {
    const containerWidth = 180, containerHeight = 88, skewYAngle = 6;
    const vars = buildClickyVars({ containerWidth, containerHeight, frameEnabled: false, skewYAngle });
    const W0 = containerWidth; // frameless ⇒ fw === 0 ⇒ W0 === containerWidth
    const expectedWidenY = Math.ceil(W0 * Math.abs(tan(skewYAngle)));
    expect(vars['--housing-height']).toBe(`${containerHeight + expectedWidenY}px`);
    // No X skew, but the cross-term (tanX * tanY) is 0 too when tanX === 0,
    // so no width widen either.
    expect(vars['--housing-width']).toBe(`${containerWidth}px`);
  });

  it('combined X+Y skew adds the cross-term (W0 * |tanX * tanY|) to the X widen', () => {
    const containerWidth = 180, containerHeight = 88, skewXAngle = 8, skewYAngle = 4;
    const fw = 14; // default frameWidth, frameEnabled default true
    const vars = buildClickyVars({ containerWidth, containerHeight, skewXAngle, skewYAngle });
    const W0 = containerWidth + 2 * fw;
    const H0 = containerHeight + fw;
    const expectedWidenX = Math.ceil(H0 * Math.abs(tan(skewXAngle)) + W0 * Math.abs(tan(skewXAngle) * tan(skewYAngle)));
    const expectedWidenY = Math.ceil(W0 * Math.abs(tan(skewYAngle)));
    expect(vars['--housing-width']).toBe(`${W0 + expectedWidenX}px`);
    expect(vars['--housing-height']).toBe(`${H0 + expectedWidenY}px`);
  });

  it('skewXAngle is hard-clamped to ±18deg in the actual geometry, not just validated', () => {
    const vars = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false, skewXAngle: 60 });
    const expectedWiden = Math.ceil(88 * Math.abs(tan(18)));
    expect(vars['--housing-width']).toBe(`${180 + expectedWiden}px`);
  });

  it('skewYAngle is hard-clamped to ±8deg (tighter than X) in the actual geometry, not just validated', () => {
    const vars = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false, skewYAngle: 60 });
    const expectedWiden = Math.ceil(180 * Math.abs(tan(8)));
    expect(vars['--housing-height']).toBe(`${88 + expectedWiden}px`);
  });

  it('negative skewXAngle widens the housing by the same magnitude as its positive counterpart', () => {
    const pos = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false, skewXAngle: 15 });
    const neg = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false, skewXAngle: -15 });
    expect(neg['--housing-width']).toBe(pos['--housing-width']);
  });

  it('negative skewYAngle widens the housing by the same magnitude as its positive counterpart', () => {
    const pos = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false, skewYAngle: 6 });
    const neg = buildClickyVars({ containerWidth: 180, containerHeight: 88, frameEnabled: false, skewYAngle: -6 });
    expect(neg['--housing-height']).toBe(pos['--housing-height']);
  });

  it('--skew-widen-y is only emitted when the Y widen is non-zero', () => {
    const xOnly = buildClickyVars({ containerWidth: 180, containerHeight: 88, skewXAngle: 12 });
    expect('--skew-widen-y' in xOnly).toBe(false);
    const withY = buildClickyVars({ containerWidth: 180, containerHeight: 88, skewYAngle: 6 });
    expect('--skew-widen-y' in withY).toBe(true);
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

describe('equal ring + flush-gated reveal (owner invariants)', () => {
  const px = s => parseFloat(s);

  // The ring is judged around the CHANNEL with the key pressed flush — not
  // around the resting key, which stands proud and covers the top chrome.
  it('ring is equal top and bottom at the flush position, for every wall/frame combination', () => {
    const cases = [
      { label: 'wall === frame',   cfg: {} },
      { label: 'shallow wall',     cfg: { wallHRatio: 4 } },
      { label: 'thick frame',      cfg: { frameWidth: 30 } },
      { label: 'tall button',      cfg: { containerHeight: 200, frameWidth: 40 } },
    ];
    for (const { label, cfg } of cases) {
      const v = buildClickyVars(cfg);
      const fw = px(v['--frame-width']);
      const wallH = px(v['--wall-h']);
      const faceH = px(v['--container-height']) - wallH;
      const H = px(v['--housing-height']);
      const cellTop = Math.max(0, fw - wallH);           // .btn-cell top
      const faceTopAtFlush = cellTop + wallH;            // descended one wall height
      const topRing = faceTopAtFlush;
      const botRing = H - (faceTopAtFlush + faceH);
      expect(topRing, `${label}: top ring`).toBeCloseTo(botRing, 5);
      expect(topRing, `${label}: ring === frame width`).toBeCloseTo(fw, 5);
    }
  });

  // A wall deeper than the frame rises higher than the plate's ring; it must
  // still never be clipped by the housing (cell top floors at 0).
  it('a proud key never clips: the cell never starts above the housing', () => {
    for (const wallHRatio of [4, 16, 30, 40]) {
      const v = buildClickyVars({ wallHRatio });
      const fw = px(v['--frame-width']);
      const wallH = px(v['--wall-h']);
      expect(Math.max(0, fw - wallH)).toBeGreaterThanOrEqual(0);
      // Housing always accommodates the whole keycap plus the bottom ring.
      const H = px(v['--housing-height']);
      expect(H).toBeGreaterThanOrEqual(Math.max(0, fw - wallH) + px(v['--container-height']));
    }
  });

  // The recess may not exist until the key's own wall is fully swallowed.
  it('recess shadow is gated on flush: it waits out the descent, then ramps', () => {
    // Press twice the wall ⇒ flush at exactly half the travel.
    const v = buildClickyVars({ wallHRatio: 16, pressDepthRatio: 32 });
    expect(v['--shadow-flush-frac']).toBe('0.500');
    expect(v['--shadow-press-delay']).toContain('0.500');
    // Deep frameless key: wall swallowed only in the last eighth of travel.
    const deep = buildClickyVars({ wallHRatio: 40, pressDepthRatio: 45, frameEnabled: false });
    expect(deep['--shadow-flush-frac']).toBe('0.875');
  });

  it('a key that stops at flush is never recessed — pressed shadow === resting shadow', () => {
    // press depth === wall height ⇒ the face never goes below the plate.
    const v = buildClickyVars({ wallHRatio: 16, pressDepthRatio: 16 });
    expect(v['--shadow-flush-frac']).toBe('1.000');
    expect(v['--face-shadow-pressed']).toBe(v['--face-shadow-resting']);
  });

  it('cavity top sits one wall-height below the resting face, so nothing leaks in before flush', () => {
    const css = buildClickyCss();
    expect(css).toMatch(/\.btn-cell::before\s*\{[^}]*top: var\(--wall-h\);/s);
    expect(css).not.toMatch(/\.btn-cell::before\s*\{[^}]*top: var\(--frame-width\);/s);
  });

  it('shadow keyframes hold resting until flush and clear it on the way back up', () => {
    const css = buildClickyCss({ wallHRatio: 16, pressDepthRatio: 32 });
    const kf = css.match(/@keyframes clicky-shadow-cycle[^{]*\{[\s\S]*?\n\}/)[0];
    const [, flushDown] = kf.match(/0%, ([\d.]+)% \{ box-shadow: var\(--face-shadow-resting\)/);
    const [, bottom]    = kf.match(/([\d.]+)%\s+\{ box-shadow: var\(--face-shadow-pressed\)/);
    const [, flushUp]   = kf.match(/([\d.]+)%, 100% \{ box-shadow: var\(--face-shadow-resting\)/);
    expect(parseFloat(flushDown)).toBeGreaterThan(0);
    expect(parseFloat(flushDown)).toBeLessThan(parseFloat(bottom));
    expect(parseFloat(flushUp)).toBeGreaterThan(parseFloat(bottom));
    // Asymmetric by construction: the wait going down != the wait coming up.
    expect(parseFloat(bottom) - parseFloat(flushDown))
      .not.toBeCloseTo(parseFloat(flushUp) - parseFloat(bottom), 1);
  });
});

describe('deep-wall exception (wall deeper than the frame ring)', () => {
  const px = s => parseFloat(s);

  // A key whose wall exceeds the frame width rises higher than the plate's
  // ring, so it cannot sit inside an even fw ring — the honest projection is
  // a top ring of wallH. Documented, and still never clipped.
  it('keeps the bottom ring at frame width and never clips the taller key', () => {
    const v = buildClickyVars({ wallHRatio: 40, frameWidth: 10 });   // wall 35 > fw 10
    const fw = px(v['--frame-width']);
    const wallH = px(v['--wall-h']);
    const faceH = px(v['--container-height']) - wallH;
    const H = px(v['--housing-height']);
    expect(wallH).toBeGreaterThan(fw);
    expect(H).toBe(Math.max(fw, wallH) + faceH + fw);
    const cellTop = Math.max(0, fw - wallH);
    expect(cellTop).toBe(0);                                          // no clipping
    const faceTopAtFlush = cellTop + wallH;
    expect(H - (faceTopAtFlush + faceH)).toBeCloseTo(fw, 5);          // bottom ring === fw
  });
});
