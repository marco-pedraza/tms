import { buses } from '@repo/ims-client';
import { KnownBusLicensePlateTypes } from '@/types/translations';

type BusLicensePlateTypesTranslationKeys = {
  [key in buses.BusLicensePlateType]: KnownBusLicensePlateTypes;
};

const busLicensePlateTypesTranslationKeys: BusLicensePlateTypesTranslationKeys =
  {
    NATIONAL: 'national',
    INTERNATIONAL: 'international',
    TOURISM: 'tourism',
  };

export default busLicensePlateTypesTranslationKeys;
