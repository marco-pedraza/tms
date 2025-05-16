'use client';

import { useTranslations } from 'next-intl';
import BusLineForm, {
  BusLineFormValues,
} from '@/bus-lines/components/bus-line-form';
import BusLineFormSkeleton from '@/bus-lines/components/bus-line-form-skeleton';
import useBusLineDetailsParams from '@/bus-lines/hooks/use-bus-line-details-params';
import useBusLineMutations from '@/bus-lines/hooks/use-bus-line-mutations';
import useQueryBusLine from '@/bus-lines/hooks/use-query-bus-line';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function EditBusLinePage() {
  const tBusLines = useTranslations('busLines');
  const tCommon = useTranslations('common');
  const { busLineId, isValidId } = useBusLineDetailsParams();
  const { data, isLoading } = useQueryBusLine({
    busLineId,
    enabled: isValidId,
  });
  const { updateBusLine } = useBusLineMutations();

  const handleSubmit = (values: BusLineFormValues) => {
    return updateBusLine.mutateWithToast({ id: busLineId, values });
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
          description: data.description || undefined,
          logoUrl: data.logoUrl || undefined,
          primaryColor: data.primaryColor || undefined,
          secondaryColor: data.secondaryColor || undefined,
        }}
        onSubmit={handleSubmit}
        submitButtonText={tCommon('actions.update')}
      />
    </div>
  );
}
