'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import PathwayForm, {
  PathwayFormValues,
} from '@/pathways/components/pathway-form';
import PathwayFormSkeleton from '@/pathways/components/pathway-form-skeleton';
import usePathwayMutations from '@/pathways/hooks/use-pathway-mutations';
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

  const handleSubmit = (values: PathwayFormValues) =>
    updatePathway.mutateWithToast({
      id: pathwayId,
      values,
    });

  if (isLoading) {
    return <PathwayFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tPathways('edit.title')}
        description={`${data?.name} (${data?.code})`}
        backHref={routes.pathways.index}
      />
      <PathwayForm defaultValues={data} onSubmit={handleSubmit} />
    </div>
  );
}
