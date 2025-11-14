import type { Meta, StoryObj } from '@storybook/react';
import { CheckboxInput } from '../components/checkboxinput';

/**
 * The CheckboxInput component - checkbox with label and description
 */
const meta: Meta<typeof CheckboxInput> = {
  title: 'Form components/CheckboxInput',
  component: CheckboxInput,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Label text for the checkbox (required)',
    },
    description: {
      control: { type: 'text' },
      description: 'Description text below the label (optional)',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'small'],
      description: 'Size variant of the checkbox',
    },
    feedback: {
      control: { type: 'text' },
      description: 'Error feedback message (always destructive)',
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
  args: {
    label: 'CheckboxInput Label',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic checkbox with label
 */
export const WithLabel: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

/**
 * Checkbox with label and description
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
    label: 'This checkbox is disabled',
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
 * Small checkbox variant
 */
export const Small: Story = {
  args: {
    label: 'Small checkbox',
    variant: 'small',
  },
};

/**
 * Small checkbox with description
 */
export const SmallWithDescription: Story = {
  args: {
    label: 'Small checkbox with description',
    description: 'This shows how the small variant looks with description text',
    variant: 'small',
  },
};

/**
 * Multiple checkbox inputs
 */
export const Multiple: Story = {
  render: () => (
    <div className="space-y-3">
      <CheckboxInput label="Option 1" />
      <CheckboxInput label="Option 2" checked />
      <CheckboxInput label="Option 3" disabled />
    </div>
  ),
};

/**
 * With error feedback
 */
export const WithFeedback: Story = {
  args: {
    label: 'I accept the terms and conditions',
    feedback: 'You must accept the terms to continue',
  },
};

/**
 * Form example with different variants
 */
export const FormExample: Story = {
  render: () => (
    <form className="space-y-6 p-4 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
        <div className="space-y-4">
          <CheckboxInput
            label="Email notifications"
            description="Get notified about important updates"
            defaultChecked
          />
          <CheckboxInput
            label="SMS notifications"
            description="Receive text messages for urgent alerts"
          />
          <CheckboxInput
            label="Marketing emails"
            description="Receive promotional content and special offers"
          />
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium mb-3">Privacy</h4>
        <div className="space-y-3">
          <CheckboxInput label="Make profile public" />
          <CheckboxInput
            label="Allow data sharing"
            defaultChecked
            feedback="Required for certain features"
          />
        </div>
      </div>
    </form>
  ),
};
