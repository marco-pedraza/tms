import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, amenities } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook that fetches all active bus amenities from the inventory service.
 * This hook is designed for use in form selectors where all available bus amenities are needed.
 */
export default function useQueryAllBusAmenities(): UseQueryResult<
  amenities.ListAmenitiesResult,
  APIError
> {
  return useQuery<amenities.ListAmenitiesResult, APIError>({
    queryKey: [
      'amenities',
      'for',
      'buses',
      {
        active: true,
        amenityType: 'bus',
        orderBy: 'name',
        direction: 'asc',
      },
    ],
    queryFn: () =>
      imsClient.inventory.listAmenities({
        orderBy: [
          {
            field: 'name',
            direction: 'asc',
          },
        ],
        filters: {
          active: true,
          amenityType: 'bus',
        },
      }),
  });
}
