#!/usr/bin/env node
/**
 * Validates locale JSON files: en is the source of truth.
 * Fails if any non-en locale is missing keys that exist in en.
 * Optional: warns on extra keys in non-en (keys not in en).
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '..', 'src', 'i18n', 'locales');

const failOnExtra = process.argv.includes('--strict');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function main() {
  const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));
  const enPath = join(LOCALES_DIR, 'en.json');
  const en = loadJson(enPath);
  const enKeys = new Set(Object.keys(en));

  let failed = false;

  for (const file of files) {
    if (file === 'en.json') continue;
    const path = join(LOCALES_DIR, file);
    const pack = loadJson(path);
    const packKeys = new Set(Object.keys(pack));

    const missing = [...enKeys].filter((k) => !packKeys.has(k));
    if (missing.length > 0) {
      console.error(`[ERROR] ${file}: missing ${missing.length} key(s): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
      failed = true;
    }

    if (failOnExtra) {
      const extra = [...packKeys].filter((k) => !enKeys.has(k));
      if (extra.length > 0) {
        console.warn(`[WARN] ${file}: extra key(s) not in en: ${extra.slice(0, 10).join(', ')}${extra.length > 10 ? '...' : ''}`);
      }
    }
  }

  if (failed) {
    process.exit(1);
  }
  console.log('Locale validation passed.');
}

main();
