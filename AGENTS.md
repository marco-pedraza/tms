<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# IMS Development Guide

Source of truth for development patterns, architecture decisions, and coding standards.

## Tech Stack

**Backend**: Encore + Drizzle ORM + PostgreSQL + Vitest  
**Frontend**: Next.js 15 + React 19  
**Monorepo**: Turborepo

**Shared Packages**:

- `@repo/base-repo`: Base repository with CRUD operations and transactions
- `@repo/state-machine`: State machine utilities
- `@repo/ims-client`: Generated API client for frontend
- `@repo/ui`: Shared UI components

## Architecture Patterns

### Encore Services Structure

The backend is organized into multiple Encore services that share a database but have separate responsibilities:

```
apps/server/
├── inventory/          # Service: Inventory management
│   ├── locations/     # Subsystem
│   ├── operators/     # Subsystem
│   ├── fleet/         # Subsystem
│   └── routing/        # Subsystem
├── planning/           # Service: Planning (consumes inventory)
│   └── rolling-plans/ # Feature
└── users/              # Service: User management
```

**Service Characteristics:**

- Each service has its own `encore.service.ts` defining service boundaries
- Each service has its own `db-service.ts` with Drizzle instance
- All services share the same physical database (`inventory-db`)
- Services can reference schemas and types from other services via imports

### Cross-Service References

Services consume data from other services through **Integrations and Adapters** pattern (Anti-Corruption Layer):

#### Architecture: Integration → Adapter → Service

**Three-Layer Pattern**:

1. **Integration Layer** (inventory service): Exposes controlled access to data
2. **Adapter Layer** (planning service): Translates and adapts data to domain types
3. **Service Layer** (planning service): Uses adapter for all cross-service access

#### Integration Layer (Inventory Service)

**Purpose**: Provide controlled, stable API for cross-service access

**Structure**:

```
inventory/
├── integration/
│   └── index.ts              # Public entry point
└── operators/bus-lines/
    └── bus-lines.integration.ts  # Feature-specific integration
```

**Integration File Example** (`bus-lines.integration.ts`):

```typescript
// Defines integration type (only fields needed for cross-service)
export interface BusLineIntegration {
  id: number;
  name: string;
  code: string;
  serviceTypeId: number;
  serviceType: Pick<ServiceType, 'id' | 'name' | 'code' | 'description' | 'active'>;
  // ... other fields
}

// Exposes integration service
export const busLinesIntegration = {
  async getBusLineWithServiceType(id: number): Promise<BusLineIntegration> {
    // Uses internal repository or direct queries
    const busLine = await db.query.busLines.findFirst({
      where: (busLines, { eq, and, isNull }) =>
        and(eq(busLines.id, id), isNull(busLines.deletedAt)),
      with: { serviceType: true },
    });
    // Returns integration type (not internal type)
    return {
      /* mapped fields */
    };
  },

  async getBusLinesByIds(ids: number[]): Promise<BusLineIntegration[]> {
    // Batch operation for efficiency
    // ...
  },
};
```

**Public Entry Point** (`inventory/integration/index.ts`):

```typescript
// Single entry point for all integrations
export { busLinesIntegration } from '../operators/bus-lines/bus-lines.integration';
export { nodesIntegration } from '../locations/nodes/nodes.integration';
export type { BusLineIntegration } from '../operators/bus-lines/bus-lines.integration';
```

#### Adapter Layer (Planning Service)

**Purpose**: Anti-Corruption Layer that translates inventory types to planning domain types

**Structure**:

```
planning/
└── adapters/
    └── inventory.adapter.ts   # Adapter for inventory service
```

**Adapter Implementation** (`planning/adapters/inventory.adapter.ts`):

