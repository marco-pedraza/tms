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
import routes from '@/services/routes';
import UserSkeleton from '../components/user-skeleton';
import useQueryUser from '../hooks/use-query-user';
import useUserMutations from '../hooks/use-user-mutations';

export default function UserDetailsPage() {
  const tUsers = useTranslations('users');
  const tCommon = useTranslations('common');
  const { itemId: userId, isValidId } = useCollectionItemDetailsParams();
  const { data: user, isLoading } = useQueryUser({
    itemId: userId,
    enabled: isValidId,
  });
  const { delete: deleteUser } = useUserMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteUser.mutateWithToast(userId);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <UserSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={tUsers('details.description')}
        backHref={routes.users.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.users.getEditRoute(userId.toString())}
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
              <dt className="font-medium">{tCommon('fields.firstName')}:</dt>
              <dd>{user.firstName}</dd>

              <dt className="font-medium">{tCommon('fields.lastName')}:</dt>
              <dd>{user.lastName}</dd>

              <dt className="font-medium">{tUsers('fields.username')}:</dt>
              <dd>{user.username}</dd>

              <dt className="font-medium">{tUsers('fields.department')}:</dt>
              <dd>{user.department?.name || '-'}</dd>

              <dt className="font-medium">{tCommon('fields.email')}:</dt>
              <dd>{user.email}</dd>

              <dt className="font-medium">{tUsers('fields.position')}:</dt>
              <dd>{user.position || '-'}</dd>

              <dt className="font-medium">{tUsers('fields.employeeId')}:</dt>
              <dd>{user.employeeId || '-'}</dd>

              <dt className="font-medium">{tCommon('fields.phone')}:</dt>
              <dd>{user.phone || '-'}</dd>

              <dt className="font-medium">{tUsers('fields.roles')}:</dt>
              <dd>
                <div className="flex flex-wrap gap-2">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge key={role.id} variant="secondary">
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <IsActiveBadge isActive={user.active} />
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
              <dd>{user.id}</dd>

              <dt className="font-medium">{tUsers('fields.lastLogin')}:</dt>
              <dd>
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {user.updatedAt
                  ? new Date(user.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
