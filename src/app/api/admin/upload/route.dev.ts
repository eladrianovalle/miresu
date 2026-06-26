import { NextRequest, NextResponse } from 'next/server';
import { assertDevOnly } from '@/lib/admin/dev-gate';
import { saveUploadedAsset, AssetValidationError } from '@/lib/admin/asset-ops';

/**
 * POST: Upload an image/video asset for a project.
 *
 * Dev-only (this `.dev.ts` route is excluded from the static export's
 * `pageExtensions`, so it never exists in the deployed site). Accepts
 * multipart/form-data with `file`, `kind` (image|video), `category`, `slug`,
 * writes into `public/assets/...`, and returns the web path to store in JSON.
 *
 * Always returns a JSON body (even on error) so the client never chokes on an
 * empty response — same lesson as the create-project route.
 */
export async function POST(request: NextRequest) {
  assertDevOnly();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 });
  }

  const file = form.get('file');
  const kind = form.get('kind');
  const category = form.get('category');
  const slug = form.get('slug');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file.' }, { status: 400 });
  }
  if (typeof kind !== 'string' || typeof category !== 'string' || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Missing kind, category, or slug.' }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const { path } = await saveUploadedAsset({
      kind,
      category,
      slug,
      filename: file.name,
      bytes,
    });
    return NextResponse.json({ ok: true, path }, { status: 201 });
  } catch (error) {
    if (error instanceof AssetValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 500 },
    );
  }
}
