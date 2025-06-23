import {
  UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { countries } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface QueryCountryError extends Error {
  code?: string;
  status?: number;
}

interface UseQueryCountryProps {
  countryId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a country by ID.
 *
 * This hook provides a reusable query for fetching a country by its ID.
 * It handles query setup, caching, and error handling.
 */
export default function useQueryCountry({
  countryId,
  enabled = true,
}: UseQueryCountryProps): UseQueryResult<countries.Country, QueryCountryError> {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['country', countryId],
    enabled,
    queryFn: () => imsClient.inventory.getCountry(countryId),
    initialData: () =>
      queryClient
        .getQueryData<countries.PaginatedListCountriesResult>(['countries'])
        ?.data.find((country) => country.id === countryId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<countries.PaginatedListCountriesResult>([
        'countries',
      ])?.dataUpdatedAt,
  });

  return query;
}