```typescript
import { busLinesIntegration, nodesIntegration } from '@/inventory/integration';

// Planning domain types (may differ from inventory types)
export interface PlanningBusLine {
  id: number;
  name: string;
  code: string;
  serviceTypeId: number;
  serviceType: PlanningServiceType; // Planning-specific structure
  // ... planning-specific fields
}

// Translation functions
function translateBusLine(busLine: BusLineIntegration): PlanningBusLine {
  return {
    id: busLine.id,
    name: busLine.name,
    code: busLine.code,
    serviceTypeId: busLine.serviceTypeId,
    serviceType: translateServiceType(busLine.serviceType),
    // ... adapt to planning domain
  };
}

// Adapter service
export const inventoryAdapter = {
  async getBusLine(id: number): Promise<PlanningBusLine> {
    const busLine = await busLinesIntegration.getBusLineWithServiceType(id);
    return translateBusLine(busLine);
  },

  async getBusLinesByIds(ids: number[]): Promise<PlanningBusLine[]> {
    const busLines = await busLinesIntegration.getBusLinesByIds(ids);
    return busLines.map(translateBusLine);
  },
  // ... other methods
};
```

#### Usage in Service Layer

**Repository Usage**:

```typescript
// planning/rolling-plans/rolling-plans.repository.ts
import { inventoryAdapter } from '@/planning/adapters/inventory.adapter';

async function findOneWithRelations(id: number) {
  const plan = await baseRepository.findOne(id);

  // Use adapter (NOT direct inventory access)
  const [busline, busModel, baseNode] = await Promise.all([
    inventoryAdapter.getBusLine(plan.buslineId),
    inventoryAdapter.getBusModel(plan.busModelId),
    inventoryAdapter.getNode(plan.baseNodeId),
  ]);

  return { ...plan, busline, busModel, baseNode };
}
```

**Entity Usage**:

```typescript
// planning/rolling-plans/rolling-plan.entity.ts
import { inventoryAdapter } from '@/planning/adapters/inventory.adapter';

async function validateRelatedEntities(payload, collector) {
  // Validate using adapter
  await inventoryAdapter.getBusLine(payload.buslineId).catch(() => {
    rollingPlanErrors.buslineNotFound(collector, payload.buslineId);
  });

  // Infer serviceTypeId from bus line
  const busline = await inventoryAdapter.getBusLine(payload.buslineId);
  const serviceTypeId = busline.serviceTypeId;
}
```

#### Schema References (For Foreign Keys Only)

**Note**: Schemas can still be imported for foreign key definitions, but data access MUST go through adapters:

```typescript
// planning/rolling-plans/rolling-plans.schema.ts
// OK: Import schemas for foreign keys
import { busLines } from '@/inventory/operators/bus-lines/bus-lines.schema';

export const rollingPlans = pgTable('rolling_plans', {
  buslineId: integer('busline_id').references(() => busLines.id),
});
```

**But data access MUST use adapter**:

```typescript
// ❌ WRONG: Direct repository access
import { busLinesRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';

// ✅ CORRECT: Use adapter
import { inventoryAdapter } from '@/planning/adapters/inventory.adapter';
const busLine = await inventoryAdapter.getBusLine(id);
```

#### Benefits of This Pattern

- **Service Boundaries**: Clear separation between services
- **Type Safety**: Domain-specific types prevent coupling
- **Future-Proof**: Easy to migrate to separate databases/services
- **Performance**: Batch operations for efficiency
- **Maintainability**: Changes in inventory don't break planning
- **Testability**: Adapters can be mocked easily

#### Example: Planning Service

- **Service**: `planning` (separate Encore service)
- **Consumes**: `busLines`, `serviceTypes`, `busModels`, `nodes` from `inventory`
- **Pattern**: Integration → Adapter → Repository/Entity
- **Database**: Shares `inventory-db` but uses adapter for all data access
- **Implementation**: Uses adapter pattern for all cross-service communication

### Feature-Based Structure

Within each service, features follow hierarchical structure:

