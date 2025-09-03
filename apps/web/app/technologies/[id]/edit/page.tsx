'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';
import TechnologyForm, {
  TechnologyFormValues,
} from '@/technologies/components/technology-form';
import TechnologyFormSkeleton from '@/technologies/components/technology-form-skeleton';
import useQueryTechnology from '@/technologies/hooks/use-query-technology';
import useTechnologyMutations from '@/technologies/hooks/use-technology-mutations';

export default function EditTechnologyPage() {
  const tTechnologies = useTranslations('technologies');
  const { itemId: technologyId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryTechnology({
    itemId: technologyId,
    enabled: isValidId,
  });
  const { update: updateTechnology } = useTechnologyMutations();

  const handleSubmit = (values: TechnologyFormValues) =>
    updateTechnology.mutateWithToast({
      id: technologyId,
      values,
    });

  if (isLoading) {
    return <TechnologyFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tTechnologies('edit.title')}
        description={`${data?.name} (${data?.provider})`}
        backHref={routes.technologies.index}
      />
      <TechnologyForm defaultValues={data} onSubmit={handleSubmit} />
    </div>
  );
}
