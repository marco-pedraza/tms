'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import TransporterForm from '@/transporters/components/transporter-form';
import useTransporterMutations from '@/transporters/hooks/use-transporter-mutations';

export default function NewTransporterPage() {
  const { create: createTransporter } = useTransporterMutations();
  const tTransporters = useTranslations('transporters');

  return (
    <div>
      <PageHeader
        title={tTransporters('actions.create')}
        backHref={routes.transporters.index}
        backLabel={tTransporters('actions.backToList')}
      />
      <TransporterForm onSubmit={createTransporter.mutateWithToast} />
    </div>
  );
}
