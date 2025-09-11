'use client';

import { useTranslations } from 'next-intl';
import { amenities } from '@repo/ims-client';
import amenityTypesTranslationKeys from '@/amenities/translations/amenity-types-translations-keys';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface AmenityTypeBadgeProps {
  amenityType: amenities.AmenityType;
  className?: string;
}

/**
 * Color mapping for each amenity type
 * Each type has a unique color scheme for better visual distinction
 */
const typeColors: Record<amenities.AmenityType, string> = {
  bus: 'bg-blue-100 text-blue-700 border-blue-300',
  installation: 'bg-green-100 text-green-700 border-green-300',
  service_type: 'bg-purple-100 text-purple-700 border-purple-300',
};

/**
 * Badge component that displays amenity types with color-coded styling
 *
 * @param amenityType - The amenity type to display
 * @param className - Optional additional CSS classes
 */
export default function AmenityTypeBadge({
  amenityType,
  className,
}: AmenityTypeBadgeProps) {
  const tAmenities = useTranslations('amenities');

  return (
    <Badge variant="outline" className={cn(typeColors[amenityType], className)}>
      {tAmenities(`amenityTypes.${amenityTypesTranslationKeys[amenityType]}`)}
    </Badge>
  );
}
