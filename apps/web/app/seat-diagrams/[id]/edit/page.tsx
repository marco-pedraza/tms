'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import SeatDiagramFormSkeleton from '@/seat-diagrams/components/seat-diagram-form-skeleton';
import { createFloorsFromSeatConfiguration } from '@/seat-diagrams/components/seat-diagram-form/create-floors-from-quick-config';
import SeatDiagramForm, {
  SeatDiagramFormValues,
} from '@/seat-diagrams/components/seat-diagram-form/seat-diagram-form';
import useQuerySeatConfiguration from '@/seat-diagrams/hooks/use-query-seat-configuration';
import useQuerySeatDiagram from '@/seat-diagrams/hooks/use-query-seat-diagram';
import useSeatDiagramMutations from '@/seat-diagrams/hooks/use-seat-diagram-mutations';
import useUpdateSeatConfigMutation from '@/seat-diagrams/hooks/use-update-seat-config-mutation';
import routes from '@/services/routes';

export default function EditSeatDiagramPage() {
  const router = useRouter();
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const { itemId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQuerySeatDiagram({
    itemId,
    enabled: isValidId,
  });
  const { update: updateSeatDiagram } = useSeatDiagramMutations();
  const updateSeatConfiguration = useUpdateSeatConfigMutation();
  const { data: seatConfiguration, isLoading: isLoadingSeatConfiguration } =
    useQuerySeatConfiguration({
      seatDiagramId: itemId,
      enabled: isValidId,
    });

  const handleSubmit = async (values: SeatDiagramFormValues) => {
    await updateSeatDiagram.mutateWithToast(
      { id: itemId, values },
      {
        standalone: false,
      },
    );
    await updateSeatConfiguration.mutateWithToast(
      {
        seatDiagramId: itemId,
        seats: values.seatConfiguration
          .map((floor) => floor.spaces.map((space) => space))
          .flat(),
      },
      {
        standalone: false,
        onSuccess: () => {
          router.push(routes.seatDiagrams.getDetailsRoute(itemId.toString()));
        },
        onError: () => {
          router.push(routes.seatDiagrams.getDetailsRoute(itemId.toString()));
        },
      },
    );
  };

  if (isLoading || isLoadingSeatConfiguration) {
    return <SeatDiagramFormSkeleton />;
  }

  if (!data || !seatConfiguration) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeader
        title={tSeatDiagrams('edit.title')}
        description={data?.name}
        backHref={routes.seatDiagrams.getDetailsRoute(itemId.toString())}
      />
      <SeatDiagramForm
        defaultValues={{
          ...data,
          seatConfiguration: createFloorsFromSeatConfiguration(
            seatConfiguration.data,
          ) as SeatDiagramFormValues['seatConfiguration'],
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
