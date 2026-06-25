import type { Metadata } from 'next';
import { getConsulting } from '@/lib/projects';
import { buildMetadata } from '@/lib/metadata';
import { ConsultingDossier, MobileBack } from '@/components/command-center';
import '@/styles/command-center/dossier.css';

export const metadata: Metadata = buildMetadata({
  title: 'Consulting | Adriano Valle Hernandez',
  description:
    'Game design & gameplay engineering consulting. Unity, systems design, prototyping, player experience.',
});

export default async function ConsultingDetailPage() {
  const data = await getConsulting();

  if (!data) {
    return (
      <div className="cc-dossier-content">
        <p className="cc-dossier-description">Consulting content unavailable.</p>
      </div>
    );
  }

  return (
    <>
      <MobileBack />
      <ConsultingDossier data={data} />
    </>
  );
}
