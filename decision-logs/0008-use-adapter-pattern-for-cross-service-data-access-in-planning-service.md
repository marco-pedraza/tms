# 8. Use adapter pattern for cross-service data access in planning service

Date: 2025-11-10

## Status

Accepted

## Context

The planning service requires access to data from the inventory service to support its various features. For example, planning features may need:

- **Bus lines** (`busLines`) - To associate plans with specific bus line operations
- **Bus models** (`busModels`) - To specify bus models used in plans
- **Nodes** (`nodes`) - To define base nodes for operations

As an example, the rolling plans feature includes foreign key references to these inventory entities:

```typescript
buslineId: integer('busline_id').references(() => busLines.id)
busModelId: integer('bus_model_id').references(() => busModels.id)
baseNodeId: integer('base_node_id').references(() => nodes.id)
```

**The Problem**: We needed to avoid direct dependencies from the planning service to the inventory service's internal implementation. Direct imports would create tight coupling and violate bounded context boundaries. Additionally, planning may need different data representations than what inventory provides, and we need protection from changes in inventory's internal structure.

Additionally, the planning domain may need different representations of inventory data:

- Different field names or structures
- Planning-specific computed fields
- Filtered or transformed data views
- Protection against changes in inventory's internal structure

As the planning service grows with new modules, we need a consistent pattern for accessing inventory data across all features.

## Decision

We will use an **Adapter Pattern** (specifically an **Anti-Corruption Layer**) to access inventory data from the planning service.

### Architecture

1. **Inventory Integration Layer**: The inventory service provides integration services (`*.integration.ts` files) that expose controlled access to its entities. These services are the only way other services should access inventory data.

2. **Planning Adapter**: The planning service implements an `inventory.adapter.ts` that:
   - Uses inventory integration services to fetch data
   - Translates inventory domain types to planning domain types
   - Provides planning-specific interfaces (`PlanningBusLine`, `PlanningNode`, `PlanningBusModel`)
   - Acts as the single point of access for inventory data within planning

### Implementation

**Location**: `apps/server/planning/adapters/inventory.adapter.ts`

The adapter is implemented as a factory function that returns an object with adapter methods, and exported as a singleton instance:

```typescript
export const inventoryAdapter = createInventoryAdapter();
```

This singleton pattern ensures consistent usage across the entire planning service and makes the adapter easily mockable in tests.

The adapter provides:

- **Translation functions**: Convert inventory types to planning types
  - `translateBusLine()` - Maps `BusLineIntegration` → `PlanningBusLine`
  - `translateNode()` - Maps `NodeIntegration` → `PlanningNode` (reorganizes coordinates and permissions)
  - `translateBusModel()` - Maps `BusModelIntegration` → `PlanningBusModel`

- **Public API methods**: Both single and batch operations
  - `getBusLine(id)` / `getBusLinesByIds(ids[])`
  - `getNode(id)` / `getNodesByIds(ids[])`
  - `getBusModel(id)` / `getBusModelsByIds(ids[])`

### Usage Examples

The adapter is used throughout planning features. Here are examples from the rolling plans module:

1. **Entity Validation** (`rolling-plans/rolling-plan.entity.ts`):

   ```typescript
   async function validateRelatedEntities(payload, collector) {
     // Validate busline exists
     await inventoryAdapter.getBusLine(payload.buslineId).catch(() => {
       rollingPlanErrors.buslineNotFound(collector, payload.buslineId);
     });

     // Validate bus model exists
     if (payload.busModelId) {
       await inventoryAdapter.getBusModel(payload.busModelId).catch(() => {
         rollingPlanErrors.busModelNotFound(collector, payload.busModelId);
       });
     }

     // Validate base node exists
     if (payload.baseNodeId) {
       await inventoryAdapter.getNode(payload.baseNodeId).catch(() => {
         rollingPlanErrors.baseNodeNotFound(collector, payload.baseNodeId);
       });
     }
   }
   ```

