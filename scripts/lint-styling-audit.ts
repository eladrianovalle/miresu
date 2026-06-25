import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

interface SectionConfig {
  id: string;
  label: string;
  required?: boolean;
}

interface AuditRow {
  section: string;
  cssSources: string;
  responsiveNotes: string;
  tests: string;
}

const repoRoot = path.resolve(__dirname, '..');
const configPath = path.join(__dirname, 'config', 'styling-sections.json');
const auditPath = path.join(repoRoot, 'docs', 'styling-audit.md');

function readConfig(): SectionConfig[] {
  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.sections)) {
    throw new Error('styling-sections.json must contain a "sections" array');
  }
  return parsed.sections as SectionConfig[];
}

function parseAudit(): AuditRow[] {
  const markdown = fs.readFileSync(auditPath, 'utf-8');
  const lines = markdown.split(/\r?\n/);
  const tableStart = lines.findIndex((line) => line.trim().startsWith('| Section'));
  if (tableStart === -1) {
    throw new Error('docs/styling-audit.md missing table header');
  }
  const rows: AuditRow[] = [];
  for (let i = tableStart + 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) {
      break;
    }
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((value) => value.trim());
    if (cells.length < 4) {
      continue;
    }
    rows.push({
      section: cells[0],
      cssSources: cells[1],
      responsiveNotes: cells[2],
      tests: cells[3],
    });
  }
  if (!rows.length) {
    throw new Error('docs/styling-audit.md table has no rows');
  }
  return rows;
}

function getChangedFiles(): string[] {
  const commands = ['git diff --name-only --cached', 'git diff --name-only'];
  const files = new Set<string>();
  for (const command of commands) {
    try {
      const output = execSync(command, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
      if (output) {
        output
          .split(/\r?\n/)
          .filter(Boolean)
          .forEach((file) => files.add(file));
      }
    } catch {
      // ignore; git command may fail if no staged changes yet
    }
  }
  return Array.from(files);
}

function ensureSectionCoverage(sections: SectionConfig[], rows: AuditRow[]): string[] {
  const errors: string[] = [];
  const rowMap = new Map<string, AuditRow>();
  rows.forEach((row) => {
    rowMap.set(row.section, row);
  });

  sections
    .filter((section) => section.required !== false)
    .forEach((section) => {
      const row = rowMap.get(section.label);
      if (!row) {
        errors.push(`Missing audit row for required section: "${section.label}"`);
        return;
      }
      if (!row.cssSources || !row.cssSources.includes('src/')) {
        errors.push(`Section "${section.label}" must include CSS references (e.g., src/styles/...)`);
      }
      if (!row.responsiveNotes) {
        errors.push(`Section "${section.label}" must include responsive notes.`);
      }
      if (!row.tests) {
        errors.push(`Section "${section.label}" must mention covering tests.`);
      }
    });

  return errors;
}

function ensureChangedFilesMapped(rows: AuditRow[]): string[] {
  const errors: string[] = [];
  const changed = getChangedFiles();
  if (!changed.length) {
    return errors;
  }
  const tracked = changed.filter((file) => file.startsWith('src/styles') || file.startsWith('src/components'));
  if (!tracked.length) {
    return errors;
  }

  const searchableRows = rows.map((row) => ({
    ...row,
    cssLower: row.cssSources.toLowerCase(),
  }));

  tracked.forEach((file) => {
    const base = path.basename(file).toLowerCase();
    const match = searchableRows.find((row) => row.cssLower.includes(base));
    if (!match) {
      errors.push(`Changed file "${file}" is not referenced in docs/styling-audit.md. Update the table.`);
    }
  });

  return errors;
}

function main() {
  const sections = readConfig();
  const rows = parseAudit();
  const errors = [
    ...ensureSectionCoverage(sections, rows),
    ...ensureChangedFilesMapped(rows),
  ];

  if (errors.length) {
    console.error('⚠️ Styling audit lint failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('✅ Styling audit looks good.');
}

main();
