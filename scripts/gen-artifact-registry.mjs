#!/usr/bin/env node
'use strict';

/**
 * Schema/artifact registry compiler for clicky-button (issue #88).
 *
 * Rolls up every data-artifact producer in this CSS-generation engine —
 * the config contract, the CSS custom-property map, the emitted DOM
 * elements, the animation keyframes, the public API surface, and the
 * export bundle — into ONE deterministic JSON manifest, cross-checked
 * against the LIVE, running engine (never hand-counted), so a v2 element
 * that shows up in generated output without a co-located annotation is a
 * visible, gate-failing gap instead of a silent omission.
 *
 * Sources of truth (read FROM, never written TO by this script):
 *   - lib/clicky-button.js            — TSDoc tags via the TypeScript
 *                                        Compiler API (ts.getJSDocTags),
 *                                        parsed as plain JS (ScriptKind.JS)
 *   - lib/clicky-button-enhancer.js   — same
 *   - app.js                          — same (downloadZip only)
 *   - scripts/artifact-annotations.mjs — the hand-maintained sidecar for
 *                                         producers with no standalone
 *                                         declaration (elements/var-groups/
 *                                         keyframe-groups/export-bundle)
 *   - the RUNNING engine (dynamic import of lib/clicky-button.js) — for
 *     shape/value introspection: which CSS vars, HTML classes, and
 *     @keyframes names actually exist right now.
 *
 * Usage:
 *   node scripts/gen-artifact-registry.mjs             # writes the manifest
 *   node scripts/gen-artifact-registry.mjs --check      # exits 1 on drift,
 *                                                        # never writes
 *
 * Determinism: every collection (object keys, arrays) is sorted before
 * serialization; every file path is relative to the repo root; no
 * wall-clock timestamp, random id, or machine path is ever embedded — a
 * fresh compile of unchanged source byte-equals the committed manifest.
 */

import * as ts from 'typescript';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ELEMENT_ANNOTATIONS,
  ELEMENT_EXCLUDE_EXACT,
  ELEMENT_EXCLUDE_PATTERNS,
  CSS_VAR_GROUPS,
  KEYFRAME_GROUPS,
  EXPORT_BUNDLE_ANNOTATIONS,
} from './artifact-annotations.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const rel = p => p.split(ROOT + '/').join('');

const LIB_PATH = join(ROOT, 'lib/clicky-button.js');
const ENHANCER_PATH = join(ROOT, 'lib/clicky-button-enhancer.js');
const APP_PATH = join(ROOT, 'app.js');
const MANIFEST_PATH = join(ROOT, 'reports/artifact-registry.json');

const REQUIRED_TAGS = ['displayName', 'strategicPurpose', 'tacticalObjective'];

// ── 1. TSDoc tag extraction (TS Compiler API, plain JS) ──────────────────

/**
 * Parses a JS source file and returns, for every top-level named
 * declaration (function declaration or `const NAME = ...` statement),
 * whatever TSDoc tags are attached directly above it — plus the same for
 * every name listed in a top-level `export { a, b, c };` declaration.
 */
function extractTags(sourceText, fileName) {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const byName = new Map(); // name -> { tags: {tagName: text}, line }
  const exportedNames = [];

  for (const stmt of sourceFile.statements) {
    let name;
    if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      name = stmt.name.text;
    } else if (ts.isVariableStatement(stmt) && stmt.declarationList.declarations.length === 1) {
      const decl = stmt.declarationList.declarations[0];
      if (ts.isIdentifier(decl.name)) name = decl.name.text;
    } else if (ts.isExportDeclaration(stmt) && stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
      for (const el of stmt.exportClause.elements) exportedNames.push(el.name.text);
      continue;
    }
    if (!name) continue;

    const tagNodes = ts.getJSDocTags(stmt);
    const tags = {};
    for (const t of tagNodes) {
      const text = ts.getTextOfJSDocComment(t.comment);
      // Collapse the JSDoc tag's line-wrapped source (each continuation
      // line carries its own leading `*`-comment indentation) into single
      // spaces — the manifest is meant to be read as prose, not as
      // reflowed source text.
      if (text !== undefined) tags[t.tagName.text] = text.replace(/\s+/g, ' ').trim();
    }
    const { line } = sourceFile.getLineAndCharacterOfPosition(stmt.getStart(sourceFile));
    byName.set(name, { tags, line: line + 1 });
  }

  return { byName, exportedNames };
}

