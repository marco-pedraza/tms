'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import DriverForm from '@/drivers/components/driver-form';
import useDriverMutations from '@/drivers/hooks/use-driver-mutations';
import routes from '@/services/routes';

export default function NewDriverPage() {
  const t = useTranslations('drivers');
  const { create: createDriver } = useDriverMutations();

  return (
    <div>
      <PageHeader title={t('actions.create')} backHref={routes.drivers.index} />
      <DriverForm onSubmit={createDriver.mutateWithToast} />
    </div>
  );
}
