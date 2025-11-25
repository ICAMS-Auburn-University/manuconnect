# Project Layout

This document explains how the repository is organized so future coding agents know where to place new files and how to keep features consistent with the existing structure.

## Top-Level Directories

- `src/app/` – Next.js App Router entry points, layouts, and route handlers. Anything that defines a page, server action, or API route lives here.
- `src/components/` – Reusable React building blocks split by feature area (forms, dashboard widgets, chat UI, etc.) plus the foundational shadcn UI primitives under `components/ui`.
- `src/domain/` – Business-logic modules grouped by bounded context (auth, orders, manufacturing, etc.). Each domain usually exposes a `service.ts` for orchestration, `types.ts` for domain-specific structures, and sometimes validation helpers.
- `src/hooks/` – React hooks that encapsulate client-side state or cross-cutting behavior for a domain (e.g., CAD upload workflow, realtime chat state).
- `src/lib/` – Shared utilities and infrastructure code (configuration readers, Supabase data-access helpers, generic API callers, logging helpers, etc.). Think of this as platform-level glue.
- `src/providers/` – Top-level React providers (currently theme context) that wrap the App Router layouts.
- `src/services/` – Thin client-side service helpers that talk to external systems (CAD split service, Supabase admin API, file storage helpers). Use these for imperative API calls that don’t belong directly in `lib/` or a React hook.
- `src/types/` – Global TypeScript declarations, enums, schema mirrors of database tables, and other source-of-truth typing aids shared by multiple domains.
- `public/` – Static assets served directly by Next.js (logos, fonts, etc.).
- Config files (`tailwind.config.ts`, `tsconfig.json`, `.eslintrc.json`, etc.) – Build/tooling configuration. Add new tooling configs here rather than under `src/`.

## `app/` Detailed Structure

- `app/layout.tsx` and `app/global.css` define the root document shell and global styles. Update when changing site-wide chrome.
- `app/(auth)/` – Auth-focused routes (sign-in, sign-up, onboarding, password reset). Shared layout lives at `app/(auth)/layout.tsx`. New auth flows should create a folder within this segment.
  - Each folder inside, such as `sign-in` or `confirmAuth`, contains a `page.tsx` plus any local server actions/components.
- `app/(dashboard)/` – Authenticated dashboard experience. `app/(dashboard)/layout.tsx` provides shell/nav; child folders like `orders`, `messages`, and `about` hold their respective `page.tsx` plus nested routes.
- `app/api/` – Next.js Route Handlers backing `/api/*`. Subfolders (assemblies, auth, chats, orders, projects) each export HTTP methods (`route.ts`) or supporting modules. Place new serverless endpoints here.
- `app/_internal/` – Server-only helpers imported by other `app/` modules. For example:
  - `_internal/auth/getSession.ts` centralizes session lookup.
  - `_internal/supabase/*.ts` wraps creation of Supabase clients for browser, middleware, and server contexts.
- `app/not-found.tsx` – 404 boundary.

## `components/`

Component directories are organized by feature verticals to keep complex flows isolated:

- `components/cad/` – CAD visualization helpers (e.g., `CadSplitViewer`). Use for Three.js/fiber-driven CAD experiences.
- `components/chats/` – Chat UI atoms/molecules, including composers and realtime viewers.
- `components/dashboard/` – Cards and widgets displayed on the dashboard landing page.
- `components/emails/` – React Email templates for transactional emails.
- `components/feedback/` – Progress indicators and archive buttons shared between manufacturer/customer flows.
- `components/forms/` – All form-driven flows. Subdirectories like `forms/order` contain multi-step wizard steps, schema, and helper components for specific forms. Top-level form components (signin/signup, split CAD form, etc.) sit directly under `forms/`.
- `components/layout/` – Global layout pieces (Navbar, Footer, MobileMenu) used by App Router layouts.
- `components/media/` – Media viewers (e.g., 3D model viewer).
- `components/onboarding/` – Creator/manufacturer onboarding-specific components and agreements UI.
- `components/ui/` – Primitive UI components (accordion, button, dialog, form wrappers, etc.). Follow shadcn conventions for adding new primitives here.

When introducing a new reusable UI element, place it in the feature-specific directory if it’s tightly coupled (e.g., `components/orders/...`). If it’s generic, add it under `components/ui` or create a new feature folder mirroring existing naming.

## `domain/`

Encapsulates business logic per bounded context:

