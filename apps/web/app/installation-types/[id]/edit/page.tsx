'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import InstallationTypeForm from '@/installation-types/components/installation-type-form';
import { InstallationTypeFormValues } from '@/installation-types/components/installation-type-form';
import InstallationTypeFormSkeleton from '@/installation-types/components/installation-type-form-skeleton';
import useInstallationTypeMutations from '@/installation-types/hooks/use-installation-type-mutations';
import useQueryInstallationType from '@/installation-types/hooks/use-query-installation-type';
import routes from '@/services/routes';

export default function EditInstallationTypePage() {
  const tInstallationTypes = useTranslations('installationTypes');
  const { itemId: installationTypeId, isValidId } =
    useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryInstallationType({
    itemId: installationTypeId,
    enabled: isValidId,
  });
  const { update: updateInstallationType } = useInstallationTypeMutations();

  const handleSubmit = (values: InstallationTypeFormValues) => {
    return updateInstallationType.mutateWithToast({
      id: installationTypeId,
      values,
    });
  };

  if (isLoading) {
    return <InstallationTypeFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tInstallationTypes('edit.title')}
        description={data.name}
        backHref={routes.installationTypes.index}
      />
      <InstallationTypeForm
        defaultValues={{
          ...data,
          description: data.description ?? undefined,
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
