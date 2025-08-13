'use client';

import { useTranslations } from 'next-intl';
import BusLineForm, {
  BusLineFormValues,
} from '@/bus-lines/components/bus-line-form';
import BusLineFormSkeleton from '@/bus-lines/components/bus-line-form-skeleton';
import useBusLineMutations from '@/bus-lines/hooks/use-bus-line-mutations';
import useQueryBusLine from '@/bus-lines/hooks/use-query-bus-line';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

export default function EditBusLinePage() {
  const tBusLines = useTranslations('busLines');
  const { itemId: busLineId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryBusLine({
    itemId: busLineId,
    enabled: isValidId,
  });
  const { update: updateBusLine } = useBusLineMutations();

  const handleSubmit = (values: BusLineFormValues) => {
    const apiValues = {
      ...values,
    };
    return updateBusLine.mutateWithToast({ id: busLineId, values: apiValues });
  };

  if (isLoading) {
    return <BusLineFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tBusLines('details.description')}
        description={`${data?.name} (${data?.code})`}
        backHref={routes.busLines.index}
      />
      <BusLineForm
        defaultValues={{
          ...data,
          description: data.description ?? '',
          fleetSize: data.fleetSize ?? null,
          website: data.website ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
