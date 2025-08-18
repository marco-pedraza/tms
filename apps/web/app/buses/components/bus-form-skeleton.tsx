import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function BusFormSkeleton() {
  const tCommon = useTranslations('common');

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      {/* Header with back button and title */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">{tCommon('actions.backToList')}</span>
        </Button>
        <div>
          <Skeleton className="h-8 w-40 mb-1" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">
          {tCommon('sections.basicInfo')}
        </h2>

        <div className="space-y-6">
          {/* Registration Number Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Registration Number</Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Economic Number Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Economic Number</Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Status Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Capacity Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Max Capacity</Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-2 pt-2">
            <Skeleton className="h-5 w-10 rounded-full" />
            <Label className="text-sm font-medium">
              {tCommon('fields.active')}
            </Label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-8">
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </Card>
    </div>
  );
}
