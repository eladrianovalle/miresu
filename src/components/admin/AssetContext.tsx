'use client';

import { createContext, useContext } from 'react';

/**
 * Carries the upload target (`category` + current `slug`) down through the
 * recursive `SchemaField` tree to the `UploadField` widgets, so they don't have
 * to be prop-drilled through every intermediate field.
 */
export interface AssetContextValue {
  /** Project category, or null for non-project (singleton) forms. */
  category: 'games' | 'client' | 'personal' | null;
  /** Current slug (filename). Empty until known (always empty on the create form). */
  slug: string;
  /** 'create' (new entry, no slug yet) or 'edit' (existing entry). */
  mode: 'create' | 'edit';
  /**
   * Create-form draft id. Staged uploads are namespaced by this (the slug is
   * title-derived and mutates per keystroke, so it can't key the upload dir);
   * `createProject` moves the staged files into the real slug dir on save.
   * Present only when `mode === 'create'`.
   */
  draftId?: string;
  /**
   * Whether uploads are allowed right now. Edit needs a real slug; create needs
   * a category (uploads stage under the draft id and relocate on save).
   */
  canUpload: boolean;
}

const AssetContext = createContext<AssetContextValue | null>(null);

export const AssetContextProvider = AssetContext.Provider;

export function useAssetContext(): AssetContextValue | null {
  return useContext(AssetContext);
}
