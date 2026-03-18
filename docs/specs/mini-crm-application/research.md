# Research: Mini CRM Application

Date: 2026-03-18
Mode: research
Feature: Mini CRM Application

## Executive Summary

The SMB CRM market is crowded, but current products still cluster around the same tradeoff: powerful but heavy platforms, or lightweight CRMs that become expensive or rigid once a team needs automation, integrations, and custom objects. For a mini CRM, the viable opening is not "another general CRM." The opening is a fast, opinionated CRM for small teams that need core sales workflow, clean data, and simple automation without the operational weight of Salesforce or the pricing expansion pattern of HubSpot.

The recommended product shape is:

- Focus on contacts, companies, deals, activities, notes, tasks, pipeline stages, reminders, search, import/export, and basic reporting.
- Use an object-plus-association data model so the product can grow toward custom objects and richer relationship graphs later.
- Treat AI as assistive, not central, in v1: summaries, dedupe suggestions, activity drafting, and next-step suggestions.
- Defer marketing automation, ticketing, deep forecasting, and broad ecosystem replication.

The strongest strategic risk is commodity positioning. The strongest strategic answer is to optimize for one or two sharp promises: faster setup than HubSpot or Salesforce, better data hygiene than spreadsheet-driven teams, and a cleaner workflow than feature-dense incumbents.

## Research Question

What should a 2026 mini CRM application include to be competitive for small teams, and what technical architecture should it adopt so the MVP is simple now but extensible later?

## Layer 1: Market Research

### Current market anchors

- HubSpot continues to anchor the "free CRM plus paid expansion" pattern. Its free CRM is positioned for startups and small businesses, includes core contact and deal management, and advertises AI-assisted workflows and broad integrations. Source: https://www.hubspot.com/products/crm
- Salesforce still spans from a free tier to a small-business starter suite. The Starter Suite is priced at $25/user/month and bundles multiple customer-facing functions, which highlights how quickly general-purpose CRM positioning expands in scope. Source: https://www.salesforce.com/small-business/starter/
- Zoho remains aggressive on entry pricing and free-user availability, reinforcing that SMB buyers expect a low-cost starting point. Source: https://www.zoho.com/crm/zohocrm-pricing.html
- Pipedrive remains strong in sales-led SMB workflow with pricing and packaging centered on pipeline management, email sync, automation, and AI-assisted reporting. Source: https://www.pipedrive.com/en/pricing
- Attio represents the modern "flexible CRM/data workspace" direction, with custom objects, API/webhooks, enrichment, and AI-oriented capabilities visible in the product surface. Source: https://attio.com/pricing

### What the market says about buyer expectations

Across these products, baseline expectations for a modern SMB CRM in 2026 are:

- Contact, company, and deal tracking are table stakes.
- Activity timeline, tasks, reminders, and notes are expected.
- Import and export from spreadsheets are mandatory.
- Email and calendar sync become highly valuable once a team moves beyond a toy CRM.
- Basic automation is expected earlier than before.
- AI is now a visible packaging element, but mostly as an assistant layer rather than the system of record itself.

Inference from pricing and packaging: a mini CRM that omits core workflow automation, integrations, and mobile-friendly operation will feel behind the market even if the UI is clean.

### Competitive gaps a mini CRM can realistically attack

1. Setup speed and simplicity.
2. Clean, opinionated default workflow.
3. Better data hygiene and duplicate resistance.
4. Transparent pricing and intentionally limited scope.

### Contrarian view

The main contrarian risk is that "mini CRM" may not be enough of a wedge. If the product is only a simpler clone of contacts, deals, and tasks, incumbents already satisfy that need at low or zero entry cost. A defensible version likely needs one of:

- vertical specialization,
- superior collaboration UX,
- better CRM data quality and dedupe,
- or a clearer operational advantage such as fast setup, local deployment, or integration-first architecture.

## Layer 2: Technical Research

### Object model patterns used by leading CRMs

HubSpot and Attio both reinforce the importance of an object-centric core with explicit relationships:

- HubSpot models core CRM entities such as contacts, companies, and deals as objects, with associations between them and related activities. Sources:
  - https://developers.hubspot.com/docs/reference/api/crm/objects/contacts
  - https://developers.hubspot.com/docs/guides/api/crm/associations/associations-v4
- Attio exposes records under objects and supports assert-style upsert flows, which is useful for dedupe-safe syncing. Sources:
  - https://docs.attio.com/rest-api/endpoint-reference/records/create-a-record
  - https://docs.attio.com/rest-api/endpoint-reference/companies/assert-a-company-record
  - https://docs.attio.com/docs/slugs-and-ids

