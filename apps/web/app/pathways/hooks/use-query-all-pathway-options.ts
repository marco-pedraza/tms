import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, pathway_options } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllPathwayOptions(
  pathwayId: number,
): UseQueryResult<pathway_options.ListPathwayOptionsResult, APIError> {
  return useQuery<pathway_options.ListPathwayOptionsResult, APIError>({
    queryKey: ['allPathwaysOptions', pathwayId],
    queryFn: () => imsClient.inventory.getPathwayOptions(pathwayId),
  });
}
