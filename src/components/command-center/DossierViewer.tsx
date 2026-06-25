'use client';

import Image from 'next/image';
import { useState, useCallback, useMemo, memo, useRef } from 'react';
import type { Project } from '@/lib/projects';
import { getHeroImage } from '@/lib/project-utils';
import { DossierFocusTitle } from './DossierFocusTitle';
import { DossierMeta } from './DossierMeta';
import { DossierContributors } from './DossierContributors';
import { DossierLinks } from './DossierLinks';
import { DossierTestimonial } from './DossierTestimonial';

export function DossierViewer({ project }: { project: Project }) {
  const heroImage = getHeroImage(project);
  const allImages = useMemo(() => {
    const gallery = project.gallery ?? [];
    if (!heroImage) return gallery;
    return [heroImage, ...gallery.filter((img) => img !== heroImage)];
  }, [heroImage, project.gallery]);
  const hasGallery = allImages.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);

  const heroVideo =
    project.video && project.video.type === 'hero' ? project.video : null;

  const handleSelect = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // NDA treatment
  if (project.confidential) {
    return (
      <>
        <div className="cc-dossier-nda">
          <span className="cc-dossier-nda-badge">[CLASSIFIED // UNDER NDA]</span>
        </div>
        <DossierContent project={project} />
      </>
    );
  }

  const showVideo = heroVideo && activeIndex === 0;

  return (
    <>
      {/* Hero viewer */}
      <div className="cc-viewer">
        <div className="cc-viewer-main" key={showVideo ? 'video' : activeIndex}>
          {showVideo ? (
            <video
              src={heroVideo.src}
              poster={heroVideo.poster}
              muted
              autoPlay
              loop
              playsInline
            />
          ) : (
            <Image
              src={allImages[activeIndex]}
              alt={`${project.title}${activeIndex > 0 ? ` — image ${activeIndex}` : ''}`}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          )}
        </div>
      </div>

      {/* Single filmstrip — mobile-first horizontal, desktop absolute overlay */}
      {hasGallery && (
        <Filmstrip
          images={allImages}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          title={project.title}
        />
      )}

      {/* Content below */}
      <DossierContent project={project} />
    </>
  );
}

const DossierContent = memo(function DossierContent({ project }: { project: Project }) {
  return (
    <div className="cc-dossier-content">
      <div className="cc-dossier-header">
        <DossierFocusTitle>{project.title}</DossierFocusTitle>
        {project.subtitle && (
          <p className="cc-dossier-subtitle">{project.subtitle}</p>
        )}
      </div>
      <DossierMeta project={project} />
      <div className="cc-dossier-section">
        <div className="cc-section-label">Description</div>
        <p className="cc-dossier-description">{project.description}</p>
      </div>
      {project.contributors && (
        <DossierContributors contributors={project.contributors} />
      )}
      <DossierLinks project={project} />
      {project.testimonial && (
        <DossierTestimonial testimonial={project.testimonial} />
      )}
    </div>
  );
});

function Filmstrip({
  images,
  activeIndex,
  onSelect,
  title,
}: {
  images: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  title: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next: number | null = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        next = Math.min(activeIndex + 1, images.length - 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        next = Math.max(activeIndex - 1, 0);
      }
      if (next !== null && next !== activeIndex) {
        e.preventDefault();
        onSelect(next);
        const target = next;
        requestAnimationFrame(() => {
          ref.current
            ?.querySelectorAll<HTMLButtonElement>('[role="option"]')
            [target]?.focus();
        });
      }
    },
    [activeIndex, images.length, onSelect],
  );

  return (
    <div
      className="cc-viewer-filmstrip"
      role="listbox"
      aria-label="Gallery images"
      ref={ref}
      onKeyDown={handleKeyDown}
    >
      <div className="cc-section-label">Gallery</div>
      {images.map((src, i) => (
        <button
          key={src}
          className={`cc-viewer-thumb${i === activeIndex ? ' active' : ''}`}
          onClick={() => onSelect(i)}
          type="button"
          role="option"
          aria-selected={i === activeIndex}
          aria-label={`${title} — ${i === 0 ? 'hero image' : `image ${i}`}`}
          tabIndex={i === activeIndex ? 0 : -1}
        >
          <Image src={src} alt="" fill sizes="(max-width: 1024px) 64px, 100px" />
        </button>
      ))}
    </div>
  );
}
