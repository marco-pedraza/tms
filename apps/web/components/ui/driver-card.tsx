'use client';

import { User } from 'lucide-react';
import { drivers } from '@repo/ims-client';
import DynamicLucideIcon from '@/components/ui/dynamic-lucide-icon';
import { cn } from '@/utils/cn';

interface DriverCardProps {
  driver: drivers.Driver;
  className?: string;
}

/**
 * Compact card component for displaying event information
 * Shows icon, name, and optional description
 */
export default function DriverCard({ driver, className }: DriverCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col p-3 border rounded-lg bg-muted/25 hover:bg-muted/40 transition-colors',
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <DynamicLucideIcon
          name={'User'}
          className="h-4 w-4 text-primary flex-shrink-0"
          fallback={<User className="h-4 w-4 text-muted-foreground" />}
        />
        <div className="font-medium text-sm truncate">
          {driver.firstName} {driver.lastName}
        </div>
      </div>
    </div>
  );
}
