'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { amenities } from '@repo/ims-client';
import AmenityForm, {
  AmenityFormValues,
} from '@/amenities/components/amenity-form';
import useAmenitiesMutations from '@/amenities/hooks/use-amenities-mutations';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

const INSTALLATION_AMENITY_TYPE: amenities.AmenityType = 'installation';
/**
 * Page for creating a new amenity
 */
export default function NewAmenityPage() {
  const router = useRouter();
  const tAmenities = useTranslations('amenities');
  const { create } = useAmenitiesMutations();

  /**
   * Handle form submission for creating a new amenity
   * The amenityType is always set to "installation"
   */
  async function handleSubmit(values: AmenityFormValues) {
    const payload = {
      ...values,
      amenityType: INSTALLATION_AMENITY_TYPE,
      // Convert empty strings to null for optional fields
      description: values.description?.trim() || null,
      iconName: values.iconName?.trim() || null,
    };

    const result = await create.mutateWithToast(payload);
    router.push(routes.amenities.getDetailsRoute(result.id.toString()));
  }

  return (
    <div>
      <PageHeader
        title={tAmenities('actions.create')}
        backHref={routes.amenities.index}
        backLabel={tAmenities('actions.backToList')}
      />

      <AmenityForm onSubmit={handleSubmit} />
    </div>
  );
}
