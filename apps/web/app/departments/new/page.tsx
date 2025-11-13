'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import DepartmentForm from '../components/department-form';
import DepartmentFormSkeleton from '../components/department-form-skeleton';
import useDepartmentMutations from '../hooks/use-department-mutations';

export default function NewDepartmentPage() {
  const tDepartments = useTranslations('departments');
  const { create } = useDepartmentMutations();

  return (
    <div>
      <PageHeader
        title={tDepartments('actions.create')}
        backHref={routes.departments.index}
        backLabel={tDepartments('actions.backToList')}
      />
      <Suspense fallback={<DepartmentFormSkeleton />}>
        <DepartmentForm onSubmit={create.mutateWithToast} />
      </Suspense>
    </div>
  );
}
