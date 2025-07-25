'use client';

import { BarChart3, Tag, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useLabelsMetrics from '@/labels/hooks/use-labels-metrics';
import LabelsMetricsError from './labels-metrics-error';
import LabelsMetricsSkeleton from './labels-metrics-skeleton';

export default function LabelsMetrics() {
  const t = useTranslations('labels');

  const { data: metrics, isLoading, error, refetch } = useLabelsMetrics();

  if (isLoading) {
    return <LabelsMetricsSkeleton />;
  }

  if (error) {
    return <LabelsMetricsError onRetry={refetch} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('metrics.totalLabels')}
          </CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.totalLabels ?? 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('metrics.labelsInUse')}
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.labelsInUse ?? 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('metrics.mostUsedLabels')}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.mostUsedLabels?.[0]?.nodeCount ?? 0}
          </div>
          {metrics && metrics.mostUsedLabels.length > 0 ? (
            <div className="space-y-1 mt-1">
              {metrics.mostUsedLabels.slice(0, 3).map((label, index) => (
                <div
                  key={`${label.name}-${index}`}
                  className="flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full border flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <p className="text-xs text-muted-foreground truncate">
                    {label.name}
                  </p>
                </div>
              ))}
              {metrics.mostUsedLabels.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  {t('metrics.andMore', {
                    count: metrics.mostUsedLabels.length - 3,
                  })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('metrics.noData')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