Design implication:

- The mini CRM should not hardcode only contacts, companies, and deals in a way that blocks future extensibility.
- For the MVP, expose fixed first-class entities, but implement storage so relationships are explicit and extensible.

### Recommended MVP domain model

Core entities:

- Workspace
- User
- Contact
- Company
- Deal
- Pipeline
- Pipeline Stage
- Activity
- Task
- Note
- Tag

Core relationships:

- Contact belongs to or is associated with one or more companies.
- Deal belongs to one pipeline and one stage.
- Deal can link to one primary company and multiple contacts.
- Activities, notes, and tasks attach polymorphically to contacts, companies, and deals.
- User ownership exists on contacts, companies, deals, and tasks.

### API and integration implications

The strongest technical pattern from modern CRM APIs is stable object endpoints plus associations and idempotent upsert behavior.

Recommended API shape:

- `POST /contacts`
- `POST /companies`
- `POST /deals`
- `POST /activities`
- `POST /tasks`
- `PUT /contacts/assert`
- `PUT /companies/assert`
- `GET /search`
- `POST /imports/csv`
- `POST /webhooks/outbound`

Why this matters:

- Upsert/assert endpoints reduce duplicate creation during imports and sync.
- Association-first design makes email, calendar, and later billing/support integrations easier.
- Search should span contacts, companies, and deals from the start because CRM value collapses when retrieval is slow.

### Integration priorities

Do first:

- CSV import/export
- Gmail/Google Calendar or Outlook/Microsoft 365 sync later in the MVP roadmap
- Webhook outbound events
- Public REST API for core records

Do later:

- Native phone dialer
- Marketing campaign automation
- Quote/invoice generation
- Marketplace ecosystem

### AI implications

AI is clearly now part of CRM positioning:

- HubSpot markets AI across summaries, assistance, content, and workflow help. Source: https://www.hubspot.com/products/crm
- Salesforce packages AI and automation directly into its SMB and higher-end CRM tiers. Source: https://www.salesforce.com/small-business/starter/
- Attio includes AI-facing packaging such as call intelligence and AI agents in higher plans. Source: https://attio.com/pricing

Recommendation:

- Build an event-rich architecture now, not a heavy AI feature set now.
- Capture structured timeline events, ownership changes, stage changes, notes, and communication metadata.
- Use that later for summarization, next-best-action prompts, dedupe suggestions, and health scoring.

### Suggested architecture

Recommended stack for a mini CRM MVP:

- Frontend: web app with mobile-responsive interface
- Backend: API-first service
- Database: PostgreSQL
- Search: PostgreSQL full-text search first
- Jobs: background worker for imports, syncs, reminders, and webhook delivery
- Auth: email/password plus OAuth login later
- Permissions: workspace-scoped RBAC with at least admin and member roles

Recommended architectural patterns:

- Relational core with explicit foreign keys and join tables
- Append-only activity/event log for timeline reconstruction
- Outbox pattern for webhook delivery
- Idempotency keys for imports and external sync
- Optimistic UI with authoritative server-side validation

## Product Recommendations

### Recommended MVP scope

Include in v1:

- Contacts, companies, deals
- Single default pipeline with customizable stages
- Notes, tasks, reminders, activities
- Unified timeline
- Search
- Owner assignment
- CSV import/export
- Basic dashboard metrics
- Simple automations such as task reminders and stage-change triggers

Defer from v1:

- Marketing automation
- Ticketing/service desk
- Quote-to-cash
- Advanced forecasting
- Full custom-object builder
- Marketplace and third-party app ecosystem

### Positioning recommendation

Best-positioned narrative:

"A fast, opinionated CRM for small teams graduating from spreadsheets."

## Quality Gate

Research confidence: medium-high.

What is well-supported:

- Current pricing and packaging expectations in the SMB CRM market
- Common object model patterns in modern CRM APIs
- The importance of associations, imports, sync, and light automation

What remains uncertain without narrowing the target segment:

- Whether this product should stay horizontal or target a vertical
- Whether deployment should be SaaS-only or also self-hosted
- How much email/calendar sync is required in the first release
- Whether the project wants a productized SaaS roadmap or a hackathon-focused MVP only

## Recommended Next Step

Proceed to spec generation with these defaults unless the niche is narrowed first:

- target user: small B2B team moving off spreadsheets
- product scope: lightweight sales CRM, not full-suite CRM
- architecture: Postgres-backed multi-tenant web app with API-first backend
- differentiation: speed, usability, clean data model, simple automation
