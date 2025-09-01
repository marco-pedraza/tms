/**
 * Skeleton loading component for driver time-offs
 * Provides visual feedback while time-offs data is being loaded
 */
export default function DriverTimeOffsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-lg border-l-4 border-l-gray-300 bg-gray-50 animate-pulse"
        >
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
