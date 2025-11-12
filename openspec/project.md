# Project Context

> **📖 See `AGENTS.md` for complete development patterns, architecture decisions, and coding standards**

## Purpose

IMS (Inventory Management System) is a monorepo application for managing inventory and routing for transportation companies. The system provides comprehensive management of locations, operators, fleet, and routing capabilities including pathways, routes, and tolls.

## Tech Stack

**Backend**: Encore + Drizzle ORM + PostgreSQL + Vitest  
**Frontend**: Next.js 15 + React 19  
**Monorepo**: Turborepo

**Shared Packages**:

- `@repo/base-repo`: Base repository with CRUD operations and transactions
- `@repo/state-machine`: State machine utilities
- `@repo/ims-client`: Generated API client for frontend
- `@repo/ui`: Shared UI components

## Project Conventions

### Language

**English Only**: All development must be in English. Spanish is prohibited in variable/function names, file names, code comments, commit messages, error messages, and user-facing strings (use i18n translations instead).

### Code Style

- **TypeScript Strict Mode**: Always use strict mode (`"strict": true`)
- **Naming**: `camelCase` variables/functions, `PascalCase` types/classes, `UPPER_SNAKE_CASE` constants
- **Function Declarations**: Prefer `function` declarations over arrow functions for exports
- **Array Types**: Use `T[]` not `Array<T>`
- **Nullish Coalescing**: Use `??` not `||` for defaults
- **No Non-null Assertions**: Prohibited use of `!` operator
- **File Size**: Maximum 500 lines per file
- **Documentation**: JSDoc for functions (avoid redundant type info), explain "why" not "how"

See `AGENTS.md` section "Code Conventions" for complete standards.

### Architecture Patterns

#### Encore Services Structure

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

- Each service has its own `encore.service.ts` and `db-service.ts`
- All services share the same physical database (`inventory-db`)
- Cross-service access via **Integration → Adapter → Service** pattern

#### Backend Pattern Selection

**Entity Pattern** (Standard for domain entities):

- Domain entities with business logic
- Entities with state management
- Rich behavior and lifecycle methods
- Examples: `pathways`, `routes`, `pathway-options`

**Repository Pattern** (Only for value objects):

- Value objects without domain behavior
- Simple data containers
- No business logic or state management

See `AGENTS.md` section "Backend Pattern Selection: Entity vs Repository" for decision criteria.

#### Cross-Service Communication

Services consume data from other services through **Integrations and Adapters** pattern:

1. **Integration Layer** (source service): Exposes controlled access to data
2. **Adapter Layer** (consuming service): Translates to domain types
3. **Service Layer**: Uses adapter for all cross-service access

See `AGENTS.md` section "Cross-Service References" for complete pattern.

#### Frontend Patterns

- **Module Structure**: Components, hooks, pages organized by module
- **Data Fetching**: React Query with cache-first pattern
- **Forms**: TanStack Form + Zod schemas
- **i18n**: next-intl for internationalization

See `AGENTS.md` section "Frontend Patterns" for complete patterns.

### Testing Strategy

- **Command**: `encore test` from project root (not `npm test`)
- **Run twice**: Detect flaky tests from parallel execution
- **Integration tests**: Real database, no mocks
- **Coverage**: Maintain 80%+
- **Structure**: One `feature.controller.spec.ts` per feature

See `AGENTS.md` section "Testing" for complete strategy.

### Development Commands

```bash
# Development
npm run dev                    # All apps
npm run dev -- --filter=ims-server  # Backend only

# Testing
encore test                    # All tests (from root)
encore test filename.spec.ts   # Specific test

# Database
cd apps/server && npm run db:generate  # Generate migrations
npm run seed:all         # Seed data
```

See `AGENTS.md` section "Development Commands" for complete list.

## Domain Context

### Core Domains

1. **Inventory Management**
   - Locations (countries, states, cities, installations, nodes)
   - Operators (bus lines, service types)
   - Fleet (buses, bus models, drivers, seat diagrams)
   - Shared entities (events, labels, technologies, amenities)

2. **Routing**
   - **Pathways**: Routes between origin and destination nodes
   - **Pathway Options**: Different route variations for a pathway (with tolls)
   - **Routes**: Multi-leg journeys combining pathway options
   - **Route Legs**: Individual segments of a route

3. **Users & Permissions**
   - User management
   - Role-based access control
   - Permission groups
   - Departments

### Key Business Rules

- **Pathways**: Must have at least one option before activation
- **Routes**: Must have at least one leg, legs must form a continuous chain
- **Empty Trips**: Cannot be marked as sellable
- **Soft Delete**: Used for most entities to preserve data integrity
- **Uniqueness**: Validated at domain layer with multi-field support

## Important Constraints

- **Docker Required**: Encore needs Docker running
- **No Dynamic Imports**: Use factory functions instead
- **Transaction Visibility**: Factories may not be visible in transactions - use repositories directly
- **Secrets**: Use Encore's `secret()`, never `process.env`
- **Cross-Service Access**: Services can import schemas/types but should not call other services' APIs directly
- **Database Sharing**: All services share the same database; use foreign keys for relationships

See `AGENTS.md` section "Important Constraints" for complete list.

## External Dependencies

- **Encore Platform**: Provides API framework, database management, and deployment
- **PostgreSQL**: Database server (managed by Encore locally)
- **Sentry**: Error tracking and monitoring
- **Drizzle ORM**: Database query builder and migration generator
- **Base Repository Package**: Shared CRUD operations (`@repo/base-repo`)
- **State Machine Package**: State management utilities (`@repo/state-machine`)
