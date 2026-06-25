'use client';

import { useReducer, useCallback, useState, useEffect, useRef } from 'react';
import { SchemaField, type JsonSchemaNode } from './SchemaField';
import { ObjectField } from './fields/ObjectField';

interface SaveSuccessResponse {
  ok?: boolean;
  message?: string;
}

interface SaveErrorResponse {
  error?: string;
  issues?: Array<{ path: (string | number)[]; message: string }>;
}

type SaveResponse = SaveSuccessResponse & SaveErrorResponse;

interface ContentFormProps {
  initialData: Record<string, unknown>;
  jsonSchema: Record<string, unknown>;
  annotations: {
    fieldOrder: string[];
    hints: Record<string, string>;
    textareaFields: string[];
  };
  saveEndpoint: string;
  saveMethod: 'PUT' | 'POST';
}

// --- State management ---

type FormAction =
  | { type: 'SET_FIELD'; path: string; value: unknown }
  | { type: 'RESET'; data: Record<string, unknown> };

function formReducer(
  state: Record<string, unknown>,
  action: FormAction,
): Record<string, unknown> {
  switch (action.type) {
    case 'SET_FIELD': {
      const keys = action.path.split('.');
      return setDeep(state, keys, action.value);
    }
    case 'RESET':
      return action.data;
    default:
      return state;
  }
}

/** Immutably set a value at a deep path, correctly handling array indices */
function setDeep(
  obj: Record<string, unknown>,
  keys: string[],
  value: unknown,
): Record<string, unknown> {
  if (keys.length === 0) return obj;
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value };
  }

  const [head, ...rest] = keys;
  const child = obj[head];

  // Handle array index traversal
  if (Array.isArray(child)) {
    const typedChild = child as unknown[];
    const index = parseInt(rest[0], 10);
    if (!isNaN(index) && rest.length === 1) {
      const updated: unknown[] = [...typedChild];
      updated[index] = value;
      return { ...obj, [head]: updated };
    }
    if (!isNaN(index)) {
      const updated: unknown[] = [...typedChild];
      updated[index] = setDeep(
        ((typedChild[index] ?? {}) as Record<string, unknown>),
        rest.slice(1),
        value,
      );
      return { ...obj, [head]: updated };
    }
  }

  // When child is undefined/null and the next key is a numeric index,
  // create an array instead of an object (C2-3 fix)
  if ((child === undefined || child === null) && !isNaN(parseInt(rest[0], 10))) {
    const index = parseInt(rest[0], 10);
    const arr: unknown[] = [];
    if (rest.length === 1) {
      arr[index] = value;
    } else {
      arr[index] = setDeep({} as Record<string, unknown>, rest.slice(1), value);
    }
    return { ...obj, [head]: arr };
  }

  return {
    ...obj,
    [head]: setDeep((child ?? {}) as Record<string, unknown>, rest, value),
  };
}

// --- Component ---

