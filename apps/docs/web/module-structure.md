# Module Structure Documentation

## Overview

Each module follows a well-organized pattern that separates concerns into distinct folders and files. This structure makes the codebase maintainable, scalable, and easy to navigate.

## Directory Structure

```
app/module-name/
├── components/        # Reusable UI components specific to the module
├── hooks/             # Custom React hooks for module data and logic
├── [id]/              # Dynamic route for entity details
│   ├── layout.tsx     # Shared layout for entity detail routes
│   └── edit/          # Entity editing page
├── new/               # Page for creating new entities
└── page.tsx           # Main entity listing page
```

## Components Organization

Components should be contained in the `components/` directory and follow these patterns:

1. **Naming Convention**: Components should use kebab-case naming with a module-specific prefix for component files (e.g., "entity-component.tsx"), clearly indicating their relationship to the module.

2. **Component Types**:

   - **Data Display Components**: `module-name-table.tsx` - For displaying tabular data
   - **Form Components**: `entity-form.tsx` - For data input
   - **Loading States**: `entity-skeleton.tsx`, `entity-form-skeleton.tsx` - Skeleton loaders
   - **Error States**: `entity-not-found.tsx` - Error handling components

3. **Component Implementation**:
   - Each component should be client-side rendered (marked with 'use client')
   - Components should use TypeScript interfaces for props
   - Forms should use Zod for validation
   - Internationalization via next-intl

Example component structure:

```typescript
"use client";

import { useTranslations } from "next-intl";
// imports...

interface EntityFormProps {
  defaultValues?: EntityFormValues;
  onSubmit: (values: EntityFormValues) => Promise<unknown>;
  submitButtonText?: string;
}

function EntityForm({
  defaultValues,
  onSubmit,
  submitButtonText,
}: EntityFormProps) {
  // component implementation
}

export default EntityForm;
```

## Hooks Organization

Custom hooks should be in the `hooks/` directory and follow these patterns:

1. **Naming Convention**: Hooks should use camelCase with a "use" prefix (React convention) and a descriptive name indicating their purpose.

2. **Hook Types**:

   - **Query Hooks**: `use-query-entity.ts` - For data fetching
   - **Mutation Hooks**: `use-entity-mutations.ts` - For data modification operations
   - **Parameter Hooks**: `use-entity-details-params.ts` - For parsing and validating route parameters

3. **Hook Implementation**:
   - Hooks should be well-documented with JSDoc comments
   - They should use TypeScript for type safety
   - React Query should be used for data fetching and caching
   - Hooks should encapsulate reusable logic to avoid duplication across components
   - Each hook should be in its own file, following the single responsibility principle
   - Query hooks for individual entities should implement the cache-first pattern

For detailed guidelines on hooks implementation, refer to the [Hooks Patterns and Best Practices](./hooks-patterns.md) documentation.

Example hook structure:

```typescript
/**
 * Custom hook for querying an entity by ID.
 *
 * This hook provides a reusable query for fetching an entity by its ID.
 * It handles query setup, caching, and error handling.
 */
export default function useQueryEntity({
  entityId,
  enabled = true,
}: UseQueryEntityProps): UseQueryResult<Entity, QueryEntityError> {
  // hook implementation
}
```

## Layout Organization

Layouts are used to encapsulate common behavior across nested routes and follow these patterns:

1. **Layout Responsibility**:

   - Handle invalid parameters using parameter hooks
   - Show error states (not found, generic errors)
   - Provide consistent appearance and navigation for child pages

2. **Implementation**:
   - Create layout components for dynamic routes like `[id]/layout.tsx`
   - Use relevant parameter hooks for validation
   - Centralize error handling to avoid duplication in child pages
   - Allow child pages to handle their own loading states

Example layout structure:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import EntityNotFound from '@/module-name/components/entity-not-found';
import useEntityDetailsParams from '@/module-name/hooks/use-entity-details-params';
import useQueryEntity from '@/module-name/hooks/use-query-entity';

