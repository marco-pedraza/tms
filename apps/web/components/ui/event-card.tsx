'use client';

import { Calendar } from 'lucide-react';
import { event_types } from '@repo/ims-client';
import DynamicLucideIcon from '@/components/ui/dynamic-lucide-icon';
import { cn } from '@/utils/cn';

interface EventCardProps {
  event: event_types.EventType;
  className?: string;
}

/**
 * Compact card component for displaying event information
 * Shows icon, name, and optional description
 */
export default function EventCard({ event, className }: EventCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col p-3 border rounded-lg bg-muted/25 hover:bg-muted/40 transition-colors',
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <DynamicLucideIcon
          name={'Calendar'}
          className="h-4 w-4 text-primary flex-shrink-0"
          fallback={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />
        <div className="font-medium text-sm truncate">{event.name}</div>
      </div>
      {event.description && (
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {event.description}
        </div>
      )}
    </div>
  );
}
