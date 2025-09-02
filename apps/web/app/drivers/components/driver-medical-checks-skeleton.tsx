import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading component for driver medical checks
 * Provides visual feedback while medical checks data is being loaded
 */
export default function DriverMedicalChecksSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="p-4 rounded-lg border-l-4 border-l-gray-300 bg-gray-50 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              {/* Badge */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              {/* Check dates grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* Notes (optional) */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
