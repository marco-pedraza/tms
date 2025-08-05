import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, event_types } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryInstallationTypeEventsProps {
  installationTypeId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a events for a given installation type.
 */
export default function useQueryInstallationTypeEvents({
  installationTypeId,
  enabled = true,
}: UseQueryInstallationTypeEventsProps): UseQueryResult<
  event_types.EventType[],
  APIError
> {
  return useQuery({
    queryKey: ['installationType', installationTypeId, 'events'],
    queryFn: async () => {
      const installationType =
        await imsClient.inventory.getInstallationType(installationTypeId);
      return installationType.eventTypes;
    },
    enabled,
  });
}
