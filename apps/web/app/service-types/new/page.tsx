'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import ServiceTypeForm from '../components/service-type-form';
import useServiceTypeMutations from '../hooks/use-service-type-mutations';

export default function NewServiceTypePage() {
  const t = useTranslations('serviceTypes');
  const { create: createServiceType } = useServiceTypeMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.serviceTypes.index}
        backLabel={t('actions.backToList')}
      />
      <ServiceTypeForm onSubmit={createServiceType.mutateWithToast} />
    </div>
  );
}
