'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import BusModelForm from '@/bus-models/components/bus-model-form';
import type { BusModelFormValues } from '@/bus-models/components/bus-model-form';
import useBusModelAmenityMutations from '@/bus-models/hooks/use-bus-model-amenity-mutations';
import useBusModelMutations from '@/bus-models/hooks/use-bus-model-mutations';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function NewBusModelPage() {
  const router = useRouter();
  const t = useTranslations('busModels');
  const { create: createBusModel } = useBusModelMutations();
  const { assignAmenities } = useBusModelAmenityMutations();

  const handleSubmit = async (values: BusModelFormValues) => {
    const { amenityIds, ...busModelData } = values;

    // First create the bus model
    const busModel = await createBusModel.mutateWithToast(busModelData, {
      standalone: false,
    });

    // Then assign amenities if any were selected
    if (amenityIds && amenityIds.length > 0) {
      await assignAmenities.mutateWithToast(
        {
          busModelId: busModel.id,
          amenityIds,
        },
        {
          standalone: false,
          onError: () => {
            // Show warning that amenity assignment failed but don't block navigation
            toast.warning(t('messages.assignAmenities.error'));
          },
        },
      );
    }

    router.push(routes.busModels.getDetailsRoute(busModel.id.toString()));
    return busModel;
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeader
        title={t('actions.create')}
        backHref={routes.busModels.index}
        backLabel={t('actions.backToList')}
      />
      <BusModelForm onSubmit={handleSubmit} />
    </div>
  );
}
