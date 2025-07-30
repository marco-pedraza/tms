'use client';

import { LucideProps, icons } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DynamicLucideIconProps extends Omit<LucideProps, 'ref'> {
  /**
   * The name of the Lucide icon to render (kebab-case)
   * @example "wifi", "air-vent", "shield-check"
   */
  name: string;
  /**
   * Fallback content when icon is not found
   */
  fallback?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Convert kebab-case to PascalCase for Lucide icon names
 * @example "air-vent" -> "AirVent", "wifi" -> "Wifi"
 */
function kebabToPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Dynamic Lucide icon component that renders icons by name
 *
 * This component takes a kebab-case icon name and dynamically
 * renders the corresponding Lucide icon component.
 *
 * @example
 * ```tsx
 * <DynamicLucideIcon name="wifi" className="h-4 w-4" />
 * <DynamicLucideIcon name="air-vent" size={20} />
 * <DynamicLucideIcon name="invalid-icon" fallback={<span>?</span>} />
 * ```
 */
export default function DynamicLucideIcon({
  name,
  fallback,
  className,
  ...props
}: DynamicLucideIconProps) {
  // Convert kebab-case to PascalCase
  const iconName = kebabToPascalCase(name);

  // Get the icon component from the icons object
  const LucideIcon = icons[iconName as keyof typeof icons];

  // If icon doesn't exist, render fallback
  if (!LucideIcon) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback: a question mark in a box
    return (
      <div
        className={cn(
          'flex items-center justify-center text-xs text-muted-foreground border border-dashed border-muted-foreground/30 rounded',
          className ?? 'h-4 w-4',
        )}
      >
        ?
      </div>
    );
  }

  // Render the found icon
  return <LucideIcon className={cn('h-4 w-4', className)} {...props} />;
}
