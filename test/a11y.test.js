import { describe, it, expect } from 'vitest';
import { buildClickyGroupHtml } from '../lib/clicky-button.js';

// Group markup + aria semantics for segmented housings (issue #36) and
// tri-state radio groups (issue #37) — per the critic's pinned semantics:
// role="group"/"radiogroup" + aria-label on .btn-housing, NOT <fieldset>
// (default border/min-inline-size fights the pixel geometry); per-segment
// accessible names come free from the existing label-wrapped markup.

describe('a11y: segmented housing group semantics (issue #36)', () => {
  const base = { housingLayout: 'segmented', gridWrap: 'nowrap', groupLabel: 'View mode', btnCount: 3, btnLabels: 'One,Two,Three' };

  it('the shared housing carries role="group" + aria-label from groupLabel', () => {
    const html = buildClickyGroupHtml(base);
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="View mode"');
  });

  it('is NOT a <fieldset> (pinned: default border/min-inline-size fights the pixel geometry)', () => {
    const html = buildClickyGroupHtml(base);
    expect(html).not.toContain('<fieldset');
  });

  it('outer segments carry seg-first/seg-last hooks; the middle segment carries neither', () => {
    const html = buildClickyGroupHtml(base);
    expect(html).toContain('btn-cell seg-first');
    expect(html).toContain('btn-cell seg-last');
    // Segment "Two" (the middle one) must render with a bare btn-cell class.
    expect(html).toMatch(/<div class="btn-cell"><button[^>]*label-two/);
  });

  it('exactly N-1 dividers sit strictly between adjacent segments', () => {
    const html = buildClickyGroupHtml(base);
    expect((html.match(/btn-divider/g) || []).length).toBe(2);
  });

  it('per-segment accessible name comes from the button/label text, same as today (click mode)', () => {
    const html = buildClickyGroupHtml(base);
    expect(html).toContain('>One<');
    expect(html).toContain('>Two<');
    expect(html).toContain('>Three<');
  });

  it('toggle-mode segmented group wraps each segment in a labeled .clicky-toggle (accessible name via label text)', () => {
    const html = buildClickyGroupHtml({ ...base, mode: 'toggle' });
    expect(html).toContain('<label class="clicky-toggle label-one">');
    expect(html).toContain('<label class="clicky-toggle label-two">');
    expect(html).toContain('<label class="clicky-toggle label-three">');
    expect(html).toContain('<input type="checkbox">');
  });
});

describe('a11y: tri-state radio group semantics (issue #37)', () => {
  const triStateConfig = {
    housingLayout: 'segmented', mode: 'radio', gridWrap: 'nowrap',
    groupLabel: 'Sci-fi', btnCount: 3, btnLabels: 'Tacit,Include,Exclude',
  };
  const opts = { name: 'f-scifi', values: ['tacit', 'include', 'exclude'], checked: 'tacit' };

  it('the shared housing carries role="radiogroup" + aria-label', () => {
    const html = buildClickyGroupHtml(triStateConfig, opts);
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Sci-fi"');
  });

  it('every segment shares one radio-group name (native Tab-stop + arrow-key grouping, no JS)', () => {
    const html = buildClickyGroupHtml(triStateConfig, opts);
    expect((html.match(/name="f-scifi"/g) || []).length).toBe(3);
  });

  it('each radio is wrapped in its own labeled .clicky-toggle (accessible name via label text, per segment)', () => {
    const html = buildClickyGroupHtml(triStateConfig, opts);
    expect(html).toContain('<label class="clicky-toggle label-tacit">');
    expect(html).toContain('<label class="clicky-toggle label-include">');
    expect(html).toContain('<label class="clicky-toggle label-exclude">');
  });

  it('the tacit segment renders CHECKED at load — a defined Tab-stop and FormData value from the start', () => {
    const html = buildClickyGroupHtml(triStateConfig, opts);
    expect(html).toMatch(/label class="clicky-toggle label-tacit">\s*<input type="radio" name="f-scifi" value="tacit" checked>/);
  });

  it('non-tacit segments render as plain unchecked radios (no checked attribute)', () => {
    const html = buildClickyGroupHtml(triStateConfig, opts);
    expect(html).toMatch(/value="include">/);
    expect(html).toMatch(/value="exclude">/);
  });
});
