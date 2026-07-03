'use client';

import { pathToLabel } from '@/lib/admin/utils';
import { CURATED_FONTS } from '@/lib/admin/theme-fields';

interface FontFieldProps {
  path: string;
  value: string;
  onChange: (path: string, value: unknown) => void;
  error?: string;
  hint?: string;
  readOnly?: boolean;
}

/**
 * Font-family widget for `fonts.{display,mono,body}.family`. A combobox: the
 * curated Google families appear as suggestions, but any family can be typed
 * (no allowlist, no API key). Emits the family string straight through.
 */
export function FontField({ path, value, onChange, error, hint, readOnly }: FontFieldProps) {
  const label = pathToLabel(path);
  const id = `field-${path}`;
  const listId = `fonts-${path}`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[10px] font-mono font-semibold text-text-muted uppercase tracking-[0.12em]">
        {label}
      </label>
      <input
        id={id}
        name={path}
        type="text"
        list={listId}
        value={value ?? ''}
        readOnly={readOnly}
        spellCheck={false}
        onChange={(e) => onChange(path, e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        placeholder="e.g. Inter, or type any family"
        className={`w-full bg-surface-1 border rounded-md px-3 py-2 text-sm font-mono text-text-primary
          ${error ? 'border-accent/60' : 'border-surface-3'}
          ${readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-text-muted focus:border-accent-secondary/60'}
          focus:outline-none focus:ring-1 focus:ring-accent-secondary/30`}
      />
      <datalist id={listId}>
        {CURATED_FONTS.map((family) => (
          <option key={family} value={family} />
        ))}
      </datalist>
      {hint && !error && <p className="text-[10px] font-mono text-text-muted/60">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-[10px] font-mono text-accent">{error}</p>}
    </div>
  );
}
