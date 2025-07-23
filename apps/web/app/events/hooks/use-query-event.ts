import type { APIError, event_types } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

export default createCollectionItemQuery<
  event_types.EventType,
  event_types.PaginatedListEventTypesResult,
  APIError
>({
  collectionQueryKey: ['events'],
  queryFn: (eventId) => imsClient.inventory.getEventType(eventId),
});
