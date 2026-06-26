/** Resolve hero image: explicit `image` field, or first gallery entry.
 * Empty/whitespace strings (e.g. a draft's unfilled `image` field) count as absent. */
export function getHeroImage(project: { image?: string; gallery?: string[] }): string | undefined {
  if (project.image?.trim()) return project.image;
  return project.gallery?.find((img) => img?.trim());
}

/** String resume bullets into a single prose paragraph (each clause ends with
 * sentence punctuation, joined by spaces). */
function bulletsToProse(bullets: string[]): string {
  return bullets
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => (/[.!?]$/.test(b) ? b : `${b}.`))
    .join(' ');
}

/**
 * Resolve a project's display description. An authored `description` wins; when
 * it's blank or omitted, fall back to the project's `resumeBullets` strung into
 * prose — so the description and the bullets aren't two sources of truth. Returns
 * '' when there's neither (callers should hide the section on empty).
 */
export function descriptionFor(project: { description?: string; resumeBullets?: string[] }): string {
  if (project.description?.trim()) return project.description;
  return bulletsToProse(project.resumeBullets ?? []);
}
