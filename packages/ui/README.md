# UI Package

This package contains all reusable UI components for the project, based on shadcn/ui and documented with Storybook.

## 🚀 Commands from Root

All commands can be executed from the monorepo root without needing to navigate to the `packages/ui` folder.

### Install shadcn Components

```bash
# Install a specific component
npm run shadcn badge

# Install multiple components
npm run shadcn button card dialog

# View available components
npm run shadcn
```

### Run Storybook

```bash
# Start the Storybook development server
npm run storybook
```

Storybook will be available at `http://localhost:6006`

## 📋 Workflow for Adding Components

### 1. Install the Base Component

From the project root, install the shadcn component:

```bash
npm run shadcn [component-name]
```

Example:

```bash
npm run shadcn button
```

This will create the component file at `packages/ui/src/components/[component-name].tsx`

### 2. Customize the Component (Optional)

If you need to customize the component, edit it directly at:

```
packages/ui/src/components/[component-name].tsx
```

### 3. Create the Storybook Story

Create a story file to document the component:

```typescript
// packages/ui/src/stories/[ComponentName].stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/button';

const meta = {
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
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Button',
  },
};
```

### 4. Verify in Storybook

Run Storybook to see your component:

```bash
npm run storybook
```

Navigate to `http://localhost:6006` and verify that your component displays correctly.

### 5. Export the Component

Components are automatically exported through the package.json `exports` field. shadcn components already come with proper exports from their individual files.

The package uses path-based exports, so components are imported like:

```typescript
// From other packages in the monorepo
import { Button } from '@repo/ui/components/button';
import { useCustomHook } from '@repo/ui/hooks/use-custom-hook';
```

No additional export configuration is needed - the component files handle their own exports.

## 📁 File Structure

```
packages/ui/
├── src/
│   ├── components/           # UI Components
│   │   ├── button.tsx       # Component
│   │   └── ...
│   ├── stories/             # Storybook Stories
│   │   ├── Button.stories.ts # Story files
│   │   └── ...
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utility functions
│   ├── styles/
│   │   └── globals.css      # Global styles
│   └── themes/              # Theme configurations
├── .storybook/              # Storybook configuration
├── package.json
└── README.md
```

## 🎨 Naming Conventions

### Components

- **Files**: `kebab-case.tsx` (e.g., `data-table.tsx`)
- **Components**: `PascalCase` (e.g., `DataTable`)
- **Props interfaces**: `[ComponentName]Props` (e.g., `DataTableProps`)

### Stories

- **Files**: `[ComponentName].stories.tsx` (in `src/stories/` folder)
- **Titles**: `Components/[ComponentName]` (e.g., `Components/DataTable`)
- **Stories**: `PascalCase` (e.g., `Default`, `WithData`, `Loading`)
- **Location**: Always in `src/stories/` directory, not with components

## 🔧 Local Development

### Useful Commands

```bash
# Linting
npm run lint

# Type checking
npm run check-types

# Code formatting
npm run format

# Check formatting
npm run check-format
```

### shadcn Configuration

The project is configured with:

- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React

## 📚 Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Storybook Documentation](https://storybook.js.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

## 🤝 Contributing

1. Install the base component with `npm run shadcn [component]`
2. Customize according to project needs
3. Create comprehensive Storybook stories
4. Verify everything works correctly
5. Document any special behavior

## ❗ Important Notes

- **Don't navigate** to the `packages/ui` folder - all commands work from the root
- **Always create stories** for new or modified components
- **Use strict TypeScript** - the project has `strict: true` enabled
- **Follow the established** naming conventions
- **Verify in Storybook** before committing

---

Need help? Check the documentation or ask the team! 🚀
