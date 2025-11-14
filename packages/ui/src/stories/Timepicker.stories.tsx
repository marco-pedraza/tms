import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Timepicker } from '../components/timepicker';

function TimepickerWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof Timepicker>>;
}) {
  const [value, setValue] = useState<string>('');
  return (
    <Timepicker
      {...args}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

const meta: Meta<typeof Timepicker> = {
  title: 'Form components/Timepicker',
  component: Timepicker,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive'],
    },
    label: {
      control: { type: 'text' },
      description: 'Label text for the timepicker',
    },
    staticLabel: {
      control: { type: 'boolean' },
      description: 'Whether the label is always visible (permanent) or dynamic',
    },
    feedback: {
      control: { type: 'text' },
      description: 'Error feedback message (always destructive)',
    },
    disabled: {
      control: { type: 'boolean' },
    },
    required: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Timepicker without label
 */
export const Default: Story = {
  render: (args) => <TimepickerWrapper args={args} />,
  args: {
    placeholder: 'Select time',
    value: '',
    onChange: () => {},
  },
};

/**
 * Timepicker with dynamic floating label (appears when opened or has value)
 */
export const DynamicLabel: Story = {
  render: (args) => <TimepickerWrapper args={args} />,
  args: {
    staticLabel: false,
    label: 'Time',
    placeholder: 'Select time',
    value: '',
    onChange: () => {},
  },
};

/**
 * Timepicker with permanent floating label (always visible)
 */
export const PermanentLabel: Story = {
  render: (args) => <TimepickerWrapper args={args} />,
  args: {
    staticLabel: true,
    label: 'Time',
    placeholder: 'Select time',
    value: '',
    onChange: () => {},
  },
};

/**
 * Timepicker with error feedback
 */
export const WithFeedback: Story = {
  render: (args) => <TimepickerWrapper args={args} />,
  args: {
    label: 'Time',
    feedback: 'Invalid time selected',
    variant: 'destructive',
    placeholder: 'Select time',
    value: '',
    onChange: () => {},
  },
};

/**
 * Disabled timepicker
 */
export const Disabled: Story = {
  render: (args) => <TimepickerWrapper args={args} />,
  args: {
    label: 'Time',
    disabled: true,
    placeholder: 'Select time',
    value: '',
    onChange: () => {},
  },
};
