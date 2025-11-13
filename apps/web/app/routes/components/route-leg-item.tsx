'use client';

import { useEffect, useMemo } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { pathways } from '@repo/ims-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useForm from '@/hooks/use-form';
import useQueryAllPathwayOptions from '@/pathways/hooks/use-query-all-pathway-options';
import useQueryAllPathways from '@/pathways/hooks/use-query-all-pathways';
import useQueryAllTollbooths from '@/pathways/hooks/use-query-all-tollbooths';

interface RouteLegRaw {
  pathwayId: string;
  pathwayOptionId: string;
  position: number;
}

interface RouteLegItemProps {
  leg: RouteLegRaw;
  index: number;
  form: ReturnType<typeof useForm>;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onOptionChange: (index: number, optionId: string) => void;
  continuityError?: { expectedOrigin: string; actualOrigin: string };
}

function formatPrice(price: number) {
  return price.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
}

export default function RouteLegItem({
  leg,
  index,
  form,
  onRemove,
  onMoveUp,
  onMoveDown,
  onOptionChange,
  continuityError,
}: RouteLegItemProps) {
  const tRoutes = useTranslations('routes');
  const tPathways = useTranslations('pathways');
  const { data: pathwaysData } = useQueryAllPathways();
  const { data: pathwayOptions } = useQueryAllPathwayOptions(
    Number(leg.pathwayId),
  );
  const { data: tollboothsData } = useQueryAllTollbooths();

  const pathway = useMemo(() => {
    return pathwaysData?.data.find((p) => p.id.toString() === leg.pathwayId) as
      | pathways.PathwayWithRelations
      | undefined;
  }, [leg.pathwayId, pathwaysData]);

  const selectedOption = useMemo(() => {
    if (!pathwayOptions?.data || !leg.pathwayOptionId) return null;
    return pathwayOptions.data.find(
      (opt) => opt.id.toString() === leg.pathwayOptionId,
    );
  }, [pathwayOptions, leg.pathwayOptionId]);

  // Set default option if not set
  useEffect(() => {
    if (
      !leg.pathwayOptionId &&
      pathwayOptions?.data &&
      pathwayOptions.data.length > 0
    ) {
      const defaultOption =
        pathwayOptions.data.find((opt) => opt.isDefault) ||
        pathwayOptions.data[0];
      if (defaultOption) {
        onOptionChange(index, defaultOption.id.toString());
      }
    }
  }, [leg.pathwayOptionId, pathwayOptions, index, onOptionChange]);

  const tollboothsMap = useMemo(() => {
    const map = new Map();
    tollboothsData?.data.forEach((toll) => {
      map.set(toll.id, toll);
    });
    return map;
  }, [tollboothsData]);

  const tolls = selectedOption?.tolls || [];
  const totalTollCost = tolls.reduce((sum, toll) => {
    const tollbooth = tollboothsMap.get(toll.nodeId);
    return sum + (tollbooth?.tollPrice || 0);
  }, 0);

  if (!pathway) return null;

  return (
    <Card className={continuityError ? 'border-2 border-red-500' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {tRoutes('routeLegs.segmentLabel', { number: index + 1 })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                onMoveUp(index);
              }}
              disabled={index === 0}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                onMoveDown(index);
              }}
              disabled={
                index ===
                ((form.getFieldValue('legs') as RouteLegRaw[]) || []).length - 1
              }
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                onRemove(index);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Continuity Error Message */}
        {continuityError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {tRoutes('routeLegs.continuityError', {
                expectedOrigin: continuityError.expectedOrigin,
                actualOrigin: continuityError.actualOrigin,
              })}
            </AlertDescription>
          </Alert>
        )}

        {/* Pathway Name */}
        <div>
          <p className="font-medium text-sm">{pathway.name}</p>
        </div>

        {/* Origin and Destination */}
        <div className="flex items-center gap-2 text-sm justify-between">
          <span className="flex flex-col font-medium">
            <span className="font-light">{tRoutes('fields.origin')}</span>
            <span className="font-medium">{pathway.origin?.name || '-'}</span>
          </span>
          <span className="text-gray-400">→</span>
          <span className="flex flex-col font-medium">
            <span className="font-light">{tRoutes('fields.destination')}</span>
            <span className="font-medium">
              {pathway.destination?.name || '-'}
            </span>
          </span>
        </div>

        {/* Pathway Option Selection */}
        {pathwayOptions?.data && pathwayOptions.data.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {tRoutes('routeLegs.selectedOption')}:
            </label>
            <Select
              value={leg.pathwayOptionId}
              onValueChange={(value) => {
                onOptionChange(index, value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pathwayOptions.data.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.name ||
                      `${tPathways('pathwayOptions.fields.option', { index: option.sequence || 0 })}`}
                    {option.isDefault && (
                      <Badge variant="secondary" className="ml-2">
                        {tPathways('pathwayOptions.fields.isDefault')}
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Option Details */}
        {selectedOption && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {tRoutes('routeLegs.selectedOption')}:{' '}
                    <span className="font-medium">
                      {selectedOption.name ||
                        tPathways('pathwayOptions.fields.option', {
                          index: selectedOption.sequence || index + 1,
                        })}
                    </span>
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {tPathways('pathwayOptions.fields.distance')}:{' '}
                      <span className="font-semibold">
                        {selectedOption.distanceKm || 0} km
                      </span>
                    </span>
                    <span className="text-gray-600">
                      {tPathways('pathwayOptions.fields.typicalTime')}:{' '}
                      <span className="font-semibold">
                        {selectedOption.typicalTimeMin
                          ? formatTime(selectedOption.typicalTimeMin)
                          : '-'}
                      </span>
                    </span>
                  </div>
                </div>
                {tolls.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {tRoutes('routeLegs.tollHighway')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Toll Booths */}
            {tolls.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-sm">
                  {tPathways('pathwayOptions.sections.tollBooths')}:
                </h4>
                <div className="space-y-2">
                  {tolls.map((toll, tollIndex) => {
                    const tollbooth = tollboothsMap.get(toll.nodeId);
                    return (
                      <div
                        key={tollIndex}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                            {tollIndex + 1}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {tollbooth?.name || '-'}
                            </span>
                            {tollbooth && toll.distance && (
                              <span className="text-xs text-gray-600">
                                (Km {toll.distance})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">
                            {tollbooth?.tollPrice
                              ? formatPrice(tollbooth.tollPrice)
                              : '-'}
                          </span>
                          {tollbooth?.iaveEnabled && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-100 text-green-800 border-green-300"
                            >
                              IAVE
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">
                    {tRoutes('routeLegs.totalTolls')}:
                  </span>
                  <span className="text-sm font-semibold">
                    {formatPrice(totalTollCost)} ({tolls.length}{' '}
                    {tRoutes('routeLegs.tollBooths')})
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
