'use client';

import { useTranslations } from 'next-intl';
import BusModelForm, {
  BusModelFormValues,
} from '@/bus-models/components/bus-model-form';
import BusModelFormSkeleton from '@/bus-models/components/bus-model-form-skeleton';
import useBusModelMutations from '@/bus-models/hooks/use-bus-model-mutations';
import useQueryBusModel from '@/bus-models/hooks/use-query-bus-model';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

export default function EditBusModelPage() {
  const tBusModels = useTranslations('busModels');
  const { itemId: busModelId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryBusModel({
    itemId: busModelId,
    enabled: isValidId,
  });
  const { update: updateBusModel } = useBusModelMutations();

  const handleSubmit = (values: BusModelFormValues) =>
    updateBusModel.mutateWithToast({
      id: busModelId,
      values,
    });

  if (isLoading) {
    return <BusModelFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tBusModels('edit.title')}
        description={`${data?.manufacturer} (${data?.model})`}
        backHref={routes.busModels.index}
      />
      <BusModelForm defaultValues={data} onSubmit={handleSubmit} />
    </div>
  );
}
