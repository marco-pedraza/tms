import type { Meta, StoryObj } from '@storybook/react';
import { Bookmark, Filter, Star, Tag } from 'lucide-react';
import { Chip } from '../components/chip';

const meta = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['accent', 'gray'],
      description: 'Visual variant of the chip',
    },
    label: {
      control: { type: 'text' },
      description: 'Text to display in the chip',
    },
    onRemove: {
      action: 'removed',
      description:
        'Callback when remove button is clicked (only for accent variant)',
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default editable chip with accent color and remove button
 */
export const Editable: Story = {
  args: {
    label: 'Editable Chip',
    variant: 'accent',
    onRemove: () => console.log('Chip removed'),
  },
};

/**
 * Static chip with gray color, no remove button
 */
export const Static: Story = {
  args: {
    label: 'Static Chip',
    variant: 'gray',
  },
};

/**
 * Static chip with an icon on the left
 */
export const StaticWithIcon: Story = {
  args: {
    label: 'Tagged Item',
    variant: 'gray',
    icon: Tag,
  },
};

/**
 * Editable chip without remove callback (no X button)
 */
export const EditableWithoutRemove: Story = {
  args: {
    label: 'No Remove',
    variant: 'accent',
  },
};

/**
 * Multiple chips displayed together
 */
export const MultipleChips: Story = {
  args: {
    label: 'Chip',
    variant: 'accent',
  },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip
        label="Tag 1"
        variant="accent"
        onRemove={() => console.log('Removed Tag 1')}
      />
      <Chip
        label="Tag 2"
        variant="accent"
        onRemove={() => console.log('Removed Tag 2')}
      />
      <Chip label="Category" variant="gray" icon={Filter} />
      <Chip label="Static Tag" variant="gray" />
      <Chip
        label="Long Chip Name Example"
        variant="accent"
        onRemove={() => console.log('Removed')}
      />
    </div>
  ),
};

/**
 * Different icon combinations
 */
export const WithDifferentIcons: Story = {
  args: {
    label: 'Chip',
    variant: 'gray',
  },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip label="Filter Applied" variant="gray" icon={Filter} />
      <Chip label="Tagged" variant="gray" icon={Tag} />
      <Chip label="Favorite" variant="gray" icon={Star} />
      <Chip label="Bookmarked" variant="gray" icon={Bookmark} />
    </div>
  ),
};
