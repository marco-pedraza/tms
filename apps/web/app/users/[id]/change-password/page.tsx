'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';
import ChangePasswordForm from '@/users/components/change-password-form';
import ChangePasswordFormSkeleton from '@/users/components/change-password-form-skeleton';
import useChangePasswordMutation from '@/users/hooks/use-change-password-mutation';
import useQueryUser from '@/users/hooks/use-query-user';

export default function ChangePasswordPage() {
  const tUsers = useTranslations('users');
  const { itemId: userId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryUser({
    itemId: userId,
    enabled: isValidId,
  });
  const changePasswordMutation = useChangePasswordMutation();

  const handleSubmit = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    await changePasswordMutation.mutateWithToast({
      userId,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  if (isLoading) {
    return <ChangePasswordFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tUsers('changePassword.title')}
        description={`${data?.firstName} ${data?.lastName}`}
        backHref={routes.users.index}
      />
      <ChangePasswordForm onSubmit={handleSubmit} />
    </div>
  );
}
