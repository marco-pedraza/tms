import type { Meta, StoryObj } from '@storybook/react';
import { Bullet } from '../components/bullet';

/**
 * The Bullet component - basic radio button only
 */
const meta: Meta<typeof Bullet> = {
  title: 'Form components/Bullet',
  component: Bullet,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'small'],
      description: 'Size variant of the bullet',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the bullet is disabled',
    },
    checked: {
      control: { type: 'boolean' },
      description: 'Whether the bullet is checked',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the bullet',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic bullet only
 */
export const Default: Story = {
  args: {},
};

/**
 * Checked state
 */
export const Checked: Story = {
  args: {
    checked: true,
  },
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
 * Small size checked
 */
export const SmallChecked: Story = {
  args: {
    variant: 'small',
    checked: true,
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
        <Bullet variant="default" />
        <span className="text-sm">Default size (16x16px)</span>
      </div>
      <div className="flex items-center space-x-2">
        <Bullet variant="small" />
        <span className="text-sm">Small size (12x12px)</span>
      </div>
      <div className="flex items-center space-x-2">
        <Bullet variant="default" checked />
        <span className="text-sm">Default checked</span>
      </div>
      <div className="flex items-center space-x-2">
        <Bullet variant="small" checked />
        <span className="text-sm">Small checked</span>
      </div>
    </div>
  ),
};