export function ContentForm({
  initialData,
  jsonSchema,
  annotations,
  saveEndpoint,
  saveMethod,
}: ContentFormProps) {
  const [formData, dispatch] = useReducer(formReducer, initialData);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map());
  const [showJson, setShowJson] = useState(false);
  // `navigator` only exists in the browser — read it after mount so this
  // component still renders during SSR. Server (and first client paint) shows
  // "Ctrl"; on a Mac the effect upgrades it to ⌘, with no hydration mismatch.
  const [isMac, setIsMac] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMac(navigator.platform?.includes('Mac') ?? false);
  }, []);

  // Track dirty state
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (saveResult) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setSaveResult(null), 4000);
    }
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [saveResult]);

  // Unsaved changes warning
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Cmd+S / Ctrl+S keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!saving) void handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, formData, saveEndpoint, saveMethod]);

  const handleChange = useCallback((path: string, value: unknown) => {
    dispatch({ type: 'SET_FIELD', path, value });
    // Clear field error on change
    setFieldErrors((prev) => {
      if (!prev.has(path)) return prev;
      const next = new Map(prev);
      next.delete(path);
      return next;
    });
    setSaveResult(null);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    setFieldErrors(new Map());

    try {
      const response = await fetch(saveEndpoint, {
        method: saveMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result: SaveResponse = await response.json() as SaveResponse;

      if (!response.ok) {
        if (result.issues) {
          const errors = new Map<string, string>();
          for (const issue of result.issues) {
            const path = issue.path.join('.');
            errors.set(path, issue.message);
          }
          setFieldErrors(errors);
          setSaveResult({ ok: false, message: `Validation failed: ${errors.size} error(s)` });
        } else {
          setSaveResult({ ok: false, message: result.error ?? 'Save failed' });
        }
        return;
      }

      setSaveResult({ ok: true, message: 'Saved successfully' });
    } catch (error) {
      setSaveResult({
        ok: false,
        message: error instanceof Error ? error.message : 'Network error',
      });
    } finally {
      setSaving(false);
    }
  };

  const schema = jsonSchema as JsonSchemaNode;
  const properties = schema.properties ?? {};
  const textareaSet = new Set(annotations.textareaFields);

  const orderedKeys =
    annotations.fieldOrder.length > 0
      ? annotations.fieldOrder.filter((k) => k in properties)
      : Object.keys(properties);

  const requiredSet = new Set(schema.required ?? []);

  return (
    <div className="space-y-6">
      {/* Form fields */}
      <div className="space-y-4">
        {orderedKeys.map((key) => {
          const propSchema = properties[key];
          const isOptionalObject =
            propSchema.type === 'object' && !requiredSet.has(key);

          if (isOptionalObject && propSchema.properties) {
            return (
              <ObjectField
                key={key}
                schema={propSchema}
                path={key}
                value={formData[key] as Record<string, unknown>}
                onChange={handleChange}
                errors={fieldErrors}
                optional
              />
            );
          }

          return (
            <SchemaField
              key={key}
              schema={propSchema}
              path={key}
              value={formData[key]}
              onChange={handleChange}
              errors={fieldErrors}
              hint={annotations.hints[key]}
              isTextarea={textareaSet.has(key)}
              readOnly={key === 'slug'}
            />
          );
        })}
      </div>

      {/* JSON preview toggle */}
      {showJson && (
        <details open className="border border-surface-3 rounded-lg bg-surface-1/50">
          <summary className="px-4 py-2 text-[10px] font-space-mono text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-secondary select-none">
            JSON Preview
          </summary>
          <pre className="px-4 pb-4 text-xs font-space-mono text-text-muted overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </details>
      )}

      {/* Save toolbar */}
      <div className="sticky bottom-0 bg-primary-dark/95 backdrop-blur-sm border-t border-surface-3/60 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-turquoise/90 text-primary-dark font-space-mono font-bold text-xs tracking-wide hover:bg-turquoise disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'RESET', data: initialData })}
          disabled={saving}
          className="px-3 py-2 rounded-md border border-surface-3 text-text-muted text-xs font-space-mono hover:text-text-primary hover:border-text-muted transition-colors"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => setShowJson((v) => !v)}
          className={`px-2.5 py-2 rounded-md border text-xs font-space-mono transition-colors ${
            showJson
              ? 'border-turquoise/50 text-turquoise bg-turquoise/5'
              : 'border-surface-3 text-text-muted hover:text-text-secondary hover:border-text-muted'
          }`}
        >
          {'{ }'}
        </button>
        {isDirty && !saveResult && (
          <span className="text-[10px] font-space-mono text-yellow tracking-wide">UNSAVED</span>
        )}
        {saveResult && (
          <span
            className={`text-xs font-space-mono transition-opacity ${saveResult.ok ? 'text-turquoise' : 'text-magenta'}`}
          >
            {saveResult.message}
          </span>
        )}
        {fieldErrors.size > 0 && (
          <span className="text-[10px] font-space-mono text-magenta">
            {fieldErrors.size} error{fieldErrors.size !== 1 ? 's' : ''} &mdash; scroll up
          </span>
        )}
        <span className="ml-auto text-[10px] text-text-muted/40 font-space-mono">
          {isMac ? '\u2318' : 'Ctrl'}+S
        </span>
      </div>
    </div>
  );
}
