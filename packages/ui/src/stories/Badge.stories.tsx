import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../components/badge';

/**
 * Badge component for displaying status, labels, or small pieces of information.
 *
 * Supports two visual variants (default and accent) and can be rendered as a custom
 * component via the asChild prop.
 *
 * @example
 * ```tsx
 * <Badge variant="default">New</Badge>
 * <Badge variant="accent">Featured</Badge>
 * <Badge asChild><a href="/details">Link Badge</a></Badge>
 * ```
 */
const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'accent'],
      description: 'The visual style variant of the badge',
    },
    asChild: {
      control: { type: 'boolean' },
      description:
        'Change the component to the HTML tag or custom component of the only child',
    },
    children: {
      control: { type: 'text' },
      description: 'The content to display inside the badge',
    },
  },
  args: {
    children: 'Badge',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'accent',
    children: 'Accent Badge',
  },
};
