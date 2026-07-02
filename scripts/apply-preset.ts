/**
 * Apply a bundled theme preset by copying it over src/content/theme.json.
 *
 * Usage: npm run apply-preset <name>   (e.g. npm run apply-preset nocturne)
 *
 * Presets live in src/content/theme-presets/*.json — each is a complete theme
 * (both palettes + fonts + skin). This OVERWRITES your current theme.json, so it
 * is a demo/authoring convenience, not a merge. Restart dev or rebuild to see it;
 * `git checkout src/content/theme.json` gets the default back.
 *
 * The resolution helpers (listPresets / resolvePreset) are exported and pure so
 * the catalog tests can exercise name resolution without running the copy.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const PRESETS_DIR = path.resolve('src/content/theme-presets');
const THEME_FILE = path.resolve('src/content/theme.json');

/** The names of every bundled preset (a preset's name is its filename sans .json). */
export function listPresets(): string[] {
  return readdirSync(PRESETS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));
}

/**
 * Resolve a preset name to its JSON file path. Throws (rather than exits) on an
 * unknown name so it stays a pure, testable function; the CLI wrapper below
 * turns the throw into a friendly stderr message + non-zero exit.
 */
export function resolvePreset(name: string, available: string[]): string {
  if (!available.includes(name)) {
    throw new Error(`Unknown preset "${name}". Available: ${available.join(', ')}`);
  }
  return path.join(PRESETS_DIR, `${name}.json`);
}

function main() {
  const name = process.argv[2];
  const available = listPresets();

  if (!name) {
    console.error(`Usage: npm run apply-preset <name>\nAvailable: ${available.join(', ')}`);
    process.exit(1);
  }

  let source: string;
  try {
    source = resolvePreset(name, available);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }

  writeFileSync(THEME_FILE, readFileSync(source, 'utf-8'));
  console.log(`Applied preset "${name}" → src/content/theme.json. Restart dev or rebuild to see it.`);
}

// Only run the CLI when invoked directly (not when imported by the tests). When
// run as `tsx scripts/apply-preset.ts`, argv[1] is this file; under vitest it is
// the test runner's binary, so the copy never fires during the test import.
if (process.argv[1]?.endsWith('apply-preset.ts')) {
  main();
}
