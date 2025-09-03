import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { APIError, bus_diagram_models } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying all seat diagrams without pagination.
 *
 * This hook is useful for dropdowns and other components that need
 * a complete list of seat diagrams.
 */
export default function useQueryAllSeatDiagrams(): UseQueryResult<
  bus_diagram_models.ListBusDiagramModelsResult,
  APIError
> {
  return useQuery({
    queryKey: ['allSeatDiagrams'],
    queryFn: () =>
      imsClient.inventory.listBusDiagramModels({
        orderBy: [{ field: 'name', direction: 'asc' }],
        filters: { active: true },
      }),
  });
}
