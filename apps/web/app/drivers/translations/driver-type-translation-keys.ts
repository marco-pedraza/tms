import { drivers } from '@repo/ims-client';

type DriverTypeTranslationKeys = {
  [key in drivers.DriverType]: string;
};

const driverTypeTranslationKeys: DriverTypeTranslationKeys = {
  standard: 'driverType.standard',
  substitute: 'driverType.substitute',
  temporary: 'driverType.temporary',
  tourist: 'driverType.tourist',
};

export default driverTypeTranslationKeys;