function tagSummary(entry, id, sourceFile) {
  const tags = entry ? entry.tags : {};
  const missing = REQUIRED_TAGS.filter(t => !tags[t]);
  return {
    id,
    sourceFile,
    sourceLine: entry ? entry.line : null,
    displayName: tags.displayName || null,
    strategicPurpose: tags.strategicPurpose || null,
    tacticalObjective: tags.tacticalObjective || null,
    annotated: missing.length === 0,
    missingTags: missing,
  };
}

// ── 2. Live-engine discovery (shape/value introspection) ─────────────────

const REPRESENTATIVE_VAR_CONFIGS = [
  {},
  { radiusCorners: { tl: 1, tr: 1, br: 1, bl: 1 } },
  { skewXAngle: 5, skewYAngle: 3 },
  { housingLayout: 'segmented', groupLabel: 'g', gridWrap: 'nowrap' },
  { iconPlacement: 'edge' },
  { frameEnabled: true, frameBevelConic: true },
  { frameEnabled: false },
];

async function discoverCssVarKeys(lib) {
  const keys = new Set();
  for (const cfg of REPRESENTATIVE_VAR_CONFIGS) {
    for (const k of Object.keys(lib.buildClickyVars(cfg))) keys.add(k);
  }
  return keys;
}

function collectClassesFromHtml(html, into) {
  const re = /class="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    for (const c of m[1].split(/\s+/)) if (c) into.add(c);
  }
}

async function discoverHtmlClasses(lib) {
  const classes = new Set();
  collectClassesFromHtml(lib.buildClickyHtml({ label: 'Play' }), classes);
  collectClassesFromHtml(lib.buildClickyHtml({ label: '', attrs: { 'aria-label': 'x' }, config: { iconName: 'send' } }), classes);
  collectClassesFromHtml(lib.buildClickyHtml({ label: 'Play', config: { mode: 'toggle' } }), classes);
  collectClassesFromHtml(lib.buildClickyHtml({ label: '', attrs: { 'aria-label': 'x' }, config: { iconPlacement: 'edge', iconName: 'send', iconPosition: 'right' } }), classes);
  collectClassesFromHtml(lib.buildClickyHtml({ label: 'Play', config: { iconSvg: '<svg></svg>' } }), classes);
  collectClassesFromHtml(lib.buildClickyGroupHtml({}), classes);
  collectClassesFromHtml(
    lib.buildClickyGroupHtml({ housingLayout: 'segmented', groupLabel: 'g', gridWrap: 'nowrap', mode: 'toggle' }),
    classes
  );
  collectClassesFromHtml(
    lib.buildClickyGroupHtml(
      { housingLayout: 'segmented', groupLabel: 'g', gridWrap: 'nowrap', mode: 'radio' },
      { name: 'n', values: ['a', 'b', 'c', 'd'], checked: 'a' }
    ),
    classes
  );
  return classes;
}

function isExcludedClass(cls) {
  if (ELEMENT_EXCLUDE_EXACT.has(cls)) return true;
  return ELEMENT_EXCLUDE_PATTERNS.some(re => re.test(cls));
}

async function discoverCavity(lib) {
  const css = lib.internals.buildGridCss({ ...lib.defaultClickyConfig });
  return css.includes('.btn-cell::before');
}

function discoverKeyframeNames(libSource) {
  // Anchored to the START of a (trimmed) line so prose comments that merely
  // MENTION "@keyframes" (e.g. "// @keyframes name with a deterministic
  // hash...") are never mistaken for a real at-rule — every actual
  // @keyframes definition in this file opens flush at the start of its own
  // line, per the same one-rule-per-line convention scopeCssBlock's header
  // comment documents and depends on.
  const names = new Set();
  const re = /^@keyframes\s+([\w-]+)/;
  for (const line of libSource.split('\n')) {
    const m = re.exec(line.trim());
    if (m) names.add(m[1]);
  }
  return names;
}

