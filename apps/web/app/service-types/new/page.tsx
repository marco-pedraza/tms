'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import ServiceTypeForm from '../components/service-type-form';
import useServiceTypeAmenityMutations from '../hooks/use-service-type-amenity-mutations';
import useServiceTypeMutations from '../hooks/use-service-type-mutations';

export default function NewServiceTypePage() {
  const t = useTranslations('serviceTypes');
  const { create: createServiceType } = useServiceTypeMutations();
  const { assignAmenities } = useServiceTypeAmenityMutations();
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.serviceTypes.index}
        backLabel={t('actions.backToList')}
      />
      <ServiceTypeForm
        onSubmit={async (values) => {
          const { amenityIds = [], ...createPayload } = values;
          const created = await createServiceType.mutateWithToast(
            createPayload,
            { standalone: false },
          );
          if (created && amenityIds.length > 0) {
            try {
              await assignAmenities.mutateWithToast(
                { id: created.id, amenityIds },
                { standalone: false },
              );
            } catch {
              // Ignore amenity assignment errors and continue navigation
            }
          }
          router.push(routes.serviceTypes.getDetailsRoute(String(created.id)));
          return created;
        }}
      />
    </div>
  );
}