```
service-name/
├── subsystem/
│   └── feature/       # Feature (Entity or Repository Pattern)
```

## Domain-Driven Design Philosophy

**Entity Pattern is the Standard**: All domain entities must use Entity Pattern. This aligns with DDD principles where entities encapsulate behavior and business logic.

**Repository Pattern Only for Value Objects**: Plain repositories are only for value objects without domain behavior (simple data containers).

**Gradual Refactoring Strategy**: Existing features using Repository Pattern are gradually refactored to Entity Pattern when possible. This is an incremental migration, not a breaking change.

**New Features**: Always use Entity Pattern for domain entities.

## Backend Pattern Selection: Entity vs Repository

### Entity Pattern (Standard for Domain Entities)

**Use Entity Pattern for:**

- Domain entities with business logic
- Entities with state management
- Rich behavior and lifecycle methods
- Coordinated multi-step operations
- Examples: `pathways`, `routes`, `pathway-options`

**Entity Pattern Structure:**

```
feature-name/
├── feature-name.entity.ts              # Domain entity with behavior
├── feature-name.application-service.ts  # Orchestrates operations
├── feature-name.domain-service.ts       # Complex domain operations (optional)
├── feature-name.controller.ts           # API endpoints
├── feature-name.repository.ts           # Data access layer
├── feature-name.types.ts                # Types (includes Entity types)
├── feature-name.schema.ts               # Database schema
├── feature-name.errors.ts               # Domain-specific errors
└── feature-name.controller.spec.ts      # Integration tests
```

**Key Components:**

- **Entity** (`feature-name.entity.ts`): Factory function that creates entity instances with behavior
- **Application Service** (`feature-name.application-service.ts`): Orchestrates operations, handles transactions, dependency injection
- **Domain Service** (`feature-name.domain-service.ts`): Complex domain operations that span multiple entities (optional)
- **Repository**: Data access only, no business logic

### Repository Pattern (Only for Value Objects)

**Use Repository Pattern only for:**

- Value objects without domain behavior
- Simple data containers
- No business logic or state management
- Examples: Simple lookup tables, configuration data

**Repository Pattern Structure:**

```
feature-name/
├── feature-name.repository.ts    # Data access (extends base repo)
├── feature-name.controller.ts     # API endpoints
├── feature-name.domain.ts         # Validation & business rules
├── feature-name.types.ts          # TypeScript types
├── feature-name.schema.ts         # Database schema
└── feature-name.controller.spec.ts # Tests
```

### Pattern Comparison

| Aspect               | Entity Pattern             | Repository Pattern  |
| -------------------- | -------------------------- | ------------------- |
| **Use Case**         | Domain entities (standard) | Value objects only  |
| **Business Logic**   | Rich behavior in entity    | Simple validation   |
| **State Management** | Stateful entities          | Stateless           |
| **Operations**       | Coordinated multi-step     | CRUD + simple rules |
| **Files**            | 7-8 files                  | 5-6 files           |
| **When**             | Default for new features   | Only value objects  |

**Decision Flow:**

```
New feature?
├─ Domain entity with behavior? → Entity Pattern (default)
├─ Simple value object? → Repository Pattern
└─ Existing Repository feature? → Refactor to Entity when possible
```

## Frontend Patterns

### Module Structure (Next.js App Router)

Each frontend module follows this structure:

```
app/module-name/
├── components/          # Module-specific components
│   ├── module-name-table.tsx
│   ├── module-name-form.tsx
│   ├── module-name-skeleton.tsx
│   └── module-name-not-found.tsx
├── hooks/               # Custom React hooks
│   ├── use-query-module-name.ts      # Query hook
│   ├── use-module-name-mutations.ts   # Mutations hook
│   └── use-module-name-details-params.ts  # Route params hook
├── [id]/                # Dynamic route
│   ├── layout.tsx       # Shared layout (handles errors)
│   ├── page.tsx         # Details page
│   └── edit/
│       └── page.tsx     # Edit page
├── new/
│   └── page.tsx         # Create page
└── page.tsx             # List page
```

