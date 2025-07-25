import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LabelsMetricsErrorProps {
  onRetry: () => void;
}

/**
 * Error component displayed when label metrics fail to load.
 * Provides user with retry functionality and clear error messaging.
 */
export default function LabelsMetricsError({
  onRetry,
}: LabelsMetricsErrorProps) {
  const t = useTranslations('labels');
  const tCommon = useTranslations('common');

  return (
    <div className="grid gap-6 md:grid-cols-1 mb-6">
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">
              {t('metrics.loadError')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('metrics.loadErrorDescription')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {tCommon('actions.retry')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
