import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton component for transporter form loading states.
 */
export default function TransporterFormSkeleton() {
  const tTransporters = useTranslations('transporters');
  const tCommon = useTranslations('common');

  return (
    <div>
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

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
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
              <Skeleton className="h-20 w-full rounded-md" />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center space-x-2 pt-2">
              <Label className="text-sm font-medium">
                {tCommon('fields.active')}
              </Label>
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Company Information Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Legal Name Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tTransporters('fields.legalName')}
              </Label>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* License Number Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tTransporters('fields.licenseNumber')}
              </Label>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Headquarter City Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tTransporters('fields.headquarterCity')}
              </Label>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tTransporters('fields.address')}
              </Label>
              <Skeleton className="h-20 w-full rounded-md" />
            </div>

            {/* Logo URL Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tTransporters('fields.logoUrl')}
              </Label>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tCommon('fields.email')}
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

            {/* Website Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tCommon('fields.website')}
              </Label>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Contact Info Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tTransporters('fields.contactInfo')}
              </Label>
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
