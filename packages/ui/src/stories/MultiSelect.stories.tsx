import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Filter from '../components/icons/Filter';
import { MultiSelect } from '../components/multiselect';

const meta = {
  title: 'Form Components/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the multiselect',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text for the multiselect',
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

/**
 * MultiSelect without label - just placeholder
 */
export const Default: Story = {
  render: (args) => <MultiSelectWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select multiple options...',
    value: [],
    onChange: () => {},
  },
};

/**
 * MultiSelect with dynamic floating label (appears when focused or has value)
 */
export const DynamicLabel: Story = {
  render: (args) => <MultiSelectWithLabelWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select multiple options...',
    label: 'Tags',
    staticLabel: false,
    value: [],
    onChange: () => {},
  },
};

/**
 * MultiSelect with permanent floating label (always visible)
 */
export const PermanentLabel: Story = {
  render: (args) => <MultiSelectWithLabelWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select multiple options...',
    label: 'Tags',
    staticLabel: true,
    value: [],
    onChange: () => {},
  },
};

/**
 * MultiSelect with left icon
 */
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

/**
 * MultiSelect with dynamic label and icon
 */
export const DynamicLabelAndIcon: Story = {
  render: (args) => <MultiSelectWithLabelAndIconWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Filtrar por estados...',
    label: 'Filter',
    staticLabel: false,
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

function MultiSelectSearchableWrapper({
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

export const WithSearch: Story = {
  render: (args) => <MultiSelectSearchableWrapper args={args} />,
  args: {
    options: [
      { value: 'ex-mexico', label: 'ex-México' },
      { value: 'ex-usa', label: 'ex-USA' },
      { value: 'ex-canada', label: 'ex-Canadá' },
      { value: 'guadalajara', label: 'Guadalajara' },
      { value: 'monterrey', label: 'Monterrey' },
      { value: 'tijuana', label: 'Tijuana' },
      { value: 'cancun', label: 'Cancún' },
      { value: 'puebla', label: 'Puebla' },
      { value: 'queretaro', label: 'Querétaro' },
      { value: 'merida', label: 'Mérida' },
    ],
    placeholder: 'Seleccionar ciudades...',
    searchable: true,
    searchPlaceholder: 'Buscar ciudad...',
    value: [],
    onChange: () => {},
  },
};

export const WithSearchAndIcon: Story = {
  render: (args) => <MultiSelectSearchableWrapper args={args} />,
  args: {
    options: [
      { value: 'ex-frontend', label: 'ex-Frontend Developer' },
      { value: 'ex-backend', label: 'ex-Backend Developer' },
      { value: 'designer', label: 'Designer' },
      { value: 'product-manager', label: 'Product Manager' },
      { value: 'devops', label: 'DevOps Engineer' },
      { value: 'qa-engineer', label: 'QA Engineer' },
    ],
    placeholder: 'Filtrar por roles...',
    leftIcon: Filter,
    label: 'Roles',
    searchable: true,
    searchPlaceholder: 'Buscar rol...',
    value: [],
    onChange: () => {},
  },
};

export const WithFeedback: Story = {
  render: (args) => <MultiSelectWrapper args={args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select at least one option...',
    feedback: 'At least one option is required',
    value: [],
    onChange: () => {},
  },
};
