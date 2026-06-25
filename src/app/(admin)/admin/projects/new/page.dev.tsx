'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ContentForm } from '@/components/admin/ContentForm';
import { buildDefaults, type JsonSchemaNode } from '@/lib/admin/defaults';

interface SchemaResponse {
  jsonSchema: Record<string, unknown>;
  annotations: {
    fieldOrder: string[];
    hints: Record<string, string>;
    textareaFields: string[];
  };
}

type CategoryOption = {
  key: 'games' | 'client' | 'personal';
  label: string;
  accent: string;
};

const CATEGORIES: CategoryOption[] = [
  { key: 'games', label: 'Game Projects', accent: 'border-magenta/50 bg-magenta/10 text-magenta' },
  { key: 'client', label: 'Client Projects', accent: 'border-turquoise/50 bg-turquoise/10 text-turquoise' },
  { key: 'personal', label: 'Collaborations', accent: 'border-yellow/50 bg-yellow/10 text-yellow' },
];

export default function NewProjectPage() {
  const [category, setCategory] = useState<CategoryOption['key'] | null>(null);
  const [schemaInfo, setSchemaInfo] = useState<{
    jsonSchema: Record<string, unknown>;
    annotations: {
      fieldOrder: string[];
      hints: Record<string, string>;
      textareaFields: string[];
    };
  } | null>(null);
  const [defaults, setDefaults] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategorySelect = async (cat: CategoryOption['key']) => {
    setCategory(cat);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/schema/projects%2F${cat}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch schema');
      }
      const data: SchemaResponse = await response.json() as SchemaResponse;
      setSchemaInfo({
        jsonSchema: data.jsonSchema,
        annotations: data.annotations,
      });

      const builtDefaults = buildDefaults(data.jsonSchema as JsonSchemaNode);
      setDefaults(builtDefaults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/"
          className="text-xs font-space-mono text-text-muted hover:text-turquoise transition-colors"
        >
          &larr; Dashboard
        </Link>
        <h1 className="text-xl font-syne font-bold text-text-primary">New Project</h1>
      </div>

      <div className="mb-8">
        <label className="block text-[10px] font-space-mono text-text-muted uppercase tracking-[0.15em] mb-3">
          Category
        </label>
        <div className="flex gap-2">
          {CATEGORIES.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => void handleCategorySelect(opt.key)}
              className={`px-4 py-2 rounded-md border text-sm font-space-mono transition-all duration-200 ${
                category === opt.key
                  ? opt.accent
                  : 'border-surface-3 text-text-muted hover:text-text-primary hover:border-text-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="text-text-muted text-sm font-space-mono animate-pulse">Loading schema...</p>
      )}

      {error && (
        <p className="text-red-400 text-sm font-space-mono">{error}</p>
      )}

      {category && schemaInfo && defaults && (
        <ContentForm
          initialData={defaults}
          jsonSchema={schemaInfo.jsonSchema}
          annotations={schemaInfo.annotations}
          saveEndpoint={`/api/admin/projects/${category}/`}
          saveMethod="POST"
        />
      )}
    </div>
  );
}
