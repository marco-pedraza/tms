import type { users } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  users.SafeUser,
  users.CreateUserPayload
>({
  queryKey: ['users'],
  translationKey: 'users',
  createMutationFn: (payload) => imsClient.users.createUser(payload),
  deleteMutationFn: (id) => imsClient.users.deleteUser(id),
  updateMutationFn: (id, payload) => imsClient.users.updateUser(id, payload),
  routes: routes.users,
});
