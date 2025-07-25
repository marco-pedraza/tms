import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

const placeholderMetrics = Array.from({ length: 3 });

export default function LabelsMetricsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3 mb-6">
      {placeholderMetrics.map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
