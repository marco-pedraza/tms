'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';
import { TransporterFormOutputValues } from '@/transporters/components/transporter-form';
import TransporterForm from '@/transporters/components/transporter-form';
import TransporterFormSkeleton from '@/transporters/components/transporter-form-skeleton';
import useQueryTransporter from '@/transporters/hooks/use-query-transporter';
import useTransporterMutations from '@/transporters/hooks/use-transporter-mutations';

export default function EditTransporterPage() {
  const tTransporters = useTranslations('transporters');
  const { itemId: transporterId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryTransporter({
    itemId: transporterId,
    enabled: isValidId,
  });
  const { update: updateTransporter } = useTransporterMutations();

  const handleSubmit = async (values: TransporterFormOutputValues) => {
    return await updateTransporter.mutateWithToast({
      id: transporterId,
      values,
    });
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
        title={tTransporters('actions.update')}
        description={data.name}
        backHref={routes.transporters.index}
      />
      <TransporterForm
        defaultValues={{
          ...data,
          description: data.description || '',
          legalName: data.legalName || '',
          address: data.address || '',
          website: data.website || '',
          email: data.email || '',
          phone: data.phone || '',
          logoUrl: data.logoUrl || '',
          contactInfo: data.contactInfo || '',
          licenseNumber: data.licenseNumber || '',
          headquarterCityId: data.headquarterCityId || undefined,
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
