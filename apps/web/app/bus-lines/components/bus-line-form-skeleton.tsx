import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function BusLineFormSkeleton() {
  const tBusLines = useTranslations('busLines');
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

      {/* Edit Form Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">
          {tBusLines('details.description')}
        </h2>

        <div className="space-y-6">
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
              {tCommon('fields.code')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.description')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Transporter Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.transporter')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Service Type Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.serviceType')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Price per Kilometer */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tBusLines('fields.pricePerKilometer')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Fleet Size */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tBusLines('fields.fleetSize')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.website')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.email')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {tCommon('fields.phone')}
            </Label>
            <Skeleton className="h-10 w-full rounded-md" />
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
