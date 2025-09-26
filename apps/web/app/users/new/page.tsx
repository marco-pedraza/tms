'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import UserForm, { UserFormValues } from '@/users/components/user-form';
import useUserMutations from '@/users/hooks/use-user-mutations';

export default function NewUserPage() {
  const t = useTranslations('users');
  const { create: createUser } = useUserMutations();

  const handleSubmit = async (values: UserFormValues) => {
    const apiValues = {
      ...values,
      position: values.position ?? '',
      employeeId: values.employeeId ?? '',
      phone: values.phone ?? undefined,
      username: values.username || '',
      password: values.password || '',
    };
    await createUser.mutateWithToast(apiValues);
  };

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.users.index}
        backLabel={t('actions.backToList')}
      />
      <UserForm onSubmit={handleSubmit} />
    </div>
  );
}
