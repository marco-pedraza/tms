import { drivers } from '@repo/ims-client';

type DriverStatusTranslationKeys = {
  [key in drivers.DriverStatus]: string;
};

const driverStatusTranslationKeys: DriverStatusTranslationKeys = {
  active: 'status.active',
  inactive: 'status.inactive',
  suspended: 'status.suspended',
  on_leave: 'status.on_leave',
  terminated: 'status.terminated',
  in_training: 'status.in_training',
  probation: 'status.probation',
};

export default driverStatusTranslationKeys;
