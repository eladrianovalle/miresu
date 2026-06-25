import { redirect } from 'next/navigation';
import { getSiteProjects } from '@/lib/projects';

export async function generateStaticParams() {
  const projects = await getSiteProjects('client');
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/projects/${slug}/`);
}
