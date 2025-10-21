import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@repo/ui/lib/utils';

/**
 * Toggle switch component built with Radix UI primitives.
 *
 * Provides accessible boolean state toggling with keyboard navigation,
 * focus management, and disabled states. Supports controlled and uncontrolled modes.
 *
 * @example
 * ```tsx
 * // Uncontrolled
 * <Switch defaultChecked={false} />
 *
 * // Controlled
 * <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
 * ```
 */

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-gradient-to-r from-primary-light to-primary data-[state=checked]:border-none data-[state=checked]:shadow-sm data-[state=unchecked]:bg-white data-[state=unchecked]:border-gray-200 data-[state=unchecked]:shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all duration-500 ease-out outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-gray-300 data-[state=checked]:bg-white mx-0.5 pointer-events-none block size-3 rounded-full ring-0 transition-all duration-500 ease-out data-[state=checked]:translate-x-[calc(150%-2px)] data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
