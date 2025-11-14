import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchBar } from '../components/searchbar';

const meta = {
  title: 'Form Components/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the input',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text for the search bar',
    },
    staticLabel: {
      control: { type: 'boolean' },
      description: 'Whether the label is always visible (permanent) or dynamic',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when the input value changes',
    },
    onSearch: {
      action: 'searched',
      description:
        'Callback when the search button is clicked or Enter is pressed',
    },
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

function SearchBarWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof SearchBar>>;
}) {
  const [value, setValue] = useState<string>('');
  return (
    <SearchBar
      {...args}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

function SearchBarWithValueWrapper({
  args,
}: {
  args: Partial<React.ComponentProps<typeof SearchBar>>;
}) {
  const [value, setValue] = useState<string>('Sample search term');
  return (
    <SearchBar
      {...args}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

/**
 * SearchBar without label - just placeholder
 */
export const Default: Story = {
  render: (args) => <SearchBarWrapper args={args} />,
  args: {
    placeholder: 'Search...',
    value: '',
    onChange: () => {},
  },
};

/**
 * SearchBar with dynamic floating label (appears when focused or has value)
 */
export const DynamicLabel: Story = {
  render: (args) => <SearchBarWrapper args={args} />,
  args: {
    placeholder: 'Search...',
    label: 'Search',
    staticLabel: false,
    value: '',
    onChange: () => {},
  },
};

/**
 * SearchBar with permanent floating label (always visible)
 */
export const PermanentLabel: Story = {
  render: (args) => <SearchBarWrapper args={args} />,
  args: {
    placeholder: 'Buscar autobuses...',
    label: 'Búsqueda',
    staticLabel: true,
    value: '',
    onChange: () => {},
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  render: (args) => <SearchBarWrapper args={args} />,
  args: {
    placeholder: 'Search...',
    disabled: true,
    value: '',
    onChange: () => {},
  },
};

/**
 * SearchBar with value
 */
export const WithValue: Story = {
  render: (args) => <SearchBarWithValueWrapper args={args} />,
  args: {
    placeholder: 'Search...',
    value: 'Sample search term',
    onChange: () => {},
  },
};
