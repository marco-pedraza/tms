import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { APIError, amenities } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryAmenityParams {
  amenityId: number;
  enabled?: boolean;
}

export default function useQueryAmenity({
  amenityId,
  enabled = true,
}: UseQueryAmenityParams): UseQueryResult<amenities.Amenity, APIError> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['amenities', amenityId],
    queryFn: () => imsClient.inventory.getAmenity(amenityId),
    enabled,
    initialData: () =>
      queryClient
        .getQueryData<amenities.PaginatedListAmenitiesResult>(['amenities'])
        ?.data.find((amenity) => amenity.id === amenityId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<amenities.PaginatedListAmenitiesResult>([
        'amenities',
      ])?.dataUpdatedAt,
  });
}
