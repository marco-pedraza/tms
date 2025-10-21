import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@repo/ui/lib/utils';
import { Text } from './text';

// Convert hex to RGB for opacity calculation
function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result?.[1] || !result[2] || !result[3]) return null;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r}, ${g}, ${b}`;
}

const tagVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 w-fit whitespace-nowrap shrink-0',
  {
    variants: {
      variant: {
        default: 'border-gray-300 text-gray-500 bg-gray-100',
        primary: 'border-primary text-primary bg-primary/15',
        primaryLight:
          'border-primary-light text-primary-light bg-primary-light/15',
        accent: 'border-accent text-accent bg-accent/15',
        accentStrong:
          'border-accent-strong text-accent-strong bg-accent-strong/15',
        success: 'border-success text-success bg-success/15',
        destructive: 'border-destructive text-destructive bg-destructive/15',
        muted: 'border-gray-300 text-gray-500 bg-gray-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

// Base interface for common props
interface BaseTagProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  /**
   * The content to display inside the tag
   */
  children: React.ReactNode;
}

// Interface for variant-based tags
interface VariantTagProps
  extends BaseTagProps,
    VariantProps<typeof tagVariants> {
  /**
   * Custom color is not allowed when using variants
   */
  color?: never;
}

// Interface for custom color tags
interface CustomColorTagProps extends BaseTagProps {
  /**
   * Custom hexadecimal color for the tag
   * When provided, this color will be used for border, text, and background (with 15% opacity)
   */
  color: string;
  /**
   * Variant is not allowed when using custom color
   */
  variant?: never;
}

/**
 * A flexible tag component with predefined color variants and custom color support
 *
 * @throws {TypeError} When both variant and color props are provided
 *
 * When a custom color is provided, it overrides the variant and applies to:
 * - Border: full opacity
 * - Text: full opacity
 * - Background: 15% opacity
 *
 * @example
 * // ✅ Correct usage
 * <Tag>Default Tag</Tag>
 * <Tag variant="primary">Primary Tag</Tag>
 * <Tag color="#ff0000">Custom Tag</Tag>
 *
 * @example
 * // ❌ Incorrect usage (will show TypeScript error)
 * <Tag variant="primary" color="#ff0000">Mixed props</Tag>
 */

function Tag(props: VariantTagProps | CustomColorTagProps) {
  const { className, children } = props;

  // Type guard to determine if we're using custom color
  const isCustomColor = 'color' in props && props.color !== undefined;

  // Generate styles based on custom color (overrides variant)
  const customStyles = React.useMemo(() => {
    if (!isCustomColor || !props.color) return {};

    const rgb = hexToRgb(props.color);
    if (!rgb) return {};

    return {
      borderColor: props.color,
      backgroundColor: `rgba(${rgb}, 0.15)`,
    };
  }, [isCustomColor, props.color]);

  // Determine which variant to use
  const variant = isCustomColor ? undefined : props.variant;

  return (
    <div
      data-slot="tag"
      className={cn(tagVariants({ variant }), className)}
      style={customStyles}
      {...props}
    >
      <Text
        variant="xs"
        fontWeight="semibold"
        className="whitespace-nowrap text-inherit"
        style={
          isCustomColor && props.color ? { color: props.color } : undefined
        }
      >
        {children}
      </Text>
    </div>
  );
}

export { Tag };
