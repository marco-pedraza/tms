import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

/**
 * Component displayed when an amenity is not found or doesn't exist.
 */
export default function AmenityNotFound() {
  const tAmenities = useTranslations('amenities');

  return (
    <NotFound
      title={tAmenities('errors.notFound.title')}
      description={tAmenities('errors.notFound.description')}
      backHref={routes.amenities.index}
      backLabel={tAmenities('actions.backToList')}
    />
  );
}
