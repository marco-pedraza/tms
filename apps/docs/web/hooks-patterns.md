# Hooks Patterns and Best Practices

This document outlines the patterns and best practices for creating and using custom hooks in the application.

## Single Responsibility

Each hook should follow the single responsibility principle:

1. **One hook per file**: Each hook should be defined in its own file with a descriptive name.
2. **Focused purpose**: Hooks should do one thing well, rather than trying to handle multiple concerns.

### Example

Instead of:

```
// use-query-entities.ts
export function useQueryEntities() {...}
export function useQueryEntity() {...}
```

Prefer:

```
// use-query-entities.ts
export function useQueryEntities() {...}

// use-query-entity.ts
export function useQueryEntity() {...}
```

## Data Fetching Patterns

### Cache-First Approach

For query hooks that fetch individual items, implement a cache-first approach to minimize unnecessary network requests:

1. **Check existing data**: Look for the item in already cached queries first
2. **Use React Query's initialData**: Utilize the initialData and initialDataUpdatedAt options
3. **Fall back to API call**: Only make a new API call if data isn't in the cache or is stale

### Example Implementation

```typescript
// use-query-entity.ts
export function useQueryEntity({ entityId, enabled = true }) {
  const queryClient = useQueryClient();
  const numericId =
    typeof entityId === "string" ? parseInt(entityId, 10) : entityId;

  return useQuery({
    queryKey: ["entities", numericId],
    queryFn: async () => {
      return await client.api.getEntity(numericId);
    },
    // Try to get the entity from the entities list cache first
    initialData: () =>
      queryClient
        .getQueryData(["entities"])
        ?.data.find((entity) => entity.id === numericId),
    // Use the timestamp from the list query to determine data freshness
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(["entities"])?.dataUpdatedAt,
    enabled,
  });
}
```

## Naming Conventions

Follow these conventions for hook names:

1. **Query hooks**: `use-query-entity.ts` for fetching data
2. **Mutation hooks**: `use-entity-mutations.ts` for data modification operations
3. **Parameter hooks**: `use-entity-details-params.ts` for parsing and validating route parameters
4. **Utility hooks**: `use-entity-sorting.ts` for functionality not tied to data fetching

## Error Handling

Hooks should handle errors gracefully:

1. **Provide error state**: Make error information accessible to components
2. **Type errors**: Use TypeScript to type possible error states
3. **Documentation**: Document possible error states in JSDoc comments

## Documentation

All hooks should be well-documented with JSDoc:

```typescript
/**
 * Custom hook for querying an entity by ID
 * Implements cache-first pattern by checking the entities list query cache
 *
 * @param props.entityId - The ID of the entity to query
 * @param props.enabled - Whether the query should be enabled (defaults to true)
 * @returns Query result containing entity data, loading state, and potential errors
 */
```

By following these patterns consistently, the codebase will be more maintainable, efficient, and easier to understand.
