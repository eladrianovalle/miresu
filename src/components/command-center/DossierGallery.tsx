import Image from 'next/image';

export function DossierGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  if (!images || images.length === 0) return null;

  return (
    <div className="cc-dossier-section">
      <div className="cc-section-label">Gallery</div>
      <div className="cc-dossier-gallery">
        {images.map((src, i) => (
          <div key={src} className="cc-gallery-img-wrap" style={{ position: 'relative', aspectRatio: '16 / 9' }}>
            <Image src={src} alt={`${title} — image ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
