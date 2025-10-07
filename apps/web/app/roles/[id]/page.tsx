'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import RoleSkeleton from '@/roles/components/role-skeleton';
import useQueryRole from '@/roles/hooks/use-query-role';
import useRoleMutations from '@/roles/hooks/use-role-mutations';
import routes from '@/services/routes';

export default function RoleDetailsPage() {
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const { itemId: roleId, isValidId } = useCollectionItemDetailsParams();
  const { data: role, isLoading } = useQueryRole({
    itemId: roleId,
    enabled: isValidId,
  });
  const { delete: deleteRole } = useRoleMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteRole.mutateWithToast(roleId);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <RoleSkeleton />;
  }

  if (!role) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={role.name}
        description={tRoles('details.description')}
        backHref={routes.roles.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.roles.getEditRoute(role.id.toString())}
          onDelete={handleDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.name')}:</dt>
              <dd>{role.name}</dd>

              <dt className="font-medium">{tCommon('fields.description')}:</dt>
              <dd>{role.description || '-'}</dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <IsActiveBadge isActive={role.active} />
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>{role.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {role.createdAt
                  ? new Date(role.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {role.updatedAt
                  ? new Date(role.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      {role.permissions && role.permissions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {tRoles('details.permissionsTitle')} ({role.permissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <Badge key={permission.id} variant="secondary">
                  {permission.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!role.permissions || role.permissions.length === 0) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{tRoles('details.permissionsTitle')} (0)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {tRoles('details.noPermissionsAssigned')}
            </p>
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
