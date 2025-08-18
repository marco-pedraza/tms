import { buses } from '@repo/ims-client';
import { KnownBusStatuses } from '@/types/translations';

type BusStatusTranslationKeys = {
  [key in buses.BusStatus]: KnownBusStatuses;
};

const busStatusTranslationKeys: BusStatusTranslationKeys = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  REPAIR: 'repair',
  OUT_OF_SERVICE: 'out_of_service',
  RESERVED: 'reserved',
  IN_TRANSIT: 'in_transit',
  RETIRED: 'retired',
};

export default busStatusTranslationKeys;
