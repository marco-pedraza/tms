import { useQuery } from '@tanstack/react-query';
import imsClient from '@/services/ims-client';

interface UseQueryDriverMedicalChecksParams {
  driverId: number;
  enabled?: boolean;
}

/**
 * Hook for querying driver medical checks
 * @param params - Query parameters including driverId and enabled flag
 * @returns Query result with medical checks data
 */
export default function useQueryDriverMedicalChecks({
  driverId,
  enabled = true,
}: UseQueryDriverMedicalChecksParams) {
  return useQuery({
    queryKey: ['drivers', driverId, 'medical-checks'],
    queryFn: () =>
      imsClient.inventory.listDriverMedicalChecks(driverId, {
        orderBy: [{ field: 'id', direction: 'desc' }],
      }),
    enabled: enabled && !!driverId,
  });
}
