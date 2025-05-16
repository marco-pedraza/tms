'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import ServiceTypeForm, {
  ServiceTypeFormValues,
} from '@/service-types/components/service-type-form';
import ServiceTypeSkeleton from '@/service-types/components/service-type-skeleton';
import useQueryServiceType from '@/service-types/hooks/use-query-service-type';
import useServiceTypeDetailsParams from '@/service-types/hooks/use-service-type-details-params';
import useServiceTypeMutations from '@/service-types/hooks/use-service-type-mutations';
import routes from '@/services/routes';

export default function EditServiceTypePage() {
  const tServiceTypes = useTranslations('serviceTypes');
  const tCommon = useTranslations('common');
  const { serviceTypeId, isValidId } = useServiceTypeDetailsParams();
  const { data: serviceType, isLoading } = useQueryServiceType({
    serviceTypeId,
    enabled: isValidId,
  });
  const { updateServiceType } = useServiceTypeMutations();

  const handleSubmit = async (values: ServiceTypeFormValues) => {
    await updateServiceType.mutateWithToast({ id: serviceTypeId, values });
  };

  if (isLoading) {
    return <ServiceTypeSkeleton />;
  }

  if (!serviceType) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tServiceTypes('edit.title')}
        description={`${serviceType.name}`}
        backHref={routes.serviceTypes.getDetailsRoute(serviceTypeId.toString())}
        backLabel={tServiceTypes('actions.backToList')}
      />
      <ServiceTypeForm
        defaultValues={serviceType}
        onSubmit={handleSubmit}
        submitButtonText={tCommon('actions.update')}
      />
    </div>
  );
}
