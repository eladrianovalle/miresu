'use client';

import { pathToLabel } from '@/lib/admin/utils';

interface CheckboxFieldProps {
  path: string;
  checked: boolean;
  onChange: (path: string, value: unknown) => void;
  error?: string;
  hint?: string;
  readOnly?: boolean;
}

export function CheckboxField({ path, checked, onChange, error, hint, readOnly }: CheckboxFieldProps) {
  const label = pathToLabel(path);
  const id = `field-${path}`;

  return (
    <div className="flex items-start gap-3 py-1">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(path, e.target.checked)}
        disabled={readOnly}
        aria-invalid={!!error}
        className="mt-0.5 h-4 w-4 rounded border-surface-3 bg-surface-1 text-accent-secondary/60 focus:ring-accent-secondary/30"
      />
      <div>
        <label htmlFor={id} className="text-sm text-text-secondary">
          {label}
        </label>
        {hint && <p className="text-[10px] font-mono text-text-muted/60 mt-0.5">{hint}</p>}
        {error && <p className="text-[10px] font-mono text-accent mt-0.5">{error}</p>}
      </div>
    </div>
  );
}
