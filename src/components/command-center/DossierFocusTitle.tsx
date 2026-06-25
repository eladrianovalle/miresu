'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function DossierFocusTitle({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.focus();
  }, [pathname]);

  return (
    <h2 className="cc-dossier-title" tabIndex={-1} ref={ref}>
      {children}
    </h2>
  );
}
