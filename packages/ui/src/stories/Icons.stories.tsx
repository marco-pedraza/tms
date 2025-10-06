import type { Meta, StoryObj } from '@storybook/react';
import Amenity from '../components/icons/Amenity';
import Bus from '../components/icons/Bus';
import Dashboard from '../components/icons/Dashboard';
import Diagram from '../components/icons/Diagram';
import Filter from '../components/icons/Filter';
import Inventory from '../components/icons/Inventory';
import Location from '../components/icons/Location';
import Planning from '../components/icons/Planning';
import Route from '../components/icons/Route';
import Settings from '../components/icons/Settings';
import Tag from '../components/icons/Tag';
import User from '../components/icons/User';

/**
 * Storybook meta configuration for Icon components
 * Showcases all available icon components in the UI library.
 */

const meta: Meta = {
  title: 'Components/Icons',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-12 p-8">
      <div className="flex flex-col items-center space-y-3">
        <Amenity className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Amenity</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Bus className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Bus</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Dashboard className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Dashboard</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Diagram className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Diagram</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Filter className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Filter</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Inventory className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Inventory</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Location className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Location</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Planning className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Planning</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Route className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Route</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Settings className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Settings</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <Tag className="w-8 h-8" />
        <span className="text-sm font-medium text-center">Tag</span>
      </div>

      <div className="flex flex-col items-center space-y-3">
        <User className="w-8 h-8" />
        <span className="text-sm font-medium text-center">User</span>
      </div>
    </div>
  ),
};