### Hooks Pattern

**Query Hook** (`use-query-entity.ts`):

- Uses React Query with cache-first pattern
- Retrieves initial data from collection cache when available
- Handles loading and error states

**Mutations Hook** (`use-entity-mutations.ts`):

- Uses `createCollectionMutations` helper
- Includes toast notifications
- Invalidates queries on success
- Handles navigation after mutations

**Params Hook** (`use-entity-details-params.ts`):

- Extracts and validates route parameters
- Returns validated ID and validation flag

### Component Patterns

**Forms**: Use TanStack Form + Zod schemas
**Tables**: Use DataTable component with React Query
**Loading**: Skeleton components for consistent UX
**Errors**: Dedicated not-found and error components
**Layouts**: Handle parameter validation and error states

### Data Fetching

- **React Query**: All data fetching via React Query
- **Cache-First**: Query hooks use collection cache as initial data
- **Query Keys**: Consistent naming `['module-name', id]` or `['module-name']`
- **Invalidation**: Mutations invalidate related queries

### Form Handling

- **TanStack Form**: Form state management
- **Zod**: Schema validation
- **Custom Hook**: `useForm` from `@/hooks/use-form`
- **Error Injection**: `injectTranslatedErrorsToForm` for i18n errors

### i18n

- **next-intl**: Internationalization system
- **Translation Keys**: Organized by module (`useTranslations('module-name')`)
- **Validation Messages**: Separate `validations` namespace

## Code Conventions

### Language

**English Only**: All development must be in English. Spanish is prohibited in:

- Variable, function, class, and type names
- File and directory names
- Code comments and documentation
- Commit messages
- Error messages
- User-facing strings (use i18n translations instead)

**Examples**:

```typescript
// ✅ Correct
function createUser(name: string): User {}
const userName = 'John';
// User not found

// ❌ Incorrect
function crearUsuario(nombre: string): Usuario {}
const nombreUsuario = 'John';
// Usuario no encontrado
```

### TypeScript

- Strict mode required (`"strict": true`)
- `camelCase` variables/functions, `PascalCase` types/classes
- Prefer `function` declarations over arrows for exports
- Use `T[]` not `Array<T>`
- Use `??` not `||` for defaults
- No non-null assertions (`!`)
- Max 500 lines per file

### Naming

- Domain names over technical names
- Descriptive > short
- Examples: `ensureMinimumOptionsAndDefaultPresence` ✅, `validatePostRules` ❌

### Documentation

- JSDoc for functions (avoid redundant type info)
- Explain "why" not "how"
- Document complex logic only

## API Patterns (Encore)

**Endpoint Conventions:**

- `POST /resources/create` - Create
- `GET /resources/:id` - Get one
- `POST /resources/list/all` - List all (non-paginated)
- `POST /resources/list` - List paginated
- `PUT /resources/:id/update` - Update
- `DELETE /resources/:id/delete` - Delete

**Controller Pattern (Repository):**

```typescript
export const createResource = api(
  { method: 'POST', path: '/resources/create', auth: true },
  async (params: CreatePayload): Promise<Resource> => {
    await validateResource(params); // domain.ts
    return await resourceRepository.create(params);
  }
);
```

**Controller Pattern (Entity):**

```typescript
export const createResource = api(
  { method: 'POST', path: '/resources/create', auth: true },
  async (params: CreatePayload): Promise<Resource> => {
    return await resourceApplicationService.createResource(params);
  }
);
```

## Entity Pattern Components

### Application Service

**Purpose**: Orchestrates operations, handles transactions, manages dependencies

**Responsibilities**:

- Coordinates entity operations
- Manages transactions for atomic operations
- Handles dependency injection (repositories, entity factories, domain services)
- Exposes clean API to controllers

**Example**:

