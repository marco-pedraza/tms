'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { bus_models } from '@repo/ims-client';
import BusModelForm, {
  BusModelFormValues,
} from '@/bus-models/components/bus-model-form';
import BusModelFormSkeleton from '@/bus-models/components/bus-model-form-skeleton';
import useBusModelAmenityMutations from '@/bus-models/hooks/use-bus-model-amenity-mutations';
import useBusModelMutations from '@/bus-models/hooks/use-bus-model-mutations';
import useQueryBusModel from '@/bus-models/hooks/use-query-bus-model';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

export default function EditBusModelPage() {
  const router = useRouter();
  const tBusModels = useTranslations('busModels');
  const { itemId: busModelId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryBusModel({
    itemId: busModelId,
    enabled: isValidId,
  });
  const { update: updateBusModel } = useBusModelMutations();
  const { assignAmenities } = useBusModelAmenityMutations();

  const handleSubmit = async (values: BusModelFormValues) => {
    const { amenityIds, ...busModelData } = values;

    // First update the bus model
    await updateBusModel.mutateWithToast(
      {
        id: busModelId,
        values: busModelData,
      },
      {
        standalone: false,
      },
    );

    // Then assign amenities (this replaces all existing amenities)
    if (amenityIds !== undefined) {
      await assignAmenities.mutateWithToast(
        {
          busModelId,
          amenityIds,
        },
        {
          standalone: false,
          onError: () => {
            // Show warning that amenity assignment failed but don't block navigation
            toast.warning(tBusModels('messages.assignAmenities.error'));
          },
        },
      );
    }

    router.push(routes.busModels.getDetailsRoute(busModelId.toString()));
  };

  if (isLoading) {
    return <BusModelFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  // Map amenities to amenityIds for the form
  const busModelWithDetails = data as bus_models.BusModelWithDetails;
  const defaultValues = {
    ...data,
    amenityIds:
      busModelWithDetails.amenities?.map((amenity) => amenity.id) ?? [],
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeader
        title={tBusModels('edit.title')}
        description={`${data?.manufacturer} (${data?.model})`}
        backHref={routes.busModels.index}
      />
      <BusModelForm defaultValues={defaultValues} onSubmit={handleSubmit} />
    </div>
  );
}
