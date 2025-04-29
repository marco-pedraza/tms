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

interface UseQueryResourceProps {
  resourceId: number;
  enabled?: boolean;
}

type QueryResourceError = Error;

/**
 * Custom hook for querying a resource by ID with cache integration.
 *
 * This hook first attempts to retrieve the resource from the collection cache,
 * then fetches the complete resource data from the API.
 *
 * @param props - The properties for configuring the query
 * @param props.resourceId - The ID of the resource to fetch
 * @param props.enabled - Whether the query should execute (defaults to true)
 * @returns The query result containing resource data, loading state, and error state
 */
export default function useQueryResource({
  resourceId,
  enabled = true,
}: UseQueryResourceProps): UseQueryResult<Resource, QueryResourceError> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["resources", resourceId],
    queryFn: () => client.resources.getResource(resourceId),
    // Only run if enabled flag is true and resourceId is valid
    enabled: enabled && Boolean(resourceId) && !isNaN(Number(resourceId)),
    // Try to get initial data from the collection cache
    initialData: () => {
      // Look for this resource in the collection query cache
      const collectionData = queryClient.getQueryData<{ data: Resource[] }>([
        "resources",
      ]);

      // If we found the collection and this resource exists in it, return that data
      return collectionData?.data?.find(
        (resource) => resource.id === resourceId
      );
    },
    // Tell React Query when the initialData was last updated
    initialDataUpdatedAt: () => {
      // Return the timestamp of when the collection query was last updated
      return queryClient.getQueryState(["resources"])?.dataUpdatedAt;
    },
  });
}
```

## Benefits

This pattern provides several advantages:

1. **Improved Perceived Performance**: Users see data immediately if it's already in the cache
2. **Reduced Network Traffic**: Prevents unnecessary duplicate requests
3. **Consistent Data**: Eventually shows the complete, up-to-date data from the API
4. **Better UX**: Reduces loading spinners and wait times

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

if (isLoading && !data) {
  return <ResourceSkeleton />;
}

if (error || !data) {
  return <ResourceNotFound />;
}

return (
  <ResourceDetails resource={data} />
);
```

By following this pattern, you'll create a more responsive and efficient application that makes good use of the data you've already loaded.
