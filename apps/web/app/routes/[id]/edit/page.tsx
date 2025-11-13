'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import RouteForm, {
  type RouteFormValues,
} from '@/routes/components/route-form';
import RouteFormSkeleton from '@/routes/components/route-form-skeleton';
import useQueryRoute from '@/routes/hooks/use-query-route';
import useRoutesMutations from '@/routes/hooks/use-routes-mutations';
import routes from '@/services/routes';

export default function EditRoutePage() {
  const tRoutes = useTranslations('routes');
  const { itemId: routeId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryRoute({
    itemId: routeId,
    enabled: isValidId,
  });
  const { update: updateRoute } = useRoutesMutations();
  const router = useRouter();

  const handleSubmit = async (values: RouteFormValues) => {
    await updateRoute.mutateWithToast(
      {
        id: routeId,
        values: {
          ...values,
          serviceTypeId: values.serviceTypeId
            ? Number(values.serviceTypeId)
            : 0,
          originNodeId: values.originNodeId ? Number(values.originNodeId) : 0,
          destinationNodeId: values.destinationNodeId
            ? Number(values.destinationNodeId)
            : 0,
          legs: (values.legs || []).map((leg) => ({
            position: leg.position,
            pathwayId: Number(leg.pathwayId), // Transform string to number for API
            pathwayOptionId: Number(leg.pathwayOptionId), // Transform string to number for API
            active: true,
          })),
        },
      },
      {
        standalone: false,
      },
    );

    // Navigate to the route details page after update is complete
    router.push(routes.routes.getDetailsRoute(routeId.toString()));
  };

  if (isLoading) {
    return <RouteFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  // Transform RouteEnriched to RouteFormValues
  const defaultValues: RouteFormValues = {
    ...data,
    autoUpdateNameCode: true,
    legs: (data.legs || [])
      .filter((leg) => !leg.isDerived) // Filter out derived legs (like toll booths)
      .map((leg) => ({
        pathwayId: leg.pathwayId.toString(),
        pathwayOptionId: leg.pathwayOptionId.toString(),
        position: leg.position,
      })),
  };

  return (
    <div>
      <PageHeader
        title={tRoutes('edit.title')}
        description={`${data?.name} (${data?.code})`}
        backHref={routes.routes.index}
        backLabel={tRoutes('actions.backToList')}
      />
      <RouteForm defaultValues={defaultValues} onSubmit={handleSubmit} />
    </div>
  );
}
