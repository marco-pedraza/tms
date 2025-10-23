import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchBar } from '../components/searchbar';

const meta = {
  title: 'Components/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the input',
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

export const Default: Story = {
  render: (args) => <SearchBarWrapper args={args} />,
  args: {
    placeholder: 'Search...',
    value: '',
    onChange: () => {},
  },
};

export const WithCustomPlaceholder: Story = {
  render: (args) => <SearchBarWrapper args={args} />,
  args: {
    placeholder: 'Buscar autobuses...',
    value: '',
    onChange: () => {},
  },
};

export const Disabled: Story = {
  render: (args) => <SearchBarWrapper args={args} />,
  args: {
    placeholder: 'Search...',
    disabled: true,
    value: '',
    onChange: () => {},
  },
};

export const WithValue: Story = {
  render: (args) => <SearchBarWithValueWrapper args={args} />,
  args: {
    placeholder: 'Search...',
    value: 'Sample search term',
    onChange: () => {},
  },
};
