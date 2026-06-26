import { NextRequest, NextResponse } from 'next/server';
import { assertDevOnly } from '@/lib/admin/dev-gate';
import {
  saveUploadedAsset,
  saveStagedAsset,
  AssetValidationError,
} from '@/lib/admin/asset-ops';

/**
 * POST: Upload an image/video asset for a project.
 *
 * Dev-only (this `.dev.ts` route is excluded from the static export's
 * `pageExtensions`, so it never exists in the deployed site). Accepts
 * multipart/form-data with `file`, `kind` (image|video), and EITHER:
 *  - `category` + `slug` (edit form) → writes straight into the final dir, or
 *  - `draftId` (create form, slug not yet fixed) → stages under
 *    `public/assets/_staging/<draftId>/…`; `createProject` relocates on save.
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
  const draftId = form.get('draftId');
  const category = form.get('category');
  const slug = form.get('slug');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file.' }, { status: 400 });
  }
  if (typeof kind !== 'string') {
    return NextResponse.json({ error: 'Missing kind.' }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());

    let result: { path: string };
    if (typeof draftId === 'string' && draftId.length > 0) {
      // Create form: stage until the entry is saved.
      result = await saveStagedAsset({ kind, draftId, filename: file.name, bytes });
    } else if (typeof category === 'string' && typeof slug === 'string') {
      // Edit form: write straight into the final <category>/<slug>/ dir.
      result = await saveUploadedAsset({ kind, category, slug, filename: file.name, bytes });
    } else {
      return NextResponse.json(
        { error: 'Missing draftId, or category + slug.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, path: result.path }, { status: 201 });
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
