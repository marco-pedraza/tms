# Module Structure Documentation

## Overview

Each module follows a well-organized pattern that separates concerns into distinct folders and files. This structure makes the codebase maintainable, scalable, and easy to navigate.

## Directory Structure

```
app/module-name/
├── components/        # Reusable UI components specific to the module
├── hooks/             # Custom React hooks for module data and logic
├── [id]/              # Dynamic route for entity details
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

4. **Edit Page**: `module-name/[id]/edit/page.tsx`

   - Form for editing an existing entity
   - Reuses the entity form component with different props

5. **Layout**: `module-name/[id]/layout.tsx`
   - Provides shared layout for detail pages

Example page structure:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import EntityTable from '@/module-name/components/entity-table';

export default function ModuleNamePage() {
  const t = useTranslations('module-name');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref="/module-name/new"
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

4. **Create data hooks**:

   - Create query hook: `app/module-name/hooks/use-query-entity.ts`
   - Create mutations hook: `app/module-name/hooks/use-entity-mutations.ts`

5. **Create CRUD pages**:

   - Create new entity page: `app/module-name/new/page.tsx`
   - Create detail page: `app/module-name/[id]/page.tsx`
   - Create edit page: `app/module-name/[id]/edit/page.tsx`

6. **Add translations**:

   - Add module translations to the i18n files

7. **Test the module**:
   - Verify all CRUD operations work correctly
   - Check loading and error states

By following this structure, you'll create a module that is consistent with the rest of the application, maintainable, and follows best practices for React and Next.js development.
