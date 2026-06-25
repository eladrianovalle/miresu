import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import {
  GameProjectSchema,
  ClientProjectSchema,
  PersonalCategorySchema,
  IdentitySchema,
  ConsultingContentSchema,
  SkillsTaxonomySchema,
  ResumeProjectsSchema,
  EducationListSchema,
  ResumeHeaderSchema,
} from '@/types/project-content';

function logValid(scope: string, file: string) {
  console.log(`✔ ${scope}: ${file} valid`);
}

function logInvalid(scope: string, file: string, error: unknown) {
  console.error(`✖ ${scope}: ${file} invalid`);
  console.error(error);
  process.exitCode = 1;
}

async function readJsonFiles(dir: string) {
  const resolvedDir = path.resolve(dir);
  const files = await fs.readdir(resolvedDir);
  return Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => {
        const filePath = path.join(resolvedDir, file);
        const raw = await fs.readFile(filePath, 'utf-8');
        return { file: filePath, data: JSON.parse(raw) as unknown };
      })
  );
}

async function validateProjectDir(contentDir: string, subdir: string, schema: z.ZodType, label: string) {
  const dir = path.join(contentDir, subdir);
  let entries;
  try {
    entries = await readJsonFiles(dir);
  } catch {
    return;
  }
  entries.forEach(({ file, data }) => {
    try {
      schema.parse(data);
      logValid(label, path.relative(process.cwd(), file));
    } catch (error) {
      logInvalid(label, path.relative(process.cwd(), file), error);
    }
  });
}

async function validateSingleton(contentDir: string, filename: string, schema: z.ZodType, label: string) {
  const filePath = path.join(contentDir, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    schema.parse(JSON.parse(raw));
    logValid(label, path.relative(process.cwd(), filePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    logInvalid(label, filename, error);
  }
}

async function main() {
  const contentDir = path.resolve('src/content');
  await Promise.all([
    validateProjectDir(contentDir, 'projects/games', GameProjectSchema, 'Project/Games'),
    validateProjectDir(contentDir, 'projects/client', ClientProjectSchema, 'Project/Client'),
    validateProjectDir(contentDir, 'projects/personal', PersonalCategorySchema, 'Project/Personal'),
    validateSingleton(contentDir, 'identity.json', IdentitySchema, 'Identity'),
    validateSingleton(contentDir, 'consulting.json', ConsultingContentSchema, 'Consulting'),
    validateSingleton(contentDir, 'resume/skills.json', SkillsTaxonomySchema, 'Resume/Skills'),
    validateSingleton(contentDir, 'resume/projects.json', ResumeProjectsSchema, 'Resume/Projects'),
    validateSingleton(contentDir, 'resume/education.json', EducationListSchema, 'Resume/Education'),
    validateSingleton(contentDir, 'resume/header.json', ResumeHeaderSchema, 'Resume/Header'),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
