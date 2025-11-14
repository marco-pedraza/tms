import { type ComponentProps, forwardRef, useId } from 'react';
import { cn } from '@repo/ui/lib/utils';
import { Checkbox, type CheckboxProps } from './checkbox';
import { Text } from './text';

interface CheckboxInputProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: string;
  description?: string;
  variant?: CheckboxProps['variant'];
  feedback?: string;
}

const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
  ({ className, label, description, variant, feedback, ...props }, ref) => {
    const checkboxId = useId();

    return (
      <div
        className={cn(
          'flex space-x-2',
          description ? 'items-start' : 'items-center',
          props.disabled && 'opacity-30',
        )}
      >
        <Checkbox
          ref={ref}
          id={checkboxId}
          className={className}
          variant={variant}
          {...props}
        />
        <div className="flex flex-col">
          <Text
            asChild
            variant="sm"
            fontWeight={description ? 'semibold' : 'regular'}
            className="leading-none cursor-pointer"
          >
            <label htmlFor={checkboxId}>{label}</label>
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
  },
);
CheckboxInput.displayName = 'CheckboxInput';

export { CheckboxInput };
