import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';
import { Badge } from './badge';
import { Card } from './card';
import { Text } from './text';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  rightContent: string;
  icon?: React.ReactNode;
  badges?: string[];
  className?: string;
}

/**
 * A section header component with title, description, and a right-side card with content, icon, and badges
 *
 * Uses Card and Text components internally for consistent styling.
 * Icons should come from components/icons and will maintain their original colors.
 * Perfect for page headers, section introductions, or dashboard headers.
 */
function SectionHeader({
  title,
  description,
  rightContent,
  icon,
  badges = [],
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn('w-full', className)}
      {...props}
    >
      <Card
        variant="default"
        padding="md"
        shadow="lg"
        borderColor="gray100"
        borderStyle="solid"
        borderRadius="md"
        className="flex flex-col md:flex-row items-start gap-6"
      >
        {/* Left side - Title and Description */}
        <div className="flex-1 space-y-2 order-1 md:order-none">
          <Text
            variant="xxl"
            textColor="gray600"
            fontWeight="extrabold"
            className="leading-tight"
          >
            {title}
          </Text>
          {description && (
            <Text
              variant="sm"
              textColor="gray500"
              fontWeight="regular"
              className="leading-relaxed"
            >
              {description}
            </Text>
          )}
        </div>

        {/* Right side - Content Card with Icon and Badges */}
        <div className="flex-shrink-0 min-w-fit m-auto order-2 md:order-none">
          <Card
            variant="default"
            padding="sm"
            shadow="lg"
            borderColor="gray100"
            borderStyle="solid"
            borderRadius="lg"
            className="flex flex-col text-center space-y-3 min-w-fit"
          >
            {/* Right Content with Icon */}
            <div className="flex justify-start gap-2">
              {icon && <div className="flex-shrink-0">{icon}</div>}

              <Text variant="md" textColor="gray600" fontWeight="semibold">
                {rightContent}
              </Text>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap md:flex-nowrap gap-1 justify-center md:whitespace-nowrap">
                {badges.map((badge, index) => (
                  <Badge key={index} variant="default">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Card>
    </div>
  );
}

export { SectionHeader };
