'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import PathwayForm, {
  PathwayFormValues,
} from '@/pathways/components/pathway-form';
import PathwayFormSkeleton from '@/pathways/components/pathway-form-skeleton';
import usePathwayMutations from '@/pathways/hooks/use-pathway-mutations';
import usePathwayOptionMutations from '@/pathways/hooks/use-pathway-option-mutations';
import useQueryAllPathwayOptions from '@/pathways/hooks/use-query-all-pathway-options';
import useQueryPathway from '@/pathways/hooks/use-query-pathway';
import routes from '@/services/routes';

export default function EditPathwayPage() {
  const tPathways = useTranslations('pathways');
  const { itemId: pathwayId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryPathway({
    itemId: pathwayId,
    enabled: isValidId,
  });
  const { update: updatePathway } = usePathwayMutations();
  const { syncPathwayOptions } = usePathwayOptionMutations();
  const { data: pathwayOptions, isLoading: isLoadingPathwayOptions } =
    useQueryAllPathwayOptions(pathwayId);
  const router = useRouter();

  const handleSubmit = async (values: PathwayFormValues) => {
    await updatePathway.mutateWithToast(
      {
        id: pathwayId,
        values,
      },
      {
        standalone: false,
      },
    );

    await syncPathwayOptions.mutateWithToast({
      pathwayId,
      options: values.options,
    });

    // Navigate to the pathway details page after all operations are complete
    router.push(routes.pathways.getDetailsRoute(pathwayId.toString()));
  };

  if (isLoading || isLoadingPathwayOptions) {
    return <PathwayFormSkeleton />;
  }

  if (!data || !pathwayOptions) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tPathways('edit.title')}
        description={`${data?.name} (${data?.code})`}
        backHref={routes.pathways.index}
      />
      <PathwayForm
        defaultValues={{
          ...data,
          options: pathwayOptions.data.map((option) => ({
            ...option,
            name: option.name ?? '',
            description: option.description ?? '',
            distanceKm: option.distanceKm ?? 0,
            typicalTimeMin: option.typicalTimeMin ?? 0,
            avgSpeedKmh: option.avgSpeedKmh ?? 0,
            isDefault: option.isDefault ?? false,
            isPassThrough: option.isPassThrough ?? false,
            passThroughTimeMin: option.passThroughTimeMin ?? null,
            active: option.active ?? false,
            sequence: option.sequence ?? 0,
            tolls: option.tolls?.map((toll) => ({
              ...toll,
              distance: toll.distance ?? 0,
            })),
          })),
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
