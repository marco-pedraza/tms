import { bus_models } from '@repo/ims-client';
import { KnownBusEngineTypes } from '@/types/translations';

type BusEngineTypeTranslationKeys = {
  [key in bus_models.EngineType]: KnownBusEngineTypes;
};

const busEngineTypeTranslationKeys: BusEngineTypeTranslationKeys = {
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
  HYBRID: 'hybrid',
  GASOLINE: 'gasoline',
  NATURAL_GAS: 'natural_gas',
  LPG: 'lpg',
  OTHER: 'other',
};

export default busEngineTypeTranslationKeys;
