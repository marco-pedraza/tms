import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, installations } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryInstallationParams {
  installationId: number;
  enabled?: boolean;
}

/**
 * Hook to fetch a single installation by ID
 */
export default function useQueryInstallation({
  installationId,
  enabled = true,
}: UseQueryInstallationParams): UseQueryResult<
  installations.InstallationWithDetails,
  APIError
> {
  return useQuery({
    queryKey: ['installations', installationId],
    queryFn: () => imsClient.inventory.getInstallation(installationId),
    enabled,
  });
}
