import { amenities } from '@repo/ims-client';
import { KnownAmenityTypes } from '@/types/translations';

type AmenityTypesTranslationKeys = {
  [key in amenities.AmenityType]: KnownAmenityTypes;
};

const amenityTypesTranslationKeys: AmenityTypesTranslationKeys = {
  bus: 'bus',
  installation: 'installation',
  service_type: 'service_type',
};

export default amenityTypesTranslationKeys;
