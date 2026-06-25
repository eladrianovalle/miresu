import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PROJECT_CATEGORIES, type ProjectCategoryKey } from './schemas';

/** Convert a dotted path like "storeLinks.0.url" to a readable label like "Url" */
export function pathToLabel(path: string): string {
  const last = path.split('.').pop() ?? path;
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/** Type-guard for valid project category keys */
export function isValidCategory(cat: string): cat is ProjectCategoryKey {
  return PROJECT_CATEGORIES.includes(cat as ProjectCategoryKey);
}

/** Build a standard 400 response from a ZodError */
export function zodErrorResponse(error: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      issues: error.issues.map((i) => ({
        path: i.path,
        message: i.message,
        code: i.code,
      })),
    },
    { status: 400 },
  );
}

/** Check if an unknown error is an ENOENT (file not found) */
export function isFileNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}