```typescript
// feature-name.application-service.ts
export function createFeatureApplicationService() {
  // Create entity factory with dependencies
  const entityFactory = createFeatureEntity({
    repository: featureRepository,
    relatedRepository: relatedRepository,
  });

  // Transaction wrapper
  function withTransaction<T>(
    operation: (entity: FeatureEntity, tx: TransactionalDB) => Promise<T>
  ): Promise<T> {
    return featureRepository.transaction(async (txRepo, tx) => {
      const txEntityFactory = createFeatureEntity({
        repository: txRepo,
        relatedRepository: relatedRepository.withTransaction(tx),
      });
      const entity = await txEntityFactory.findOne(id);
      return await operation(entity, tx);
    });
  }

  return {
    create: (payload) => {
      const entity = entityFactory.create(payload);
      return entity.save();
    },
    // ... other operations
  };
}
```

### Domain Service

**Purpose**: Complex domain operations that span multiple entities or require coordination

**When to Use**:

- Operations involving multiple entities
- Complex business logic that doesn't belong to a single entity
- Operations that need to work with or without transactions

**Example**:

```typescript
// feature-name.domain-service.ts
export function createFeatureDomainService(dependencies) {
  return {
    async complexOperation(payload) {
      // Coordinates multiple entities/repositories
      // Can work with transaction-wrapped repositories
    },
  };
}
```

### Entity Factory

**Purpose**: Creates entity instances with injected dependencies

**Pattern**:

```typescript
// feature-name.entity.ts
export function createFeatureEntity(dependencies) {
  // Factory function that returns entity methods
  function create(payload): FeatureEntity {
    /* ... */
  }
  function fromData(data): FeatureEntity {
    /* ... */
  }
  function findOne(id): Promise<FeatureEntity> {
    /* ... */
  }

  return { create, fromData, findOne };
}
```

### Transaction Handling

**Entity Pattern**: Transactions managed by Application Service

```typescript
// Application service handles transactions
function createFeature(payload) {
  return repository.transaction(async (txRepo, tx) => {
    // Create transaction-aware entity factory
    const txEntityFactory = createFeatureEntity({
      repository: txRepo,
    });

    const entity = txEntityFactory.create(payload);
    return await entity.save(tx); // Entity receives transaction
  });
}
```

**Repository Pattern**: Simple transactions via repository

```typescript
// Repository pattern uses base repository transaction
await repository.transaction(async (txRepo) => {
  await txRepo.create(data1);
  await txRepo.create(data2);
});
```

## Domain Validation

**Repository Pattern** (domain.ts):

```typescript
export async function validateResource(payload: CreatePayload, currentId?: number): Promise<void> {
  const collector = new FieldErrorCollector();
  // Check uniqueness, business rules
  collector.throwIfErrors();
}
```

**Entity Pattern** (entity.ts):

```typescript
function validateBusinessRules(data: Payload): void {
  const collector = new FieldErrorCollector();
  // Complex validation logic
  collector.throwIfErrors();
}
```

## Error Handling

### Domain-Specific Errors (Entity Pattern)

**Purpose**: Create feature-specific error helpers for domain validation

**Pattern** (`feature-name.errors.ts`):

```typescript
import { FieldErrorCollector } from '@repo/base-repo';
import { createDomainErrorHelpersWithFields } from '@/shared/domain/domain-errors';

// Define error configuration
const FEATURE_ERROR_CONFIG = {
  invalidState: {
    message: 'Invalid state for this operation',
    field: 'state',
    code: 'INVALID_STATE',
  },
  relatedEntityNotFound: {
    message: 'Related entity not found',
    field: 'relatedId',
    code: 'NOT_FOUND',
  },
} as const;

// Generate error helpers automatically
const baseErrors = createDomainErrorHelpersWithFields(FEATURE_ERROR_CONFIG);

// Export error helpers
export const featureErrors = {
  ...baseErrors,
  // Add custom errors if needed
  customError: (collector: FieldErrorCollector, value: unknown) => {
    collector.addError('field', 'CUSTOM_CODE', 'Custom error message', { value });
  },
};
```

