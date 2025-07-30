'use client';

import { useTranslations } from 'next-intl';
import { amenities } from '@repo/ims-client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface AmenityCategoryBadgeProps {
  category: amenities.AmenityCategory;
  className?: string;
}

/**
 * Color mapping for each amenity category
 * Each category has a unique color scheme for better visual distinction
 */
const categoryColors: Record<amenities.AmenityCategory, string> = {
  basic: 'bg-slate-100 text-slate-700 border-slate-300',
  comfort: 'bg-blue-100 text-blue-700 border-blue-300',
  technology: 'bg-purple-100 text-purple-700 border-purple-300',
  security: 'bg-red-100 text-red-700 border-red-300',
  accessibility: 'bg-green-100 text-green-700 border-green-300',
  services: 'bg-orange-100 text-orange-700 border-orange-300',
};

/**
 * Badge component that displays amenity categories with color-coded styling
 *
 * @param category - The amenity category to display
 * @param className - Optional additional CSS classes
 */
export default function AmenityCategoryBadge({
  category,
  className,
}: AmenityCategoryBadgeProps) {
  const tAmenities = useTranslations('amenities');

  return (
    <Badge
      variant="outline"
      className={cn(categoryColors[category], className)}
    >
      {tAmenities(`categories.${category}`)}
    </Badge>
  );
}
