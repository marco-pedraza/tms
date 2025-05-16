export default function TransporterSkeleton() {
  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse mr-2"></div>
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-md"></div>
      </div>
      <div className="h-5 w-64 bg-gray-200 animate-pulse rounded-md mb-6"></div>

      {/* Action buttons */}
      <div className="flex justify-end mb-4 gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
      </div>

      {/* Two column layout for info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Basic Information Card */}
        <div className="border rounded-lg p-4 bg-white">
          <div className="h-7 w-48 bg-gray-200 animate-pulse rounded-md mb-4"></div>

          {/* Info rows */}
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex mb-4">
              <div className="h-5 w-24 bg-gray-200 animate-pulse rounded-md mr-4"></div>
              <div className="h-5 w-48 bg-gray-200 animate-pulse rounded-md"></div>
            </div>
          ))}
        </div>

        {/* Contact Information Card */}
        <div className="border rounded-lg p-4 bg-white">
          <div className="h-7 w-48 bg-gray-200 animate-pulse rounded-md mb-4"></div>

          {/* Info rows */}
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex mb-4">
              <div className="h-5 w-24 bg-gray-200 animate-pulse rounded-md mr-4"></div>
              <div className="h-5 w-48 bg-gray-200 animate-pulse rounded-md"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Bus Lines Table */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="h-7 w-48 bg-gray-200 animate-pulse rounded-md mb-4"></div>

        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 mb-4 pb-2 border-b">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-5 bg-gray-200 animate-pulse rounded-md"
            ></div>
          ))}
        </div>

        {/* Table rows */}
        {[1, 2, 3].map((row) => (
          <div key={row} className="grid grid-cols-5 gap-4 py-4 border-b">
            {[1, 2, 3, 4, 5].map((col) => (
              <div
                key={col}
                className={`h-5 bg-gray-200 animate-pulse rounded-md ${col === 4 ? 'w-16' : ''}`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
