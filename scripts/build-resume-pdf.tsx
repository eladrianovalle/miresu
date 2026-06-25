import { promises as fs } from 'fs';
import path from 'path';
import { renderToBuffer } from '@react-pdf/renderer';
import { ResumePdfDocument } from '@/components/resume/ResumePdfDocument';
import { projectResume } from '@/lib/resume/projectResume';
import {
  getProjects,
  getIdentity,
  getSkillsTaxonomy,
  getResumeProjects,
  getEducation,
  getResumeHeader,
} from '@/lib/projects';

// Build-time resume PDF generator.
//
// Runs as a Node `tsx` script BEFORE `next build` (it is a prerequisite of both
// `build` and `build:staging`), so the emitted PDF is present in `public/` when
// Next copies it into the export. It never runs inside `next build` and makes no
// network calls — fully static-export-clean.
//
// SPIKE FINDING (run_studio_20260619_201202): @react-pdf/renderer@4.5.1 transpiles
// cleanly under this repo's tsx + module:esnext + moduleResolution:bundler + React 18
// toolchain. JSX works (no React.createElement needed). renderToBuffer is headless
// (no browser/DOM). Built-in Helvetica yields ATS-parseable text.
//
// OUTPUT PATH is deliberate: move-export.ts only basePath-prefixes the `assets|js`
// allowlist, so the PDF MUST live under public/assets/ — a path under public/resume/
// would not get prefixed and would 404 on subdirectory hosting.
const OUT_PATH = path.resolve(process.cwd(), 'public/assets/resume/resume.pdf');

async function main() {
  const [projects, identity, skills, resumeProjects, education, header] = await Promise.all([
    getProjects(),
    getIdentity(),
    getSkillsTaxonomy(),
    getResumeProjects(),
    getEducation(),
    getResumeHeader(),
  ]);

  const model = projectResume(projects, identity, {
    skills,
    projects: resumeProjects,
    education,
    header,
  });
  const buffer = await renderToBuffer(<ResumePdfDocument model={model} />);

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, buffer);
  console.log(
    `[build-resume-pdf] Wrote ${buffer.length} bytes to ${path.relative(process.cwd(), OUT_PATH)}`,
  );
}

main().catch((err) => {
  console.error('[build-resume-pdf] FAILED:', err);
  process.exit(1);
});
