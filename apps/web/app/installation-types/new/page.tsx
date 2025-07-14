'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import InstallationTypeForm from '@/installation-types/components/installation-type-form';
import useInstallationTypeMutations from '@/installation-types/hooks/use-installation-type-mutations';
import routes from '@/services/routes';

export default function NewInstallationTypePage() {
  const { create: createInstallationType } = useInstallationTypeMutations();
  const tInstallationTypes = useTranslations('installationTypes');

  return (
    <div>
      <PageHeader
        title={tInstallationTypes('actions.create')}
        description={tInstallationTypes('description')}
        backHref={routes.installationTypes.index}
        backLabel={tInstallationTypes('actions.backToList')}
      />

      <InstallationTypeForm onSubmit={createInstallationType.mutateWithToast} />
    </div>
  );
}
