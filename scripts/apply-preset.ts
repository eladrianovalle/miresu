/**
 * Apply a bundled theme preset by copying it over src/content/theme.json.
 *
 * Usage: npm run theme:preset <name>   (e.g. npm run theme:preset nocturne)
 *
 * Presets live in src/content/theme-presets/*.json — each is a complete theme
 * (both palettes + fonts). This overwrites your current theme.json, so it is a
 * demo/authoring convenience, not a merge. Rebuild (or restart dev) to see it.
 */
import { promises as fs } from 'fs';
import path from 'path';

const PRESETS_DIR = path.resolve('src/content/theme-presets');
const THEME_FILE = path.resolve('src/content/theme.json');

async function listPresets(): Promise<string[]> {
  const files = await fs.readdir(PRESETS_DIR);
  return files.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
}

async function main() {
  const name = process.argv[2];
  const available = await listPresets();

  if (!name) {
    console.error(`Usage: npm run theme:preset <name>\nAvailable: ${available.join(', ')}`);
    process.exit(1);
  }

  if (!available.includes(name)) {
    console.error(`Unknown preset "${name}".\nAvailable: ${available.join(', ')}`);
    process.exit(1);
  }

  const preset = await fs.readFile(path.join(PRESETS_DIR, `${name}.json`), 'utf-8');
  await fs.writeFile(THEME_FILE, preset);
  console.log(`Applied preset "${name}" → src/content/theme.json. Rebuild or restart dev to see it.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
