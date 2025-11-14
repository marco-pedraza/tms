import { type ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@repo/ui/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center rounded-full px-4 py-2 font-medium transition-all hover:cursor-pointer active:shadow-lg focus:shadow-lg active:border active:border-white active:border-2 focus:border-2  focus:border-white active:border-dashed focus:border-dashed disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none',
  {
    variants: {
      variant: {
        // --- LINK BUTTONS ---
        linkPrimary:
          'bg-none border-none text-primary underline underline-offset-4 hover:border-none hover:bg-none! hover:text-primary-light focus:outline-none active:outline-none focus:shadow-none active:shadow-none',
        linkDestructive:
          'bg-none  border-none text-destructive underline underline-offset-4 hover:border-none hover:bg-none hover:text-destructive',

        // --- OUTLINE BUTTONS ---
        outlineGray:
          'bg-background border border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white',
        outlinePrimary:
          'bg-background border border-primary text-primary hover:bg-primary hover:text-white',
        outlineDestructive:
          'bg-background border border-destructive text-destructive hover:bg-destructive hover:text-white',

        // ---  DEFAULLT BUTTONS ---
        gradient:
          'border-none text-white bg-gradient-to-r from-primary to-primary-light hover:text-white hover:scale-105',
        primary:
          'border-none text-primary-foreground bg-primary hover:bg-primary-light hover:scale-105',
        destructive:
          'border-none text-primary-foreground bg-destructive hover:bg-destructive hover:scale-105 active:bg-destructive focus:bg-destructive',
      },
      size: {
        sm: 'min-h-8 px-3 text-xs has-[>svg]:px-3',
        md: 'min-h-9 px-4 text-sm py-2 has-[>svg]:px-2',
        lg: 'min-h-10 px-6 text-base has-[>svg]:px-2',
      },
    },

    defaultVariants: {
      variant: 'gradient',
      size: 'md',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
