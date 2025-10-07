import type { roles } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<roles.Role, roles.CreateRolePayload>({
  queryKey: ['roles'],
  translationKey: 'roles',
  createMutationFn: (payload) => imsClient.users.createRole(payload),
  deleteMutationFn: (id) => imsClient.users.deleteRole(id),
  updateMutationFn: (id, payload) => imsClient.users.updateRole(id, payload),
  routes: routes.roles,
});
