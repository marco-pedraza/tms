'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import TransporterForm from '@/transporters/components/transporter-form';
import useTransporterMutations from '@/transporters/hooks/use-transporter-mutations';

export default function NewTransporterPage() {
  const t = useTranslations('transporters');
  const tCommon = useTranslations('common');
  const { createTransporter } = useTransporterMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.transporters.index}
        backLabel={t('actions.backToList')}
      />
      <TransporterForm
        onSubmit={createTransporter.mutateWithToast}
        submitButtonText={tCommon('actions.create')}
      />
    </div>
  );
}
