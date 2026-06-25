import type { JsonSchemaNode } from './api-types';

export type { JsonSchemaNode };

/**
 * Walk a JSON Schema and build an object with all default values populated.
 * Used to pre-fill the form when creating new content.
 *
 * Rules:
 * - If a property has "default", use it
 * - If a property is type "object" with properties, recurse
 * - If a property is type "array", default to []
 * - If a property is type "string", default to ''
 * - If a property is type "number", default to 0
 * - If a property is type "boolean", default to false
 * - Optional properties without defaults are omitted
 */
export function buildDefaults(
  schema: JsonSchemaNode,
  requiredFields?: string[],
): Record<string, unknown> {
  if (schema.type !== 'object' || !schema.properties) return {};

  const required = new Set(requiredFields ?? schema.required ?? []);
  const result: Record<string, unknown> = {};

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    // If schema has an explicit default, always use it
    if (propSchema.default !== undefined) {
      result[key] = propSchema.default;
      continue;
    }

    // Only populate required fields without explicit defaults
    if (!required.has(key)) continue;

    if (propSchema.type === 'object' && propSchema.properties) {
      result[key] = buildDefaults(propSchema, propSchema.required);
    } else if (propSchema.type === 'array') {
      result[key] = [];
    } else if (propSchema.type === 'string') {
      result[key] = '';
    } else if (propSchema.type === 'number') {
      result[key] = 0;
    } else if (propSchema.type === 'boolean') {
      result[key] = false;
    }
  }

  return result;
}
