import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Datepicker } from '../components/datepicker';

/**
 * The Datepicker component built on top of the Input component.
 * Automatically sets type="date" and applies date-specific styling
 * while maintaining all Input functionality.
 */

function DatepickerWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof Datepicker>>;
}) {
  const [value, setValue] = useState<string>('');
  return (
    <Datepicker
      {...args}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

function DatepickerWithValueWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof Datepicker>>;
}) {
  const [value, setValue] = useState<string>('2024-01-15');
  return (
    <Datepicker
      {...args}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

const meta: Meta<typeof Datepicker> = {
  title: 'Form components/Datepicker',
  component: Datepicker,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive'],
      description: 'Visual variant of the datepicker',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the datepicker',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text for the datepicker',
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
      description: 'Whether the datepicker is disabled',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the datepicker is required',
    },
    value: {
      control: { type: 'text' },
      description: 'The value of the datepicker (YYYY-MM-DD format)',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the datepicker',
    },
  },
  args: {
    staticLabel: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Datepicker without label
 */
export const Default: Story = {
  render: (args) => <DatepickerWrapper args={args} />,
  args: {
    value: '',
    onChange: () => {},
  },
};

/**
 * Datepicker with dynamic floating label (appears when opened or has value)
 */
export const DynamicLabel: Story = {
  render: (args) => <DatepickerWrapper args={args} />,
  args: {
    staticLabel: false,
    label: 'Birth Date',
    value: '',
    onChange: () => {},
  },
};

/**
 * Datepicker with permanent floating label (always visible)
 */
export const PermanentLabel: Story = {
  render: (args) => <DatepickerWrapper args={args} />,
  args: {
    staticLabel: true,
    label: 'Birth Date',
    value: '',
    onChange: () => {},
  },
};

/**
 * Datepicker with error feedback
 */
export const WithFeedback: Story = {
  render: (args) => <DatepickerWrapper args={args} />,
  args: {
    variant: 'destructive',
    label: 'Birth Date',
    feedback: 'This field is required',
    value: '',
    onChange: () => {},
  },
};

/**
 * Disabled datepicker
 */
export const Disabled: Story = {
  render: (args) => <DatepickerWithValueWrapper args={args} />,
  args: {
    disabled: true,
    value: '2024-01-15',
    onChange: () => {},
  },
};
