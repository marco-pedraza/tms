'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import TransporterForm, {
  TransporterFormValues,
} from '@/transporters/components/transporter-form';
import TransporterFormSkeleton from '@/transporters/components/transporter-form-skeleton';
import useQueryTransporter from '@/transporters/hooks/use-query-transporter';
import useTransporterDetailsParams from '@/transporters/hooks/use-transporter-details-params';
import useTransporterMutations from '@/transporters/hooks/use-transporter-mutations';

export default function EditTransporterPage() {
  const tTransporters = useTranslations('transporters');
  const tCommon = useTranslations('common');
  const { transporterId, isValidId } = useTransporterDetailsParams();
  const { data, isLoading } = useQueryTransporter({
    transporterId,
    enabled: isValidId,
  });
  const { updateTransporter } = useTransporterMutations();

  const handleSubmit = (values: TransporterFormValues) => {
    return updateTransporter.mutateWithToast({ id: transporterId, values });
  };

  if (isLoading) {
    return <TransporterFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tTransporters('details.description')}
        description={`${data?.name} (${data?.code})`}
        backHref="/transporters"
      />
      <TransporterForm
        defaultValues={{
          ...data,
          headquarterCityId: data.headquarterCityId || undefined,
          description: data.description || undefined,
          website: data.website || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          licenseNumber: data.licenseNumber || undefined,
          logoUrl: data.logoUrl || undefined,
        }}
        onSubmit={handleSubmit}
        submitButtonText={tCommon('actions.update')}
      />
    </div>
  );
}
