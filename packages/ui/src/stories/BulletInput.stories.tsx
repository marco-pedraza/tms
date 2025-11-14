import type { Meta, StoryObj } from '@storybook/react';
import { BulletInput } from '../components/bulletinput';

/**
 * The BulletInput component - radio button with label and description
 */
const meta: Meta<typeof BulletInput> = {
  title: 'Form components/BulletInput',
  component: BulletInput,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Label text for the bullet (required)',
    },
    description: {
      control: { type: 'text' },
      description: 'Description text below the label (optional)',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'small'],
      description: 'Size variant of the bullet',
    },
    feedback: {
      control: { type: 'text' },
      description: 'Error feedback message (always destructive)',
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
  args: {
    label: 'BulletInput Label',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic bullet with label
 */
export const WithLabel: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

/**
 * Bullet with label and description
 */
export const WithDescription: Story = {
  args: {
    label: 'Email notifications',
    description: 'Receive updates about your account and new features',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    label: 'This bullet is disabled',
    disabled: true,
  },
};

/**
 * Disabled and checked state
 */
export const DisabledChecked: Story = {
  args: {
    label: 'Disabled and checked',
    disabled: true,
    checked: true,
  },
};

/**
 * Small bullet variant
 */
export const Small: Story = {
  args: {
    label: 'Small bullet',
    variant: 'small',
  },
};

/**
 * Small bullet with description
 */
export const SmallWithDescription: Story = {
  args: {
    label: 'Small bullet with description',
    description: 'This shows how the small variant looks with description text',
    variant: 'small',
  },
};

/**
 * With error feedback
 */
export const WithFeedback: Story = {
  args: {
    label: 'Terms and conditions',
    feedback: 'You must accept the terms to continue',
  },
};
