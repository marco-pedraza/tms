import { ArrowLeft } from 'lucide-react';

export default function BusLineFormSkeleton() {
  return (
    <div className="max-w-full min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <ArrowLeft className="h-5 w-5 text-gray-500" />
        <div className="h-7 w-64 bg-gray-200 rounded-md animate-pulse" />
      </div>
      <div className="h-5 w-72 bg-gray-200 rounded-md animate-pulse mb-6" />

      {/* Main Card */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        {/* Card Title */}
        <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse mb-8" />

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse" />
          </div>

          {/* Code Field */}
          <div className="space-y-2">
            <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded-md animate-pulse" />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-24 w-full bg-gray-100 rounded-md animate-pulse" />
          </div>

          {/* Transport Group Field */}
          <div className="space-y-2">
            <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse" />
          </div>

          {/* Service Type Field */}
          <div className="space-y-2">
            <div className="h-5 w-36 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse" />
          </div>

          {/* Logo URL Field */}
          <div className="space-y-2">
            <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 rounded-md animate-pulse" />
          </div>

          {/* Color Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-300 rounded-md animate-pulse" />
                <div className="h-10 flex-1 bg-gray-100 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-5 w-36 bg-gray-200 rounded-md animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-300 rounded-md animate-pulse" />
                <div className="h-10 flex-1 bg-gray-100 rounded-md animate-pulse" />
              </div>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-48 bg-gray-300 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  );
}
