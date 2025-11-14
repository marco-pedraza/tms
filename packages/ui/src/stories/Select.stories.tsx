import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Filter from '../components/icons/Filter';
import { Select } from '../components/select';

const meta = {
  title: 'Form Components/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the select',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text for the select',
    },
    staticLabel: {
      control: { type: 'boolean' },
      description: 'Whether the label is always visible (permanent) or dynamic',
    },
    feedback: {
      control: { type: 'text' },
      description: 'Error feedback message (always destructive)',
    },
    searchable: {
      control: { type: 'boolean' },
      description: 'Enable search functionality',
    },
    searchPlaceholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the search input',
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

/**
 * Select without label - just placeholder
 */
export const Default: Story = {
  render: (args) => <SelectWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
    value: '',
    onChange: () => {},
  },
};

/**
 * Select with dynamic floating label (appears when focused or has value)
 */
export const DynamicLabel: Story = {
  render: (args) => <SelectWithLabelWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
    label: 'Category',
    staticLabel: false,
    value: '',
    onChange: () => {},
  },
};

/**
 * Select with permanent floating label (always visible)
 */
export const PermanentLabel: Story = {
  render: (args) => <SelectWithLabelWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
    label: 'Category',
    staticLabel: true,
    value: '',
    onChange: () => {},
  },
};

/**
 * Select with left icon
 */
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

/**
 * Disabled select
 */
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

export const WithFeedback: Story = {
  render: (args) => <SelectWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
    feedback: 'This field is required',
    value: '',
    onChange: () => {},
  },
};

/**
 * Select with search functionality
 */
export const WithSearch: Story = {
  render: (args) => <SelectWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
    searchable: true,
    searchPlaceholder: 'Search options...',
    value: '',
    onChange: () => {},
  },
};
