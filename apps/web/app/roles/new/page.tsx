'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import RoleForm, { RoleFormValues } from '@/roles/components/role-form';
import useRoleMutations from '@/roles/hooks/use-role-mutations';
import routes from '@/services/routes';

export default function NewRolePage() {
  const t = useTranslations('roles');
  const { create: createRole } = useRoleMutations();

  const handleSubmit = async (values: RoleFormValues) => {
    const apiValues = {
      ...values,
      description: values.description ?? '',
    };
    await createRole.mutateWithToast(apiValues);
  };

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.roles.index}
        backLabel={t('actions.backToList')}
      />
      <RoleForm onSubmit={handleSubmit} />
    </div>
  );
}
