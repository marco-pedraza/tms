import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, facilities } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying all facilities.
 *
 * This hook provides a reusable query for fetching facilities with pagination.
 * It handles query setup, caching, and error handling.
 */
export default function useQueryAllFacilities(): UseQueryResult<
  facilities.Facilities,
  APIError
> {
  return useQuery<facilities.Facilities, APIError>({
    queryKey: ['allFacilities'],
    queryFn: () => imsClient.inventory.listFacilities(),
  });
}
