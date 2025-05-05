export default function TerminalFormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />

      {/* Basic Information Section */}
      <div className="border rounded-lg p-6 space-y-6">
        <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />

        {/* Name Field */}
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Code Field */}
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-72 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Address Field */}
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>

        {/* City Field */}
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Coordinates Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Operation Hours Section */}
      <div className="border rounded-lg p-6 space-y-6">
        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />

        {/* Days of the week */}
        {[...Array(7)].map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-4 items-center py-3"
          >
            <div className="col-span-2 h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="col-span-4 flex items-center gap-2">
              <div className="h-5 w-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="col-span-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Facilities Section */}
      <div className="border rounded-lg p-6 space-y-6">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />

        <div className="grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
