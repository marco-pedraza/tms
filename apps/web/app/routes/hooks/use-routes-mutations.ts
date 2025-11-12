import type { routes } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routesService from '@/services/routes';

/**
 * Collection mutations hook for route resources in IMS
 *
 * This hook provides create, update, and delete mutations for routes,
 * wired to the IMS inventory client.
 */
const useRoutesMutations = createCollectionMutations<
  routes.Route,
  routes.CreateRoutePayload
>({
  queryKey: ['routes'],
  translationKey: 'routes',
  createMutationFn: (payload) => imsClient.inventory.createRoute(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteRoute(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateRoute(id, payload),
  routes: routesService.routes,
});

export default useRoutesMutations;
