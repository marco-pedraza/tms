import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, countries } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying all countries.
 *
 * This hook provides a reusable query for fetching countries with pagination.
 * It handles query setup, caching, and error handling.
 */
export default function useQueryAllCountries(): UseQueryResult<
  countries.Countries,
  APIError
> {
  return useQuery<countries.Countries, APIError>({
    queryKey: ['allCountries'],
    queryFn: () => imsClient.inventory.listCountries({}),
  });
}
