'use client';

import { TextField } from './fields/TextField';
import { NumberField } from './fields/NumberField';
import { CheckboxField } from './fields/CheckboxField';
import { SelectField } from './fields/SelectField';
import { ArrayField } from './fields/ArrayField';
import { ObjectField } from './fields/ObjectField';
import type { JsonSchemaNode } from '@/lib/admin/api-types';

export type { JsonSchemaNode };

export interface SchemaFieldProps {
  schema: JsonSchemaNode;
  path: string;
  value: unknown;
  onChange: (path: string, value: unknown) => void;
  errors?: Map<string, string>;
  /** Hint text from annotations */
  hint?: string;
  /** Whether this field should render as a textarea */
  isTextarea?: boolean;
  /** Whether this is a read-only field (e.g., slug on edit) */
  readOnly?: boolean;
}

/**
 * Recursive field renderer. Dispatches to the correct widget based on
 * JSON Schema type, format, and enum presence.
 *
 * Rendering rules (in priority order):
 *
 * 1. Has `enum` array        -> SelectField (dropdown)
 * 2. type === 'boolean'       -> CheckboxField (checkbox)
 * 3. type === 'number'        -> NumberField (number input)
 * 4. type === 'string'
 *    a. format === 'uri'      -> TextField with type="url"
 *    b. format === 'email'    -> TextField with type="email"
 *    c. isTextarea === true   -> TextField with multiline
 *    d. otherwise             -> TextField with type="text"
 * 5. type === 'array'         -> ArrayField
 * 6. type === 'object'        -> ObjectField (collapsible fieldset)
 * 7. Unrecognized             -> TextField fallback with warning
 */
export function SchemaField(props: SchemaFieldProps) {
  const { schema, path, value, onChange, errors, hint, isTextarea, readOnly } = props;

  // Rule 1: Enum -> Select
  if (schema.enum && schema.enum.length > 0) {
    return (
      <SelectField
        path={path}
        options={schema.enum}
        value={(value as string) ?? ''}
        onChange={onChange}
        error={errors?.get(path)}
        hint={hint}
        readOnly={readOnly}
      />
    );
  }

  // Rule 2: Boolean -> Checkbox
  if (schema.type === 'boolean') {
    return (
      <CheckboxField
        path={path}
        checked={(value as boolean) ?? (schema.default as boolean) ?? false}
        onChange={onChange}
        error={errors?.get(path)}
        hint={hint}
        readOnly={readOnly}
      />
    );
  }

  // Rule 3: Number / Integer -> Number input
  if (schema.type === 'number' || schema.type === 'integer') {
    return (
      <NumberField
        path={path}
        value={(value as number) ?? ''}
        onChange={onChange}
        error={errors?.get(path)}
        hint={hint}
        readOnly={readOnly}
      />
    );
  }

  // Rule 4: String -> Text input (with format variants)
  if (schema.type === 'string') {
    let inputType: 'text' | 'url' | 'email' = 'text';
    if (schema.format === 'uri') inputType = 'url';
    if (schema.format === 'email') inputType = 'email';

    return (
      <TextField
        path={path}
        value={(value as string) ?? ''}
        onChange={onChange}
        inputType={inputType}
        multiline={isTextarea ?? false}
        error={errors?.get(path)}
        hint={hint}
        readOnly={readOnly}
      />
    );
  }

  // Rule 5: Array -> ArrayField
  if (schema.type === 'array' && schema.items) {
    return (
      <ArrayField
        path={path}
        itemSchema={schema.items}
        value={(value as unknown[]) ?? []}
        onChange={onChange}
        errors={errors}
        hint={hint}
      />
    );
  }

  // Rule 6: Object -> ObjectField
  if (schema.type === 'object' && schema.properties) {
    return (
      <ObjectField
        schema={schema}
        path={path}
        value={(value as Record<string, unknown>) ?? {}}
        onChange={onChange}
        errors={errors}
      />
    );
  }

  // Rule 7: Fallback
  return (
    <div className="text-accent-tertiary text-xs font-space-mono p-2 border border-surface-3 rounded">
      Unknown field type at {path}: {JSON.stringify(schema.type)}
    </div>
  );
}
