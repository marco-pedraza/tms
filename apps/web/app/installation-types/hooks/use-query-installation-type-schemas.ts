import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, installation_schemas } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryInstallationTypeSchemasProps {
  installationTypeId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a installation type schemas by installation type ID
 */
export default function useQueryInstallationTypeSchemas({
  installationTypeId,
  enabled = true,
}: UseQueryInstallationTypeSchemasProps): UseQueryResult<
  installation_schemas.ListInstallationSchemasResult,
  APIError
> {
  return useQuery({
    queryKey: ['installationTypes', installationTypeId, 'schemas'],
    enabled,
    queryFn: () =>
      imsClient.inventory.getInstallationTypeSchema(installationTypeId),
  });
}
