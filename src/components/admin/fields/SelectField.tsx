'use client';

import { pathToLabel } from '@/lib/admin/utils';

interface SelectFieldProps {
  path: string;
  options: string[];
  value: string;
  onChange: (path: string, value: unknown) => void;
  error?: string;
  hint?: string;
  readOnly?: boolean;
}

export function SelectField({ path, options, value, onChange, error, hint, readOnly }: SelectFieldProps) {
  const label = pathToLabel(path);
  const id = `field-${path}`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[10px] font-space-mono font-semibold text-text-muted uppercase tracking-[0.12em]">
        {label}
      </label>
      <select
        id={id}
        name={path}
        value={value}
        onChange={(e) => onChange(path, e.target.value)}
        disabled={readOnly}
        aria-invalid={!!error}
        className={`w-full bg-surface-1 border rounded-md px-3 py-2 text-sm font-space-mono text-text-primary
          ${error ? 'border-magenta/60' : 'border-surface-3'}
          focus:outline-none focus:ring-1 focus:ring-turquoise/30`}
      >
        <option value="">&mdash; Select &mdash;</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {hint && !error && <p className="text-[10px] font-space-mono text-text-muted/60">{hint}</p>}
      {error && <p className="text-[10px] font-space-mono text-magenta">{error}</p>}
    </div>
  );
}
