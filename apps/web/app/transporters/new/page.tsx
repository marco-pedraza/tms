'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import TransporterForm, {
  TransporterFormOutputValues,
} from '@/transporters/components/transporter-form';
import useTransporterMutations from '@/transporters/hooks/use-transporter-mutations';

export default function NewTransporterPage() {
  const { create: createTransporter } = useTransporterMutations();
  const tCommon = useTranslations('common');
  const tTransporters = useTranslations('transporters');

  const onSubmit = async (values: TransporterFormOutputValues) => {
    return await createTransporter.mutateWithToast(values);
  };

  return (
    <div>
      <PageHeader
        title={tCommon('actions.create')}
        backHref={routes.transporters.index}
        backLabel={tTransporters('actions.backToList')}
      />
      <TransporterForm onSubmit={onSubmit} />
    </div>
  );
}
