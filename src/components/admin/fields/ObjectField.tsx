'use client';

import { pathToLabel } from '@/lib/admin/utils';
import { SchemaField, type JsonSchemaNode } from '../SchemaField';

interface ObjectFieldProps {
  schema: JsonSchemaNode;
  path: string;
  value: Record<string, unknown>;
  onChange: (path: string, value: unknown) => void;
  errors?: Map<string, string>;
  /** If true, the entire object is optional and can be toggled on/off */
  optional?: boolean;
}

/**
 * Renders a nested object as a bordered fieldset.
 * For optional objects (like `testimonial`, `video`), shows an enable/disable toggle.
 */
export function ObjectField({ schema, path, value, onChange, errors, optional }: ObjectFieldProps) {
  const label = pathToLabel(path);
  const properties = schema.properties ?? {};
  const isPresent = value !== undefined && value !== null && Object.keys(value).length > 0;

  if (optional && !isPresent) {
    return (
      <div className="border border-dashed border-surface-3/60 rounded p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-[0.12em]">
            {label}
          </span>
          <button
            type="button"
            onClick={() => {
              // Build empty object with required fields
              const empty: Record<string, unknown> = {};
              const required = new Set(schema.required ?? []);
              for (const [key, prop] of Object.entries(properties)) {
                if (required.has(key)) {
                  const p = prop;
                  if (p.type === 'string') empty[key] = '';
                  else if (p.type === 'number') empty[key] = 0;
                  else if (p.type === 'boolean') empty[key] = false;
                }
              }
              onChange(path, empty);
            }}
            className="text-xs px-2 py-1 rounded bg-surface-2 text-text-secondary hover:bg-surface-3"
          >
            + Add
          </button>
        </div>
      </div>
    );
  }

  return (
    <fieldset className="border border-surface-3 rounded p-3 space-y-3">
      <legend className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-[0.12em] px-1">
        {label}
        {optional && (
          <button
            type="button"
            onClick={() => onChange(path, undefined)}
            className="ml-2 text-text-muted/60 hover:text-accent normal-case font-normal"
          >
            (remove)
          </button>
        )}
      </legend>
      {Object.entries(properties).map(([key, propSchema]) => (
        <SchemaField
          key={key}
          schema={propSchema}
          path={path ? `${path}.${key}` : key}
          value={value?.[key]}
          onChange={onChange}
          errors={errors}
        />
      ))}
    </fieldset>
  );
}
