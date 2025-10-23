import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Filter from '../components/icons/Filter';
import { Select } from '../components/select';

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the select',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the select is disabled',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when the value changes',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4' },
  { value: 'option5', label: 'Option 5' },
];

function SelectWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof Select>>;
}) {
  const [value, setValue] = useState<string>('');
  return (
    <Select
      {...args}
      value={value}
      onChange={setValue}
      options={args.options || []}
    />
  );
}

function SelectWithFilterWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof Select>>;
}) {
  const [value, setValue] = useState<string>('');
  return (
    <Select
      {...args}
      value={value}
      onChange={setValue}
      options={args.options || []}
    />
  );
}

function SelectDisabledWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof Select>>;
}) {
  const [value, setValue] = useState<string>('');
  return (
    <Select
      {...args}
      value={value}
      onChange={setValue}
      options={args.options || []}
    />
  );
}

function SelectWithLabelWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof Select>>;
}) {
  const [value, setValue] = useState<string>('');
  return (
    <Select
      {...args}
      value={value}
      onChange={setValue}
      options={args.options || []}
    />
  );
}

export const Default: Story = {
  render: (args) => <SelectWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
    value: '',
    onChange: () => {},
  },
};

export const WithFilterIcon: Story = {
  render: (args) => <SelectWithFilterWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Filter by category...',
    leftIcon: Filter,
    value: '',
    onChange: () => {},
  },
};

export const Disabled: Story = {
  render: (args) => <SelectDisabledWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
    disabled: true,
    value: '',
    onChange: () => {},
  },
};

export const WithFloatingLabel: Story = {
  render: (args) => <SelectWithLabelWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
    label: 'Category',
    value: '',
    onChange: () => {},
  },
};
