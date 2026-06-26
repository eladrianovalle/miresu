'use client';

import { useRef, useState } from 'react';
import { pathToLabel } from '@/lib/admin/utils';
import { ASSET_LIMITS, formatCap, type AssetKind } from '@/lib/admin/asset-fields';
import { useAssetContext } from '../AssetContext';

interface UploadFieldProps {
  path: string;
  kind: AssetKind;
  value: string;
  onChange: (path: string, value: unknown) => void;
  error?: string;
  hint?: string;
  readOnly?: boolean;
  /** Suppress the field label (used for array items, which label the group). */
  hideLabel?: boolean;
}

/**
 * Upload widget for image/video asset fields. Drag-drop or pick a file → it is
 * POSTed to the dev-only `/api/admin/upload` route, copied into `public/assets`,
 * and the returned web path is written into the field. A collapsible manual-path
 * input remains as an escape hatch (paste an existing path or external URL).
 */
export function UploadField({
  path,
  kind,
  value,
  onChange,
  error,
  hint,
  readOnly,
  hideLabel,
}: UploadFieldProps) {
  const ctx = useAssetContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const label = pathToLabel(path);
  const id = `field-${path}`;
  const canUpload = !readOnly && (ctx?.canUpload ?? false);
  const accept =
    kind === 'image'
      ? ASSET_LIMITS.image.extensions.map((e) => `.${e}`).join(',')
      : ASSET_LIMITS.video.extensions.map((e) => `.${e}`).join(',');

  async function upload(file: File) {
    if (!ctx || ctx.category === null) {
      setLocalError('Pick a category first.');
      return;
    }
    if (ctx.mode === 'edit' && !ctx.slug) {
      setLocalError('No upload target — save the entry first.');
      return;
    }
    // Client pre-flight so we never stream an oversize body to the server.
    if (file.size > ASSET_LIMITS[kind].maxBytes) {
      setLocalError(`File too large (max ${formatCap(kind)} for ${kind}).`);
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('kind', kind);
      if (ctx.mode === 'create' && ctx.draftId) {
        // Stage under the draft id; createProject relocates on save.
        body.set('draftId', ctx.draftId);
      } else {
        body.set('category', ctx.category);
        body.set('slug', ctx.slug);
      }

      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const raw = await res.text();
      const data = (raw ? JSON.parse(raw) : {}) as { path?: string; error?: string };
      if (!res.ok || !data.path) {
        setLocalError(data.error ?? `Upload failed (${res.status}).`);
        return;
      }
      onChange(path, data.path);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!canUpload) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  const shownError = error ?? localError;

  return (
    <div className="space-y-1.5">
      {!hideLabel && (
        <label htmlFor={id} className="block text-[10px] font-mono font-semibold text-text-muted uppercase tracking-[0.12em]">
          {label}
        </label>
      )}

      {/* Current value preview */}
      {value && (
        <div className="flex items-center gap-3 rounded-md border border-surface-3 bg-surface-1 p-2">
          {kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element -- dev-only admin preview of an arbitrary local path
            <img src={value} alt="" className="h-12 w-12 rounded object-cover bg-surface-2" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded bg-surface-2 text-accent-secondary" aria-hidden="true">▶</span>
          )}
          <span className="flex-1 truncate font-mono text-[11px] text-text-secondary">{value}</span>
          {!readOnly && (
            <button
              type="button"
              onClick={() => onChange(path, '')}
              className="text-xs text-text-muted/60 hover:text-accent transition-colors"
              aria-label={`Clear ${label}`}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Drop zone / picker */}
      <div
        onDragOver={(e) => { if (canUpload) { e.preventDefault(); setDragOver(true); } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-md border border-dashed px-3 py-3 text-center transition-colors ${
          dragOver ? 'border-accent-secondary/70 bg-accent-secondary/10' : 'border-surface-3'
        } ${canUpload ? '' : 'opacity-50'}`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={!canUpload || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!canUpload || busy}
          className="font-mono text-[11px] text-accent-secondary hover:underline disabled:cursor-not-allowed disabled:text-text-muted"
        >
          {busy ? 'Uploading…' : value ? 'Replace file' : `Drop ${kind} or choose file`}
        </button>
        <p className="mt-1 text-[10px] font-mono text-text-muted/60">
          {canUpload
            ? `${ASSET_LIMITS[kind].extensions.join(', ')} · max ${formatCap(kind)}`
            : ctx?.category == null
              ? 'Pick a category first.'
              : 'Save the entry first, then upload here.'}
        </p>
      </div>

      {/* Manual-path escape hatch */}
      <div>
        <button
          type="button"
          onClick={() => setShowManual((s) => !s)}
          className="text-[10px] font-mono text-text-muted/60 hover:text-text-secondary"
        >
          {showManual ? '− Hide manual path' : '+ Enter path manually'}
        </button>
        {showManual && (
          <input
            type="text"
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange(path, e.target.value)}
            placeholder="/assets/images/… or https://…"
            className="mt-1 w-full bg-surface-1 border border-surface-3 rounded-md px-3 py-2 text-sm font-mono text-text-primary hover:border-text-muted focus:border-accent-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent-secondary/30"
          />
        )}
      </div>

      {hint && !shownError && (
        <p className="text-[10px] font-mono text-text-muted/60">{hint}</p>
      )}
      {shownError && (
        <p id={`${id}-error`} className="text-[10px] font-mono text-accent">{shownError}</p>
      )}
    </div>
  );
}