// ── 3. Compile ─────────────────────────────────────────────────────────

async function compileManifest() {
  const libSource = readFileSync(LIB_PATH, 'utf8');
  const enhancerSource = readFileSync(ENHANCER_PATH, 'utf8');
  const appSource = readFileSync(APP_PATH, 'utf8');

  const libTags = extractTags(libSource, 'clicky-button.js');
  const enhancerTags = extractTags(enhancerSource, 'clicky-button-enhancer.js');
  const appTags = extractTags(appSource, 'app.js');

  const lib = await import(pathToFileURL(LIB_PATH).href);

  const discoveredVars = await discoverCssVarKeys(lib);
  const discoveredClasses = await discoverHtmlClasses(lib);
  const hasCavity = await discoverCavity(lib);
  const discoveredKeyframes = discoverKeyframeNames(libSource);

  // ── config contract ──
  const configContract = {
    ...tagSummary(libTags.byName.get('defaultClickyConfig'), 'config-contract:default-clicky-config', rel(LIB_PATH)),
    keyCount: Object.keys(lib.defaultClickyConfig).length,
    typedefRef: `${rel(LIB_PATH)} — the \`@typedef {object} ClickyConfig\` block (per-key docs live there, not duplicated here)`,
    keySyncTest: rel(join(ROOT, 'test/typedef.test.js')),
    richerContractRef: rel(join(ROOT, 'test/clicky-config.schema.js')),
  };

  // ── public API entry points (auto-discovered from the real `export {}` lists) ──
  const libApiNames = libTags.exportedNames.filter(n => n !== 'defaultClickyConfig');
  const enhancerApiNames = ['enhanceClickyButtons', 'clickyEnhancerJs'];
  // SHADOW_EASING_PRESS and SHADOW_EASING_RELEASE are documented together —
  // the tag block sits above SHADOW_EASING_PRESS only (see lib/clicky-button.js).
  const tagAliases = { SHADOW_EASING_RELEASE: 'SHADOW_EASING_PRESS' };

  const apiEntryPoints = {};
  for (const name of libApiNames) {
    const entry = libTags.byName.get(tagAliases[name] || name);
    const id = `api:${name}`;
    apiEntryPoints[id] = tagSummary(entry, id, rel(LIB_PATH));
  }
  for (const name of enhancerApiNames) {
    const entry = enhancerTags.byName.get(name);
    const id = `api:${name}`;
    apiEntryPoints[id] = tagSummary(entry, id, rel(ENHANCER_PATH));
  }

  // ── export bundle ──
  const exportBundle = {};
  for (const [id, def] of Object.entries(EXPORT_BUNDLE_ANNOTATIONS)) {
    const entry = appTags.byName.get('downloadZip');
    exportBundle[id] = {
      ...tagSummary(entry, id, rel(APP_PATH)),
      producedBy: def.producedBy,
    };
  }

  // ── CSS custom-property groups (cross-checked against the live var map) ──
  const groupedVars = new Set();
  const cssVarGroups = {};
  for (const [groupId, def] of Object.entries(CSS_VAR_GROUPS)) {
    const id = `css-var-group:${groupId}`;
    def.vars.forEach(v => groupedVars.add(v));
    const missingTags = REQUIRED_TAGS.filter(t => !def[t]);
    cssVarGroups[id] = {
      id,
      vars: [...def.vars].sort(),
      displayName: def.displayName || null,
      strategicPurpose: def.strategicPurpose || null,
      tacticalObjective: def.tacticalObjective || null,
      annotated: missingTags.length === 0,
      missingTags,
    };
  }
  const orphanedVars = [...discoveredVars].filter(v => !groupedVars.has(v)).sort();
  const staleVarGroupEntries = [...groupedVars].filter(v => !discoveredVars.has(v)).sort();

  // ── DOM elements (cross-checked against live HTML/CSS discovery) ──
  const domElements = {};
  for (const [elId, def] of Object.entries(ELEMENT_ANNOTATIONS)) {
    const id = `element:${elId}`;
    const discovered = def.selector.endsWith('::before')
      ? hasCavity
      : discoveredClasses.has(def.selector);
    const missingTags = REQUIRED_TAGS.filter(t => !def[t]);
    domElements[id] = {
      id,
      selector: def.selector,
      producedBy: def.producedBy,
      displayName: def.displayName || null,
      strategicPurpose: def.strategicPurpose || null,
      tacticalObjective: def.tacticalObjective || null,
      discovered,
      annotated: missingTags.length === 0,
      missingTags,
    };
  }
  const annotatedSelectors = new Set(Object.values(ELEMENT_ANNOTATIONS).map(d => d.selector));
  const orphanedElements = [...discoveredClasses]
    .filter(c => !isExcludedClass(c) && !annotatedSelectors.has(c))
    .sort();
  if (!annotatedSelectors.has('btn-cell::before') && hasCavity) orphanedElements.push('btn-cell::before');

  // ── keyframe groups (cross-checked against the raw source's @keyframes names) ──
  const groupedKeyframes = new Set();
  const keyframeGroups = {};
  for (const [kfId, def] of Object.entries(KEYFRAME_GROUPS)) {
    const id = `keyframe-group:${kfId}`;
    def.names.forEach(n => groupedKeyframes.add(n));
    const missingTags = REQUIRED_TAGS.filter(t => !def[t]);
    keyframeGroups[id] = {
      id,
      names: [...def.names].sort(),
      producedBy: def.producedBy,
      displayName: def.displayName || null,
      strategicPurpose: def.strategicPurpose || null,
      tacticalObjective: def.tacticalObjective || null,
      annotated: missingTags.length === 0,
      missingTags,
    };
  }
  const orphanedKeyframes = [...discoveredKeyframes].filter(n => !groupedKeyframes.has(n)).sort();
  const staleKeyframeGroupEntries = [...groupedKeyframes].filter(n => !discoveredKeyframes.has(n)).sort();

  // ── supplementary: internal builder functions (co-location evidence only —
  //    NOT counted toward coverage/missingKeys; the required categories are
  //    config-contract / api-entry-point / css-var-group / dom-element /
  //    keyframe-group / export-bundle) ──
  const INTERNAL_BUILDERS = [
    'buildVarMap', 'buildGridCss', 'buildButtonWallCss',
    'buildClickFaceCss', 'buildToggleFaceCss', 'sharedFaceCssProps',
  ];
  const internalBuilderAnnotations = {};
  for (const name of INTERNAL_BUILDERS) {
    internalBuilderAnnotations[name] = tagSummary(libTags.byName.get(name), `builder:${name}`, rel(LIB_PATH));
  }

  // ── gap tracking (union of every required category) ──
  const allRequired = {
    ...{ 'config-contract:default-clicky-config': configContract },
    ...apiEntryPoints,
    ...exportBundle,
    ...cssVarGroups,
    ...domElements,
    ...keyframeGroups,
  };
  const requiredIds = Object.keys(allRequired).sort();
  const missingKeys = requiredIds.filter(id => !allRequired[id].annotated);
  // Elements/vars/keyframes discovered live but with no sidecar entry at all
  // (the case a v2 element MUST trigger) — always gap-tracked, never
  // silently dropped, even though they have no id yet to check `.annotated`.
  const undeclaredProducers = [
    ...orphanedVars.map(v => `undeclared-css-var:${v}`),
    ...orphanedElements.map(e => `undeclared-element:${e}`),
    ...orphanedKeyframes.map(k => `undeclared-keyframe:${k}`),
  ].sort();

  const totalRequired = requiredIds.length;
  const totalAnnotated = requiredIds.filter(id => allRequired[id].annotated).length;
  const coveragePct = totalRequired === 0 ? 100 : Math.round((totalAnnotated / totalRequired) * 10000) / 100;

  const producerTypeCounts = {
    schema: 1 + Object.keys(apiEntryPoints).length, // config-contract + api entry points
    'column-blob': Object.keys(cssVarGroups).length, // CSS custom-property groups
    event: Object.keys(domElements).length + Object.keys(keyframeGroups).length, // DOM/keyframe emissions
    'file-artifact': Object.keys(exportBundle).length, // export ZIP
    'db-row': 0,
    'subprocess-handoff': 0,
  };

  const manifest = {
    manifestVersion: 1,
    project: 'clicky-button',
    note:
      'Auto-generated by scripts/gen-artifact-registry.mjs — DO NOT HAND-EDIT. ' +
      'Regenerate with `npm run gen:artifact-registry`; verify with ' +
      '`npm run audit:artifact-registry` (exits 1 on drift from source).',
    typeTaxonomy: {
      description:
        'This project has no DB/EventBus/subprocess pipeline — it is a ' +
        'CSS-generation engine. Producer kinds are mapped onto the ' +
        'standard db-row/file-artifact/event/subprocess-handoff/' +
        'column-blob/schema vocabulary as: config-contract & ' +
        'api-entry-point -> schema; css-var-group -> column-blob (a flat ' +
        'computed value map); dom-element & keyframe-group -> event (an ' +
        'emission the browser ingests at render/animation time); ' +
        'export-bundle -> file-artifact (files written to a downloaded ' +
        '.zip). db-row and subprocess-handoff are genuinely absent from ' +
        'this project (no database, no cross-process handoff).',
    },
    coverage: {
      totalRequiredProducers: totalRequired,
      annotatedProducers: totalAnnotated,
      coveragePct,
      missingKeys,
      undeclaredProducers,
      staleAnnotations: {
        cssVarGroupEntriesNotLiveAnyMore: staleVarGroupEntries,
        keyframeGroupEntriesNotLiveAnyMore: staleKeyframeGroupEntries,
      },
    },
    producerTypeCounts,
    producers: {
      'config-contract:default-clicky-config': configContract,
      ...sortObjectKeys(apiEntryPoints),
      ...sortObjectKeys(exportBundle),
      ...sortObjectKeys(cssVarGroups),
      ...sortObjectKeys(domElements),
      ...sortObjectKeys(keyframeGroups),
    },
    supplementary: {
      note:
        'Co-location evidence for the internal CSS-rule builder functions ' +
        '(the "annotate the builder/rule that emits it" instruction) — ' +
        'NOT counted toward coverage/missingKeys above; element/var-group/' +
        'keyframe-group entries carry the authoritative per-artifact tags.',
      internalBuilderAnnotations: sortObjectKeys(internalBuilderAnnotations),
    },
  };

  return manifest;
}

