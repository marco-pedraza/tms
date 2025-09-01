'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import LoadError from '@/components/load-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeOffType } from '@/services/ims-client';
import useQueryDriverTimeOffs from '../hooks/use-query-driver-time-offs';
import DriverTimeOffTypeBadge from './driver-time-off-type-badge';
import DriverTimeOffsSkeleton from './driver-time-offs-skeleton';

// API response type (matches actual DriverTimeOff)
interface ApiTimeOffItem {
  id?: number;
  startDate: string;
  endDate: string;
  type: unknown; // API type that gets converted
  reason?: string | null;
  createdAt?: string | null;
}

// Unified time-off interface that works for both API and local data
export interface TimeOffItem {
  id?: number;
  startDate: string;
  endDate: string;
  type: TimeOffType;
  reason?: string | null; // Compatible with API response
  createdAt?: string;
  isNew?: boolean; // Flag to mark newly created time-offs for visual feedback
}

interface DriverTimeOffsViewProps {
  // Data sources (provide one of these)
  driverId?: number; // If provided → use API data
  timeOffs?: TimeOffItem[]; // If provided → use local data

  // Functionality
  onDelete?: (index: number) => void;

  // Configuration options
  showHeader?: boolean;
  showCreatedAt?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Unified component for displaying driver time-offs
 * Auto-detects mode: if driverId provided → API mode, if timeOffs provided → local mode
 */
export default function DriverTimeOffsView({
  driverId,
  timeOffs: localTimeOffs,
  onDelete,
  showHeader = false,
  showCreatedAt = false,
  disabled = false,
  className = '',
}: DriverTimeOffsViewProps) {
  const tTimeOffs = useTranslations('timeOffs');
  const tCommon = useTranslations('common');
  const [deleteIndex, setDeleteIndex] = useState<number | undefined>();

  // Auto-detect mode: API if driverId provided, local if timeOffs provided
  const isApiMode = !!driverId && !localTimeOffs;

  // API mode: use query hook
  const apiQuery = useQueryDriverTimeOffs({
    driverId: driverId ?? 0,
    enabled: isApiMode,
  });

  // Get data based on detected mode
  const isLoading = isApiMode ? apiQuery.isLoading : false;
  const error = isApiMode ? apiQuery.error : null;
  const refetch = isApiMode ? apiQuery.refetch : undefined;
  const timeOffs: TimeOffItem[] = isApiMode
    ? (apiQuery.data?.data || []).map(
        (item: ApiTimeOffItem): TimeOffItem => ({
          ...item,
          type: item.type as TimeOffType,
          reason: item.reason ?? undefined,
          createdAt: item.createdAt ?? undefined,
        }),
      )
    : (localTimeOffs ?? []);

  /**
   * Formats a date string to local date format
   * @param dateString - Date string to format
   * @returns Formatted date string
   */
  function formatDate(dateString: string): string {
    try {
      return new Date(dateString + 'T00:00:00').toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  /**
   * Handles delete confirmation for local mode
   */
  function handleDeleteConfirm(): void {
    if (deleteIndex !== undefined && onDelete) {
      onDelete(deleteIndex);
      setDeleteIndex(undefined);
    }
  }

  /**
   * Renders a single time-off card
   */
  function renderTimeOffCard(timeOff: TimeOffItem, index: number) {
    const isNew = timeOff.isNew ?? false;
    const showDeleteButton = !isApiMode && !disabled && onDelete;

    return (
      <div
        key={timeOff.id ?? `new-${index}`}
        className={`p-4 rounded-lg border-l-4 bg-gradient-to-r ${
          isNew
            ? 'border-l-green-500 from-green-50 to-green-25'
            : 'border-l-gray-500 from-blue-50 to-blue-25'
        } hover:shadow-md transition-shadow duration-200`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <DriverTimeOffTypeBadge type={timeOff.type} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 font-medium">
                  {tTimeOffs('fields.startDate')}:
                </span>
                <div className="font-mono text-gray-900">
                  {formatDate(timeOff.startDate)}
                </div>
              </div>
              <div>
                <span className="text-gray-500 font-medium">
                  {tTimeOffs('fields.endDate')}:
                </span>
                <div className="font-mono text-gray-900">
                  {formatDate(timeOff.endDate)}
                </div>
              </div>
            </div>

            {timeOff.reason && (
              <div className="text-sm">
                <span className="text-gray-500 font-medium">
                  {tTimeOffs('fields.reason')}:
                </span>
                <div className="text-gray-700 mt-1">{timeOff.reason}</div>
              </div>
            )}

            {showCreatedAt && timeOff.createdAt && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">
                  {tCommon('fields.createdAt')}:
                </span>
                <span className="ml-1">
                  {new Date(timeOff.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {showDeleteButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeleteIndex(index);
              }}
              className="ml-4 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{tCommon('actions.delete')}</span>
            </Button>
          )}
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
              {tTimeOffs('table.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground text-center py-4">
              {tTimeOffs('table.empty')}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{tTimeOffs('table.empty')}</p>
      </div>
    );
  }

  /**
   * Renders the time-offs list
   */
  function renderTimeOffsList() {
    const content = (
      <div className="space-y-3">
        {timeOffs.map((timeOff, index) => renderTimeOffCard(timeOff, index))}
      </div>
    );

    if (showHeader) {
      return (
        <Card className="border-0 shadow-none p-0">
          <CardHeader className="px-0">
            <CardTitle className="text-sm">
              {tTimeOffs('table.title')} ({timeOffs.length})
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
    return <DriverTimeOffsSkeleton />;
  }

  // Handle error state (API mode only)
  if (error) {
    return (
      <LoadError
        description={tTimeOffs('messages.noTimeOffs')}
        onRetry={refetch}
        backHref=""
      />
    );
  }

  // Handle empty state
  if (timeOffs.length === 0) {
    return renderEmptyState();
  }

  // Render main content
  return (
    <div className={className}>
      {renderTimeOffsList()}

      {/* Delete confirmation dialog (local mode only) */}
      {!isApiMode && (
        <ConfirmDeleteDialog
          isOpen={deleteIndex !== undefined}
          onOpenChange={(open) => {
            if (!open) setDeleteIndex(undefined);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
