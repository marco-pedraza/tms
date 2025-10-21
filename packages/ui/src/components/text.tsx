import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../lib/utils';

const textVariants = cva('', {
  variants: {
    variant: {
      xxl: 'text-xl md:text-2xl',
      xl: 'text-lg md:text-xl',
      lg: 'text-base md:text-lg',
      md: 'text-sm md:text-base',
      sm: 'text-xs md:text-sm',
      xs: 'text-[10px] md:text-[11px]',
    },
    textColor: {
      gray600: 'text-gray-600',
      gray500: 'text-gray-500',
      gray400: 'text-gray-400',
      gray300: 'text-gray-300',
      gray200: 'text-gray-200',
      gray100: 'text-gray-100',
      white: 'text-white',
      primary: 'text-primary',
      primaryLight: 'text-primary-light',
      accent: 'text-accent',
      accentStrong: 'text-accent-strong',
      muted: 'text-muted-foreground',
      success: 'text-success',
      successStrong: 'text-success-strong',
      destructive: 'text-destructive',
      gradient:
        'bg-gradient-to-r from-primary-light to-primary inline-block text-transparent bg-clip-text',
    },
    fontWeight: {
      regular: 'font-normal',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
    },
    italic: {
      true: 'italic',
      false: 'not-italic',
    },
  },
  defaultVariants: {
    variant: 'sm',
    textColor: 'gray600',
  },
});

interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof textVariants> {
  asChild?: boolean;
  as?: React.ElementType;
}

/**
 * A flexible text component with semantic HTML elements and consistent styling
 *
 * Automatically renders appropriate HTML elements based on the variant:
 * - xxl, xl, lg: heading elements (h1, h2, h3)
 * - md, sm, xs: paragraph elements (p)
 *
 * Supports custom element override via the `as` prop or child composition via `asChild`
 */
function Text({
  className,
  variant = 'sm',
  textColor = 'gray600',
  fontWeight = 'regular',
  italic = false,
  asChild = false,
  as,
  ...props
}: TextProps) {
  /**
   * Determines the appropriate HTML element based on variant
   */
  function getTagName(): React.ElementType {
    if (as) return as;

    switch (variant) {
      case 'xxl':
        return 'h1';
      case 'xl':
        return 'h2';
      case 'lg':
        return 'h3';
      case 'md':
      case 'sm':
      case 'xs':
        return 'p';
      default:
        return 'div';
    }
  }

  const Comp = asChild ? Slot : (getTagName() as React.ElementType);

  return (
    <Comp
      className={cn(
        textVariants({ variant, textColor, fontWeight, italic, className }),
      )}
      {...props}
    />
  );
}

export { Text, textVariants };
