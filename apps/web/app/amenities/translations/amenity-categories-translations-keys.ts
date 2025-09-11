import { amenities } from '@repo/ims-client';
import { KnownAmenityCategories } from '@/types/translations';

type AmenityCategoriesTranslationKeys = {
  [key in amenities.AmenityCategory]: KnownAmenityCategories;
};

const amenityCategoriesTranslationKeys: AmenityCategoriesTranslationKeys = {
  basic: 'basic',
  comfort: 'comfort',
  technology: 'technology',
  security: 'security',
  accessibility: 'accessibility',
  services: 'services',
};

export default amenityCategoriesTranslationKeys;
