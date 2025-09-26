import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface UserFormSkeletonProps {
  isEditMode?: boolean;
}

export default function UserFormSkeleton({
  isEditMode = false,
}: UserFormSkeletonProps) {
  const tUsers = useTranslations('users');
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

      <FormLayout title={tUsers('form.title')}>
        {/* Grid of form fields matching the exact order from user-form.tsx */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.firstName')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Last Name Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.lastName')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Username Field - only shown for new users */}
          {!isEditMode ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tUsers('fields.username')}
              </Label>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ) : (
            <div></div>
          )}

          {/* Password Field - only shown for new users */}
          {!isEditMode ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tUsers('fields.password')}
              </Label>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ) : (
            <div></div>
          )}

          {/* Department Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tUsers('fields.department')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.email')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Position Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tUsers('fields.position')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Employee ID Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tUsers('fields.employeeId')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.phone')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        {/* Switch fields section */}
        <div className="space-y-4">
          {/* System Admin Switch */}
          <div className="space-x-2">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">
                {tUsers('fields.isSystemAdmin')}
              </Label>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
            <Skeleton className="h-4 w-64 mt-1" />
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
        </div>

        <FormFooter>
          <Skeleton className="h-10 w-24 rounded-md" />
        </FormFooter>
      </FormLayout>
    </div>
  );
}
