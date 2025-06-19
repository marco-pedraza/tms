import type { APIError, drivers } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

export default createCollectionQuery<
  drivers.Driver,
  drivers.PaginatedListDriversResult,
  APIError
>({
  queryKey: ['drivers'],
  queryFn: (params) => imsClient.inventory.listDriversPaginated(params),
});
