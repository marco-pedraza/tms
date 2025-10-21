import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from '../components/tag';

/**
 * Tag component using predefined design system variants.
 *
 * Perfect for consistent branding and design system compliance.
 * Uses predefined color variants that match your design system.
 */
const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tag component using predefined design system variants. Perfect for consistent branding and design system compliance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default',
        'primary',
        'primaryLight',
        'accent',
        'accentStrong',
        'success',
        'destructive',
        'muted',
      ],
      description: 'Predefined color variant from the design system',
    },
    children: {
      control: { type: 'text' },
      description: 'The content to display inside the tag',
    },
  },
  args: {
    children: 'Tag',
  },
};

export default meta;
type Story = StoryObj<{
  variant: string;
  children: string;
}>;

// ===== VARIANT-BASED STORIES =====
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Tag',
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Tag',
  },
};

export const Accent: Story = {
  args: {
    variant: 'accent',
    children: 'Accent Tag',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Tag',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive Tag',
  },
};

// ===== COMPARISON STORY =====
export const VariantVsCustom: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Tag variant="primary">Design System Primary</Tag>
      <Tag color="#3B82F6">Custom Blue</Tag>
      <Tag variant="success">Design System Success</Tag>
      <Tag color="#10B981">Custom Green</Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comparison between design system variants and custom colors with similar hex values.',
      },
    },
  },
};
