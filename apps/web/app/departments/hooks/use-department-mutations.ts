import type { departments } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  departments.Department,
  departments.CreateDepartmentPayload
>({
  queryKey: ['departments'],
  translationKey: 'departments',
  createMutationFn: (payload) => imsClient.users.createDepartment(payload),
  deleteMutationFn: (id) => imsClient.users.deleteDepartment(id),
  updateMutationFn: (id, payload) =>
    imsClient.users.updateDepartment(id, payload),
  routes: routes.departments,
});
