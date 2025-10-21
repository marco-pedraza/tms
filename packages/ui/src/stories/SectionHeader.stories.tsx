import type { Meta, StoryObj } from '@storybook/react';
import Diagram from '../components/icons/Diagram';
import Settings from '../components/icons/Settings';
import { SectionHeader } from '../components/section-header';

/**
 * The SectionHeader component from our UI library.
 * A composite component that combines Card and Text components to create
 * structured section headers with title, description, and contextual information.
 *
 * Features:
 * - Main card with title and description on the left
 * - Secondary card with content, icon, and badges on the right
 * - Consistent styling using Card and Text components
 * - Flexible content with customizable icons and badges
 * - Icons from components/icons maintain their original colors
 */
const meta: Meta<typeof SectionHeader> = {
  title: 'Components/SectionHeader',
  component: SectionHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'The main title of the section',
    },
    description: {
      control: { type: 'text' },
      description: 'The description text below the title',
    },
    rightContent: {
      control: { type: 'text' },
      description: 'The content for the right side card',
    },
    icon: {
      control: { type: 'object' },
      description:
        'The icon component from components/icons to display next to the right content',
    },
    badges: {
      control: { type: 'object' },
      description: 'Array of badges to display below the right content',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes for the container',
    },
  },
  args: {
    title: 'Dashboard Overview',
    description: 'Monitor your key metrics and performance indicators',
    rightContent: 'Active Users',
    badges: ['Online', 'Verified', 'Premium'],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Diagrama de asientos',
    description:
      'Define y gestiona el diseño de asientos para tus autobuses, personalizando la distribución, así como los servicios disponibles en cada lugar.',
    rightContent: '5 Diagramas',
    icon: <Diagram />,
    badges: ['5 activos', '2 inactivos', '1 nuevo este mes'],
  },
};

export const WithoutDescription: Story = {
  args: {
    title: 'Quick Actions',
    rightContent: 'Status',
    icon: <Settings />,
    badges: ['Ready', 'Configured'],
  },
};

export const WithoutIcon: Story = {
  args: {
    title: 'System Status',
    description: 'Current system health and operational status',
    rightContent: 'All Systems',
    badges: ['Operational', 'Stable', 'Monitored'],
  },
};
