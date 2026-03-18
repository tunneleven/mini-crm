# Design: Mini CRM Application

## Context

The product is a lightweight CRM for small teams moving off spreadsheets. The system should optimize for fast setup, clear workflow defaults, clean data, and a usable daily sales workflow without broad platform complexity.

## Goals

- Ship a focused CRM MVP quickly
- Support contacts, companies, deals, and follow-up execution
- Keep the architecture simple but extensible
- Preserve clean data relationships and audit-friendly history

## Non-Goals

- Full-suite CRM coverage
- Marketing automation
- Ticketing or service workflows
- Advanced forecasting
- Marketplace-scale integrations

## Architecture Overview

The MVP uses a single web application with an API-first backend and PostgreSQL. The frontend renders authenticated application views for dashboard, list pages, detail pages, and pipeline board interactions. The backend owns validation, persistence, authorization, import processing, and timeline creation. A lightweight background job layer handles imports, reminders, and outbound webhooks.

## Components

### Auth and Workspace

Purpose:

- authenticate users
- enforce workspace boundaries
- manage roles

### CRM Records

Purpose:

- manage contacts
- manage companies
- manage deals
- manage owners and archive state

### Pipeline

Purpose:

- define pipeline stages
- move deals across stages
- record stage transitions

### Timeline and Activity

Purpose:

- aggregate notes, tasks, activities, and stage changes into a single history

### Import/Export

Purpose:

- support CSV migration
- validate input rows
- create or match existing records

### Dashboard and Search

Purpose:

- expose operational visibility
- allow fast retrieval of CRM data

## Data Model

Primary entities:

- Workspace
- User
- Contact
- Company
- Deal
- Pipeline
- PipelineStage
- Task
- Note
- Activity

Key relationships:

- A workspace has many users, contacts, companies, deals, tasks, notes, and activities.
- Contacts may relate to multiple companies.
- Deals belong to one pipeline stage and may relate to companies and contacts.
- Notes, tasks, and activities attach to one target record type and one target record id.
- Owners are users linked to business records.

Constraints:

- workspace scoping on all business records
- normalized email uniqueness within a workspace when available
- soft delete or archive fields instead of hard delete for user-facing records

## API Design

Representative endpoints:

- `POST /api/contacts`
- `GET /api/contacts`
- `PATCH /api/contacts/:id`
- `POST /api/companies`
- `POST /api/deals`
- `PATCH /api/deals/:id/stage`
- `POST /api/tasks`
- `POST /api/notes`
- `GET /api/search?q=...`
- `POST /api/imports/csv`
- `GET /api/exports/csv`

## Error Handling

- Reject cross-workspace access
- Report CSV row-level validation errors clearly
- Prevent invalid stage transitions
- Preserve partial import results when some rows fail
- Return meaningful validation messages for missing required fields

## Decisions

### Decision: PostgreSQL as primary store

Why:

- Strong fit for relational CRM data and associations
- Good enough search for MVP
- Avoids operational complexity early

Alternative considered:

- Separate search engine from day one

Why not chosen:

- Too much complexity for MVP

### Decision: Single app deployment

Why:

- Faster to ship and easier to operate

Alternative considered:

- Split frontend and backend services early

Why not chosen:

- Not justified by MVP scope

## Risks and Trade-offs

- Commodity risk if product positioning stays too general
- Scope creep risk if marketing or support workflows enter v1
- Data quality risk if imports and dedupe rules are weak
- UX risk if search or timeline are slow
- Future extensibility risk if associations are hardcoded too narrowly

## Testing Strategy

- Unit tests for domain rules, validation, stage transitions, and import mapping
- Integration tests for API + database flows
- End-to-end tests for sign-in, contact creation, deal creation, stage movement, and CSV import happy path
- Regression tests for search and timeline behavior
