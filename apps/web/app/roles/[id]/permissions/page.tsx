'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Search, ShieldCheck, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { permissions } from '@repo/ims-client';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import RoleSkeleton from '@/roles/components/role-skeleton';
import useAssignPermissionsMutation from '@/roles/hooks/use-assign-permissions-mutation';
import useQueryAllPermissions from '@/roles/hooks/use-query-all-permissions';
import useQueryPermissionGroups from '@/roles/hooks/use-query-permission-groups';
import useQueryRole from '@/roles/hooks/use-query-role';
import routes from '@/services/routes';

interface GroupedPermissions {
  groupId: number | null;
  groupName: string;
  groupCode?: string;
  permissions: permissions.Permission[];
}

export default function RolePermissionsPage() {
  const tRoles = useTranslations('roles');
  const { itemId: roleId, isValidId } = useCollectionItemDetailsParams();

  const { data: role, isLoading: isLoadingRole } = useQueryRole({
    itemId: roleId,
    enabled: isValidId,
  });

  const { data: permissionsData, isLoading: isLoadingPermissions } =
    useQueryAllPermissions();
  const { data: groupsData, isLoading: isLoadingGroups } =
    useQueryPermissionGroups();
  const assignPermissionsMutation = useAssignPermissionsMutation();

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<number>
  >(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<number | null>>(
    new Set(),
  );

  // Initialize selected permissions from role data
  useEffect(() => {
    if (role?.permissions) {
      setSelectedPermissionIds(new Set(role.permissions.map((p) => p.id)));
    }
  }, [role]);

  // Group permissions by permissionGroupId
  const groupedPermissions = useMemo<GroupedPermissions[]>(() => {
    if (!permissionsData?.permissions) return [];

    const groups = new Map<number | null, GroupedPermissions>();

    // Create a map of group IDs to group info
    const groupMap = new Map<number, { name: string; code: string }>();
    if (groupsData?.permissionGroups) {
      groupsData.permissionGroups.forEach((group) => {
        groupMap.set(group.id, { name: group.name, code: group.code });
      });
    }

    permissionsData.permissions.forEach((permission) => {
      const groupId = permission.permissionGroupId;

      if (!groups.has(groupId)) {
        const groupInfo = groupId !== null ? groupMap.get(groupId) : undefined;
        groups.set(groupId, {
          groupId,
          groupName: groupInfo?.name ?? tRoles('permissionsPage.noGroup'),
          groupCode: groupInfo?.code,
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
  }, [permissionsData, groupsData, tRoles]);

  // Filter permissions based on search term
  const filteredGroupedPermissions = useMemo(() => {
    if (!searchTerm.trim()) return groupedPermissions;

    const lowerSearch = searchTerm.toLowerCase();
    return groupedPermissions
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (p) =>
            p.name.toLowerCase().includes(lowerSearch) ||
            p.description?.toLowerCase().includes(lowerSearch),
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [groupedPermissions, searchTerm]);

  // Calculate changes
  const originalPermissionIds = useMemo(
    () => new Set(role?.permissions?.map((p) => p.id) || []),
    [role],
  );

  const hasChanges = useMemo(() => {
    if (selectedPermissionIds.size !== originalPermissionIds.size) return true;
    for (const id of selectedPermissionIds) {
      if (!originalPermissionIds.has(id)) return true;
    }
    return false;
  }, [selectedPermissionIds, originalPermissionIds]);

  const addedCount = useMemo(() => {
    let count = 0;
    for (const id of selectedPermissionIds) {
      if (!originalPermissionIds.has(id)) count++;
    }
    return count;
  }, [selectedPermissionIds, originalPermissionIds]);

  const removedCount = useMemo(() => {
    let count = 0;
    for (const id of originalPermissionIds) {
      if (!selectedPermissionIds.has(id)) count++;
    }
    return count;
  }, [selectedPermissionIds, originalPermissionIds]);

  const handleTogglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleToggleGroup = (groupPermissions: permissions.Permission[]) => {
    const groupPermissionIds = groupPermissions.map((p) => p.id);
    const allSelected = groupPermissionIds.every((id) =>
      selectedPermissionIds.has(id),
    );

    setSelectedPermissionIds((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        groupPermissionIds.forEach((id) => newSet.delete(id));
      } else {
        groupPermissionIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleToggleGroupExpansion = (groupId: number | null) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    setExpandedGroups(
      new Set(filteredGroupedPermissions.map((g) => g.groupId)),
    );
  };

  const handleCollapseAll = () => {
    setExpandedGroups(new Set());
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      await assignPermissionsMutation.mutateWithToast({
        roleId,
        permissionIds: Array.from(selectedPermissionIds),
      });
    } catch {
      // Error is already handled by the toast mutation
      // This catch prevents the error from propagating to Next.js error boundary
    }
  };

  const handleReset = () => {
    setSelectedPermissionIds(new Set(originalPermissionIds));
  };

  if (isLoadingRole || isLoadingPermissions || isLoadingGroups) {
    return <RoleSkeleton />;
  }

  if (!role) {
    return null;
  }

  const isLoading = assignPermissionsMutation.isPending;

  return (
    <div className="pb-20">
      <PageHeader
        title={`${role.name} - ${tRoles('permissionsPage.title')}`}
        description={tRoles('permissionsPage.description')}
        backHref={routes.roles.getDetailsRoute(roleId.toString())}
      />

      {/* Search and Actions Bar */}
      <div className="sticky top-0 z-10 bg-background pb-4 mb-6 border-b">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tRoles('permissionsPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="pl-9"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandAll}
              disabled={
                expandedGroups.size === filteredGroupedPermissions.length
              }
            >
              {tRoles('buttons.expandAll')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCollapseAll}
              disabled={expandedGroups.size === 0}
            >
              {tRoles('buttons.collapseAll')}
            </Button>
          </div>
        </div>

        {/* Summary Panel - Animated height */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            hasChanges ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          <div className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                {tRoles('permissionsPage.changesDetected')}
              </span>
              <div className="flex items-center gap-3 text-xs text-orange-700 dark:text-orange-300">
                {addedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {addedCount}{' '}
                    {tRoles('permissionsPage.added', { count: addedCount })}
                  </span>
                )}
                {removedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {removedCount}{' '}
                    {tRoles('permissionsPage.removed', { count: removedCount })}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-orange-700 hover:text-orange-900 hover:bg-orange-100 h-7 px-2 text-xs"
            >
              {tRoles('buttons.reset')}
            </Button>
          </div>
        </div>
      </div>

      {/* Permission Groups */}
      <div className="space-y-4">
        {filteredGroupedPermissions.map((group) => {
          const isExpanded = expandedGroups.has(group.groupId);
          const selectedCount = group.permissions.filter((p) =>
            selectedPermissionIds.has(p.id),
          ).length;
          const totalCount = group.permissions.length;
          const allSelected = selectedCount === totalCount;
          const someSelected = selectedCount > 0 && selectedCount < totalCount;

          return (
            <Card key={group.groupId ?? 'no-group'} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={tRoles('permissionsPage.toggleGroup', {
                  groupName: group.groupName,
                })}
                onClick={() => {
                  handleToggleGroupExpansion(group.groupId);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleGroupExpansion(group.groupId);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={() => {
                        handleToggleGroup(group.permissions);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <CardTitle className="text-lg">
                        {group.groupName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedCount} / {totalCount}{' '}
                        {tRoles('permissionsPage.selected')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={selectedCount > 0 ? 'default' : 'secondary'}>
                    {selectedCount}
                  </Badge>
                </div>
              </CardHeader>

              {isExpanded && (
                <>
                  <Separator />
                  <CardContent className="pt-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.permissions.map((permission) => {
                        const isSelected = selectedPermissionIds.has(
                          permission.id,
                        );

                        return (
                          <div
                            key={permission.id}
                            className={`
                              flex items-start gap-3 p-3 rounded-lg border transition-all
                              ${
                                isSelected
                                  ? 'bg-primary/5 border-primary/20'
                                  : 'bg-background border-border hover:bg-muted/50'
                              }
                              cursor-pointer
                            `}
                            role="button"
                            tabIndex={0}
                            aria-label={tRoles(
                              'permissionsPage.togglePermission',
                              {
                                permissionName: permission.name,
                              },
                            )}
                            onClick={() => {
                              handleTogglePermission(permission.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleTogglePermission(permission.id);
                              }
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {
                                handleTogglePermission(permission.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {permission.name}
                              </div>
                              {permission.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {filteredGroupedPermissions.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {searchTerm
              ? tRoles('permissionsPage.noPermissionsFound')
              : tRoles('permissionsPage.noPermissionsAvailable')}
          </CardContent>
        </Card>
      )}

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {selectedPermissionIds.size}{' '}
              {tRoles('permissionsPage.permissionsSelected')}
              {permissionsData?.permissions &&
                ` / ${permissionsData.permissions.length}`}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
                {isLoading
                  ? tRoles('buttons.saving')
                  : tRoles('buttons.saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
