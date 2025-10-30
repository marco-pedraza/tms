'use client';

import { Check, Clock, Gauge, MapPin, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import AffirmationBadge from '@/components/affirmation-badge';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsEmptyTripBadge from '@/components/is-empty-trip-badge';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import PathwaySkeleton from '@/pathways/components/pathway-skeleton';
import usePathwayMutations from '@/pathways/hooks/use-pathway-mutations';
import useQueryAllTollbooths from '@/pathways/hooks/use-query-all-tollbooths';
import useQueryPathway from '@/pathways/hooks/use-query-pathway';
import routes from '@/services/routes';

/**
 * Formats a number to Mexican Peso currency format
 */
function formatPrice(price: number) {
  return price.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

/**
 * Formats time in minutes to a readable format (e.g., "3h 0m", "1h 20m", "37m")
 */
function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
}

export default function PathwayDetailsPage() {
  const tPathways = useTranslations('pathways');
  const tCommon = useTranslations('common');
  const { itemId: pathwayId, isValidId } = useCollectionItemDetailsParams();
  const { data: pathway, isLoading } = useQueryPathway({
    itemId: pathwayId,
    enabled: isValidId,
  });
  const { data: tollboothsData } = useQueryAllTollbooths();
  const { delete: deletePathway } = usePathwayMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deletePathway.mutateWithToast,
    });

  const onDelete = () => {
    if (!pathwayId) return;
    setDeleteId(pathwayId);
  };

  // Create a map of tollbooths for quick lookup
  const tollboothsMap = new Map(
    tollboothsData?.data.map((tb) => [tb.id, tb]) || [],
  );

  if (isLoading) {
    return <PathwaySkeleton />;
  }

  if (!pathway) {
    return null;
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={pathway.name}
        description={tPathways('details.description')}
        backHref={routes.pathways.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.pathways.getEditRoute(pathway.id.toString())}
          onDelete={onDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="max-w-7xl space-y-8">
        {/* Pathway Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {tPathways('sections.info')}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {tPathways('details.description')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Code and Status */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {tPathways('fields.code')}
                </p>
                <p className="text-lg font-semibold">{pathway.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {tCommon('fields.status')}
                </p>
                {pathway.active ? (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    {tCommon('status.active')}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    {tCommon('status.inactive')}
                  </Badge>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {tPathways('fields.description')}
                </p>
                <p className="text-base">
                  {pathway.description || tCommon('fields.noDescription')}
                </p>
              </div>

              {/* Origin Node */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tPathways('fields.origin')}
                </p>
                <p className="text-base font-medium">
                  {pathway.origin?.name || '-'}
                </p>
                <p className="text-sm text-gray-500">
                  {pathway.origin?.code || '-'}
                </p>
              </div>

              {/* Destination Node */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tPathways('fields.destination')}
                </p>
                <p className="text-base font-medium">
                  {pathway.destination?.name || '-'}
                </p>
                <p className="text-sm text-gray-500">
                  {pathway.destination?.code || '-'}
                </p>
              </div>

              {/* Empty Trip */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {tPathways('fields.isEmptyTrip')}
                </p>
                <IsEmptyTripBadge isEmptyTrip={pathway.isEmptyTrip} />
              </div>

              {/* Sellable */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {tPathways('fields.isSellable')}
                </p>
                <AffirmationBadge value={pathway.isSellable} />
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-gray-500">
                <span className="font-medium">
                  {tCommon('fields.createdAt')}:
                </span>{' '}
                {pathway.createdAt
                  ? new Date(pathway.createdAt).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">
                  {tCommon('fields.updatedAt')}:
                </span>{' '}
                {pathway.updatedAt
                  ? new Date(pathway.updatedAt).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pathway Options Section */}
        {pathway.options && pathway.options.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {tPathways('sections.options')}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {tPathways('details.optionsDescription')}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {pathway.options.map((option, index) => {
                // Calculate total toll cost for this option
                const totalTollCost =
                  option.tolls?.reduce((sum, toll) => {
                    const tollbooth = tollboothsMap.get(toll.nodeId);
                    return sum + (tollbooth?.tollPrice || 0);
                  }, 0) || 0;

                return (
                  <div
                    key={option.id}
                    className="border border-gray-200 rounded-lg p-6 bg-gray-50"
                  >
                    {/* Option Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">
                            {option.name ||
                              tPathways('pathwayOptions.fields.option', {
                                index: index + 1,
                              })}
                          </h3>
                          {option.isDefault && (
                            <Badge variant="secondary">
                              {tPathways('pathwayOptions.fields.isDefault')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {option.description ||
                            tPathways(
                              'pathwayOptions.placeholders.noDescription',
                            )}
                        </p>
                      </div>
                    </div>

                    {/* Option Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {/* Distance */}
                      <div className="flex items-start gap-2">
                        <Route className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">
                            {tPathways('pathwayOptions.fields.distance')}
                          </p>
                          <p className="font-semibold">
                            {option.distanceKm || 0} km
                          </p>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">
                            {tPathways('pathwayOptions.fields.typicalTime')}
                          </p>
                          <p className="font-semibold">
                            {option.typicalTimeMin
                              ? formatTime(option.typicalTimeMin)
                              : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Average Speed */}
                      <div className="flex items-start gap-2">
                        <Gauge className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">
                            {tPathways('pathwayOptions.fields.avgSpeed')}
                          </p>
                          <p className="font-semibold">
                            {option.avgSpeedKmh || 0} km/h
                          </p>
                        </div>
                      </div>

                      {/* Toll indicator */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">
                            {tPathways('pathwayOptions.fields.tollBooth')}
                          </p>
                          <p className="font-semibold">
                            {option.tolls && option.tolls.length > 0
                              ? tCommon('status.yes')
                              : tCommon('status.no')}
                          </p>
                        </div>
                      </div>

                      {/* Pass Through */}
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">
                            {tPathways('pathwayOptions.fields.isPassThrough')}
                          </p>
                          <p className="font-semibold">
                            {option.isPassThrough
                              ? tCommon('status.yes')
                              : tCommon('status.no')}
                          </p>
                        </div>
                      </div>

                      {/* Pass Through Time */}
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">
                            {tPathways('pathwayOptions.fields.passThroughTime')}
                          </p>
                          <p className="font-semibold">
                            {option.passThroughTimeMin
                              ? formatTime(option.passThroughTimeMin)
                              : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Active */}
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">
                            {tCommon('fields.active')}
                          </p>
                          <p className="font-semibold">
                            {option.active
                              ? tCommon('status.yes')
                              : tCommon('status.no')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Toll Booths Section */}
                    {option.tolls && option.tolls.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {tPathways('pathwayOptions.sections.tollBooths')} (
                          {option.tolls.length})
                        </h4>
                        <div className="space-y-2">
                          {[...option.tolls]
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((toll) => {
                              const tollbooth = tollboothsMap.get(toll.nodeId);
                              return (
                                <div
                                  key={toll.id}
                                  className="bg-white border border-gray-200 rounded-md p-4"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">
                                        {tollbooth?.name ||
                                          tPathways('details.tollBooth', {
                                            tollBooth: toll.nodeId,
                                          })}
                                      </p>
                                      {toll.distance && (
                                        <p className="text-xs text-gray-500">
                                          {tPathways('details.kilometers', {
                                            distance: toll.distance,
                                          })}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div>
                                      <span className="text-gray-500">
                                        {tPathways('details.price')}
                                      </span>{' '}
                                      <span className="font-medium">
                                        {tollbooth?.tollPrice
                                          ? formatPrice(tollbooth.tollPrice)
                                          : '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">
                                        {tPathways('details.iave')}
                                      </span>{' '}
                                      <span className="font-medium">
                                        {tollbooth?.iaveEnabled
                                          ? tCommon('status.yes')
                                          : tCommon('status.no')}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">
                                        {tPathways('details.sequence')}
                                      </span>{' '}
                                      <span className="font-medium">
                                        {toll.sequence}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">
                                        {tPathways('details.passTime')}
                                      </span>{' '}
                                      <span className="font-medium">
                                        {formatTime(toll.passTimeMin)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Total Cost Display */}
                        {totalTollCost > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm font-medium text-blue-900">
                              {tPathways('details.totalTollCost')}{' '}
                              {formatPrice(totalTollCost)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* No Options Message */}
        {(!pathway.options || pathway.options.length === 0) && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">
                {tPathways('details.noOptions')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
