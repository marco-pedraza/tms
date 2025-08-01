'use client';

import { Package } from 'lucide-react';
import { amenities } from '@repo/ims-client';
import AmenityCategoryBadge from '@/amenities/components/amenity-category-badge';
import DynamicLucideIcon from '@/components/ui/dynamic-lucide-icon';

interface AmenityCardProps {
  amenity: amenities.Amenity;
  className?: string;
}

/**
 * Compact card component for displaying amenity information
 * Shows icon, name, category badge, and optional description
 */
export default function AmenityCard({ amenity, className }: AmenityCardProps) {
  return (
    <div
      className={`flex flex-col p-3 border rounded-lg bg-muted/25 hover:bg-muted/40 transition-colors ${className ?? ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <DynamicLucideIcon
          name={amenity.iconName || 'Package'}
          className="h-4 w-4 text-primary flex-shrink-0"
          fallback={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <div className="font-medium text-sm truncate">{amenity.name}</div>
      </div>
      <div className="flex items-center justify-between">
        <AmenityCategoryBadge category={amenity.category} className="text-xs" />
      </div>
      {amenity.description && (
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {amenity.description}
        </div>
      )}
    </div>
  );
}
