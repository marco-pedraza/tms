import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, amenities } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook that fetches all active installation amenities from the inventory service.
 * This hook is designed for use in form selectors where all available amenities are needed.
 */
export default function useQueryAllInstallationAmenities(): UseQueryResult<
  amenities.ListAmenitiesResult,
  APIError
> {
  return useQuery<amenities.ListAmenitiesResult, APIError>({
    queryKey: [
      'amenities',
      'for',
      'installations',
      {
        active: true,
        amenityType: 'installation',
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
          amenityType: 'installation',
        },
      }),
  });
}
