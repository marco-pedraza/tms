'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { permissions } from '@repo/ims-client';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import RoleSkeleton from '@/roles/components/role-skeleton';
import useQueryPermissionGroups from '@/roles/hooks/use-query-permission-groups';
import useQueryRole from '@/roles/hooks/use-query-role';
import useRoleMutations from '@/roles/hooks/use-role-mutations';
import routes from '@/services/routes';

interface GroupedPermissions {
  groupId: number | null;
  groupName: string;
  groupCode?: string;
  permissions: permissions.Permission[];
}

export default function RoleDetailsPage() {
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const { itemId: roleId, isValidId } = useCollectionItemDetailsParams();
  const { data: role, isLoading } = useQueryRole({
    itemId: roleId,
    enabled: isValidId,
  });
  const { data: groupsData, isLoading: isLoadingGroups } =
    useQueryPermissionGroups();
  const { delete: deleteRole } = useRoleMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Group permissions by permissionGroupId
  const groupedPermissions = useMemo<GroupedPermissions[]>(() => {
    if (!role?.permissions) return [];

    const groups = new Map<number | null, GroupedPermissions>();

    // Create a map of group IDs to group info
    const groupMap = new Map<number, { name: string; code: string }>();
    if (groupsData?.permissionGroups) {
      groupsData.permissionGroups.forEach((group) => {
        groupMap.set(group.id, { name: group.name, code: group.code });
      });
    }

    role.permissions.forEach((permission) => {
      const groupId = permission.permissionGroupId;

      if (!groups.has(groupId)) {
        const groupInfo = groupId !== null ? groupMap.get(groupId) : undefined;
        groups.set(groupId, {
          groupId,
          groupName: groupInfo?.name ?? tRoles('permissionsPage.noGroup'),
          groupCode:
            groupInfo?.code ?? (groupId === null ? 'no_group' : undefined),
          permissions: [],
        });
      }

      groups.get(groupId)?.permissions.push(permission);
    });

    // Convert to array and sort: named groups first, then "No Group"
    return Array.from(groups.values()).sort((a, b) => {
      if (a.groupId === null) return 1;
      if (b.groupId === null) return -1;
      return a.groupName.localeCompare(b.groupName);
    });
  }, [role, groupsData, tRoles]);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteRole.mutateWithToast(roleId);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading || isLoadingGroups) {
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>
              {tRoles('details.permissionsTitle')} ({role.permissions.length})
            </CardTitle>
            <Link
              href={
                routes.roles.getPermissionsRoute?.(role.id.toString()) ?? '#'
              }
            >
              <Button variant="outline" size="sm">
                <ShieldCheck className="h-4 w-4" />
                {tRoles('details.managePermissions')}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedPermissions.map((group) => (
                <div
                  key={group.groupId ?? 'no-group'}
                  className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm leading-none tracking-tight">
                        {group.groupName}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="h-5 min-w-[1.5rem] justify-center px-1.5 text-xs font-medium"
                      >
                        {group.permissions.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {group.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                      >
                        <div className="mt-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary/10">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                        </div>
                        <span className="flex-1 leading-tight text-muted-foreground">
                          {permission.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!role.permissions || role.permissions.length === 0) && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>{tRoles('details.permissionsTitle')} (0)</CardTitle>
            <Link
              href={
                routes.roles.getPermissionsRoute?.(role.id.toString()) ?? '#'
              }
            >
              <Button variant="outline" size="sm">
                <ShieldCheck className="h-4 w-4" />
                {tRoles('details.managePermissions')}
              </Button>
            </Link>
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
