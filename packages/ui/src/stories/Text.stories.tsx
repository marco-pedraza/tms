import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '../components/text';

/**
 * The Text component from our UI library with multiple variants and colors.
 * Built with Radix UI and class-variance-authority for consistent Text styling.
 * Automatically renders semantic HTML elements based on the variant.
 */
const meta: Meta<typeof Text> = {
  title: 'Components/Text',
  component: Text,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'],
      description:
        'The typography variant that determines the styling and semantic element',
    },
    textColor: {
      control: { type: 'select' },
      options: [
        'gray600',
        'gray500',
        'gray400',
        'gray300',
        'gray200',
        'gray100',
        'white',
        'primary',
        'primaryLight',
        'accent',
        'accentStrong',
        'muted',
        'success',
        'successStrong',
        'destructive',
        'gradient',
      ],
      description: 'The text color variant',
    },
    fontWeight: {
      control: { type: 'select' },
      options: ['regular', 'semibold', 'bold', 'extrabold'],
      description: 'The text weight variant',
    },
    italic: {
      control: { type: 'boolean' },
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Render the component as a child element using Radix Slot',
    },
    as: {
      control: { type: 'text' },
      description: 'Override the default HTML element (e.g., "div", "span")',
    },
  },
  args: {
    children: 'Typography Example Text',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TextXXL: Story = {
  args: {
    variant: 'xxl',
    children: 'XXL - 24px - Main Heading',
  },
};

export const TextXL: Story = {
  args: {
    variant: 'xl',
    children: 'XL - 20px - Secondary Heading',
  },
};

export const TextLG: Story = {
  args: {
    variant: 'lg',
    children: 'LG - 18px - Tertiary Heading',
  },
};

export const TextMD: Story = {
  args: {
    variant: 'md',
    children: 'MD - 16px - Used for Subheadings',
  },
};

export const TextSM: Story = {
  args: {
    variant: 'sm',
    children:
      'SM - 14px - This is a paragraph with default styling. It demonstrates how regular text content should appear using the typography component.',
  },
};

export const TextXS: Story = {
  args: {
    variant: 'xs',
    children:
      'XS - 12px - This font is useful for form feedback and table-column titles',
  },
};

export const AllTextScales: Story = {
  render: () => (
    <div className="space-y-3">
      <Text variant="xxl">XXL - 24px - Main Heading</Text>
      <Text variant="xl">XL - 20px - Secondary Heading</Text>
      <Text variant="lg">LG - 18px - Tertiary Heading</Text>
      <Text variant="md">MD - 16px - Used for Subheadings</Text>
      <Text variant="sm">
        SM - 14px - This is a paragraph with default styling. It demonstrates
        how regular text content should appear using the Text component.
      </Text>
      <Text variant="xs">
        XS - 12px - This font is useful for form feedback and table-column
        titles
      </Text>
    </div>
  ),
};