**Usage in Entity**:

```typescript
// feature-name.entity.ts
import { featureErrors } from './feature-name.errors';

function validateBusinessRules(data: Payload): void {
  const collector = new FieldErrorCollector();

  if (invalidCondition) {
    featureErrors.invalidState(collector, data.state);
  }

  collector.throwIfErrors();
}
```

### General Error Handling

- Use `FieldErrorCollector` for validation errors
- Use `standardFieldErrors` from `shared/errors.ts` for common errors
- Entity Pattern: Use `feature-name.errors.ts` for domain-specific errors
- Middleware handles error transformation (no try/catch in controllers)

## Database

- **Schema per Feature**: Each feature defines its own schema
- **Export in `db/schema.ts`**: Required for migrations
- **Shared Database**: All services share `inventory-db` but have separate Drizzle instances
- **Cross-Service References**: Services can reference schemas/types from other services
- **Foreign Keys**: Can reference tables from other services
- **Soft Delete**: Conditional unique indexes with `isNull(deletedAt)`
- **Base Repository**: Extend `@repo/base-repo`, don't reimplement CRUD

## Testing

- **Command**: `encore test` from project root (not `npm test`)
- **Run twice**: Detect flaky tests from parallel execution
- **Integration tests**: Real database, no mocks
- **Coverage**: Maintain 80%+
- **Structure**: One `feature.controller.spec.ts` per feature

## Development Tools

### OpenSpec (Optional)

OpenSpec is an **optional** tool for spec-driven development. Developers can work without it. Use OpenSpec when:

- Planning new features or capabilities
- Making breaking changes or architecture shifts
- Creating change proposals for complex work

For OpenSpec usage, see `openspec/AGENTS.md`. For regular development, follow patterns in this document.

## Development Commands

```bash
# Development
npm run dev                    # All apps
npm run dev -- --filter=ims-server  # Backend only

# Testing
encore test                    # All tests (from root)
encore test filename.spec.ts   # Specific test

# Database
cd apps/server && npm run db:generate  # Generate migrations
npm run seed:inventory         # Seed data

# Type checking & linting
npm run check-types
npm run lint
```

## Important Constraints

- **Docker Required**: Encore needs Docker running
- **No Dynamic Imports**: Use factory functions instead
- **Transaction Visibility**: Factories may not be visible in transactions - use repositories directly
- **Secrets**: Use Encore's `secret()`, never `process.env`
- **Avoid Loops**: Use bulk operations when available
- **Cross-Service Access**: Services can import schemas/types but should not call other services' APIs directly
- **Database Sharing**: All services share the same database; use foreign keys for relationships

## Key Business Rules

- **Pathways**: Must have at least one option before activation
- **Routes**: Must have at least one leg, legs form continuous chain
- **Empty Trips**: Cannot be marked as sellable
- **Soft Delete**: Used for most entities

## Quick Reference

**Creating a Backend Feature:**

1. Is it a domain entity? → Use Entity Pattern (default)
2. Is it a value object? → Use Repository Pattern
3. Create feature directory with required files
4. Export schema in `db/schema.ts`
5. Implement following pattern structure
6. Write tests

**Creating a Frontend Module:**

1. Create module directory structure (`components/`, `hooks/`, `[id]/`, `new/`)
2. Create hooks (query, mutations, params)
3. Create components (table, form, skeleton, not-found)
4. Create pages (list, details, edit, create)
5. Create layout for `[id]/` route
6. Add translations

**Refactoring Existing Features:**

- When touching a Repository Pattern feature, consider refactoring to Entity Pattern
- Do it incrementally, one feature at a time
- Ensure tests pass before and after refactoring
