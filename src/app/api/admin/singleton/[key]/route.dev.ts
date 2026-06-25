import { NextRequest, NextResponse } from 'next/server';
import { assertDevOnly } from '@/lib/admin/dev-gate';
import { readSingleton, updateSingleton } from '@/lib/admin/file-ops';
import { isSingletonKey } from '@/lib/admin/schemas';
import { zodErrorResponse } from '@/lib/admin/utils';
import { ZodError } from 'zod';

// Generic singleton read/write, keyed by the registry. Any singleton registered
// in CONTENT_TYPES (other than the bespoke consulting/identity routes) is served
// here — adding a singleton needs no new route file.

/** GET: read a singleton's content. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  assertDevOnly();

  const { key } = await params;
  if (!isSingletonKey(key)) {
    return NextResponse.json({ error: `Unknown singleton: ${key}` }, { status: 404 });
  }

  try {
    const result = await readSingleton(key);
    return NextResponse.json({ data: result.data, filePath: result.filePath });
  } catch {
    return NextResponse.json({ error: `Failed to read ${key}` }, { status: 500 });
  }
}

/** PUT: validate + atomically write a singleton's content. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  assertDevOnly();

  const { key } = await params;
  if (!isSingletonKey(key)) {
    return NextResponse.json({ error: `Unknown singleton: ${key}` }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    await updateSingleton(key, body);
    return NextResponse.json({ ok: true, type: key });
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorResponse(error);
    }
    throw error;
  }
}
