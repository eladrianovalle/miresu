/** Resolve hero image: explicit `image` field, or first gallery entry. */
export function getHeroImage(project: { image?: string; gallery?: string[] }): string | undefined {
  return project.image ?? project.gallery?.[0];
}
