'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ServiceTypeSkeleton from '@/service-types/components/service-type-skeleton';
import useQueryServiceType from '@/service-types/hooks/use-query-service-type';
import useServiceTypeDetailsParams from '@/service-types/hooks/use-service-type-details-params';
import useServiceTypeMutations from '@/service-types/hooks/use-service-type-mutations';
import routes from '@/services/routes';

export default function ServiceTypePage() {
  const tServiceTypes = useTranslations('serviceTypes');
  const tCommon = useTranslations('common');
  const { serviceTypeId, isValidId } = useServiceTypeDetailsParams();
  const { data: serviceType, isLoading } = useQueryServiceType({
    serviceTypeId,
    enabled: isValidId,
  });
  const { deleteServiceType } = useServiceTypeMutations();
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
        backLabel={tServiceTypes('actions.backToList')}
      />

      <div className="mb-6 flex justify-end">
        <ActionButtons
          editHref={routes.serviceTypes.getEditRoute(serviceType.id.toString())}
          onDelete={handleDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                {tServiceTypes('fields.name')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{serviceType.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                {tServiceTypes('fields.active')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {serviceType.active ? (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800"
                  >
                    {tCommon('status.active')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    {tCommon('status.inactive')}
                  </Badge>
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">
                {tServiceTypes('fields.description')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {serviceType.description || '-'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                {tCommon('fields.id')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{serviceType.id}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                {tCommon('fields.createdAt')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(serviceType.createdAt).toLocaleString()}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                {tCommon('fields.updatedAt')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(serviceType.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
