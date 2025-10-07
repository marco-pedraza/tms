'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import SeatDiagramForm, {
  SeatDiagramFormValues,
} from '@/app/seat-diagrams/components/seat-diagram-form/seat-diagram-form';
import PageHeader from '@/components/page-header';
import SeatDiagramFormSkeleton from '@/seat-diagrams/components/seat-diagram-form-skeleton';
import { createFloorsFromSeatConfiguration } from '@/seat-diagrams/components/seat-diagram-form/create-floors-from-quick-config';
import useQuerySeatConfiguration from '@/seat-diagrams/hooks/use-query-seat-configuration';
import useQuerySeatDiagram from '@/seat-diagrams/hooks/use-query-seat-diagram';
import useSeatDiagramMutations from '@/seat-diagrams/hooks/use-seat-diagram-mutations';
import useUpdateSeatConfigMutation from '@/seat-diagrams/hooks/use-update-seat-config-mutation';
import routes from '@/services/routes';

export default function NewSeatDiagramPage() {
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const { create: createSeatDiagram } = useSeatDiagramMutations();
  const updateSeatConfiguration = useUpdateSeatConfigMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  // Parse templateId to number if provided
  const templateIdNumber = templateId ? parseInt(templateId) : null;
  const isValidTemplateId = Boolean(
    templateIdNumber && !isNaN(templateIdNumber),
  );

  // Query template data if templateId is provided
  const { data: templateData, isLoading: isLoadingTemplate } =
    useQuerySeatDiagram({
      itemId: templateIdNumber ?? 0,
      enabled: isValidTemplateId,
    });

  const {
    data: templateSeatConfiguration,
    isLoading: isLoadingTemplateConfig,
  } = useQuerySeatConfiguration({
    seatDiagramId: templateIdNumber ?? 0,
    enabled: isValidTemplateId,
  });

  const onSubmit = async (data: SeatDiagramFormValues) => {
    const seatDiagram = await createSeatDiagram.mutateWithToast(data, {
      standalone: false,
    });
    await updateSeatConfiguration.mutateWithToast(
      {
        seatDiagramId: seatDiagram.id,
        seats: data.seatConfiguration
          .map((floor) => floor.spaces.map((space) => space))
          .flat()
          .map((space) => ({
            ...space,
            // @ts-expect-error - @todo improve typing
            reclinementAngle: space.reclinementAngle || undefined,
          })),
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

  // Show loading skeleton while fetching template data
  if (isValidTemplateId && (isLoadingTemplate || isLoadingTemplateConfig)) {
    return <SeatDiagramFormSkeleton />;
  }

  // Prepare default values from template if available
  const defaultValues: SeatDiagramFormValues | undefined =
    templateData && templateSeatConfiguration
      ? {
          ...templateData,
          name: `${templateData.name} - ${tSeatDiagrams('form.copySuffix')}`, // Add "- Copia" to distinguish from original
          seatConfiguration: createFloorsFromSeatConfiguration(
            templateSeatConfiguration.data,
          ) as SeatDiagramFormValues['seatConfiguration'],
        }
      : undefined;

  const pageTitle =
    isValidTemplateId && templateData
      ? tSeatDiagrams('pages.newBasedOn.title')
      : tSeatDiagrams('pages.new.title');

  const pageDescription =
    isValidTemplateId && templateData
      ? tSeatDiagrams('pages.newBasedOn.subtitle', {
          templateName: templateData.name,
        })
      : tSeatDiagrams('pages.new.subtitle');

  return (
    <main className="container mx-auto p-6">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        backHref={routes.seatDiagrams.index}
        backLabel={tSeatDiagrams('actions.backToList')}
      />

      <div className="mt-8">
        <SeatDiagramForm onSubmit={onSubmit} defaultValues={defaultValues} />
      </div>
    </main>
  );
}
