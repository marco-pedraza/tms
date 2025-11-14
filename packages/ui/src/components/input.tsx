import {
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  useRef,
  useState,
} from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@repo/ui/lib/utils';
import { Text } from './text';

const inputVariants = cva(
  'border w-full rounded-lg shadow-md placeholder:text-gray-400 placeholder:!text-sm placeholder:italic focus:!outline-none focus:!ring-0 text-sm text-gray-600 cursor-pointer px-3 py-2 min-h-[36px] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'border-gray-100 focus:!border-accent',
        destructive:
          'border-destructive text-destructive focus:border-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface InputProps
  extends ComponentProps<'input'>,
    VariantProps<typeof inputVariants> {
  staticLabel?: boolean;
  label?: string;
  feedback?: string;
  'data-popover-open'?: boolean;
}

function Input({
  className,
  type,
  staticLabel = false,
  label,
  feedback,
  variant,
  disabled,
  'data-popover-open': dataPopoverOpen,
  ...props
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Calculate if floating label should be visible (no state needed)
  const inputValue =
    (typeof props.value === 'string' ? props.value : inputRef.current?.value) ||
    '';
  const isPopoverOpen = dataPopoverOpen === true;
  const shouldShowFloatingLabel =
    label &&
    (staticLabel || isFocused || inputValue.length > 0 || isPopoverOpen);

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    props.onChange?.(e);
  };

  const inputClasses = cn(inputVariants({ variant }), className);

  const inputElement = (
    <input
      ref={inputRef}
      type={type}
      data-slot="input"
      className={inputClasses}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      disabled={disabled}
      {...props}
    />
  );

  const floatingLabelElement = label && (
    <label
      className={cn(
        'absolute -top-3 left-3 bg-white px-1 text-sm font-medium transition-all duration-200',
        disabled ? 'text-gray-400' : 'text-gray-500',
        shouldShowFloatingLabel ? 'opacity-100' : 'opacity-0',
      )}
    >
      {label}
    </label>
  );

  const feedbackElement = feedback && (
    <Text variant="sm" italic textColor="destructive" className="mt-2">
      * {feedback}
    </Text>
  );

  return (
    <div className={label ? 'relative' : ''}>
      {inputElement}
      {floatingLabelElement}
      {feedbackElement}
    </div>
  );
}

export { Input, inputVariants };
