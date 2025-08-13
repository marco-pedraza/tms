import { ArrowLeft, Pencil, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function BusLineSkeleton() {
  const tCommon = useTranslations('common');
  const tBusLines = useTranslations('busLines');

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Page header skeleton (matches PageHeader) */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">{tCommon('actions.backToList')}</span>
          </Button>
          <div>
            <Skeleton className="h-8 w-48 mb-1" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>

        {/* Action buttons */}
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.name')}:</dt>
              <dd>
                <Skeleton className="h-6 w-40" />
              </dd>

              <dt className="font-medium">{tCommon('fields.code')}:</dt>
              <dd>
                <Skeleton className="h-6 w-28" />
              </dd>

              <dt className="font-medium">{tCommon('fields.description')}:</dt>
              <dd>
                <Skeleton className="h-6 w-60" />
              </dd>

              <dt className="font-medium">
                {tBusLines('fields.transporter')}:
              </dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">
                {tBusLines('fields.serviceType')}:
              </dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">
                {tBusLines('fields.pricePerKilometer')}:
              </dt>
              <dd>
                <Skeleton className="h-6 w-24" />
              </dd>

              <dt className="font-medium">{tBusLines('fields.fleetSize')}:</dt>
              <dd>
                <Skeleton className="h-6 w-16" />
              </dd>

              <dt className="font-medium">{tCommon('fields.website')}:</dt>
              <dd>
                <Skeleton className="h-6 w-48" />
              </dd>

              <dt className="font-medium">{tCommon('fields.email')}:</dt>
              <dd>
                <Skeleton className="h-6 w-44" />
              </dd>

              <dt className="font-medium">{tCommon('fields.phone')}:</dt>
              <dd>
                <Skeleton className="h-6 w-36" />
              </dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <Skeleton className="h-6 w-20 rounded-full" />
              </dd>
            </dl>
          </CardContent>
        </Card>

        {/* System Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>
                <Skeleton className="h-6 w-10" />
              </dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                <Skeleton className="h-6 w-40" />
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                <Skeleton className="h-6 w-40" />
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
