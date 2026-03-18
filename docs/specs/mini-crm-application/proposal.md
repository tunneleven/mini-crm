# Proposal: Mini CRM Application

## Why

Small B2B teams often run their sales workflow across spreadsheets, inboxes, and scattered notes. That creates duplicate contact data, missed follow-ups, weak pipeline visibility, and poor ownership clarity. Existing CRMs solve these problems, but many either become operationally heavy too early or expand in scope and pricing faster than small teams want.

The case for building this product is to ship a focused CRM that covers the minimum useful sales workflow without the weight of a full-suite platform. The goal is not to compete on breadth with Salesforce, HubSpot, or Zoho. The goal is to compete on setup speed, workflow clarity, and data hygiene for small teams leaving spreadsheets.

## What Changes

This feature introduces a lightweight, opinionated CRM application centered on core sales record management and follow-up execution. It adds structured records for contacts, companies, and deals; a single-pipeline sales workflow; record timelines; tasks; notes; search; and CSV-based data migration.

## Capabilities (New)

### 1. Core CRM records

Users can create, view, edit, archive, and manage contacts, companies, and deals inside a workspace.

### 2. Pipeline management

Users can move deals through a single default pipeline with customizable stages and ownership.

### 3. Follow-up execution

Users can create tasks, notes, and activities on records so the CRM captures the actual next-step workflow rather than only storing static data.

### 4. Unified search and timeline

Users can search CRM records quickly and understand record history through an activity timeline.

### 5. Spreadsheet migration and portability

Users can import and export CRM data through CSV to reduce migration friction and avoid lock-in.

### 6. Basic operational visibility

Users can see lightweight dashboards such as open deals, deals by stage, overdue tasks, and recent activity.

## Scope

### In Scope

- Authentication and workspace setup
- Contacts CRUD
- Companies CRUD
- Deals CRUD
- Pipeline and stage management
- Notes, tasks, and activities
- Record ownership
- Unified activity timeline
- Search across contacts, companies, and deals
- CSV import/export
- Basic dashboard metrics
- Simple automation for reminders and stage-change logging

### Out of Scope

- Marketing automation
- Service desk/ticketing
- Quote and invoice workflows
- Advanced forecasting
- Marketplace integrations
- Full custom-object builder

## Success Criteria

- A new team can import CSV data and start using the CRM in under 30 minutes.
- A user can create a contact, company, and deal and advance the deal through the pipeline without leaving the app.
- Search returns relevant contacts, companies, and deals in a single workflow.
- Overdue tasks and open deal status are visible without manual spreadsheet reconciliation.
- The MVP runs reliably for a small multi-user workspace with clean record ownership and history.

## Impact

This positions the product against the low-complexity end of HubSpot, Zoho, Pipedrive, and Attio. The intended advantage is not module breadth. The intended advantage is a smaller, faster, more opinionated sales workflow with less setup overhead and cleaner defaults for teams that do not want a full CRM platform.
