import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '../components/switch';

/**
 * The Switch component from our UI library.
 * Built with Radix UI Switch primitive for accessibility and consistent behavior.
 * Perfect for toggling settings, preferences, or boolean states.
 *
 * Features:
 * - Accessible by default with proper ARIA attributes
 * - Keyboard navigation support
 * - Focus management with visible focus ring
 * - Disabled state support
 * - Smooth animations and transitions
 */
const meta: Meta<typeof Switch> = {
  title: 'Form Components/Switch',
  component: Switch,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: { type: 'boolean' },
      description: 'The controlled checked state of the switch',
    },
    defaultChecked: {
      control: { type: 'boolean' },
      description: 'The default checked state of the switch',
    },
    disabled: {
      control: { type: 'boolean' },
      description:
        'When true, prevents the user from interacting with the switch',
    },
    required: {
      control: { type: 'boolean' },
      description: 'When true, indicates that the user must check the switch',
    },
    name: {
      control: { type: 'text' },
      description: 'The name of the switch (used when submitting a form)',
    },
    value: {
      control: { type: 'text' },
      description: 'The value of the switch (used when submitting a form)',
    },
    onCheckedChange: {
      action: 'checked-change',
      description: 'Event handler called when the checked state changes',
    },
  },
  args: {
    defaultChecked: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultChecked: false,
  },
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    defaultChecked: false,
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Switch defaultChecked={false} />
        <span className="text-sm">Unchecked</span>
      </div>

      <div className="flex items-center space-x-4">
        <Switch defaultChecked={true} />
        <span className="text-sm">Checked</span>
      </div>

      <div className="flex items-center space-x-4">
        <Switch defaultChecked={false} disabled />
        <span className="text-sm">Disabled (Unchecked)</span>
      </div>

      <div className="flex items-center space-x-4">
        <Switch defaultChecked={true} disabled />
        <span className="text-sm">Disabled (Checked)</span>
      </div>
    </div>
  ),
};
