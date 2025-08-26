'use client';

import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSkeleton from '@/drivers/components/driver-skeleton';
import DriverStatusBadge from '@/drivers/components/driver-status-badge';
import useDriverMutations from '@/drivers/hooks/use-driver-mutations';
import useQueryDriver from '@/drivers/hooks/use-query-driver';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import routes from '@/services/routes';

export default function DriverDetailsPage() {
  const tDrivers = useTranslations('drivers');
  const tCommon = useTranslations('common');
  const { itemId: driverId, isValidId } = useCollectionItemDetailsParams();
  const { data: driver, isLoading } = useQueryDriver({
    itemId: driverId,
    enabled: isValidId,
  });
  const { delete: deleteDriver } = useDriverMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({ onConfirm: deleteDriver.mutateWithToast });

  if (isLoading) {
    return <DriverSkeleton />;
  }

  if (!driver) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={`${driver.firstName} ${driver.lastName}`}
        description={tDrivers('details.description')}
        backHref={routes.drivers.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.drivers.getEditRoute(driver.id.toString())}
          onDelete={() => setDeleteId(driver.id)}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{tDrivers('sections.personalInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tDrivers('fields.driverKey')}:</dt>
              <dd className="font-mono">{driver.driverKey}</dd>

              <dt className="font-medium">{tDrivers('fields.payrollKey')}:</dt>
              <dd className="font-mono">{driver.payrollKey}</dd>

              <dt className="font-medium">{tCommon('fields.fullName')}:</dt>
              <dd>
                {driver.firstName} {driver.lastName}
              </dd>

              <dt className="font-medium">{tCommon('fields.phone')}:</dt>
              <dd>{driver.phone ?? '-'}</dd>

              <dt className="font-medium">{tCommon('fields.email')}:</dt>
              <dd>{driver.email ?? '-'}</dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <DriverStatusBadge status={driver.status} />
              </dd>

              <dt className="font-medium">{tDrivers('fields.statusDate')}:</dt>
              <dd>
                {driver.statusDate
                  ? new Date(
                      driver.statusDate + 'T00:00:00',
                    ).toLocaleDateString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tDrivers('fields.address')}:</dt>
              <dd>{driver.address ?? '-'}</dd>

              <dt className="font-medium">
                {tDrivers('fields.emergencyContactName')}:
              </dt>
              <dd>{driver.emergencyContactName ?? '-'}</dd>

              <dt className="font-medium">
                {tDrivers('fields.emergencyContactPhone')}:
              </dt>
              <dd>{driver.emergencyContactPhone ?? '-'}</dd>

              <dt className="font-medium">
                {tDrivers('fields.emergencyContactRelationship')}:
              </dt>
              <dd>{driver.emergencyContactRelationship ?? '-'}</dd>
            </dl>
          </CardContent>
        </Card>

        {/* Job Information */}
        <Card>
          <CardHeader>
            <CardTitle>{tDrivers('sections.jobInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tDrivers('fields.hireDate')}:</dt>
              <dd>
                {driver.hireDate
                  ? new Date(driver.hireDate + 'T00:00:00').toLocaleDateString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tDrivers('fields.busLine')}:</dt>
              <dd>{driver.busLine.name}</dd>

              <dt className="font-medium">{tDrivers('fields.transporter')}:</dt>
              <dd>{driver.transporter.name}</dd>

              <dt className="font-medium">{tDrivers('fields.license')}:</dt>
              <dd className="font-mono">{driver.license}</dd>

              <dt className="font-medium">
                {tDrivers('fields.licenseExpiry.title')}:
              </dt>
              <dd className="flex items-center gap-2">
                <span>
                  {new Date(
                    driver.licenseExpiry + 'T00:00:00',
                  ).toLocaleDateString()}
                </span>
              </dd>
            </dl>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>{driver.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {driver.createdAt
                  ? new Date(driver.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {driver.updatedAt
                  ? new Date(driver.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
