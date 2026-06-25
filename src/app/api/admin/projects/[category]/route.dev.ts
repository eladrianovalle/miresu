import { NextRequest, NextResponse } from 'next/server';
import { assertDevOnly } from '@/lib/admin/dev-gate';
import { listProjectSlugs, createProject, SlugConflictError } from '@/lib/admin/file-ops';
import { isValidCategory, zodErrorResponse } from '@/lib/admin/utils';
import { ZodError } from 'zod';

/** GET: List all project slugs in a category */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string }> },
) {
  assertDevOnly();

  const { category } = await params;
  if (!isValidCategory(category)) {
    return NextResponse.json(
      { error: `Invalid category: ${category}` },
      { status: 400 },
    );
  }

  const slugs = await listProjectSlugs(category);
  return NextResponse.json({ category, slugs });
}

/** POST: Create a new project in a category */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> },
) {
  assertDevOnly();

  const { category } = await params;
  if (!isValidCategory(category)) {
    return NextResponse.json(
      { error: `Invalid category: ${category}` },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  try {
    const { validated, filePath } = await createProject(category, body);
    const slug = (validated as { slug: string }).slug;

    return NextResponse.json(
      { ok: true, slug, category, filePath },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorResponse(error);
    }
    if (error instanceof SlugConflictError) {
      return NextResponse.json(
        {
          error: 'Slug already exists',
          slug: error.slug,
          conflictCategory: error.conflictCategory,
        },
        { status: 409 },
      );
    }
    throw error;
  }
}
