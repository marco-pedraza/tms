import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface DepartmentFormSkeletonProps {
  isEditMode?: boolean;
}

export default function DepartmentFormSkeleton({
  isEditMode = false,
}: DepartmentFormSkeletonProps) {
  const tDepartments = useTranslations('departments');
  const tCommon = useTranslations('common');

  return (
    <div>
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {/* Back button with real icon */}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              {/* Title skeleton */}
              <Skeleton className="h-8 w-48" />
            </div>
            {/* Description skeleton - only for edit mode */}
            {isEditMode && <Skeleton className="h-5 w-64 mt-1" />}
          </div>
        </div>
      </div>

      <FormLayout title={tDepartments('form.title')}>
        {/* Grid of form fields matching the exact order from department-form.tsx */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.name')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Code Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tDepartments('fields.code')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {tCommon('fields.description')}
          </Label>
          <Skeleton className="h-24 w-full rounded-md" />
        </div>

        {/* Active Switch */}
        <div className="space-x-2">
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.active')}
            </Label>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>

        <FormFooter>
          <Skeleton className="h-10 w-24 rounded-md" />
        </FormFooter>
      </FormLayout>
    </div>
  );
}
