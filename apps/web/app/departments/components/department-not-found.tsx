'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import routes from '@/services/routes';

export default function DepartmentNotFound() {
  const tCommon = useTranslations('common');
  const tDepartments = useTranslations('departments');

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h1 className="text-4xl font-bold mb-4">
          {tDepartments('notFound.title')}
        </h1>
        <p className="text-muted-foreground mb-6">
          {tDepartments('notFound.description')}
        </p>
        <Link href={routes.departments.index}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {tCommon('actions.backToList')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
