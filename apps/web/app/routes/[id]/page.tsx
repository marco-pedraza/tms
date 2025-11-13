'use client';

import { useMemo } from 'react';
import { Clock, MapPin, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useQueryAllNodes from '@/nodes/hooks/use-query-all-nodes';
import RouteNotFound from '@/routes/components/route-not-found';
import RouteSkeleton from '@/routes/components/route-skeleton';
import useQueryRoute from '@/routes/hooks/use-query-route';
import useRoutesMutations from '@/routes/hooks/use-routes-mutations';
import routes from '@/services/routes';

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

export default function RouteDetailsPage() {
  const tRoutes = useTranslations('routes');
  const tCommon = useTranslations('common');
  const { itemId: routeId, isValidId } = useCollectionItemDetailsParams();
  const { data: route, isLoading } = useQueryRoute({
    itemId: routeId,
    enabled: isValidId,
  });
  const { data: nodesData } = useQueryAllNodes();
  const { delete: deleteRoute } = useRoutesMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteRoute.mutateWithToast,
    });

  // Create a map of node IDs to nodes for quick lookup
  const nodesMap = useMemo(() => {
    const map = new Map();
    nodesData?.data.forEach((node) => {
      map.set(node.id, node);
    });
    return map;
  }, [nodesData]);

  const onDelete = () => {
    if (!routeId) return;
    setDeleteId(routeId);
  };

  if (isLoading) {
    return <RouteSkeleton />;
  }

  if (!route) {
    return <RouteNotFound />;
  }
  // Filter out derived legs (like toll booths)
  const mainLegs = (route.legs || []).filter((leg) => !leg.isDerived);

  return (
    <div className="pb-8">
      <PageHeader
        title={route.name}
        description={tRoutes('details.description')}
        backHref={routes.routes.index}
      />

      <div className="flex gap-2 justify-end mb-6">
        <ActionButtons
          editHref={routes.routes.getEditRoute(route.id.toString())}
          onDelete={onDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="max-w-7xl space-y-8">
        {/* Route Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {tRoutes('sections.info')}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {tRoutes('details.description')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Code and Status */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {tRoutes('fields.code')}
                </p>
                <p className="text-lg font-semibold">{route.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {tCommon('fields.status')}
                </p>
                <IsActiveBadge isActive={route.active} />
              </div>

              {/* Bus Line */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {tRoutes('fields.busline')}
                </p>
                <p className="text-base font-medium">
                  {route.busline?.name || '-'}
                </p>
                <p className="text-sm text-gray-500">
                  {route.busline?.code || '-'}
                </p>
              </div>

              {/* Service Type */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {tRoutes('fields.serviceType')}
                </p>
                <p className="text-base font-medium">
                  {route.serviceType?.name || '-'}
                </p>
              </div>

              {/* Origin Node */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tRoutes('fields.origin')}
                </p>
                <p className="text-base font-medium">
                  {route.originNode?.name || '-'}
                </p>
                <p className="text-sm text-gray-500">
                  {route.originNode?.code || '-'}
                </p>
                {route.originNode?.city && (
                  <p className="text-xs text-gray-400">
                    {route.originNode.city.name}
                  </p>
                )}
              </div>

              {/* Destination Node */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tRoutes('fields.destination')}
                </p>
                <p className="text-base font-medium">
                  {route.destinationNode?.name || '-'}
                </p>
                <p className="text-sm text-gray-500">
                  {route.destinationNode?.code || '-'}
                </p>
                {route.destinationNode?.city && (
                  <p className="text-xs text-gray-400">
                    {route.destinationNode.city.name}
                  </p>
                )}
              </div>
            </div>

            {/* Metrics */}
            {route.metrics && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold mb-4">
                  {tRoutes('summary.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2">
                    <Route className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {tRoutes('summary.fields.totalDistance')}
                      </p>
                      <p className="font-semibold">
                        {route.metrics.totalDistance.toFixed(2)} km
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {tRoutes('summary.fields.estimatedDuration')}
                      </p>
                      <p className="font-semibold">
                        {formatTime(route.metrics.totalTime)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {tRoutes('summary.fields.numberOfSegments')}
                    </p>
                    <p className="font-semibold">{route.metrics.legCount}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-gray-500">
                <span className="font-medium">
                  {tCommon('fields.createdAt')}:
                </span>{' '}
                {route.createdAt
                  ? new Date(route.createdAt).toLocaleString('es-MX', {
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
                {route.updatedAt
                  ? new Date(route.updatedAt).toLocaleString('es-MX', {
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

        {/* Route Legs Section */}
        {mainLegs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {tRoutes('routeLegs.title')}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {tRoutes('routeLegs.subtitle')}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {mainLegs.map((leg) => {
                const pathway = leg.pathway;
                const option = leg.option;
                const originNode = nodesMap.get(leg.originNodeId);
                const destinationNode = nodesMap.get(leg.destinationNodeId);

                return (
                  <div
                    key={leg.id}
                    className="border border-gray-200 rounded-lg p-6 bg-gray-50"
                  >
                    {/* Leg Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">
                            {tRoutes('routeLegs.segmentLabel', {
                              number: leg.position,
                            })}
                          </h3>
                          <Badge variant="secondary">
                            {tRoutes('routeLegs.selectedOption')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {pathway?.name || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Pathway Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {tRoutes('fields.origin')}
                        </p>
                        <p className="font-medium text-sm">
                          {originNode?.name || '-'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {originNode?.code || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {tRoutes('fields.destination')}
                        </p>
                        <p className="font-medium text-sm">
                          {destinationNode?.name || '-'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {destinationNode?.code || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Option Metrics */}
                    {option && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-start gap-2">
                          <Route className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">
                              {tRoutes('summary.fields.totalDistance')}
                            </p>
                            <p className="font-semibold">
                              {option.distanceKm || 0} km
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">
                              {tRoutes('summary.fields.estimatedDuration')}
                            </p>
                            <p className="font-semibold">
                              {option.typicalTimeMin
                                ? formatTime(option.typicalTimeMin)
                                : '-'}
                            </p>
                          </div>
                        </div>
                        {option.name && (
                          <div className="md:col-span-2">
                            <p className="text-xs text-gray-500">
                              {tRoutes('routeLegs.selectedOption')}
                            </p>
                            <p className="font-semibold">{option.name}</p>
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

        {/* No Legs Message */}
        {mainLegs.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">
                {tRoutes('routeLegs.noLegs')}
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
