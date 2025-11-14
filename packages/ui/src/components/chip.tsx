import { type ComponentProps, type ComponentType } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Text } from './text';

const chipVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-normal transition-colors',
  {
    variants: {
      variant: {
        accent: 'bg-accent/15 text-gray-600',
        gray: 'bg-gray-300/50 text-gray-600',
      },
    },
    defaultVariants: {
      variant: 'accent',
    },
  },
);

export interface ChipProps
  extends ComponentProps<'div'>,
    VariantProps<typeof chipVariants> {
  /**
   * Icon component to display on the left side
   */
  icon?: ComponentType<{ className?: string }>;
  /**
   * Callback when the remove button is clicked (only for accent variant)
   */
  onRemove?: () => void;
  /**
   * The label text to display
   */
  label: string;
}

/**
 * Chip component with two variants: accent (editable with remove button) and gray (static, optional icon)
 *
 * Example usage:
 * ```tsx
 * <Chip label="Tag Name" variant="accent" onRemove={() => console.log('removed')} />
 * <Chip label="Static Tag" variant="gray" icon={IconComponent} />
 * ```
 */
function Chip({
  className,
  variant = 'accent',
  icon: Icon,
  onRemove,
  label,
  ...props
}: ChipProps) {
  const isEditable = variant === 'accent' && onRemove;

  return (
    <div className={cn(chipVariants({ variant }), className)} {...props}>
      {Icon && <Icon className="h-4 w-4 text-gray-600" />}
      <Text variant="sm">{label}</Text>
      {isEditable && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-4 w-4 items-center justify-center rounded-sm text-gray-400 hover:text-white hover:bg-accent-strong transition-colors duration-150 cursor-pointer"
          aria-label={`Remove ${label}`}
        >
          <X className="h-4 w-4 stroke-2" />
        </button>
      )}
    </div>
  );
}

export { Chip, chipVariants };
