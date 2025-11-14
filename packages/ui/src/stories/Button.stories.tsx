import type { Meta, StoryObj } from '@storybook/react';
import { Wine } from 'lucide-react';
import { Button } from '../components/button';
import RiAmenity from '../components/icons/Amenity';

/**
 * The Button component from our UI library with multiple variants and sizes.
 * Built with Radix UI and class-variance-authority for consistent styling.
 */

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'gradient',
        'primary',
        'destructive',
        'outlinePrimary',
        'outlineGray',
        'outlineDestructive',
        'linkPrimary',
        'linkDestructive',
      ],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },

    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },

    asChild: {
      control: { type: 'boolean' },
      description:
        'Change the component to the HTML tag or custom component of the only child',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the input',
    },
  },
  args: {
    children: 'Button',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default button with gradient styling
 */
export const Default: Story = {
  args: {
    variant: 'gradient',
    children: 'Button',
  },
};

/**
 * Button with outline styling
 */
export const Outline: Story = {
  args: {
    variant: 'outlinePrimary',
    children: 'Outline Button',
  },
};

export const IconButtonLeft: Story = {
  args: {
    variant: 'outlinePrimary',
    children: (
      <>
        <RiAmenity className="w-4 h-4 mr-2" />
        Icon Button Left Local
      </>
    ),
  },
};

export const IconButtonRight: Story = {
  args: {
    variant: 'outlineDestructive',
    children: (
      <>
        Icon Button Right Lucide
        <Wine className="w-4 h-4 ml-2" />
      </>
    ),
  },
};

/**
 * Disabled button state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

/**
 * Link Button
 */
export const LinkButton: Story = {
  args: {
    variant: 'linkPrimary',
    children: 'Link Button',
  },
};
