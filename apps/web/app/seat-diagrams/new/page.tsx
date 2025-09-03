'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import SeatDiagramForm from '@/seat-diagrams/components/seat-diagram-form';
import useSeatDiagramMutations from '@/seat-diagrams/hooks/use-seat-diagram-mutations';
import routes from '@/services/routes';

export default function NewSeatDiagramPage() {
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const { create: createSeatDiagram } = useSeatDiagramMutations();

  return (
    <main className="container mx-auto p-6">
      <PageHeader
        title={tSeatDiagrams('pages.new.title')}
        description={tSeatDiagrams('pages.new.subtitle')}
        backHref={routes.seatDiagrams.index}
        backLabel={tSeatDiagrams('actions.backToList')}
      />

      <div className="mt-8">
        <SeatDiagramForm onSubmit={createSeatDiagram.mutateWithToast} />
      </div>
    </main>
  );
}
