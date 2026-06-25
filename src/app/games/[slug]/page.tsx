import { redirect } from 'next/navigation';
import { getSiteProjects } from '@/lib/projects';

export async function generateStaticParams() {
  const projects = await getSiteProjects('games');
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/projects/${slug}/`);
}
