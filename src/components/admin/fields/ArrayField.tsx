'use client';

import { pathToLabel } from '@/lib/admin/utils';
import { SchemaField, type JsonSchemaNode } from '../SchemaField';

interface ArrayFieldProps {
  path: string;
  itemSchema: JsonSchemaNode;
  value: unknown[];
  onChange: (path: string, value: unknown) => void;
  errors?: Map<string, string>;
  hint?: string;
}

/**
 * Renders an array field.
 *
 * For string arrays: renders a list of text inputs with add/remove.
 * For object arrays: renders collapsible fieldsets per item with add/remove.
 */
export function ArrayField({ path, itemSchema, value, onChange, errors, hint }: ArrayFieldProps) {
  const label = pathToLabel(path);
  const items = Array.isArray(value) ? value : [];
  const isStringArray = itemSchema.type === 'string';

  function handleItemChange(index: number, itemPath: string, itemValue: unknown) {
    const updated = [...items];
    if (isStringArray) {
      // For string arrays, the value IS the item
      updated[index] = itemValue;
    } else {
      // For object arrays, need to set nested path
      const subPath = itemPath.replace(`${path}.${index}.`, '');
      const item = { ...(updated[index] as Record<string, unknown>) };
      setNestedValue(item, subPath, itemValue);
      updated[index] = item;
    }
    onChange(path, updated);
  }

  function addItem() {
    const updated = [...items];
    if (isStringArray) {
      updated.push('');
    } else if (itemSchema.type === 'object' && itemSchema.properties) {
      // Build empty object from schema
      const empty: Record<string, unknown> = {};
      const required = new Set(itemSchema.required ?? []);
      for (const [key, prop] of Object.entries(itemSchema.properties)) {
        if (prop.default !== undefined) {
          empty[key] = prop.default;
        } else if (required.has(key)) {
          const p = prop;
          if (p.type === 'string') empty[key] = '';
          else if (p.type === 'number') empty[key] = 0;
          else if (p.type === 'boolean') empty[key] = false;
          else if (p.type === 'array') empty[key] = [];
        }
      }
      updated.push(empty);
    }
    onChange(path, updated);
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index);
    onChange(path, updated);
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(path, updated);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-space-mono font-semibold text-text-muted uppercase tracking-[0.12em]">
          {label}
          <span className="ml-2 text-text-muted/60 normal-case font-normal">({items.length})</span>
        </label>
        <button
          type="button"
          onClick={addItem}
          className="text-xs px-2 py-1 rounded bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
        >
          + Add
        </button>
      </div>
      {hint && <p className="text-[10px] font-space-mono text-text-muted/60">{hint}</p>}

      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-start group">
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => moveItem(index, -1)}
              disabled={index === 0}
              className="text-[10px] text-text-muted/60 hover:text-text-primary disabled:invisible"
              aria-label={`Move item ${index + 1} up`}
            >
              &#9650;
            </button>
            <button
              type="button"
              onClick={() => moveItem(index, 1)}
              disabled={index === items.length - 1}
              className="text-[10px] text-text-muted/60 hover:text-text-primary disabled:invisible"
              aria-label={`Move item ${index + 1} down`}
            >
              &#9660;
            </button>
          </div>

          {/* Item content */}
          <div className="flex-1">
            {isStringArray ? (
              <input
                type="text"
                value={item as string}
                onChange={(e) => handleItemChange(index, '', e.target.value)}
                className="w-full bg-surface-1 border border-surface-3 rounded-md px-3 py-2 text-sm font-space-mono text-text-primary hover:border-text-muted focus:border-turquoise/60 focus:outline-none focus:ring-1 focus:ring-turquoise/30"
              />
            ) : (
              <div className="border border-surface-3 rounded p-3 space-y-3">
                {itemSchema.properties &&
                  Object.entries(itemSchema.properties).map(([key, propSchema]) => (
                    <SchemaField
                      key={key}
                      schema={propSchema}
                      path={`${path}.${index}.${key}`}
                      value={(item as Record<string, unknown>)?.[key]}
                      onChange={(p, v) => handleItemChange(index, p, v)}
                      errors={errors}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="text-xs text-text-muted/60 hover:text-magenta pt-2 transition-colors"
            aria-label={`Remove item ${index + 1}`}
          >
            &#10005;
          </button>
        </div>
      ))}

      {items.length === 0 && (
        <p className="text-xs text-text-muted/40 italic">No items. Click &quot;+ Add&quot; to create one.</p>
      )}
    </div>
  );
}

/** Set a value at a dotted path in a nested object */
function setNestedValue(obj: Record<string, unknown>, dotPath: string, value: unknown) {
  const keys = dotPath.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}
