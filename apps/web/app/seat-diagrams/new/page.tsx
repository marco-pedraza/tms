'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import SeatDiagramForm, {
  SeatDiagramFormValues,
} from '@/app/seat-diagrams/components/seat-diagram-form/seat-diagram-form';
import PageHeader from '@/components/page-header';
import useSeatDiagramMutations from '@/seat-diagrams/hooks/use-seat-diagram-mutations';
import useUpdateSeatConfigMutation from '@/seat-diagrams/hooks/use-update-seat-config-mutation';
import routes from '@/services/routes';

export default function NewSeatDiagramPage() {
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const { create: createSeatDiagram } = useSeatDiagramMutations();
  const updateSeatConfiguration = useUpdateSeatConfigMutation();
  const router = useRouter();

  const onSubmit = async (data: SeatDiagramFormValues) => {
    const seatDiagram = await createSeatDiagram.mutateWithToast(data, {
      standalone: false,
    });
    await updateSeatConfiguration.mutateWithToast(
      {
        seatDiagramId: seatDiagram.id,
        seats: data.seatConfiguration
          .map((floor) => floor.spaces.map((space) => space))
          .flat(),
      },
      {
        standalone: false,
        onSuccess: () => {
          router.push(
            routes.seatDiagrams.getDetailsRoute(seatDiagram.id.toString()),
          );
        },
        onError: () => {
          router.push(
            routes.seatDiagrams.getDetailsRoute(seatDiagram.id.toString()),
          );
        },
      },
    );
  };

  return (
    <main className="container mx-auto p-6">
      <PageHeader
        title={tSeatDiagrams('pages.new.title')}
        description={tSeatDiagrams('pages.new.subtitle')}
        backHref={routes.seatDiagrams.index}
        backLabel={tSeatDiagrams('actions.backToList')}
      />

      <div className="mt-8">
        <SeatDiagramForm onSubmit={onSubmit} />
      </div>
    </main>
  );
}
