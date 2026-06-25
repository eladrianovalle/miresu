'use client';

import { pathToLabel } from '@/lib/admin/utils';

interface NumberFieldProps {
  path: string;
  value: number | '';
  onChange: (path: string, value: unknown) => void;
  error?: string;
  hint?: string;
  readOnly?: boolean;
}

export function NumberField({ path, value, onChange, error, hint, readOnly }: NumberFieldProps) {
  const label = pathToLabel(path);
  const id = `field-${path}`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[10px] font-space-mono font-semibold text-text-muted uppercase tracking-[0.12em]">
        {label}
      </label>
      <input
        id={id}
        type="number"
        name={path}
        value={value}
        onChange={(e) => onChange(path, e.target.value === '' ? '' : Number(e.target.value))}
        readOnly={readOnly}
        aria-invalid={!!error}
        className={`w-full bg-surface-1 border rounded-md px-3 py-2 text-sm font-space-mono text-text-primary
          ${error ? 'border-magenta/60' : 'border-surface-3'}
          ${readOnly ? 'opacity-60 cursor-not-allowed' : 'hover:border-text-muted focus:border-turquoise/60'}
          focus:outline-none focus:ring-1 focus:ring-turquoise/30`}
      />
      {hint && !error && <p className="text-[10px] font-space-mono text-text-muted/60">{hint}</p>}
      {error && <p className="text-[10px] font-space-mono text-magenta">{error}</p>}
    </div>
  );
}
