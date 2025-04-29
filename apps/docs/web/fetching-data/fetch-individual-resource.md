# Fetching Individual Resources

When fetching individual resources, it's important to implement proper cache handling to optimize the user experience. This document explains the pattern for implementing hooks that fetch individual resources while leveraging the existing query cache.

## Pattern Overview

When a user navigates from a list view to a detail view, the application often already has some data about the resource from the list query. Instead of making the user wait for a completely new query to load, we can:

1. Immediately display the data we already have from the list query
2. Fetch the complete data in the background
3. Update the UI once the complete data is available

This pattern provides a better user experience by reducing perceived loading times.

## Implementation

Here's how to implement a query hook for individual resources with proper cache handling:

```typescript
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { Resource } from "@repo/types";
import client from "@/lib/api-client";

// Define a structured error type that extends Error
// with additional fields that match backend error responses
interface QueryResourceError extends Error {
  code?: string;
  status?: number;
}

interface UseQueryResourceProps {
  resourceId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a resource by ID with cache integration
 *
 * Uses the collection cache as initial data for immediate rendering
 * while fetching the complete data in the background
 */
export default function useQueryResource({
  resourceId,
  enabled = true,
}: UseQueryResourceProps): UseQueryResult<Resource, QueryResourceError> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["resources", resourceId],
    queryFn: () => client.resources.getResource(resourceId),
    enabled,
    initialData: () => {
      const collectionData = queryClient.getQueryData<{ data: Resource[] }>([
        "resources",
      ]);

      return collectionData?.data?.find(
        (resource) => resource.id === resourceId
      );
    },
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(["resources"])?.dataUpdatedAt;
    },
  });
}
```

## Error Handling

When defining error types, extend the base `Error` interface with additional fields that represent the structure of error responses from the backend. This allows for more specific error handling in components:

```typescript
// Example error response from backend:
// { error: { code: "NOT_FOUND", status: 404, message: "Resource not found" } }

interface QueryResourceError extends Error {
  code?: string;
  status?: number;
}

// Usage in a component:
const { error } = useQueryResource({ resourceId: 123 });

if (error) {
  if (error.code === "NOT_FOUND" || error.status === 404) {
    return <ResourceNotFound />;
  }
  return <GenericError message={error.message} />;
}
```

## Benefits

This pattern provides several advantages:

1. **Improved Perceived Performance**: Users see data immediately if it's already in the cache
2. **Reduced Network Traffic**: Prevents unnecessary duplicate requests
3. **Consistent Data**: Eventually shows the complete, up-to-date data from the API
4. **Better UX**: Reduces loading spinners and wait times
5. **Structured Error Handling**: Provides specific error types for better error responses

## When to Use

Use this pattern when:

- Users often navigate from a list to details view
- The list view already fetches partial data about each resource
- Detail view requires complete data about a specific resource

## Example Usage

In a detail page component:

```typescript
const { data, isLoading, error } = useQueryResource({
  resourceId: parseInt(params.id),
});

// Check for specific error types
if (error) {
  if (error.status === 404) {
    return <ResourceNotFound />;
  }
  return <ErrorMessage message={error.message} />;
}

if (isLoading && !data) {
  return <ResourceSkeleton />;
}

if (!data) {
  return <ResourceNotFound />;
}

return (
  <ResourceDetails resource={data} />
);
```

By following this pattern, you'll create a more responsive and efficient application that makes good use of the data you've already loaded.
