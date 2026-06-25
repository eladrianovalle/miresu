import { promises as fs } from 'fs';
import path from 'path';
import {
  getProjects,
  getIdentity,
  getSkillsTaxonomy,
  getResumeProjects,
  getEducation,
  getResumeHeader,
} from '@/lib/projects';
import { projectResume } from '@/lib/resume/projectResume';
import { toJsonResume } from '@/lib/resume/jsonResume';

// Build-time JSON Resume export. Runs alongside build-resume-pdf before
// `next build` so the artifact is present when Next copies public/ into the
// export. No network calls; pure projection — static-export-clean.
//
// OUTPUT PATH mirrors the PDF: it MUST live under public/assets/ so
// move-export.ts basePath-prefixes it (the assets|js allowlist) for
// subdirectory hosting.
const OUT_PATH = path.resolve(process.cwd(), 'public/assets/resume/resume.json');

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

  const jsonResume = toJsonResume(model);
  const json = JSON.stringify(jsonResume, null, 2) + '\n';

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, json, 'utf-8');

  console.log(`[build-resume-json] Wrote ${json.length} bytes to ${OUT_PATH}`);
}

main();
