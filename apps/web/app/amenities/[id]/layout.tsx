'use client';

import { useTranslations } from 'next-intl';
import AmenityNotFound from '@/amenities/components/amenity-not-found';
import useQueryAmenity from '@/amenities/hooks/use-query-amenity';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

/**
 * Layout component for amenity detail pages
 *
 * Handles common error states and resource not found cases,
 * while allowing children to handle their own loading states
 */
export default function AmenityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tAmenities = useTranslations('amenities');
  const { itemId: amenityId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryAmenity({
    amenityId,
    enabled: isValidId,
  });
  const isAmenityNotFound = !isValidId || error?.code === 'not_found';

  if (isAmenityNotFound) {
    return <AmenityNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.amenities.index}
        backLabel={tAmenities('actions.backToList')}
      />
    );
  }

  return children;
}