function sortObjectKeys(obj) {
  const out = {};
  for (const k of Object.keys(obj).sort()) out[k] = obj[k];
  return out;
}

function serialize(manifest) {
  return JSON.stringify(manifest, null, 2) + '\n';
}

// ── 4. CLI ────────────────────────────────────────────────────────────

async function main() {
  const check = process.argv.includes('--check');
  const manifest = await compileManifest();
  const fresh = serialize(manifest);

  if (check) {
    if (!existsSync(MANIFEST_PATH)) {
      console.error(`FAIL: ${rel(MANIFEST_PATH)} does not exist — run \`npm run gen:artifact-registry\` first.`);
      process.exitCode = 1;
      return;
    }
    const onDisk = readFileSync(MANIFEST_PATH, 'utf8');
    if (onDisk !== fresh) {
      console.error(`FAIL: ${rel(MANIFEST_PATH)} is stale — a fresh compile differs from the committed manifest.`);
      console.error('Run `npm run gen:artifact-registry` and commit the result.');
      process.exitCode = 1;
      return;
    }
    console.log(`OK: ${rel(MANIFEST_PATH)} is up to date. Coverage: ${manifest.coverage.coveragePct}% (${manifest.coverage.annotatedProducers}/${manifest.coverage.totalRequiredProducers}).`);
    return;
  }

  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, fresh);
  console.log(`Wrote ${rel(MANIFEST_PATH)}. Coverage: ${manifest.coverage.coveragePct}% (${manifest.coverage.annotatedProducers}/${manifest.coverage.totalRequiredProducers}).`);
  if (manifest.coverage.missingKeys.length) {
    console.log('missingKeys:', manifest.coverage.missingKeys.join(', '));
  }
}

export { compileManifest, serialize, MANIFEST_PATH };

// Only run the CLI when this file is executed directly (not when imported
// by the Vitest staleness gate).
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().then(() => process.exit(process.exitCode || 0));
}
