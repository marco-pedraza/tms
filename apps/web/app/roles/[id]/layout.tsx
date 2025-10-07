'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import RoleNotFound from '@/roles/components/role-not-found';
import useQueryRole from '@/roles/hooks/use-query-role';
import routes from '@/services/routes';

export default function RoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tRoles = useTranslations('roles');
  const { itemId: roleId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryRole({
    itemId: roleId,
    enabled: isValidId,
  });
  const isRoleNotFound = !isValidId || error?.code === 'not_found';

  if (isRoleNotFound) {
    return <RoleNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.roles.index}
        backLabel={tRoles('actions.backToList')}
      />
    );
  }

  return children;
}
