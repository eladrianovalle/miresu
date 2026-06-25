import { getIdentity, getSiteProjects, getProjectCategories, type ProjectCategory } from '@/lib/projects';
import { IdentityCard, FilterBar, ProjectDirectory, MobileFooter } from '@/components/command-center';
import '@/styles/command-center/directory.css';

export async function DirectoryPanel() {
  const [identity, projects] = await Promise.all([
    getIdentity(),
    getSiteProjects(),
  ]);

  // Compute category counts for filter badges
  const categories = getProjectCategories();
  const counts = Object.fromEntries(
    categories.map(cat => [cat, projects.filter(p => p.category === cat).length])
  ) as Record<ProjectCategory, number>;

  return (
    <>
      <IdentityCard identity={identity} />
      <FilterBar counts={counts} />
      <ProjectDirectory projects={projects} />
      <MobileFooter identity={identity} />
    </>
  );
}
