import { Skeleton } from '@/components/ui/skeleton';

export default function TransporterFormSkeleton() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-3/4 mb-6" />
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Code */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* City */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>

        {/* Logo URL */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* License Number */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Active toggle */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </div>

      {/* Button */}
      <div className="flex justify-end mt-8">
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
}