export default function EntityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { entityId, isValidId } = useEntityDetailsParams();
  const { status, error } = useQueryEntity({
    entityId,
    enabled: isValidId,
  });

  // Handle invalid parameters
  if (!isValidId) {
    return <EntityNotFound />;
  }

  // Handle error states
  if (status === 'error') {
    return <LoadError />;
  }

  // Render children, letting them handle their own loading states
  return children;
}
```

## Pages Organization

Pages should follow Next.js App Router conventions:

1. **Main Listing Page**: `module-name/page.tsx`

   - Lists all entities
   - Uses PageHeader and entity table components
   - Keep it simple, delegating complex UI to components

2. **Create Page**: `module-name/new/page.tsx`

   - Form for creating new entities
   - Reuse the entity form component

3. **Details Page**: `module-name/[id]/page.tsx`

   - Displays details for a specific entity
   - Uses entity-specific components
   - Relies on layout for common error handling

4. **Edit Page**: `module-name/[id]/edit/page.tsx`
   - Form for editing an existing entity
   - Reuses the entity form component with different props
   - Relies on layout for common error handling

Example page structure:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import EntityTable from '@/module-name/components/entity-table';
import routes from '@/services/route';

export default function ModuleNamePage() {
  const t = useTranslations('module-name');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.module.new}
        createLabel={t('actions.create')}
      />
      <EntityTable />
    </div>
  );
}
```

## Data Flow Pattern

1. **Data Fetching**:

   - Create custom hooks using React Query for data fetching
   - Make queries reusable and modular
   - Retrieve initial data from the query cache when possible

2. **Data Mutation**:

   - Centralize mutations in `use-entity-mutations.ts`
   - Include toast notifications for user feedback
   - Handle optimistic updates when appropriate

3. **Form Handling**:
   - Use TanStack Form for state management
   - Define Zod schemas for validation
   - Create reusable form components that accept callbacks for submission

## Internationalization

1. All user-facing strings should use the next-intl translation system
2. Organize translations by feature area (module-name, common)
3. Access translations via the useTranslations hook:
   ```typescript
   const t = useTranslations("module-name");
   ```

## Error Handling and Loading States

1. **Loading States**:

   - Create skeleton components for consistent loading experiences
   - Use conditional rendering based on request status:

   ```typescript
   if (status === 'pending') {
     return <EntitySkeleton />;
   }
   ```

2. **Error States**:
   - Create dedicated components for not-found states
   - Use layouts for centralized error handling
   - Implement error handling in data fetching hooks

## Step-by-Step Guide to Creating a New Module

1. **Create the module directory structure**:

   ```
   mkdir -p app/module-name/components app/module-name/hooks app/module-name/[id]/edit app/module-name/new
   ```

2. **Create the listing page**:

   - Create `app/module-name/page.tsx` for the main listing page

3. **Create essential components**:

   - Create a table component: `app/module-name/components/entity-table.tsx`
   - Create a form component: `app/module-name/components/entity-form.tsx`
   - Create loading states: `app/module-name/components/entity-skeleton.tsx`
   - Create error state: `app/module-name/components/entity-not-found.tsx`

4. **Create data hooks**:

   - Create query hook: `app/module-name/hooks/use-query-entity.ts`
   - Create mutations hook: `app/module-name/hooks/use-entity-mutations.ts`
   - Create parameters hook: `app/module-name/hooks/use-entity-details-params.ts`

5. **Create layout**:

   - Create layout component: `app/module-name/[id]/layout.tsx`
   - Handle error states and invalid parameters

6. **Create CRUD pages**:

   - Create new entity page: `app/module-name/new/page.tsx`
   - Create detail page: `app/module-name/[id]/page.tsx`
   - Create edit page: `app/module-name/[id]/edit/page.tsx`

7. **Add translations**:

   - Add module translations to the i18n files

8. **Test the module**:
   - Verify all CRUD operations work correctly
   - Check loading and error states

By following this structure, you'll create a module that is consistent with the rest of the application, maintainable, and follows best practices for React and Next.js development.
