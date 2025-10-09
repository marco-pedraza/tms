import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import FormFooter from '@/components/form/form-footer';
import FormLayout from '@/components/form/form-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChangePasswordFormSkeleton() {
  const tUsers = useTranslations('users');

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
            {/* Description skeleton - user name */}
            <Skeleton className="h-5 w-64 mt-1" />
          </div>
        </div>
      </div>

      <FormLayout title={tUsers('changePassword.form.title')}>
        <div className="space-y-6">
          {/* New Password Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tUsers('changePassword.fields.newPassword')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tUsers('changePassword.fields.confirmPassword')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Current Password Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tUsers('changePassword.fields.currentPassword')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        <FormFooter>
          <Skeleton className="h-10 w-32 rounded-md" />
        </FormFooter>
      </FormLayout>
    </div>
  );
}
