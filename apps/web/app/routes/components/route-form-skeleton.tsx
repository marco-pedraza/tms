'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function RouteFormSkeleton() {
  const tRoutes = useTranslations('routes');
  const tCommon = useTranslations('common');

  return (
    <div className="container mx-auto p-4 max-w-7xl">
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
        <h2 className="text-lg font-semibold mb-6">{tRoutes('form.title')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tRoutes('form.fields.routeName')}
              </Label>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tRoutes('form.fields.routeCode')}
              </Label>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tRoutes('form.fields.description')}
              </Label>
              <Skeleton className="h-16 w-full rounded-md" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tRoutes('form.fields.busLine')}
              </Label>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Label className="text-sm font-medium">
                {tRoutes('form.fields.activeRoute')}
              </Label>
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          </div>

          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
        </div>

        {/* Route Legs Section */}
        <div className="mt-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>

        {/* Update Button */}
        <div className="flex justify-end mt-8">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </Card>
    </div>
  );
}
