import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Filter from '../components/icons/Filter';
import { MultiSelect } from '../components/multiselect';

const meta = {
  title: 'Components/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the multiselect',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the multiselect is disabled',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when the value changes',
    },
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4' },
  { value: 'option5', label: 'Option 5' },
];

function MultiSelectWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof MultiSelect>>;
}) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <MultiSelect
      {...args}
      value={value}
      onChange={setValue}
      options={args.options || []}
    />
  );
}

function MultiSelectWithFilterWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof MultiSelect>>;
}) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <MultiSelect
      {...args}
      value={value}
      onChange={setValue}
      options={args.options || []}
    />
  );
}

function MultiSelectWithLabelWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof MultiSelect>>;
}) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <MultiSelect
      {...args}
      value={value}
      onChange={setValue}
      options={args.options || []}
    />
  );
}

function MultiSelectWithLabelAndIconWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof MultiSelect>>;
}) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <MultiSelect
      {...args}
      value={value}
      onChange={setValue}
      options={args.options || []}
    />
  );
}

function MultiSelectDisabledWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof MultiSelect>>;
}) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <MultiSelect
      {...args}
      value={value}
      onChange={setValue}
      options={args.options || []}
    />
  );
}

function MultiSelectWithPreselectedWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof MultiSelect>>;
}) {
  const [value, setValue] = useState<string[]>(['option1', 'option3']);
  return (
    <MultiSelect
      {...args}
      value={value}
      onChange={setValue}
      options={args.options || []}
    />
  );
}

export const Default: Story = {
  render: (args) => <MultiSelectWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select multiple options...',
    value: [],
    onChange: () => {},
  },
};

export const WithFilterIcon: Story = {
  render: (args) => <MultiSelectWithFilterWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Filtrar por categorías...',
    leftIcon: Filter,
    value: [],
    onChange: () => {},
  },
};

export const WithFloatingLabel: Story = {
  render: (args) => <MultiSelectWithLabelWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select multiple options...',
    label: 'Tags',
    value: [],
    onChange: () => {},
  },
};

export const WithFloatingLabelAndIcon: Story = {
  render: (args) => <MultiSelectWithLabelAndIconWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Filtrar por estados...',
    label: 'Filter',
    leftIcon: Filter,
    value: [],
    onChange: () => {},
  },
};

export const Disabled: Story = {
  render: (args) => <MultiSelectDisabledWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select multiple options...',
    disabled: true,
    value: [],
    onChange: () => {},
  },
};

export const WithPreselectedValues: Story = {
  render: (args) => <MultiSelectWithPreselectedWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select multiple options...',
    value: ['option1', 'option3'],
    onChange: () => {},
  },
};
