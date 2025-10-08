import { ArrowLeft, Pencil, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserSkeleton() {
  const tCommon = useTranslations('common');
  const tUsers = useTranslations('users');

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header with back button and title */}
      <div className="flex items-center mb-2">
        <Button variant="ghost" size="icon" className="mr-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">{tCommon('actions.backToList')}</span>
        </Button>
        <div>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 mb-6">
        <Button variant="outline" disabled className="gap-2">
          <Pencil className="h-4 w-4" />
          <Skeleton className="h-4 w-12" />
        </Button>
        <Button variant="destructive" disabled className="gap-2">
          <Trash className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information Card */}
        <Card className="p-6">
          <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="font-medium">{tCommon('fields.firstName')}:</div>
              <Skeleton className="h-6 w-24" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tCommon('fields.lastName')}:</div>
              <Skeleton className="h-6 w-24" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tUsers('fields.username')}:</div>
              <Skeleton className="h-6 w-32" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tUsers('fields.department')}:</div>
              <Skeleton className="h-6 w-36" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tCommon('fields.email')}:</div>
              <Skeleton className="h-6 w-48" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tUsers('fields.position')}:</div>
              <Skeleton className="h-6 w-32" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tUsers('fields.employeeId')}:</div>
              <Skeleton className="h-6 w-20" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tCommon('fields.phone')}:</div>
              <Skeleton className="h-6 w-28" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tUsers('fields.roles')}:</div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tCommon('fields.status')}:</div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </Card>

        {/* System Information Card */}
        <Card className="p-6">
          <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="font-medium">{tCommon('fields.id')}:</div>
              <Skeleton className="h-6 w-8" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tUsers('fields.lastLogin')}:</div>
              <Skeleton className="h-6 w-40" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tCommon('fields.createdAt')}:</div>
              <Skeleton className="h-6 w-40" />
            </div>

            <div className="flex justify-between items-start">
              <div className="font-medium">{tCommon('fields.updatedAt')}:</div>
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
