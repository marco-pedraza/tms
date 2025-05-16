'use client';

import { useTranslations } from 'next-intl';
import ServiceTypeForm, {
  ServiceTypeFormValues,
} from '@/app/service-types/components/service-type-form';
import useServiceTypeMutations from '@/app/service-types/hooks/use-service-type-mutations';
import PageHeader from '@/components/page-header';

export default function NewServiceTypePage() {
  const t = useTranslations('serviceTypes');
  const tCommon = useTranslations('common');
  const { createServiceType } = useServiceTypeMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref="/service-types"
        backLabel={t('actions.backToList')}
      />
      <ServiceTypeForm
        onSubmit={createServiceType.mutateWithToast}
        submitButtonText={tCommon('actions.create')}
      />
    </div>
  );
}
