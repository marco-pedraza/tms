'use client';

import { useTranslations } from 'next-intl';
import AmenityForm, {
  AmenityFormValues,
} from '@/amenities/components/amenity-form';
import AmenityFormSkeleton from '@/amenities/components/amenity-form-skeleton';
import useAmenitiesMutations from '@/amenities/hooks/use-amenities-mutations';
import useQueryAmenity from '@/amenities/hooks/use-query-amenity';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

/**
 * Page for editing an existing amenity
 */
export default function EditAmenityPage() {
  const tAmenities = useTranslations('amenities');
  const { itemId: amenityId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryAmenity({
    amenityId,
    enabled: isValidId,
  });
  const { update } = useAmenitiesMutations();

  /**
   * Handle form submission for updating an amenity
   */
  async function handleSubmit(values: AmenityFormValues) {
    await update.mutateWithToast({ id: amenityId, values });
  }

  if (isLoading) {
    return <AmenityFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tAmenities('edit.title')}
        description={data.name}
        backHref={routes.amenities.getDetailsRoute(amenityId.toString())}
        backLabel={tAmenities('actions.backToList')}
      />
      <AmenityForm
        defaultValues={{
          ...data,
          description: data.description || '',
          iconName: data.iconName || '',
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
