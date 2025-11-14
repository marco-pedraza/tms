import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '../components/textarea';

/**
 * The Textarea component - multi-line text input
 */
const meta: Meta<typeof Textarea> = {
  title: 'Form components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive'],
      description: 'Visual variant of the textarea',
    },
    staticLabel: {
      control: { type: 'boolean' },
      description: 'Whether the floating label is always visible',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text for the textarea',
    },
    feedback: {
      control: { type: 'text' },
      description: 'Error feedback message (always destructive)',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the textarea is disabled',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the textarea is required',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the textarea',
    },
  },
  args: {
    placeholder: 'Enter your message...',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic textarea
 */
export const DefaultNoLabel: Story = {
  args: {},
};

/**
 * Textarea with dynamic floating label (appears on focus/value)
 */
export const DynamicLabel: Story = {
  args: {
    label: 'Message',
    placeholder: 'Enter your message here...',
  },
};

/**
 * Textarea with permanently visible floating label
 */
export const PermanentLabel: Story = {
  args: {
    staticLabel: true,
    label: 'Permanent Label',
    placeholder: 'This label is always visible...',
  },
};

/**
 * Destructive variant with feedback
 */
export const WithFeedback: Story = {
  args: {
    variant: 'destructive',
    label: 'Error Message',
    feedback: 'This field is required',
    placeholder: 'Please fix this error...',
    required: true,
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    label: 'Disabled Textarea',
    placeholder: 'This textarea is disabled',
    disabled: true,
    defaultValue: 'This content cannot be edited',
  },
};
