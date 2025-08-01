import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError } from '@repo/ims-client';
import imsClient from '@/services/ims-client';
import { type ListInstallationSchemasResult } from '@/types/installation-schemas';

interface UseQueryInstallationTypeSchemasProps {
  installationTypeId?: number | null;
  enabled?: boolean;
}

/**
 * Custom hook for querying installation type schemas by installation type ID
 * Used for dynamic form generation based on installation type schema definitions
 */
export default function useQueryInstallationTypeSchemas({
  installationTypeId,
  enabled = true,
}: UseQueryInstallationTypeSchemasProps): UseQueryResult<
  ListInstallationSchemasResult,
  APIError
> {
  return useQuery({
    queryKey: ['installationTypes', installationTypeId, 'schemas'],
    enabled: enabled && !!installationTypeId,
    queryFn: () => {
      if (!installationTypeId) {
        throw new Error('Installation type ID is required');
      }
      return imsClient.inventory.getInstallationTypeSchema(installationTypeId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - schemas don't change frequently
  });
}
