'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function StateSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-4 w-32 mt-6 mb-2" />
      <Skeleton className="h-24 w-full rounded" />
    </div>
  );
}
