'use client';

import { pathToLabel } from '@/lib/admin/utils';

interface TextFieldProps {
  path: string;
  value: string;
  onChange: (path: string, value: unknown) => void;
  inputType?: 'text' | 'url' | 'email';
  multiline?: boolean;
  error?: string;
  hint?: string;
  readOnly?: boolean;
}

export function TextField({
  path,
  value,
  onChange,
  inputType = 'text',
  multiline = false,
  error,
  hint,
  readOnly,
}: TextFieldProps) {
  const label = pathToLabel(path);
  const id = `field-${path}`;

  const sharedProps = {
    id,
    name: path,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(path, e.target.value),
    readOnly,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
    className: `w-full bg-surface-1 border rounded-md px-3 py-2 text-sm font-mono text-text-primary
      ${error ? 'border-accent/60' : 'border-surface-3'}
      ${readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-text-muted focus:border-accent-secondary/60'}
      focus:outline-none focus:ring-1 focus:ring-accent-secondary/30`,
  };

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[10px] font-mono font-semibold text-text-muted uppercase tracking-[0.12em]">
        {label}
      </label>
      {multiline ? (
        <textarea {...sharedProps} rows={4} />
      ) : (
        <input {...sharedProps} type={inputType} />
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[10px] font-mono text-text-muted/60">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-[10px] font-mono text-accent">{error}</p>
      )}
    </div>
  );
}
