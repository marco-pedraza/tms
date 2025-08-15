import { useQuery } from '@tanstack/react-query';
import type { APIError, amenities } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

const SERVICE_TYPE_AMENITY: amenities.AmenityType = 'service_type';

/**
 * Hook to query service type amenities using non-paginated endpoint
 */
export default function useQueryServiceTypeAmenities() {
  return useQuery<amenities.ListAmenitiesResult, APIError>({
    queryKey: ['service-type-amenities'],
    queryFn: () =>
      imsClient.inventory.listAmenities({
        orderBy: [{ field: 'name', direction: 'asc' }],
        filters: { amenityType: SERVICE_TYPE_AMENITY },
      }),
  });
}
