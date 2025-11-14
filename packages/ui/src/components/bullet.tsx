import { type ComponentProps, forwardRef } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@repo/ui/lib/utils';

const bulletVariants = cva(
  'shrink-0 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none outline outline-primary outline-1 checked:bg-gradient-to-r checked:from-primary checked:to-primary-light checked:border-white',
  {
    variants: {
      variant: {
        default: 'h-4 w-4 checked:border-3',
        small: 'h-3 w-3 checked:border-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BulletProps
  extends Omit<ComponentProps<'input'>, 'type'>,
    VariantProps<typeof bulletVariants> {}

const Bullet = forwardRef<HTMLInputElement, BulletProps>(
  ({ className, variant, ...props }, ref) => (
    <input
      type="radio"
      ref={ref}
      className={cn(bulletVariants({ variant }), className)}
      {...props}
    />
  ),
);
Bullet.displayName = 'Bullet';

export { Bullet };
