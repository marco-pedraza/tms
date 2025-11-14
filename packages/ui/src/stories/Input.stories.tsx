import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../components/input';

/**
 * The Input component from our UI library with consistent styling and accessibility features.
 * Built with proper focus states, validation states, and responsive design.
 */

const meta: Meta<typeof Input> = {
  title: 'Form components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive'],
      description: 'Visual variant of the input',
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'The type of input field',
    },
    staticLabel: {
      control: { type: 'boolean' },
      description: 'Whether the floating label is always visible',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text for the input',
    },
    feedback: {
      control: { type: 'text' },
      description: 'Error feedback message (always destructive)',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the input is required',
    },
    value: {
      control: { type: 'text' },
      description: 'The value of the input',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the input',
    },
  },
  args: {
    placeholder: 'Enter text...',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Input without any label - just placeholder
 */
export const NoLabel: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

/**
 * Input with dynamic floating label (appears on focus/value)
 */
export const DynamicLabel: Story = {
  args: {
    variant: 'default',
    staticLabel: false,
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

/**
 * Input with destructive variant
 */
export const Destructive: Story = {
  args: {
    placeholder: 'This input has an error',
    variant: 'destructive',
    value: 'Invalid input',
    feedback: 'The information provided is invalid',
  },
};

/**
 * Disabled input state
 */
export const Disabled: Story = {
  args: {
    placeholder: 'This input is disabled',
    disabled: true,
  },
};

/**
 * Input with email type
 */
export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
  },
};

/**
 * Input with permanently visible floating label
 */
export const PermanentLabel: Story = {
  args: {
    staticLabel: true,
    label: 'Permanent Label',
    placeholder: 'This label is always visible...',
  },
};
