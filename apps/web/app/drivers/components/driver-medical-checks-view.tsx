'use client';

import { useTranslations } from 'next-intl';
import type { medical_checks } from '@repo/ims-client';
import LoadError from '@/components/load-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useQueryDriverMedicalChecks from '../hooks/use-query-driver-medical-checks';
import DriverMedicalCheckResultBadge from './driver-medical-check-result-badge';
import DriverMedicalChecksSkeleton from './driver-medical-checks-skeleton';

// API response type (matches actual DriverMedicalCheck)
interface ApiMedicalCheckItem {
  id?: number;
  checkDate: string;
  nextCheckDate: string;
  daysUntilNextCheck: number;
  result: string;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// Unified medical check interface that works for both API and local data
export interface MedicalCheckItem {
  id?: number;
  checkDate: string;
  nextCheckDate: string;
  daysUntilNextCheck: number;
  result: medical_checks.MedicalCheckResult;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  isNew?: boolean; // Flag to mark newly created medical checks for visual feedback
}

interface DriverMedicalChecksViewProps {
  // Data sources (provide one of these)
  driverId?: number; // If provided → use API data
  medicalChecks?: MedicalCheckItem[]; // If provided → use local data

  // Configuration options
  showHeader?: boolean;
  showCreatedAt?: boolean;
  className?: string;
}

/**
 * Component for displaying driver medical checks (read-only)
 * Auto-detects mode: if driverId provided → API mode, if medicalChecks provided → local mode
 */
export default function DriverMedicalChecksView({
  driverId,
  medicalChecks: localMedicalChecks,
  showHeader = false,
  showCreatedAt = false,
  className = '',
}: DriverMedicalChecksViewProps) {
  const tMedicalChecks = useTranslations('medicalChecks');
  const tCommon = useTranslations('common');

  // Auto-detect mode: API if driverId provided, local if medicalChecks provided
  const isApiMode = !!driverId && !localMedicalChecks;

  // API mode: use query hook
  const apiQuery = useQueryDriverMedicalChecks({
    driverId: driverId ?? 0,
    enabled: isApiMode,
  });

  // Get data based on detected mode
  const isLoading = isApiMode ? apiQuery.isLoading : false;
  const error = isApiMode ? apiQuery.error : null;
  const refetch = isApiMode ? apiQuery.refetch : undefined;
  const medicalChecks: MedicalCheckItem[] = isApiMode
    ? (apiQuery.data?.data || []).map(
        (item: ApiMedicalCheckItem): MedicalCheckItem => ({
          ...item,
          result: item.result as medical_checks.MedicalCheckResult,
          notes: item.notes ?? undefined,
          createdAt: item.createdAt ?? undefined,
          updatedAt: item.updatedAt ?? undefined,
        }),
      )
    : (localMedicalChecks ?? []);

  /**
   * Formats a date string to local date format
   * @param dateString - Date string to format
   * @returns Formatted date string
   */
  function formatDate(dateString: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
    if (!m) return dateString;
    const [, y, mo, d] = m;
    const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d))); // UTC midnight
    return new Intl.DateTimeFormat(undefined, { timeZone: 'UTC' }).format(date);
  }

  /**
   * Renders a single medical check card
   */
  function renderMedicalCheckCard(
    medicalCheck: MedicalCheckItem,
    index: number,
  ) {
    const isNew = medicalCheck.isNew ?? false;

    return (
      <div
        key={medicalCheck.id ?? `new-${index}`}
        className={`p-4 rounded-lg border-l-4 bg-gradient-to-r ${
          isNew
            ? 'border-l-green-500 from-green-50 to-green-25'
            : 'border-l-gray-500 from-blue-50 to-blue-25'
        } hover:shadow-md transition-shadow duration-200`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <DriverMedicalCheckResultBadge result={medicalCheck.result} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 font-medium">
                  {tMedicalChecks('fields.checkDate')}:
                </span>
                <div className="font-mono text-gray-900">
                  {formatDate(medicalCheck.checkDate)}
                </div>
              </div>
              <div>
                <span className="text-gray-500 font-medium">
                  {tMedicalChecks('fields.nextCheckDate')}:
                </span>
                <div className="font-mono text-gray-900">
                  {formatDate(medicalCheck.nextCheckDate)}
                </div>
              </div>
            </div>

            {medicalCheck.notes && (
              <div className="text-sm">
                <span className="text-gray-500 font-medium">
                  {tMedicalChecks('fields.notes')}:
                </span>
                <div className="text-gray-700 mt-1">{medicalCheck.notes}</div>
              </div>
            )}

            {showCreatedAt && medicalCheck.createdAt && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">
                  {tCommon('fields.createdAt')}:
                </span>
                <span className="ml-1">
                  {new Date(medicalCheck.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Renders empty state
   */
  function renderEmptyState() {
    if (showHeader) {
      return (
        <Card className="border-0 shadow-none p-0">
          <CardHeader className="px-0">
            <CardTitle className="text-sm">
              {tMedicalChecks('table.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground text-center py-4">
              {tMedicalChecks('table.empty')}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{tMedicalChecks('table.empty')}</p>
      </div>
    );
  }

  /**
   * Renders the medical checks list
   */
  function renderMedicalChecksList() {
    const content = (
      <div className="space-y-3">
        {medicalChecks.map((medicalCheck, index) =>
          renderMedicalCheckCard(medicalCheck, index),
        )}
      </div>
    );

    if (showHeader) {
      return (
        <Card className="border-0 shadow-none p-0">
          <CardHeader className="px-0">
            <CardTitle className="text-sm">
              {tMedicalChecks('table.title')} ({medicalChecks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">{content}</CardContent>
        </Card>
      );
    }

    return content;
  }

  // Handle loading state (API mode only)
  if (isLoading) {
    return <DriverMedicalChecksSkeleton />;
  }

  // Handle error state (API mode only)
  if (error) {
    return (
      <LoadError
        description={tMedicalChecks('messages.loadError')}
        onRetry={refetch}
        backHref=""
      />
    );
  }

  // Handle empty state
  if (medicalChecks.length === 0) {
    return renderEmptyState();
  }

  // Render main content
  return <div className={className}>{renderMedicalChecksList()}</div>;
}
