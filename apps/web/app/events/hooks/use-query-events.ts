import type { APIError, event_types } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of event types.
 *
 * This hook provides a reusable query for fetching event types with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  event_types.EventType,
  event_types.PaginatedListEventTypesResult,
  APIError
>({
  queryKey: ['events'],
  queryFn: (params) => imsClient.inventory.listEventTypesPaginated(params),
});
