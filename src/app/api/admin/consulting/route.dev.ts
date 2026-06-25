import { NextRequest, NextResponse } from 'next/server';
import { assertDevOnly } from '@/lib/admin/dev-gate';
import { readSingleton, updateSingleton } from '@/lib/admin/file-ops';
import { zodErrorResponse } from '@/lib/admin/utils';
import { ZodError } from 'zod';

export async function GET() {
  assertDevOnly();

  try {
    const result = await readSingleton('consulting');
    return NextResponse.json({ data: result.data, filePath: result.filePath });
  } catch {
    return NextResponse.json(
      { error: 'Failed to read consulting content' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  assertDevOnly();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    await updateSingleton('consulting', body);
    return NextResponse.json({ ok: true, type: 'consulting' });
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorResponse(error);
    }
    throw error;
  }
}
