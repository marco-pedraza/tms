'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';
import DepartmentSkeleton from '../components/department-skeleton';
import useDepartmentMutations from '../hooks/use-department-mutations';
import useQueryDepartment from '../hooks/use-query-department';

export default function DepartmentDetailsPage() {
  const tDepartments = useTranslations('departments');
  const tCommon = useTranslations('common');
  const { itemId: departmentId, isValidId } = useCollectionItemDetailsParams();
  const { data: department, isLoading } = useQueryDepartment({
    itemId: departmentId,
    enabled: isValidId,
  });
  const { delete: deleteDepartment } = useDepartmentMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteDepartment.mutateWithToast(departmentId);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <DepartmentSkeleton />;
  }

  if (!department) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={department.name}
        description={tDepartments('details.description')}
        backHref={routes.departments.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.departments.getEditRoute(department.id.toString())}
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
              <dd>{department.name}</dd>

              <dt className="font-medium">{tDepartments('fields.code')}:</dt>
              <dd>{department.code}</dd>

              <dt className="font-medium">{tCommon('fields.description')}:</dt>
              <dd>{department.description || '-'}</dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <IsActiveBadge isActive={department.isActive} />
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
              <dd>{department.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {department.createdAt
                  ? new Date(department.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {department.updatedAt
                  ? new Date(department.updatedAt).toLocaleString()
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
