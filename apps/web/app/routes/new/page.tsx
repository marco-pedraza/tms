'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { APIError, ErrCode } from '@repo/ims-client';
import PageHeader from '@/components/page-header';
import RouteForm, {
  type RouteFormValues,
} from '@/routes/components/route-form';
import useRoutesMutations from '@/routes/hooks/use-routes-mutations';
import routes from '@/services/routes';

export default function NewRoutePage() {
  const tRoutes = useTranslations('routes');
  const { create: createRoute } = useRoutesMutations();

  const handleSubmit = async (values: RouteFormValues) => {
    await createRoute.mutateWithToast(
      {
        ...values,
        serviceTypeId: values.serviceTypeId ? Number(values.serviceTypeId) : 0,
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
      {
        standalone: false,
        onError: (error: unknown) => {
          if ((error as APIError).code === ErrCode.AlreadyExists) {
            toast.error(tRoutes('errors.alreadyExists'));
          }
        },
      },
    );
  };

  return (
    <div>
      <PageHeader
        title={tRoutes('actions.create')}
        backHref={routes.routes.index}
        backLabel={tRoutes('actions.backToList')}
      />
      <RouteForm onSubmit={handleSubmit} />
    </div>
  );
}
