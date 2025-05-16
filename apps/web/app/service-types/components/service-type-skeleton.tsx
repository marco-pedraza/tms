'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ServiceTypeSkeleton() {
  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Skeleton className="h-9 w-20 mr-2" />
        <Skeleton className="h-9 w-20" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <div className="sm:col-span-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1 space-y-2">
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-5 w-10" />
            </div>
            <div className="sm:col-span-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <div className="sm:col-span-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
