import type { Meta, StoryObj } from '@storybook/react';
import { SwitchInput } from '../components/switchinput';

/**
 * The SwitchInput component - toggle switch with label and description
 */
const meta: Meta<typeof SwitchInput> = {
  title: 'Form Components/SwitchInput',
  component: SwitchInput,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Label text for the switch (required)',
    },
    description: {
      control: { type: 'text' },
      description: 'Description text below the label (optional)',
    },
    feedback: {
      control: { type: 'text' },
      description: 'Error feedback message (always destructive)',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the switch is disabled',
    },
    checked: {
      control: { type: 'boolean' },
      description: 'Whether the switch is checked',
    },
    defaultChecked: {
      control: { type: 'boolean' },
      description: 'Default checked state (uncontrolled)',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the switch',
    },
  },
  args: {
    label: 'SwitchInput Label',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic switch with label
 */
export const WithLabel: Story = {
  args: {
    label: 'Enable notifications',
  },
};

/**
 * Switch with label and description
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
    label: 'This switch is disabled',
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
 * Checked by default (uncontrolled)
 */
export const DefaultChecked: Story = {
  args: {
    label: 'Enabled by default',
    description: 'This feature is enabled by default',
    defaultChecked: true,
  },
};

/**
 * Long label and description
 */
export const LongText: Story = {
  args: {
    label: 'Enable advanced security features for your account',
    description:
      'This will enable two-factor authentication, login notifications, and security alerts for any suspicious activity on your account',
  },
};

/**
 * With error feedback
 */
export const WithFeedback: Story = {
  args: {
    label: 'Enable sync',
    feedback: 'Internet connection required',
  },
};

/**
 * Multiple switches stacked
 */
export const MultipleStacked: Story = {
  render: () => (
    <div className="space-y-4">
      <SwitchInput
        label="Push notifications"
        description="Receive push notifications on your device"
      />
      <SwitchInput
        label="Email notifications"
        description="Receive email notifications for updates"
      />
      <SwitchInput
        label="SMS notifications"
        description="Receive text messages for important alerts"
        feedback="Standard messaging rates may apply"
      />
    </div>
  ),
  args: {
    label: 'Switch',
  },
};
