import type { APIError, amenities } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

const INSTALLATION_AMENITY: amenities.AmenityType = 'installation';

/**
 * Custom hook for querying a paginated list of installation amenities
 *
 * This hook provides a reusable query for fetching amenities with pagination
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  amenities.Amenity,
  amenities.PaginatedListAmenitiesResult,
  APIError
>({
  queryKey: ['amenities'],
  queryFn: (params) => {
    const { filters } = params;

    return imsClient.inventory.listAmenitiesPaginated({
      ...params,
      filters: {
        amenityType: INSTALLATION_AMENITY,
        ...filters,
      },
    });
  },
});
