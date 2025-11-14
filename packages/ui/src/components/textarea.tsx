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

const textareaVariants = cva(
  'border w-full rounded-lg shadow-md placeholder:text-gray-400 placeholder:!text-sm placeholder:italic focus:!outline-none focus:!ring-0 text-sm text-gray-600 cursor-pointer px-3 py-2 min-h-[100px] resize-vertical disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
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

interface TextareaProps
  extends ComponentProps<'textarea'>,
    VariantProps<typeof textareaVariants> {
  staticLabel?: boolean;
  label?: string;
  feedback?: string;
  'data-popover-open'?: boolean;
}

/**
 * Textarea component with floating label and description support
 *
 * Based on Input component structure but renders as textarea
 * with increased height and vertical resize capability
 */
function Textarea({
  className,
  staticLabel = false,
  label,
  feedback,
  variant,
  disabled,
  'data-popover-open': dataPopoverOpen,
  ...props
}: TextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Calculate if floating label should be visible (no state needed)
  const textareaValue =
    (typeof props.value === 'string'
      ? props.value
      : textareaRef.current?.value) || '';
  const isPopoverOpen = dataPopoverOpen === true;
  const shouldShowFloatingLabel =
    label &&
    (staticLabel || isFocused || textareaValue.length > 0 || isPopoverOpen);

  const handleFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    props.onChange?.(e);
  };

  const textareaClasses = cn(textareaVariants({ variant }), className);

  const textareaElement = (
    <textarea
      ref={textareaRef}
      data-slot="textarea"
      className={textareaClasses}
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
      {textareaElement}
      {floatingLabelElement}
      {feedbackElement}
    </div>
  );
}

export { Textarea };
