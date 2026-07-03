'use client';

import { pathToLabel } from '@/lib/admin/utils';
import { normalizeHex, toColorInputValue } from '@/lib/admin/theme-fields';

interface ColorFieldProps {
  path: string;
  value: string;
  onChange: (path: string, value: unknown) => void;
  error?: string;
  hint?: string;
  readOnly?: boolean;
}

/**
 * Color widget for the theme palette tokens (`colors.light.*` / `colors.dark.*`).
 * A native swatch picker and a hex text input stay in sync — both edit the same
 * hex string. The picker always emits a valid `#rrggbb`; the text input is a free
 * escape hatch (type any hex) that normalizes case/hash on blur.
 */
export function ColorField({ path, value, onChange, error, hint, readOnly }: ColorFieldProps) {
  const label = pathToLabel(path);
  const id = `field-${path}`;
  const current = value ?? '';

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[10px] font-mono font-semibold text-text-muted uppercase tracking-[0.12em]">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} — swatch`}
          value={toColorInputValue(current)}
          disabled={readOnly}
          onChange={(e) => onChange(path, e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-surface-3 bg-surface-1 disabled:cursor-not-allowed"
        />
        <input
          id={id}
          name={path}
          type="text"
          value={current}
          readOnly={readOnly}
          spellCheck={false}
          onChange={(e) => onChange(path, e.target.value)}
          onBlur={() => {
            // Tidy case/hash without blocking mid-type states; leave invalid text
            // for the save-time schema check to surface.
            const norm = normalizeHex(current);
            if (norm && norm !== current) onChange(path, norm);
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder="#rrggbb"
          className={`w-full bg-surface-1 border rounded-md px-3 py-2 text-sm font-mono text-text-primary
            ${error ? 'border-accent/60' : 'border-surface-3'}
            ${readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-text-muted focus:border-accent-secondary/60'}
            focus:outline-none focus:ring-1 focus:ring-accent-secondary/30`}
        />
      </div>
      {hint && !error && <p className="text-[10px] font-mono text-text-muted/60">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-[10px] font-mono text-accent">{error}</p>}
    </div>
  );
}
