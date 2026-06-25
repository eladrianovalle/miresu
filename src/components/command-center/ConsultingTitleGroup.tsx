'use client';

import { useRef, useLayoutEffect, useEffect, useCallback, useState } from 'react';

interface ConsultingTitleGroupProps {
  tagline: string;
  headline: string;
}

export function ConsultingTitleGroup({ tagline, headline }: ConsultingTitleGroupProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  const measure = useCallback(() => {
    const heading = headingRef.current;
    const tag = taglineRef.current;
    if (!heading || !tag) return;

    tag.style.transform = 'scaleX(1)';
    const headingWidth = heading.offsetWidth;
    const taglineWidth = tag.scrollWidth;

    if (taglineWidth > 0 && headingWidth > 0) {
      setScale(Math.min(1, headingWidth / taglineWidth));
    }
  }, []);

  // Measure before paint so the user never sees the un-scaled flash
  useLayoutEffect(() => { measure(); }, [measure, tagline, headline]);

  // Re-measure on resize
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <div className="cc-consulting-title-group">
      <span
        ref={taglineRef}
        className="cc-consulting-hero-tagline"
        style={{
          transform: scale != null ? `scaleX(${scale})` : undefined,
          visibility: scale != null ? 'visible' : 'hidden',
        }}
      >
        {tagline}
      </span>
      <h2 ref={headingRef} className="cc-dossier-title">{headline}</h2>
    </div>
  );
}
