# AGENTS.md

This document provides guidelines for coding agents working in the Vir Tome repository, a monorepo with NestJS API and Next.js client using pnpm workspaces.

## Build/Lint/Test Commands

### Root Workspace Commands
- `pnpm dev`: Run development servers for all apps
- `pnpm test`: Run all tests
- `pnpm build`: Build all apps and packages
- `pnpm lint:check`: Check code formatting and linting with Biome
- `pnpm lint:fix`: Fix code formatting and linting issues with Biome
- `pnpm ts:check`: Type check across the workspace

### API-Specific Commands (apps/api/)
- `pnpm --filter=api build`: Build the API
- `pnpm --filter=api dev`: Run API in development mode with watch
- `pnpm --filter=api lint`: Lint API code with ESLint
- `pnpm --filter=api ts:check`: Type check API
- `pnpm --filter=api test`: Run API tests with Jest
- `pnpm --filter=api test -- src/path/to/file.spec.ts`: Run single test file
- `pnpm --filter=api migration:generate -- -n MigrationName`: Generate TypeORM migration
- `pnpm --filter=api migration:run`: Run pending migrations
- `pnpm --filter=api migration:revert`: Revert last migration

### Client-Specific Commands (apps/client/)
- `pnpm --filter=client dev`: Run client in development mode
- `pnpm --filter=client build`: Build client for production
- `pnpm --filter=client lint`: Lint client code with Next.js ESLint

### Single Test Execution
- API: `pnpm --filter=api test -- --testPathPattern=file.spec.ts`
- Root: `pnpm test -- --testPathPattern=file.spec.ts`

### Type Checking Commands
- Root: `pnpm ts:check`
- API: `pnpm --filter=api ts:check`
- Client: Implicit in build/lint commands

## Code Style Guidelines

### Formatting
- Use Biome for formatting and linting
- Indent with tabs (indentWidth: 1)
- Single quotes for strings
- Line width: 80 characters
- Organize imports automatically

### TypeScript
- Frontend (client): Strict mode enabled, full type checking
- Backend (API): Relaxed settings (noImplicitAny: false, strictBindCallApply: false)
- Use path aliases: `@/` for local imports, `@repo/*` for workspace packages
- Prefer explicit types over implicit inference

### Imports
- Group imports: external libraries, then workspace packages (@repo/*), then local (@/)
- Use absolute imports with aliases
- No relative imports beyond parent directory

### Naming Conventions
- Variables/functions: camelCase
- Classes/Components: PascalCase
- Files/Directories: kebab-case
- Database tables: snake_case (via TypeORM)
- Constants: UPPER_SNAKE_CASE

### Error Handling
- Use try/catch blocks for async operations
- Throw custom exceptions in NestJS (HttpException, BadRequestException)
- Log errors appropriately in services
- Handle validation errors in controllers with ValidationPipe

### Architecture Patterns
- **Backend**: Follow NestJS conventions - Controllers handle HTTP, Services contain business logic
- **Frontend**: React functional components with hooks, server/client components in Next.js
- Use DTOs for API communication (@repo/common package)
- Separate concerns: entities, modules, controllers, services

### File Structure
- `apps/api/src/`: Controllers, services, entities, modules
- `apps/client/src/`: Components, pages, hooks, utilities
- `packages/common/`: Shared DTOs, types, enums
- `packages/ui/`: Reusable UI components
- `packages/hooks/`: Custom React hooks
- Test files: `*.spec.ts` alongside source files

## Testing Guidelines

### Jest Configuration
- Preset: ts-jest
- Test environment: node
- Test files: `*.spec.ts` in src directories
- Coverage thresholds: 90% branches, functions, lines, statements
- Module mapper: `@/` -> `<rootDir>/`

### Integration Testing
- Use testcontainers for database integration tests (@testcontainers/postgresql)
- Test timeout: 60000ms for integration tests
- Setup files: `jest.setup.ts` for global configurations
- Mock external services and databases appropriately

### Test File Naming and Location
- Files: `component.spec.ts`, `service.spec.ts`, etc.
- Location: Same directory as source file
- Naming: Describe behavior, e.g., `user.service.create.spec.ts`

## Additional Guidelines

### Commit Message Conventions
- Follow conventional commits: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Header max length: 72 characters
- Body/footer max length: 100 characters per line
- Use imperative mood: "Add feature" not "Added feature"

### Package Manager
- Use pnpm for dependency management
- Workspaces: packages/* and apps/*
- Lockfile: pnpm-lock.yaml
- Install: `pnpm install`

### Database Operations
- TypeORM for ORM
- Migrations: Generated with `migration:generate`, run with `migration:run`
- Seeds: Use scripts in `src/database/seeds/`
- Multi-tenant: Separate databases/schemas per tenant
- Backup before migrations: Use `migration:backup` script