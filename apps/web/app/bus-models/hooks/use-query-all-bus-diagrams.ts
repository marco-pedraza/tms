import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, bus_diagram_models } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Fetches all bus diagram models sorted by name.
 *
 * @returns React Query result object containing bus diagram models data or error
 * @example
 * ```tsx
 * const { data, isLoading, error } = useQueryAllBusDiagrams();
 * ```
 * @note Uses queryKey: ['allBusDiagramModels'] for caching
 */
export function useQueryAllBusDiagrams(): UseQueryResult<
  bus_diagram_models.ListBusDiagramModelsResult,
  APIError
> {
  return useQuery<bus_diagram_models.ListBusDiagramModelsResult, APIError>({
    queryKey: ['allBusDiagrams'],
    queryFn: () =>
      imsClient.inventory.listBusDiagramModels({
        orderBy: [
          {
            field: 'name',
            direction: 'asc',
          },
        ],
      }),
  });
}
