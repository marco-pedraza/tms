import type { nodes } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<nodes.Node, nodes.CreateNodePayload>({
  queryKey: ['nodes'],
  translationKey: 'nodes',
  createMutationFn: (payload) => imsClient.inventory.createNode(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteNode(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateNode(id, payload),
  routes: routes.nodes,
});
