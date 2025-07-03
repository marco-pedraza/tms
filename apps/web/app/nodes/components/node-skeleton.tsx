import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function NodeSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Basic Information Card */}
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-40 mb-6" />

        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={`basic-${i}`} className="flex justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </div>
      </div>

      {/* Location Card */}
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-6" />

        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  key={`facility-${i}`}
                  className="h-8 w-20 rounded-md"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Information Card */}
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-6" />

        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={`system-${i}`} className="flex justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
