'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RouteSummaryData {
  routeType: string;
  totalDistance: number;
  totalTime: number;
  originCity: string;
  destinationCity: string;
  originNode: string;
  destinationNode: string;
  legCount: number;
}

interface RouteSummaryProps {
  data: RouteSummaryData;
}

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
}

export default function RouteSummary({ data }: RouteSummaryProps) {
  const tRoutes = useTranslations('routes');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tRoutes('summary.title')}</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          {tRoutes('summary.subtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-600">
              {tRoutes('summary.fields.routeType')}
            </span>
            <span className="text-sm font-semibold">{data.routeType}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-600">
              {tRoutes('summary.fields.totalDistance')}
            </span>
            <span className="text-sm font-semibold">
              {data.totalDistance} km
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-600">
              {tRoutes('summary.fields.estimatedDuration')}
            </span>
            <span className="text-sm font-semibold">
              {formatTime(data.totalTime)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-600">
              {tRoutes('summary.fields.originCity')}
            </span>
            <span className="text-sm font-semibold">{data.originCity}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-600">
              {tRoutes('summary.fields.destinationCity')}
            </span>
            <span className="text-sm font-semibold">
              {data.destinationCity}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-600">
              {tRoutes('summary.fields.originNode')}
            </span>
            <span className="text-sm font-semibold">{data.originNode}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-600">
              {tRoutes('summary.fields.destinationNode')}
            </span>
            <span className="text-sm font-semibold">
              {data.destinationNode}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-600">
              {tRoutes('summary.fields.numberOfSegments')}
            </span>
            <span className="text-sm font-semibold">{data.legCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
