'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';
import DepartmentForm, {
  DepartmentFormValues,
} from '../../components/department-form';
import DepartmentFormSkeleton from '../../components/department-form-skeleton';
import DepartmentNotFound from '../../components/department-not-found';
import useDepartmentMutations from '../../hooks/use-department-mutations';
import useQueryDepartment from '../../hooks/use-query-department';

export default function EditDepartmentPage() {
  const tDepartments = useTranslations('departments');
  const { itemId: departmentId, isValidId } = useCollectionItemDetailsParams();
  const { data: department, isLoading } = useQueryDepartment({
    itemId: departmentId,
    enabled: isValidId,
  });
  const { update } = useDepartmentMutations();

  const handleSubmit = (values: DepartmentFormValues) =>
    update.mutateWithToast({ id: departmentId, values });

  if (isLoading) {
    return <DepartmentFormSkeleton isEditMode />;
  }

  if (!department) {
    return <DepartmentNotFound />;
  }

  return (
    <div>
      <PageHeader
        title={tDepartments('edit.title')}
        description={`${department.name} (${department.code})`}
        backHref={routes.departments.index}
      />
      <Suspense fallback={<DepartmentFormSkeleton isEditMode />}>
        <DepartmentForm
          defaultValues={{
            name: department.name,
            code: department.code,
            description: department.description ?? undefined,
            isActive: department.isActive,
          }}
          onSubmit={handleSubmit}
        />
      </Suspense>
    </div>
  );
}
