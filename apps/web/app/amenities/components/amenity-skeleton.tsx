import { ArrowLeft, Pencil, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton component for the amenity detail page loading state
 */
export default function AmenitySkeleton() {
  const tCommon = useTranslations('common');

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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              {/* Name */}
              <div className="font-medium">{tCommon('fields.name')}:</div>
              <Skeleton className="h-5 w-32" />

              {/* Category */}
              <div className="font-medium">{tCommon('fields.category')}:</div>
              <Skeleton className="h-6 w-24 rounded-full" />

              {/* Icon */}
              <div className="font-medium">Icon:</div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>

              {/* Description */}
              <div className="font-medium">
                {tCommon('fields.description')}:
              </div>
              <Skeleton className="h-5 w-full" />

              {/* Status */}
              <div className="font-medium">{tCommon('fields.status')}:</div>
              <Skeleton className="h-6 w-20 rounded-full" />
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
