import { NextRequest, NextResponse } from 'next/server';
import { assertDevOnly } from '@/lib/admin/dev-gate';
import { CONTENT_TYPES, getJsonSchemaWithAnnotations, type ContentTypeKey } from '@/lib/admin/schemas';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  assertDevOnly();

  const { type } = await params;
  // URL-decode the type param (e.g., "projects%2Fgames" -> "projects/games")
  const typeKey = decodeURIComponent(type) as ContentTypeKey;

  if (!(typeKey in CONTENT_TYPES)) {
    return NextResponse.json(
      { error: `Unknown content type: ${typeKey}` },
      { status: 400 },
    );
  }

  const result = getJsonSchemaWithAnnotations(typeKey);
  return NextResponse.json(result);
}
