import type { Meta, StoryObj } from '@storybook/react';
import { Wine } from 'lucide-react';
import { Card } from '../components/card';
import { Text } from '../components/text';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'gradient'],
      description: 'The visual style variant of the card',
    },
    shadow: {
      control: { type: 'select' },
      options: ['none', 'sm', 'lg'],
    },
    borderColor: {
      control: { type: 'select' },
      options: [
        'none',
        'gray100',
        'gray300',
        'primaryLight',
        'accent',
        'destructive',
      ],
    },
    borderStyle: {
      control: { type: 'select' },
      options: ['solid', 'dashed', 'dotted'],
    },
    padding: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The padding size of the card',
    },
    borderRadius: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    asChild: {
      control: { type: 'boolean' },
      description:
        'Change the component to the HTML tag or custom component of the only child',
    },
  },
  args: {
    children: 'Card Content',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Card',
  },
};

export const Info: Story = {
  args: {
    variant: 'gradient',
    padding: 'md',
    borderColor: 'none',
    shadow: 'none',
    children: 'Info Card',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    shadow: 'none',
    borderColor: 'gray300',
    children: 'Outlined Card',
  },
};

export const Dashed: Story = {
  args: {
    variant: 'default',
    shadow: 'none',
    borderColor: 'gray300',
    borderStyle: 'dashed',
    padding: 'sm',
    children: 'Dashed card with Small Padding',
  },
};

export const Dotted: Story = {
  args: {
    variant: 'default',
    shadow: 'sm',
    borderColor: 'primaryLight',
    borderStyle: 'dotted',
    padding: 'lg',
    children: 'Dotted card with large Padding',
  },
};

export const WithContent: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    className: 'max-w-full lg:max-w-4xl mx-auto',
    children: (
      <div className="space-y-4 flex gap-3">
        <Wine className="w-10 h-10 text-accent" />
        <div className="w-full">
          <div className="space-y-2">
            <Text variant="lg" textColor="gray600" fontWeight="extrabold">
              Card Title
            </Text>
            <Text variant="sm" textColor="gray500">
              This is a card with structured content including an icon, title,
              description, and custom classes.
            </Text>
          </div>
          <div className="flex items-center justify-between">
            <Text variant="xs" textColor="primaryLight" fontWeight="semibold">
              Status: Active
            </Text>
            <button className="text-sm text-primary hover:underline">
              View Details
            </button>
          </div>
        </div>
      </div>
    ),
  },
};