- `domain/auth/` – Auth-specific service helpers (server actions hitting Supabase) plus types (e.g., credentials payloads) and zod schemas.
- `domain/cad/` – CAD domain helpers such as tree-building utilities and data types describing split jobs.
- `domain/chats/` – Chat orchestration logic, errors, and types used by both UI and API handlers.
- `domain/events/`, `domain/offers/`, `domain/orders/`, `domain/users/`, `domain/manufacturing/` – Each mirrors the pattern: `service.ts` wraps Supabase/lib calls behind `requireAuth` and domain-specific workflows; `types.ts` exports strongly typed DTOs used by components, services, and API routes. Add validation/helper modules here when behavior is core business logic.

When adding new business capabilities, define the core types and orchestration in the appropriate domain folder, then have UI/hooks/services consume those exports.

## `hooks/`

Holds reusable React hooks grouped by domain:

- `hooks/cad/` – Client hooks for CAD workflows, such as `useSplitAssembly` which wraps the CAD split service.
- `hooks/chats/` – Chat-specific hooks (uploader, infinite scroll, realtime subscription, chat list management).

New hooks should live in a subdirectory matching their domain (create a new folder if needed) and avoid direct Supabase access; instead call into `domain/*` or `services/*`.

## `lib/`

Shared infrastructure helpers:

- `lib/api/` – Client-side fetch helpers hitting internal API routes (`/api/chats`, etc.). Use for browser-side fetches instead of duplicating `fetch` logic in components.
- `lib/config/` – Configuration accessors (CAD endpoint constants, environment variable parsing). Add new config modules here rather than sprinkling `process.env` reads elsewhere.
- `lib/storage/` – File storage utilities (e.g., path builders for uploads).
- `lib/supabase/` – Service-role Supabase clients and CRUD helpers for each table (manufacturing, orders, users, etc.). These files should remain data-access only: no UI or domain-specific orchestration.
- `lib/utils/` – Generic helpers (error normalization, transforms, common utility exports). Use `lib/utils/index.ts` as the aggregator.
- `lib/constants.ts`, `lib/logger.ts`, `lib/specifications.ts` – Misc shared helpers/constants that don’t fit other buckets.

## `providers/`

React providers applied at the top level (currently `ThemeProvider`). Add new context providers that must wrap the entire app here and import them in `app/layout.tsx`.

## `services/`

Thin wrappers around external services:

- `services/cad/` – Direct integration with CAD microservice (`splitAssembly.ts`).
- `services/integrations/` – Third-party integrations like Supabase admin helpers.
- `services/storage/` – Browser-side file upload utilities.

When you need to call an external API (REST, SDK) from the client or server, add a focused module here and have domain/services/hooks depend on it.

## `types/`

Global TypeScript definitions shared across the app:

- `.d.ts` – Ambient declarations (e.g., module overrides).
- `enums.ts`, `tags.ts` – Enumerations and tag definitions used for filtering or metadata.
- `schemas.ts` – Type mirrors for database tables (AssembliesSchema, OrdersSchema, etc.). These back both domain types and Supabase helpers.
- `shared.ts` – Cross-domain shared interfaces (addresses, etc.).
- `manufacturing_specifications_complete.json` – Static data reference for manufacturing specs (used by specification wizards).

If a type is domain-specific, put it in that domain’s `types.ts`. Only place types here when they are referenced by multiple domains or infrastructure layers.

## Other Notable Files

- `middleware.ts` – Next.js middleware for auth routing rules.
- `providers/ThemeProvider.tsx` – Included above, but note it is consumed by `app/layout.tsx`.
- Tooling configs (Tailwind, ESLint, Prettier, TSConfig) define project standards; extend them if new tooling is introduced.

## Adding New Code

1. Decide the domain (`src/domain/*`) responsible for the new business behavior and add/update `service.ts` or new helper modules there.
2. Expose any new API endpoints under `app/api/*` and consume the domain/service modules.
3. Create UI under `src/components/*` or pages under `src/app/...`, pulling hooks from `src/hooks` and services from `src/services` as needed.
4. Define or extend types in `src/domain/**/types.ts` or `src/types/` depending on scope.
5. Share utilities or infrastructure concerns via `src/lib/` rather than duplicating logic in components.

Following this layout keeps features modular, enforces clear boundaries between UI, domain logic, and infrastructure, and makes it easy for future contributors to navigate the project.
