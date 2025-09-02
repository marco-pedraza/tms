'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import DriverForm from '@/drivers/components/driver-form';
import type { DriverFormValues } from '@/drivers/components/driver-form';
import DriverFormSkeleton from '@/drivers/components/driver-form-skeleton';
import useDriverMutations from '@/drivers/hooks/use-driver-mutations';
import useQueryDriver from '@/drivers/hooks/use-query-driver';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

export default function EditDriverPage() {
  const t = useTranslations('drivers');
  const { itemId: driverId, isValidId } = useCollectionItemDetailsParams();
  const { data: driver, isLoading } = useQueryDriver({
    itemId: driverId,
    enabled: isValidId,
  });
  const { update: updateDriver } = useDriverMutations();

  const handleSubmit = async (values: DriverFormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timeOffs: _omit, medicalChecks: _omit2, ...driverData } = values;
    await updateDriver.mutateWithToast({ id: driverId, values: driverData });
  };

  if (isLoading) {
    return <DriverFormSkeleton />;
  }

  if (!driver) {
    return null;
  }

  const formatDateForInput = (date: string | Date | null): string => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0] ?? '';
  };

  const defaultValues = {
    id: driver.id,
    driverKey: driver.driverKey,
    payrollKey: driver.payrollKey,
    firstName: driver.firstName,
    lastName: driver.lastName,
    address: driver.address ?? '',
    emergencyContactName: driver.emergencyContactName ?? '',
    emergencyContactPhone: driver.emergencyContactPhone ?? '',
    emergencyContactRelationship: driver.emergencyContactRelationship ?? '',
    phone: driver.phone ?? '',
    email: driver.email ?? '',
    hireDate: formatDateForInput(driver.hireDate),
    status: driver.status,
    statusDate: formatDateForInput(driver.statusDate),
    license: driver.license,
    licenseExpiry: formatDateForInput(driver.licenseExpiry),
    busLineId: driver.busLineId,
    timeOffs: [],
    medicalChecks: [],
  };

  return (
    <div>
      <PageHeader
        title={t('actions.update')}
        description={`${driver.firstName} ${driver.lastName}`}
        backHref={routes.drivers.getDetailsRoute(driver.id.toString())}
      />
      <DriverForm defaultValues={defaultValues} onSubmit={handleSubmit} />
    </div>
  );
}
