# Tech Stack: Mini CRM Application

## Frontend

- Next.js
- React
- TypeScript

Rationale:

- Good fit for fast MVP development and responsive web UI.
- Strong ecosystem for forms, tables, dashboards, and authenticated app patterns.
- Supports future SEO or marketing pages if the project grows beyond the app shell.

## Backend

- Next.js Route Handlers or a Node.js API layer
- TypeScript

Rationale:

- Keeps the MVP operationally simple.
- Supports an API-first architecture without introducing unnecessary service boundaries too early.

## Database

- PostgreSQL

Rationale:

- Strong relational fit for CRM records and associations.
- Good support for constraints, joins, audit-friendly models, and full-text search in the MVP.

## Search

- PostgreSQL full-text search

Rationale:

- Good enough for initial CRM record search.
- Avoids premature infrastructure complexity.

## Background Jobs

- Lightweight job worker or queue-backed async task runner

Use cases:

- CSV imports
- Reminder processing
- Webhook delivery
- Future sync jobs

## Authentication

- Workspace-scoped auth
- Roles: admin, member

Rationale:

- Supports multi-user teams without early enterprise complexity.

## Infrastructure

- Single web deployment plus managed PostgreSQL

Rationale:

- Best trade-off for MVP speed and reliability.

## Testing

- Unit tests for domain logic
- Integration tests for API and database flows
- Coverage target: 80%

## Lock-in Notes

- Next.js is an acceptable application-layer dependency for the MVP.
- PostgreSQL keeps the core data model portable.
- Avoid proprietary workflow logic that cannot be moved later.
