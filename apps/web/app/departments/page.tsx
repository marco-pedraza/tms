'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import { DepartmentsTable } from './components/departments-table';

export default function DepartmentsPage() {
  const tDepartments = useTranslations('departments');

  return (
    <div>
      <PageHeader
        title={tDepartments('title')}
        description={tDepartments('description')}
        createHref={routes.departments.new}
        createLabel={tDepartments('actions.create')}
      />
      <Suspense>
        <DepartmentsTable />
      </Suspense>
    </div>
  );
}
