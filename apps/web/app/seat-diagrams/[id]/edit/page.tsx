'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import SeatDiagramForm, {
  SeatDiagramFormValues,
} from '@/seat-diagrams/components/seat-diagram-form';
import SeatDiagramFormSkeleton from '@/seat-diagrams/components/seat-diagram-form-skeleton';
import useQuerySeatDiagram from '@/seat-diagrams/hooks/use-query-seat-diagram';
import useSeatDiagramMutations from '@/seat-diagrams/hooks/use-seat-diagram-mutations';
import routes from '@/services/routes';

export default function EditSeatDiagramPage() {
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const { itemId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQuerySeatDiagram({
    itemId,
    enabled: isValidId,
  });
  const { update: updateSeatDiagram } = useSeatDiagramMutations();

  const handleSubmit = (values: SeatDiagramFormValues) =>
    updateSeatDiagram.mutateWithToast({ id: itemId, values });

  if (isLoading) {
    return <SeatDiagramFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tSeatDiagrams('edit.title')}
        description={data?.name}
        backHref={routes.seatDiagrams.getDetailsRoute(itemId.toString())}
      />
      <SeatDiagramForm defaultValues={data} onSubmit={handleSubmit} />
    </div>
  );
}
