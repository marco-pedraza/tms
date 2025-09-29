# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building & Development

```bash
# Install all dependencies
npm install

# Run all applications in development (backend + frontend)
npm run dev

# Run only backend
npm run dev -- --filter=ims-server

# Run only frontend
npm run dev -- --filter=web

# Build all applications
npm run build
```

### Testing & Quality

```bash
# Run backend tests
npm run server:test

# Run tests with coverage
cd apps/server && npm run test:coverage

# Type checking across project
npm run check-types

# Linting across project
npm run lint

# Code formatting check
npm run format:check
```

### Database Operations

```bash
# Generate database migrations
cd apps/server && npm run db:generate

# Seed with default data
npm run seed:inventory

# Seed with client-specific data (GFA)
npm run seed:inventory:gfa

# Seed only permissions
npm run seed:permissions
```

### Encore Specific

```bash
# Generate TypeScript client for frontend
npm run encore:gen-client

# Check Encore configuration
npm run encore:check
```

## Architecture Overview

This is a **Turborepo monorepo** with an **Encore backend** and **Next.js frontend**, organized around inventory management for transportation companies.

### Project Structure

```
├── apps/
│   ├── server/          # Encore backend API
│   └── web/             # Next.js frontend
├── packages/            # Shared packages
│   ├── base-repo/       # Base repository implementation
│   ├── ims-client/      # Generated API client
│   ├── eslint-config/   # Shared ESLint configs
│   └── ui/              # Shared UI components
```

### Backend Architecture (apps/server/)

The backend follows a **feature-based architecture** with strict patterns:

```
apps/server/
├── inventory/                    # Main domain
│   ├── locations/               # Location management subsystem
│   │   ├── countries/           # Feature: country management
│   │   ├── states/              # Feature: state management
│   │   ├── cities/              # Feature: city management
│   │   └── installations/       # Feature: installation management
│   ├── operators/               # Operator management subsystem
│   ├── fleet/                   # Fleet management subsystem
│   └── shared-entities/         # Cross-cutting entities
├── db/                          # Central database configuration
│   ├── schema.ts               # Aggregated schemas for migrations
│   └── migrations/             # Database migrations
└── shared/                     # Shared utilities and types
```

#### Feature Structure Pattern

Each feature follows this exact structure:

```
feature-name/
├── feature-name.controller.ts    # Encore API endpoints (required)
├── feature-name.repository.ts    # Data access layer (required)
├── feature-name.domain.ts        # Business validation (required)
├── feature-name.types.ts         # TypeScript types (required)
├── feature-name.schema.ts        # Database schema (required)
├── feature-name.use-cases.ts     # Complex business logic (optional)
└── feature-name.controller.spec.ts # Tests (required)
```

#### Key Architectural Principles

1. **Repository Pattern**: All data access goes through repositories extending `@repo/base-repo`
2. **Locality of Behavior**: Each feature contains its own schema, types, and business logic
3. **Domain Validation**: Business rules and validation in `.domain.ts` files
4. **Use Cases**: Only when complex business logic beyond CRUD is needed
5. **No Multi-tenancy**: Single-tenant architecture (tenants removed)

#### Database Patterns

- **Drizzle ORM** with PostgreSQL
- **Soft Delete** support via base repository configuration
- **Schema per Feature**: Each feature defines its own schema
- **Central Aggregation**: All schemas exported in `db/schema.ts` for migrations
- **Conditional Unique Indexes**: For soft delete compatibility

#### API Patterns (Encore)

Controllers use specific REST-like patterns:

- `POST /resources/create` - Create resource
- `GET /resources/:id` - Get one resource
- `POST /resources/list/all` - Get all (non-paginated, with complex filters)
- `POST /resources/list` - Get paginated (with complex filters)
- `PUT /resources/:id/update` - Update resource
- `DELETE /resources/:id/delete` - Delete resource

_Note: List operations use POST to support complex filters in request body_

### Technology Stack

#### Backend

- **Encore**: Backend development platform with automatic API docs
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Primary database
- **Vitest**: Testing framework
- **Docker**: Required for Encore local development

#### Frontend

- **Next.js 15**: React framework with App Router
- **React 19**: Frontend library

#### Development Tools

- **Turborepo**: Monorepo orchestration with caching
- **TypeScript**: Strict type safety across all projects
- **ESLint**: Code linting with shared configurations
- **Prettier**: Code formatting

## Important Development Notes

1. **Docker Required**: Encore backend requires Docker to be running locally
2. **Base Repository**: Use `@repo/base-repo` for all data access - avoid reimplementing CRUD operations
3. **Feature Creation**: Follow the exact feature structure pattern when adding new features
4. **Schema Exports**: Always export new schemas in `db/schema.ts` for migration generation
5. **Domain Validation**: Implement business rules in `.domain.ts` files, not controllers
6. **Use Cases**: Only create when complex business logic spans multiple repositories
7. **Environment**: Configure `apps/web/.env.local` with `NEXT_PUBLIC_IMS_API_URL=http://localhost:4000`

## Testing Strategy

- **Integration Tests**: Controllers tested with real database (no mocks)
- **Test Database**: Separate test database configuration
- **Coverage**: Maintain 80%+ test coverage
- **Vitest**: Primary testing framework for backend

## Local Development Setup

1. Ensure Docker is running
2. Run `npm install` from root
3. Configure environment variables
4. Run `npm run dev` to start both backend and frontend
5. Access Encore dashboard at `http://localhost:9400/ims-server-pngi`
6. Access frontend at `http://localhost:3000`
- If you need to add comments, add them in english
- Avoid database operations at loops when posible, check if bulk operations exists at repositories, there are several examples in the project