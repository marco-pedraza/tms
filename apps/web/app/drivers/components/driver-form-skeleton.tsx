'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent } from '@/components/ui/tabs';

export default function DriverFormSkeleton() {
  const tDrivers = useTranslations('drivers');
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

      <Tabs defaultValue="basic">
        {/* Tab Navigation */}
        <div className="mb-4">
          <Skeleton className="h-10 w-80 rounded-md" />
        </div>

        <TabsContent value="basic" className="mt-0">
          <Card className="p-6">
            {/* Section Title */}
            <h2 className="text-lg font-semibold mb-6">
              {tDrivers('sections.personalInfo')}
            </h2>

            {/* Driver Key and Payroll Key */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tDrivers('fields.driverKey')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tDrivers('fields.payrollKey')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            {/* First Name and Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tCommon('fields.firstName')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tCommon('fields.lastName')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            {/* Phone Number and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tCommon('fields.phone')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tCommon('fields.email')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2 mb-6">
              <Label className="text-sm font-medium">
                {tDrivers('fields.address')}
              </Label>
              <Skeleton className="h-20 w-full rounded-md" />
            </div>

            {/* Emergency Contact - Name, Phone, Relationship */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tDrivers('fields.emergencyContactName')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tDrivers('fields.emergencyContactPhone')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tDrivers('fields.emergencyContactRelationship')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="job" className="mt-0">
          <Card className="p-6">
            {/* Section Title */}
            <h2 className="text-lg font-semibold mb-6">
              {tDrivers('sections.jobInfo')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hire Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tDrivers('fields.hireDate')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Bus Line */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tDrivers('fields.busLine')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tCommon('fields.status')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Status Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tDrivers('fields.statusDate')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* License */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tDrivers('fields.license')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* License Expiry */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {tDrivers('fields.licenseExpiry.title')}
                </Label>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
