# 4. Deprecate search in favor of listAll

Date: 2025-06-24

## Status

Accepted

## Context

Previously, we had separate endpoints for searching and filtering data:

- `search()` and `searchPaginated()` methods for text-based searches
- `findAll()` and `findAllPaginated()` methods for filtering
- Separate controller endpoints for each operation

This approach had significant limitations:

- **No combined operations**: Users couldn't combine search with filters (e.g., search "John" AND filter by active=true)
- **Inconsistent API**: Different endpoints for similar operations confused developers and clients
- **Code duplication**: Similar logic existed in multiple methods and endpoints
- **Poor user experience**: Frontend had to choose between search OR filters, not both
- **Maintenance overhead**: Multiple code paths for similar functionality

The limitation became evident when building data tables that needed both search and filtering capabilities simultaneously.

## Decision

Unify search and filtering functionality by enhancing `findAll` and `findAllPaginated` methods with a `searchTerm` parameter:

1. **Enhanced base repository methods**: Add `searchTerm` parameter to existing `findAll` and `findAllPaginated` methods
2. **Unified controller endpoints**: Use single endpoints that support both search and filters
3. **Deprecate search methods**: Mark `search()` and `searchPaginated()` as deprecated for backward compatibility
4. **Consistent API patterns**: All list operations follow the same parameter structure

### Implementation Pattern

```typescript
// Base repository - unified method
const findAll = async (options?: QueryOptions<T, TTable>): Promise<T[]> => {
  const { filters, orderBy, searchTerm } = options ?? {};
  let query = db.select().from(table);

  // Apply both search and filters in single query
  query = applyAllFilters(query, searchTerm, filters);
  query = applyOrdering(query, orderBy, table);

  return await query;
};

// Controller - single endpoint for both operations
export const listCountries = api(
  { expose: true, method: 'POST', path: '/countries/list/all' },
  async (params: ListCountriesQueryParams): Promise<ListCountriesResult> => {
    const countries = await countryRepository.findAll(params);
    return { data: countries };
  }
);
```

### Migration Strategy

- Keep deprecated methods for backward compatibility
- Update all new controllers to use unified approach
- Gradually migrate existing controllers
- Remove deprecated methods in future major version

## Consequences

**Benefits:**

- **Combined functionality**: Search and filters work together seamlessly
- **Consistent API**: Single pattern for all list operations
- **Better UX**: Users can search within filtered results
- **Simplified code**: One method handles all query scenarios
- **Maintainable**: Single code path reduces bugs and complexity

**Trade-offs:**

- **Backward compatibility**: Must maintain deprecated methods temporarily
- **Migration effort**: Existing code needs gradual updates
- **Learning curve**: Developers need to understand the unified approach

**Technical Details:**

- Deprecated methods remain functional to avoid breaking changes
- New `searchTerm` parameter is optional for all existing usage
- Query optimization handles combined search and filter operations efficiently
- Type safety maintained across all query parameters
