import { ArrowLeft, Pencil, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton component for the transporter detail page loading state
 */
export default function TransporterSkeleton() {
  const tCommon = useTranslations('common');
  const tTransporters = useTranslations('transporters');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-2">
        <Button variant="ghost" size="icon" className="mr-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">{tCommon('actions.backToList')}</span>
        </Button>
        <div>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end mb-6">
        <div className="flex gap-2">
          <Button variant="outline" disabled className="gap-2">
            <Pencil className="h-4 w-4" />
            <Skeleton className="h-4 w-12" />
          </Button>
          <Button variant="destructive" disabled className="gap-2">
            <Trash className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              {/* Name */}
              <div className="font-medium">{tCommon('fields.name')}:</div>
              <Skeleton className="h-5 w-32" />

              {/* Code */}
              <div className="font-medium">{tCommon('fields.code')}:</div>
              <Skeleton className="h-5 w-24" />

              {/* Description */}
              <div className="font-medium">
                {tCommon('fields.description')}:
              </div>
              <Skeleton className="h-5 w-full" />

              {/* Active */}
              <div className="font-medium">{tCommon('fields.active')}:</div>
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
        </Card>

        {/* Company Information Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              {/* Legal Name */}
              <div className="font-medium">
                {tTransporters('fields.legalName')}:
              </div>
              <Skeleton className="h-5 w-40" />

              {/* License Number */}
              <div className="font-medium">
                {tTransporters('fields.licenseNumber')}:
              </div>
              <Skeleton className="h-5 w-32" />

              {/* Headquarter City */}
              <div className="font-medium">
                {tTransporters('fields.headquarterCity')}:
              </div>
              <Skeleton className="h-5 w-36" />

              {/* Address */}
              <div className="font-medium">
                {tTransporters('fields.address')}:
              </div>
              <Skeleton className="h-5 w-full" />

              {/* Logo URL */}
              <div className="font-medium">
                {tTransporters('fields.logoUrl')}:
              </div>
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              {/* Email */}
              <div className="font-medium">{tCommon('fields.email')}:</div>
              <Skeleton className="h-5 w-48" />

              {/* Phone */}
              <div className="font-medium">{tCommon('fields.phone')}:</div>
              <Skeleton className="h-5 w-32" />

              {/* Website */}
              <div className="font-medium">{tCommon('fields.website')}:</div>
              <Skeleton className="h-5 w-40" />

              {/* Contact Info */}
              <div className="font-medium">
                {tTransporters('fields.contactInfo')}:
              </div>
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* System Information Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              {/* ID */}
              <div className="font-medium">{tCommon('fields.id')}:</div>
              <Skeleton className="h-5 w-8" />

              {/* Created At */}
              <div className="font-medium">{tCommon('fields.createdAt')}:</div>
              <Skeleton className="h-5 w-40" />

              {/* Updated At */}
              <div className="font-medium">{tCommon('fields.updatedAt')}:</div>
              <Skeleton className="h-5 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
