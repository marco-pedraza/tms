'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';
import ServiceTypeSkeleton from '../components/service-type-skeleton';
import useQueryServiceType from '../hooks/use-query-service-type';
import useServiceTypeMutations from '../hooks/use-service-type-mutations';

export default function ServiceTypeDetailsPage() {
  const tServiceTypes = useTranslations('serviceTypes');
  const tCommon = useTranslations('common');
  const { itemId: serviceTypeId, isValidId } = useCollectionItemDetailsParams();
  const { data: serviceType, isLoading } = useQueryServiceType({
    itemId: serviceTypeId,
    enabled: isValidId,
  });
  const { delete: deleteServiceType } = useServiceTypeMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteServiceType.mutateWithToast(serviceTypeId);
    setIsDeleteDialogOpen(false);
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
        title={serviceType.name}
        description={tServiceTypes('details.description')}
        backHref={routes.serviceTypes.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.serviceTypes.getEditRoute(serviceType.id.toString())}
          onDelete={handleDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.name')}:</dt>
              <dd>{serviceType.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}:</dt>
              <dd>{serviceType.code}</dd>

              <dt className="font-medium">{tCommon('fields.category')}:</dt>
              <dd>{tServiceTypes(`categories.${serviceType.category}`)}</dd>

              <dt className="font-medium">{tCommon('fields.description')}:</dt>
              <dd>{serviceType.description}</dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <IsActiveBadge isActive={serviceType.active} />
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>{serviceType.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {serviceType.createdAt
                  ? new Date(serviceType.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {serviceType.updatedAt
                  ? new Date(serviceType.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
