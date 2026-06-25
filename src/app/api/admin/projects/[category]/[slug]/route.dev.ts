import { NextRequest, NextResponse } from 'next/server';
import { assertDevOnly } from '@/lib/admin/dev-gate';
import { readProject, updateProject } from '@/lib/admin/file-ops';
import { isValidCategory, isFileNotFound, zodErrorResponse } from '@/lib/admin/utils';
import { ZodError } from 'zod';

type RouteParams = { params: Promise<{ category: string; slug: string }> };

/** GET: Read a single project */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  assertDevOnly();

  const { category, slug } = await params;
  if (!isValidCategory(category)) {
    return NextResponse.json({ error: `Invalid category: ${category}` }, { status: 400 });
  }

  try {
    const result = await readProject(category, slug);
    return NextResponse.json({
      data: result.data,
      filePath: result.filePath,
      category: result.category,
    });
  } catch (error) {
    if (isFileNotFound(error)) {
      return NextResponse.json(
        { error: 'Project not found', slug, category },
        { status: 404 },
      );
    }
    throw error;
  }
}

/** PUT: Update an existing project */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  assertDevOnly();

  const { category, slug } = await params;
  if (!isValidCategory(category)) {
    return NextResponse.json({ error: `Invalid category: ${category}` }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    await updateProject(category, slug, body);
    return NextResponse.json({ ok: true, slug, category });
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorResponse(error);
    }
    if (isFileNotFound(error)) {
      return NextResponse.json(
        { error: 'Project not found', slug, category },
        { status: 404 },
      );
    }
    throw error;
  }
}
