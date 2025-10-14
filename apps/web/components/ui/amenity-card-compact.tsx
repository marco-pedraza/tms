'use client';

import { Package } from 'lucide-react';
import { amenities } from '@repo/ims-client';
import DynamicLucideIcon from '@/components/ui/dynamic-lucide-icon';
import { cn } from '@/utils/cn';

interface AmenityCardCompactProps {
  amenity: amenities.Amenity;
  className?: string;
}

/**
 * Compact horizontal card component for displaying amenity information
 * Shows only icon and name in a single line for space-efficient display
 */
export default function AmenityCardCompact({
  amenity,
  className,
}: AmenityCardCompactProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1 border rounded bg-muted/25 hover:bg-muted/40 transition-colors',
        className,
      )}
    >
      <DynamicLucideIcon
        name={amenity.iconName || 'Package'}
        className="h-4 w-4 text-primary flex-shrink-0"
        fallback={<Package className="h-4 w-4 text-muted-foreground" />}
      />
      <div className="font-medium text-sm truncate">{amenity.name}</div>
    </div>
  );
}
