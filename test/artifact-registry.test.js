import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileManifest, serialize, MANIFEST_PATH } from '../scripts/gen-artifact-registry.mjs';

// The schema/artifact-registry staleness + gap-tracking gate (issue #88).
//
// This is the CI-blocking half of the "--check" pattern: it recompiles the
// manifest from LIVE source (TSDoc tags + the running engine's own CSS var/
// HTML/keyframe output) and byte-compares it against the committed
// reports/artifact-registry.json. A v2 producer (new element, new CSS var,
// new keyframe, new export) that arrives without its @displayName/
// @strategicPurpose/@tacticalObjective annotation — or a stale, un-
// regenerated manifest — fails this test, exactly the enforcement issue
// #88 asks for.
describe('artifact registry (issue #88)', () => {
  it('the committed manifest is byte-identical to a fresh compile (staleness gate)', async () => {
    const manifest = await compileManifest();
    const fresh = serialize(manifest);
    const onDisk = readFileSync(MANIFEST_PATH, 'utf8');
    expect(onDisk).toBe(fresh);
  });

  it('every discovered producer is annotated — 100% coverage, zero gaps', async () => {
    const manifest = await compileManifest();
    expect(manifest.coverage.missingKeys).toEqual([]);
    expect(manifest.coverage.undeclaredProducers).toEqual([]);
    expect(manifest.coverage.coveragePct).toBe(100);
  });

  it('no stale sidecar entries (annotated but no longer live in the engine)', async () => {
    const manifest = await compileManifest();
    expect(manifest.coverage.staleAnnotations.cssVarGroupEntriesNotLiveAnyMore).toEqual([]);
    expect(manifest.coverage.staleAnnotations.keyframeGroupEntriesNotLiveAnyMore).toEqual([]);
  });

  it('the manifest carries a missingKeys key (gap-tracking is always visible, never omitted)', async () => {
    const manifest = await compileManifest();
    expect(manifest.coverage).toHaveProperty('missingKeys');
    expect(Array.isArray(manifest.coverage.missingKeys)).toBe(true);
  });

  it('a fresh compile is deterministic (no wall-clock / ordering flap)', async () => {
    const a = serialize(await compileManifest());
    const b = serialize(await compileManifest());
    expect(a).toBe(b);
    expect(a).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/); // no ISO timestamp
  });

  it('covers every required artifact category with a non-zero producer count', async () => {
    const manifest = await compileManifest();
    const counts = manifest.producerTypeCounts;
    expect(counts.schema).toBeGreaterThan(0); // config-contract + api entry points
    expect(counts['column-blob']).toBeGreaterThan(0); // css-var-groups
    expect(counts.event).toBeGreaterThan(0); // dom-elements + keyframe-groups
    expect(counts['file-artifact']).toBeGreaterThan(0); // export bundle
  });
});
