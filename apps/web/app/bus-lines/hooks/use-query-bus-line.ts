import type { APIError, bus_lines } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

export default createCollectionItemQuery<
  bus_lines.BusLineWithTransporterAndServiceType,
  bus_lines.PaginatedListBusLinesResult,
  APIError
>({
  collectionQueryKey: ['busLines'],
  queryFn: (itemId) => imsClient.inventory.getBusLine(itemId),
});
