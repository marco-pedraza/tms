import type { APIError, routes } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

// Define a compatible type that satisfies the constraint
interface RouteListResult {
  data: routes.RouteEnriched[];
}

export default createCollectionItemQuery<
  routes.RouteEnriched,
  RouteListResult,
  APIError
>({
  collectionQueryKey: ['routes'],
  queryFn: (routeId) => imsClient.inventory.getRoute(routeId),
});
