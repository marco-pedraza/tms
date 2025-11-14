import { type HTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@repo/ui/lib/utils';

const cardVariants = cva('bg-card', {
  variants: {
    variant: {
      default: 'bg-white',
      gradient: 'bg-gradient-to-r from-primary-pastel to-accent-pastel',
    },
    borderColor: {
      none: 'border-none',
      gray100: 'border border-gray-100',
      gray300: 'border border-gray-300',
      accent: 'border border-accent',
      primaryLight: 'border border-primary-light',
      destructive: 'border border-destructive',
    },
    borderStyle: {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    },
    shadow: {
      none: 'shadow-none',
      sm: 'shadow-md',
      lg: 'shadow-lg',
    },
    padding: {
      sm: 'p-3',
      md: 'p-5 md:p-6',
      lg: 'p-7 md:p-8',
    },
    borderRadius: {
      sm: 'rounded-lg',
      md: 'rounded-2xl',
      lg: 'rounded-3xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
    borderRadius: 'md',
    shadow: 'lg',
    borderColor: 'gray100',
    borderStyle: 'solid',
  },
});

interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

function Card({
  className,
  variant,
  padding,
  shadow,
  borderRadius,
  borderColor,
  borderStyle,
  asChild = false,
  ...props
}: CardProps) {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      data-slot="card"
      className={cn(
        cardVariants({
          variant,
          padding,
          borderRadius,
          borderColor,
          borderStyle,
          shadow,
          className,
        }),
      )}
      {...props}
    />
  );
}

export { Card, cardVariants };
