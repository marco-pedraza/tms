import { type ComponentProps, type ElementRef, forwardRef, useId } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@repo/ui/lib/utils';
import { Switch } from './switch';
import { Text } from './text';

interface SwitchInputProps extends ComponentProps<typeof SwitchPrimitive.Root> {
  label: string;
  description?: string;
  feedback?: string;
}

/**
 * Switch input with label and optional description for form usage
 *
 * Wraps the base Switch component with accessible label and description.
 * Automatically generates and links IDs for proper accessibility.
 *
 * Example usage:
 * ```tsx
 * <SwitchInput
 *   label="Enable notifications"
 *   description="Receive email notifications for updates"
 *   checked={isEnabled}
 *   onCheckedChange={setIsEnabled}
 * />
 * ```
 */
const SwitchInput = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  SwitchInputProps
>(({ className, label, description, feedback, ...props }, ref) => {
  const switchId = useId();

  return (
    <div
      className={cn(
        'flex space-x-2',
        description ? 'items-start' : 'items-center',
        props.disabled && 'opacity-30',
      )}
    >
      <Switch ref={ref} id={switchId} className={className} {...props} />
      <div className="flex flex-col">
        <Text
          asChild
          variant="sm"
          fontWeight={description ? 'semibold' : 'regular'}
          className="leading-none cursor-pointer"
        >
          <label htmlFor={switchId}>{label}</label>
        </Text>
        {description && (
          <Text variant="sm" textColor="gray500" className="mt-1">
            {description}
          </Text>
        )}
        {feedback && (
          <Text variant="sm" italic textColor="destructive" className="mt-1">
            * {feedback}
          </Text>
        )}
      </div>
    </div>
  );
});
SwitchInput.displayName = 'SwitchInput';

export { SwitchInput };
