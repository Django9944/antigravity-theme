import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('ASAR Patcher, Self-Updater & Desktop Installer Suite', () => {
  it('passes all cross-platform ASAR engine, updater, and sandbox installer checks', () => {
    const output = execFileSync(process.execPath, [resolve(ROOT_DIR, 'tests/test-asar-patcher.mjs')], {
      cwd: ROOT_DIR,
      encoding: 'utf8',
    });
    expect(output).toContain('[PASS]');
    expect(output).toMatch(/All \d+ tests passed!/);
  }, 30000);
});
