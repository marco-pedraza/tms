import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, technologies } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryBusTechnologiesProps {
  busId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a technologies for a given bus.
 */
export default function useQueryBusTechnologies({
  busId,
  enabled = true,
}: UseQueryBusTechnologiesProps): UseQueryResult<
  technologies.Technology[],
  APIError
> {
  return useQuery({
    queryKey: ['bus', busId, 'technologies'],
    queryFn: async () => {
      const bus = await imsClient.inventory.getBus(busId);
      return bus.technologies;
    },
    enabled,
  });
}
