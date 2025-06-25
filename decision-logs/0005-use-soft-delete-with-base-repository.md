# 5. Use soft delete with base repository

Date: 2025-06-24

## Status

Accepted

## Context

Traditional hard delete operations permanently remove records from the database, which can cause issues:

- **Data loss**: Important historical data is permanently lost
- **Referential integrity**: Cascading deletes can affect related records unexpectedly
- **Audit requirements**: Some business domains require maintaining deletion history
- **User experience**: Users may accidentally delete data and expect recovery options
- **Compliance**: Regulatory requirements may mandate data retention even after "deletion"

Many applications need the ability to "delete" records while preserving them for auditing, recovery, or compliance purposes. However, implementing this manually across features creates inconsistency and maintenance overhead.

## Decision

Implement transparent soft delete functionality in the base repository that can be enabled per feature:

1. **Transparent operation**: Soft delete works seamlessly with existing repository methods
2. **Opt-in configuration**: Features enable soft delete by setting `softDeleteEnabled: true`
3. **Database schema requirement**: Tables must include a `deletedAt` timestamp column
4. **Automatic filtering**: All queries automatically exclude soft-deleted records
5. **Additional operations**: Provide `forceDelete()` and `restore()` methods for permanent deletion and recovery

### Implementation Requirements

```typescript
// Schema: Add deletedAt column and index
export const tableName = pgTable(
  'table_name',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull(), // Remove .unique() for soft delete compatibility
    name: text('name').notNull(), // Remove .unique() for soft delete compatibility
    // ... other columns
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    // Conditional unique indexes - only apply to non-soft-deleted records
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.name).where(isNull(table.deletedAt)),
    index().on(table.deletedAt), // Index for performance
  ]
);

// Repository: Enable soft delete
export const repository = createBaseRepository(db, tableName, 'EntityName', {
  softDeleteEnabled: true,
  // ... other config
});
```

### Transparent Behavior

- `delete(id)`: Sets `deletedAt` to current timestamp instead of removing record
- `findAll()`, `findOne()`, etc.: Automatically exclude records where `deletedAt IS NOT NULL`
- `checkUniqueness()`: Ignores soft-deleted records for validation
- `deleteMany()`: Soft deletes multiple records
- `forceDelete(id)`: Permanently removes record (throws error if soft delete not enabled)
- `restore(id)`: Sets `deletedAt` to null (throws error if soft delete not enabled)

### Critical: Unique Constraints with Soft Delete

**Problem**: Standard `unique` constraints conflict with soft delete because PostgreSQL considers soft-deleted records when validating uniqueness.

**Example Issue**:

1. Create record with `code: "ZMG"`
2. Soft delete it (`deletedAt: timestamp`)
3. Try to create new record with `code: "ZMG"`
4. **Fails** - PostgreSQL sees existing soft-deleted record

**Solution**: Replace `.unique()` with conditional `uniqueIndex` that only applies to active records:

```typescript
// ❌ Problematic - causes unique constraint violations
export const countries = pgTable('countries', {
  code: text('code').notNull().unique(), // Don't use .unique() with soft delete
});

// ✅ Correct - conditional uniqueness
export const countries = pgTable(
  'countries',
  {
    code: text('code').notNull(), // Remove .unique()
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex().on(table.code).where(isNull(table.deletedAt)), // Only unique if not soft-deleted
  ]
);
```

## Consequences

**Benefits:**

- **Data preservation**: Records are preserved for audit and recovery
- **Transparent integration**: Existing code works without changes
- **Consistent behavior**: Same soft delete logic across all features
- **Performance optimized**: Automatic indexing and query filtering
- **Flexible recovery**: Easy restoration of accidentally deleted records
- **Compliance ready**: Supports regulatory data retention requirements

**Trade-offs:**

- **Database migration required**: Existing tables need `deletedAt` column and index
- **Unique constraint complexity**: Must use conditional unique indexes instead of simple `.unique()`
- **Storage overhead**: Soft-deleted records consume database space
- **Query complexity**: Additional WHERE clauses in all queries
- **Manual cleanup**: Periodic cleanup of old soft-deleted records may be needed

**Implementation Guidelines:**

- Add `deletedAt` column to schema with appropriate index
- Replace `.unique()` constraints with conditional `uniqueIndex().where(isNull(deletedAt))`
- Enable soft delete in repository configuration
- Generate and run database migrations for existing tables
- Consider data retention policies for long-term soft-deleted records
- Test that existing functionality works transparently with soft delete enabled
