'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import RoleForm, { RoleFormValues } from '@/roles/components/role-form';
import RoleFormSkeleton from '@/roles/components/role-form-skeleton';
import useQueryRole from '@/roles/hooks/use-query-role';
import useRoleMutations from '@/roles/hooks/use-role-mutations';
import routes from '@/services/routes';

export default function EditRolePage() {
  const tRoles = useTranslations('roles');
  const { itemId: roleId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryRole({
    itemId: roleId,
    enabled: isValidId,
  });
  const { update: updateRole } = useRoleMutations();

  const handleSubmit = async (values: RoleFormValues) => {
    const apiValues = {
      ...values,
      description: values.description ?? '',
    };
    await updateRole.mutateWithToast({ id: roleId, values: apiValues });
  };

  if (isLoading) {
    return <RoleFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tRoles('edit.title')}
        description={`${data?.name}`}
        backHref={routes.roles.index}
      />
      <RoleForm
        defaultValues={{
          name: data.name,
          description: data.description ?? '',
          active: data.active,
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
