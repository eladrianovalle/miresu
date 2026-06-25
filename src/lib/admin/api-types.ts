import type { ProjectCategoryKey } from './schemas';

// --- Shared JSON Schema node type ---

/**
 * JSON Schema node type — matches the subset of JSON Schema 2020-12
 * that Zod's toJSONSchema() emits. Shared between server-side defaults
 * and client-side SchemaField rendering.
 */
export interface JsonSchemaNode {
  type?: string;
  enum?: string[];
  format?: string;
  default?: unknown;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  items?: JsonSchemaNode;
  additionalProperties?: boolean;
}

// --- Schema endpoint ---

export interface SchemaResponse {
  type: string;
  label: string;
  jsonSchema: Record<string, unknown>;
  annotations: {
    fieldOrder: string[];
    hints: Record<string, string>;
    textareaFields: string[];
  };
}

// --- Project endpoints ---

export interface ProjectReadResponse {
  data: Record<string, unknown>;
  filePath: string;
  category: ProjectCategoryKey;
}

export interface ProjectUpdateResponse {
  ok: true;
  slug: string;
  category: ProjectCategoryKey;
}

export interface ProjectCreateResponse {
  ok: true;
  slug: string;
  category: ProjectCategoryKey;
  filePath: string;
}

export interface ProjectListResponse {
  category: ProjectCategoryKey;
  slugs: string[];
}

// --- Singleton endpoints ---

export interface SingletonReadResponse {
  data: Record<string, unknown>;
  filePath: string;
}

export interface SingletonUpdateResponse {
  ok: true;
  type: 'consulting' | 'identity';
}

// --- Error responses ---

export interface ValidationErrorResponse {
  error: 'Validation failed';
  issues: Array<{
    path: (string | number)[];
    message: string;
    code: string;
  }>;
}

export interface NotFoundErrorResponse {
  error: string;
}

export interface ConflictErrorResponse {
  error: 'Slug already exists';
  slug: string;
  conflictCategory?: ProjectCategoryKey;
}

export type AdminErrorResponse =
  | ValidationErrorResponse
  | NotFoundErrorResponse
  | ConflictErrorResponse;