2. **Repository Relations** (`rolling-plans/rolling-plans.repository.ts`):

   ```typescript
   async function findOneWithRelations(id) {
     const plan = await baseRepository.findOne(id);
     const [busline, busModel, baseNode] = await Promise.all([
       inventoryAdapter.getBusLine(plan.buslineId),
       inventoryAdapter.getBusModel(plan.busModelId),
       inventoryAdapter.getNode(plan.baseNodeId),
     ]);
     return { ...plan, busline, busModel, baseNode };
   }
   
   async function appendRelations(rollingPlansResult, pagination) {
     // Extract unique IDs for batch fetching
     const buslineIds = [...new Set(rollingPlansResult.map((p) => p.buslineId))];
     const busModelIds = [...new Set(rollingPlansResult.map((p) => p.busModelId))];
     const nodeIds = [...new Set(rollingPlansResult.map((p) => p.baseNodeId))];

     // Batch fetch all related entities efficiently
     const [buslines, busModels, nodes] = await Promise.all([
       inventoryAdapter.getBusLinesByIds(buslineIds),
       inventoryAdapter.getBusModelsByIds(busModelIds),
       inventoryAdapter.getNodesByIds(nodeIds),
     ]);

     // Create lookup maps for efficient matching
     const buslineMap = new Map(buslines.map((b) => [b.id, b]));
     const busModelMap = new Map(busModels.map((b) => [b.id, b]));
     const nodeMap = new Map(nodes.map((n) => [n.id, n]));

     // Combine data
     const rollingPlansWithRelations = rollingPlansResult.map((plan) => ({
       ...plan,
       busline: buslineMap.get(plan.buslineId),
       busModel: busModelMap.get(plan.busModelId),
       baseNode: nodeMap.get(plan.baseNodeId),
     }));

     return { data: rollingPlansWithRelations, pagination };
   }
   ```

**Note**: All future planning modules should follow this same pattern when accessing inventory data.

### Key Design Decisions

- **Singleton Pattern**: The adapter is exported as a singleton (`inventoryAdapter`) to ensure consistent usage across the planning service
- **Type Translation**: Planning domain types may have different structures (e.g., `PlanningNode` reorganizes coordinates into a nested object)
- **Batch Operations**: The adapter supports batch fetching for efficient data loading in list operations
- **Error Propagation**: Errors from inventory integration services (e.g., `NotFoundError`) are propagated to the planning domain

## Consequences

### Positive

- ✅ **Bounded Context Protection**: Planning service is protected from changes in inventory's internal structure
- ✅ **Domain-Specific Types**: Planning can define its own types that match its needs (e.g., nested `coordinates` object in `PlanningNode`)
- ✅ **Single Point of Access**: All inventory access goes through one adapter, making it easy to add caching, logging, or other cross-cutting concerns
- ✅ **Testability**: The adapter can be easily mocked in tests by injecting a test double
- ✅ **Clear Separation**: Explicit boundary between planning and inventory domains
- ✅ **Future Flexibility**: Can add planning-specific business logic (e.g., computed fields, filtering) without affecting inventory

### Negative

- ❗ **Additional Layer**: Adds an extra abstraction layer that must be maintained
- ❗ **Translation Overhead**: Requires maintaining translation functions when inventory types change
- ❗ **Potential Duplication**: Planning types may duplicate some inventory type information
- ❗ **Synchronization**: Changes in inventory integration API require updates to the adapter

### Implementation Notes

**Files Created**:

- `apps/server/planning/adapters/inventory.adapter.ts` (~200 lines)
  - Factory function `createInventoryAdapter()` that returns adapter methods
  - Singleton export `inventoryAdapter` for consistent usage
  - Three planning domain types: `PlanningBusLine`, `PlanningNode`, `PlanningBusModel`
  - Three translation functions: `translateBusLine()`, `translateNode()`, `translateBusModel()`
  - Six public methods: single and batch operations for each entity type
  - Type-safe with TypeScript interfaces

**Files Using Adapter** (examples from rolling plans):

- `rolling-plans/rolling-plan.entity.ts` - For validation of related entities
- `rolling-plans/rolling-plans.repository.ts` - For fetching relations in queries
- `rolling-plans/rolling-plans.application-service.ts` - Injected into entity factory

**Future modules** in planning service should use the same adapter pattern when accessing inventory data.

**Integration Points**:

- Uses `@/inventory/integration` services (the only allowed way to access inventory)
- No direct imports from inventory feature directories (e.g., `@/inventory/operators/bus-lines/...`)
- Follows the integration service pattern established in inventory
- Each integration service provides both single (`getEntity(id)`) and batch (`getEntitiesByIds(ids[])`) operations

**Testing**:

- The singleton adapter can be easily mocked in tests by replacing the import
- Tests can use the real adapter with actual inventory data or provide test doubles
- Example from `rolling-plans.controller.spec.ts`: imports `inventoryAdapter` directly and uses it with test factories

## Related Decisions

- **ADR-0001**: Record architecture decisions - This ADR documents the adapter pattern decision

## Future Considerations

1. **Caching**: The adapter could implement caching strategies for frequently accessed inventory data
2. **Error Handling**: Could add retry logic or circuit breaker patterns for resilience
3. **Monitoring**: Could add metrics/logging for cross-service calls
4. **Validation**: Could add planning-specific validation rules on top of inventory data

---

_Decision recorded and implemented successfully_ ✅
