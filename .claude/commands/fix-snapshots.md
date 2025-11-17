# Fix Drizzle Snapshots

Resolve snapshot collision and merge issues in Drizzle migrations.

## Process Flow

1. Run `drizzle-kit generate` with temporary name to detect errors
2. **Fix snapshot collisions**: If multiple snapshots point to same parent, correct `prevId` references
3. **Fix missing fields**: If migration generated (but expecting "nothing to migrate"), compare snapshots and add missing fields from merge conflicts
4. Repeat until `drizzle-kit generate` shows "nothing to migrate"
5. **Clean up verification artifacts** (see below)

## Common Issues

- **Snapshot collision**: Two snapshots pointing to same parent (parallel branches merged incorrectly)
- **Missing fields/defaults**: Fields present in schema but missing in snapshots (merge conflicts)

## Verification & Cleanup

**Verification command**:

```sh
cd apps/server && npx drizzle-kit generate --name temp_verify_$(date +%s)
```

**CRITICAL**: After verification, immediately clean up artifacts:

```sh
# Remove untracked verification files
git status --porcelain apps/server/db/migrations/ | grep "^??" | grep -E "(verify|temp)" | awk '{print $2}' | xargs rm -f

# Remove verification entries from journal (using jq)
jq '.entries = (.entries | map(select(.tag | test("verify|temp") | not)))' \
  apps/server/db/migrations/meta/_journal.json > /tmp/_journal.json.tmp && \
  mv /tmp/_journal.json.tmp apps/server/db/migrations/meta/_journal.json

# Or manually edit _journal.json to remove entries with "verify" or "temp" tags
```

**Verify cleanup**:

- [ ] No migration SQL files with "verify" or "temp" in name
- [ ] No journal entries with "verify" or "temp" tags
- [ ] No snapshot files with "verify" or "temp" in name (`ls apps/server/db/migrations/meta/ | grep -E "(verify|temp)"`)

**Never commit verification artifacts** - they pollute migration history.

## Key Files

- `apps/server/db/migrations/meta/_journal.json` - Migration journal (check `prevId` chain)
- `apps/server/db/migrations/meta/*_snapshot.json` - Snapshot files (check `prevId` and field definitions)
- `apps/server/db/migrations/*.sql` - Migration SQL files (delete if generated during verification)
