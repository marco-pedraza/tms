'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';
import UserForm, { UserFormValues } from '@/users/components/user-form';
import UserFormSkeleton from '@/users/components/user-form-skeleton';
import useQueryUser from '@/users/hooks/use-query-user';
import useUserMutations from '@/users/hooks/use-user-mutations';

export default function EditUserPage() {
  const tUsers = useTranslations('users');
  const { itemId: userId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryUser({
    itemId: userId,
    enabled: isValidId,
  });
  const { update: updateUser } = useUserMutations();

  const handleSubmit = async (values: UserFormValues) => {
    const apiValues = {
      ...values,
      position: values.position ?? '',
      employeeId: values.employeeId ?? '',
      phone: values.phone ?? undefined,
    };
    await updateUser.mutateWithToast({ id: userId, values: apiValues });
  };

  if (isLoading) {
    return <UserFormSkeleton isEditMode={true} />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tUsers('edit.title')}
        description={`${data?.firstName} ${data?.lastName}`}
        backHref={routes.users.index}
      />
      <UserForm
        defaultValues={{
          ...data,
          position: data.position ?? '',
          employeeId: data.employeeId ?? '',
          phone: data.phone ?? '',
          password: '',
          roleIds: data.roles?.map((role) => role.id) || [],
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
