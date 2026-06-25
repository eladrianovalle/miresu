export function DossierTestimonial({
  testimonial,
}: {
  testimonial: { quote: string; author: string; role?: string; company?: string };
}) {
  let attribution = `\u2014 ${testimonial.author}`;
  if (testimonial.role && testimonial.company) {
    attribution += `, ${testimonial.role} at ${testimonial.company}`;
  } else if (testimonial.role) {
    attribution += `, ${testimonial.role}`;
  } else if (testimonial.company) {
    attribution += `, ${testimonial.company}`;
  }

  return (
    <div className="cc-dossier-section">
      <div className="cc-section-label">Testimonial</div>
      <div className="cc-testimonial">
        <p className="cc-testimonial-text">&ldquo;{testimonial.quote}&rdquo;</p>
        <p className="cc-testimonial-author">{attribution}</p>
      </div>
    </div>
  );
}
