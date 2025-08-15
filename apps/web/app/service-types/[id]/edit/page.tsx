'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';
import ServiceTypeForm, {
  ServiceTypeFormValues,
} from '../../components/service-type-form';
import ServiceTypeFormSkeleton from '../../components/service-type-form-skeleton';
import useQueryServiceType from '../../hooks/use-query-service-type';
import useServiceTypeAmenityMutations from '../../hooks/use-service-type-amenity-mutations';
import useServiceTypeMutations from '../../hooks/use-service-type-mutations';

export default function EditServiceTypePage() {
  const t = useTranslations('serviceTypes');
  const { itemId: serviceTypeId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryServiceType({
    itemId: serviceTypeId,
    enabled: isValidId,
  });
  const { update } = useServiceTypeMutations();
  const { assignAmenities } = useServiceTypeAmenityMutations();

  const handleSubmit = async (values: ServiceTypeFormValues) => {
    const { amenityIds = [], ...updatePayload } = values;
    const apiValues = {
      ...updatePayload,
      description: updatePayload.description ?? '',
    };

    // Update service type
    await update.mutateWithToast({ id: serviceTypeId, values: apiValues });

    // Update amenities assignment
    await assignAmenities.mutateWithToast(
      { id: serviceTypeId, amenityIds },
      { standalone: false },
    );
  };

  if (isLoading) {
    return <ServiceTypeFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={t('edit.title')}
        description={`${data.name}`}
        backHref={routes.serviceTypes.index}
      />
      <ServiceTypeForm
        defaultValues={{
          ...data,
          description: data.description ?? '',
          amenityIds: data.amenities?.map((a) => a.id) ?? [],
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
