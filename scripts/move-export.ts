import { promises as fs } from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('out');
const STAGING_DIR = path.resolve('dist-staging');
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, '') ?? '';
const PREFIXABLE_FOLDERS = ['assets', 'js'];
const PROCESSABLE_EXTENSIONS = new Set(['.html', '.css', '.js', '.txt']);

async function removeDir(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

async function moveExport() {
  const outExists = await fs
    .stat(OUT_DIR)
    .then(() => true)
    .catch(() => false);

  if (!outExists) {
    throw new Error('Expected Next.js export output in ./out, but directory was not found.');
  }

  await removeDir(STAGING_DIR);
  await fs.rename(OUT_DIR, STAGING_DIR);
  console.log(`Moved static export to ${path.relative(process.cwd(), STAGING_DIR)}`);
  if (BASE_PATH) {
    await prefixStaticPaths(STAGING_DIR, BASE_PATH);
  } else {
    console.log('NEXT_PUBLIC_BASE_PATH not set; skipping static path prefixing.');
  }
}

function shouldProcess(filePath: string) {
  return PROCESSABLE_EXTENSIONS.has(path.extname(filePath));
}

function prefixContent(content: string, basePath: string) {
  const pattern = new RegExp(`(["'(=])\/(${PREFIXABLE_FOLDERS.join('|')})\/`, 'g');
  return content.replace(pattern, (_, prefix: string, folder: string) => `${prefix}${basePath}/${folder}/`);
}

async function prefixStaticPaths(targetDir: string, basePath: string) {
  const filesToProcess: string[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (shouldProcess(fullPath)) {
          filesToProcess.push(fullPath);
        }
      }),
    );
  }

  await walk(targetDir);

  let updatedCount = 0;
  await Promise.all(
    filesToProcess.map(async (filePath) => {
      const original = await fs.readFile(filePath, 'utf8');
      const prefixed = prefixContent(original, basePath);
      if (prefixed !== original) {
        await fs.writeFile(filePath, prefixed, 'utf8');
        updatedCount += 1;
      }
    }),
  );

  console.log(`Prefixed static asset paths in ${updatedCount} file${updatedCount === 1 ? '' : 's'} using base path "${basePath}".`);
}

moveExport().catch((error) => {
  console.error(error);
  process.exit(1);
});
