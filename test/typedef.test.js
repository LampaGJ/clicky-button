import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { defaultClickyConfig } from '../lib/clicky-button.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const libSource = readFileSync(join(__dirname, '../lib/clicky-button.js'), 'utf8');

function parseTypedefKeys(source) {
  const typedefMatch = source.match(/@typedef \{object\} ClickyConfig([\s\S]*?)\*\//);
  if (!typedefMatch) throw new Error('ClickyConfig @typedef block not found');
  const body = typedefMatch[1];
  const keys = [];
  const re = /@property\s+\{[^}]*\}\s+([A-Za-z0-9_]+)/g;
  let m;
  while ((m = re.exec(body))) keys.push(m[1]);
  return keys;
}

describe('typedef sync (issue #24)', () => {
  it('every defaultClickyConfig key is documented in the typedef', () => {
    const typedefKeys = new Set(parseTypedefKeys(libSource));
    const missing = Object.keys(defaultClickyConfig).filter(k => !typedefKeys.has(k));
    expect(missing).toEqual([]);
  });

  it('the typedef has no ghost keys not present in defaultClickyConfig', () => {
    const typedefKeys = parseTypedefKeys(libSource);
    const realKeys = new Set(Object.keys(defaultClickyConfig));
    const ghosts = typedefKeys.filter(k => !realKeys.has(k));
    expect(ghosts).toEqual([]);
  });

  it('lib/clicky-button.js contains no stale "drop-shadow copy" comment', () => {
    expect(libSource).not.toContain('drop-shadow copy');
  });

  it('no stray channelHeight ghost reference in lib/', () => {
    expect(libSource).not.toContain('channelHeight');
  });
});
