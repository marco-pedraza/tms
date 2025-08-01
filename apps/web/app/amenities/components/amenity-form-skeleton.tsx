import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton component for amenity form loading states.
 */
export default function AmenityFormSkeleton() {
  const tAmenities = useTranslations('amenities');
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
          {tAmenities('form.title')}
        </h2>

        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.name')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.category')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Icon Name Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tAmenities('fields.iconName')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.description')}
            </Label>
            <Skeleton className="h-20 w-full rounded-md" />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-2 pt-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.active')}
            </Label>
            <Skeleton className="h-5 w-10 rounded-full" />
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
