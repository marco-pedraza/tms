'use client';

import { ArrowLeft, Pencil, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DriverSkeleton() {
  const tDrivers = useTranslations('drivers');
  const tCommon = useTranslations('common');

  return (
    <div>
      {/* Header skeleton */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">{tCommon('actions.backToList')}</span>
        </Button>
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
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

      {/* Content cards */}
      <div className="grid gap-6">
        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>{tDrivers('sections.personalInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tDrivers('fields.driverKey')}:</dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">{tDrivers('fields.payrollKey')}:</dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">{tCommon('fields.fullName')}:</dt>
              <dd>
                <Skeleton className="h-6 w-48" />
              </dd>

              <dt className="font-medium">{tCommon('fields.phone')}:</dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">{tCommon('fields.email')}:</dt>
              <dd>
                <Skeleton className="h-6 w-40" />
              </dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <Skeleton className="h-6 w-20 rounded-full" />
              </dd>

              <dt className="font-medium">{tDrivers('fields.statusDate')}:</dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">{tDrivers('fields.address')}:</dt>
              <dd>
                <Skeleton className="h-6 w-48" />
              </dd>

              <dt className="font-medium">
                {tDrivers('fields.emergencyContactName')}:
              </dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">
                {tDrivers('fields.emergencyContactPhone')}:
              </dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">
                {tDrivers('fields.emergencyContactRelationship')}:
              </dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>
            </dl>
          </CardContent>
        </Card>

        {/* Job Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>{tDrivers('sections.jobInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tDrivers('fields.hireDate')}:</dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">{tDrivers('fields.busLine')}:</dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">{tDrivers('fields.transporter')}:</dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">{tDrivers('fields.license')}:</dt>
              <dd>
                <Skeleton className="h-6 w-32" />
              </dd>

              <dt className="font-medium">
                {tDrivers('fields.licenseExpiry.title')}:
              </dt>
              <dd className="flex items-center gap-2">
                <Skeleton className="h-6 w-32" />
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
                <Skeleton className="h-6 w-8" />
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
