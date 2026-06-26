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
  /** Current slug (filename). Empty until known. */
  slug: string;
  /**
   * Whether uploads are allowed right now. Iteration 1 is edit-only: the
   * create form's slug is live-derived from the title and mutates per keystroke,
   * so uploading there would orphan files under a stale slug. Create-time
   * uploads are a planned fast-follow.
   */
  canUpload: boolean;
}

const AssetContext = createContext<AssetContextValue | null>(null);

export const AssetContextProvider = AssetContext.Provider;

export function useAssetContext(): AssetContextValue | null {
  return useContext(AssetContext);
}
