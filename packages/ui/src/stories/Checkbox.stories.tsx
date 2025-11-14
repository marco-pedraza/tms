import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '../components/checkbox';

/**
 * The Checkbox component - basic checkbox only
 */
const meta: Meta<typeof Checkbox> = {
  title: 'Form components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'small'],
      description: 'Size variant of the checkbox',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is disabled',
    },
    checked: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is checked',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the checkbox',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic checkbox only
 */
export const Default: Story = {
  args: {},
};

/**
 * Small size variant
 */
export const Small: Story = {
  args: {
    variant: 'small',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/**
 * Disabled and checked state
 */
export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};

/**
 * Size comparison
 */
export const SizeComparison: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox variant="default" />
        <span className="text-sm">Default size (16x16px)</span>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox variant="small" />
        <span className="text-sm">Small size (12x12px)</span>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox variant="default" checked />
        <span className="text-sm">Default checked</span>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox variant="small" checked />
        <span className="text-sm">Small checked</span>
      </div>
    </div>
  ),
};
