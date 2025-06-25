# 3. Use checkUniqueness to validate multiple fields into a table

Date: 2025-06-24

## Status

Accepted

## Context

We need to validate uniqueness constraints across multiple fields efficiently. Previous approaches had issues:

- Multiple database queries for each field validation (performance)
- Generic database errors exposed to users (poor UX)
- Inconsistent validation patterns across features
- Race conditions between validation and insert/update operations

## Decision

Use the base repository's `checkUniqueness` method with domain validation pattern:

1. **Single query validation**: Check multiple fields in one database query
2. **Domain layer validation**: Each feature implements `validateEntityUniqueness` function
3. **Standardized errors**: Consistent error messages using `FieldErrorCollector`

### Implementation Pattern

```typescript
export async function validateEntityUniqueness(
  payload: CreateEntityPayload | UpdateEntityPayload,
  currentId?: number,
  validator?: FieldErrorCollector
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  const fieldsToCheck = [];
  if (payload.uniqueField) {
    fieldsToCheck.push({ field: schema.uniqueField, value: payload.uniqueField });
  }

  const conflicts = await repository.checkUniqueness(fieldsToCheck, currentId);

  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate('Entity', conflict.field, conflict.value as string);
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}
```

### Key Features

- Single database query for all uniqueness checks
- Excludes soft-deleted records automatically
- Supports scoped uniqueness and update operations
- Returns specific field conflicts with user-friendly errors

## Consequences

**Benefits:**

- Better performance (single query vs multiple)
- Consistent validation across features
- User-friendly error messages
- Type-safe implementation

**Trade-offs:**

- Requires domain validation boilerplate per feature
- Developers need to learn the pattern
- Database constraints still needed as safety net
