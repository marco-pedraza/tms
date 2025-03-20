# IMS (Inventory Management System)

This is a monorepo for the Inventory Management System, built using Turborepo with an Encore-powered backend API and a Next.js frontend.

## Tech Stack

### Backend (apps/server)

- [Encore](https://encore.dev) - Backend development platform
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
- PostgreSQL - Database
- Docker - Required for Encore local development

### Frontend (apps/web)

- [Next.js 15](https://nextjs.org) - React framework with App Router
- React 19

## Project Structure

This monorepo is powered by [Turborepo](https://turbo.build/repo) and follows its conventions:

```
├── apps/
│   ├── server/        # Encore backend API
│   └── web/           # Next.js frontend
├── packages/          # Shared packages
│   ├── eslint-config/ # Shared ESLint configurations
│   ├── typescript-config/ # Shared TypeScript configurations
│   └── ui/            # Shared UI components
└── turbo.json         # Turborepo configuration
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later)
- [npm](https://www.npmjs.com/) (v10.9.2 or later)
- [Docker](https://www.docker.com/) (required for Encore local development)
- [Encore CLI](https://encore.dev/docs/install)

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

Run all applications in development mode:

```bash
npm run dev
```

Run only the backend:

```bash
npm run dev -- --filter=ims-server
```

Run only the frontend:

```bash
npm run dev -- --filter=web
```

### Building

Build all applications:

```bash
npm run build
```

### Testing

Run backend tests:

```bash
npm run server:test
```

### Type Checking

Check types across the project:

```bash
npm run check-types
```

### Linting

Run linters across the project:

```bash
npm run lint
```

## Encore Backend

The backend uses Encore, which requires Docker to run locally. Encore provides:

- Automatic API documentation
- Type-safe API endpoints
- Integrated database migrations
- Local development environment

Before starting the backend, ensure Docker is running on your machine.

### Encore Dashboard

When running the backend, Encore provides a local dashboard at `http://localhost:9400/ims-server-pngi` where you can:

- Test API endpoints
- View logs
- Inspect database schema
- Generate client SDKs

## Frontend

The frontend is built with Next.js 15 and React 19. To access the application locally:

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Turborepo Features

This project leverages Turborepo's capabilities:

- [Task orchestration](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Local and remote caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Filtering workspaces](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)

## Contributing

1. Ensure your code passes all tests
2. Follow the established code style and formatting
3. Run type checking before pushing changes
