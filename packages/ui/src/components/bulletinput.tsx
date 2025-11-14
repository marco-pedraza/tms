import { type ComponentProps, forwardRef, useId } from 'react';
import { cn } from '@repo/ui/lib/utils';
import { Bullet, type BulletProps } from './bullet';
import { Text } from './text';

interface BulletInputProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: string;
  description?: string;
  variant?: BulletProps['variant'];
  feedback?: string;
}

const BulletInput = forwardRef<HTMLInputElement, BulletInputProps>(
  ({ className, label, description, variant, feedback, ...props }, ref) => {
    const bulletId = useId();

    return (
      <div
        className={cn(
          'flex space-x-2',
          description ? 'items-start' : 'items-center',
          props.disabled && 'opacity-30',
        )}
      >
        <Bullet
          ref={ref}
          id={bulletId}
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
            <label htmlFor={bulletId}>{label}</label>
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
BulletInput.displayName = 'BulletInput';

export { BulletInput };
