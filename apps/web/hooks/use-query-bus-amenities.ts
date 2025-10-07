import { useQuery } from '@tanstack/react-query';
import imsClient from '@/services/ims-client';

/**
 * Hook for fetching bus amenities for seat assignment
 *
 * Fetches all active bus amenities ordered by category and name
 * for use in seat configuration forms
 */
export function useQueryBusAmenities() {
  return useQuery({
    queryKey: ['amenities', 'bus'],
    queryFn: async () => {
      const response = await imsClient.inventory.listAmenities({
        filters: {
          amenityType: 'bus',
          active: true,
        },
        orderBy: [
          { field: 'category', direction: 'asc' },
          { field: 'name', direction: 'asc' },
        ],
      });
      return response.data;
    },
  });
}
