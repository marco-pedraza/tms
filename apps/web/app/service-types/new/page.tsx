'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import ServiceTypeForm from '@/service-types/components/service-type-form';
import useServiceTypeMutations from '@/service-types/hooks/use-service-type-mutations';
import routes from '@/services/routes';

export default function NewServiceTypePage() {
  const t = useTranslations('serviceTypes');
  const tCommon = useTranslations('common');
  const { createServiceType } = useServiceTypeMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.serviceTypes.index}
        backLabel={t('actions.backToList')}
      />
      <ServiceTypeForm
        onSubmit={createServiceType.mutateWithToast}
        submitButtonText={tCommon('actions.create')}
      />
    </div>
  );
}
