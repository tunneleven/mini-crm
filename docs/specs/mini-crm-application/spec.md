# Spec: Mini CRM Application

## Requirement: Workspace Authentication

Users can authenticate into a workspace and only access workspace-scoped data.

Priority: MUST
Operation: ADDED

### Scenario: Sign in to a workspace

- GIVEN a valid user account
- WHEN the user signs in
- THEN the user is taken into the CRM application with only their workspace data visible

### Scenario: Cross-workspace access is blocked

- GIVEN a signed-in user
- WHEN the user attempts to access data from another workspace
- THEN the request is rejected

## Requirement: Contact Management

Users can create, edit, archive, view, and search contacts.

Priority: MUST
Operation: ADDED

### Scenario: Create a contact

- GIVEN a signed-in user on the contacts screen
- WHEN the user enters a contact name and at least one identifier such as email or phone
- THEN the contact is created and visible in the contact list

### Scenario: Archive a contact

- GIVEN an existing contact
- WHEN the user archives the contact
- THEN the contact is hidden from default active views but retained in history

## Requirement: Company Management

Users can create, edit, archive, view, and search companies.

Priority: MUST
Operation: ADDED

### Scenario: Create a company

- GIVEN a signed-in user on the companies screen
- WHEN the user enters a company name and saves
- THEN the company is created and visible in the company list

## Requirement: Deal Management

Users can create, edit, archive, view, and search deals.

Priority: MUST
Operation: ADDED

### Scenario: Create a deal

- GIVEN a signed-in user on the deals screen
- WHEN the user enters a deal title, associates a company or contact, and saves
- THEN the deal is created in the current pipeline

### Scenario: Advance a deal stage

- GIVEN an existing deal in a pipeline stage
- WHEN the user moves the deal to another stage
- THEN the deal stage updates and the activity timeline records the change

## Requirement: Pipeline Management

Users can manage one default sales pipeline with customizable stages.

Priority: MUST
Operation: ADDED

### Scenario: Configure stages

- GIVEN an admin user
- WHEN the admin creates or renames stages in the pipeline
- THEN new and existing deals can use those stages

## Requirement: Notes, Tasks, and Activities

Users can attach notes, tasks, and activities to contacts, companies, and deals.

Priority: MUST
Operation: ADDED

### Scenario: Add a task to a deal

- GIVEN an existing deal
- WHEN the user creates a task with a due date
- THEN the task is visible on the deal record and in task views

### Scenario: Add a note to a contact

- GIVEN an existing contact
- WHEN the user adds a note
- THEN the note appears in the contact timeline

## Requirement: Unified Activity Timeline

Users can view record history through a single activity timeline.

Priority: MUST
Operation: ADDED

### Scenario: View record history

- GIVEN an existing contact, company, or deal
- WHEN the user opens the detail page
- THEN the user sees related tasks, notes, activities, and stage changes in chronological order

## Requirement: Search

Users can search contacts, companies, and deals from one search workflow.

Priority: MUST
Operation: ADDED

### Scenario: Search by person or company name

- GIVEN CRM data exists
- WHEN the user enters a query
- THEN matching contacts, companies, and deals are returned

### Scenario: Search by email

- GIVEN a contact exists with an email address
- WHEN the user searches using that email
- THEN the contact is returned in results

## Requirement: CSV Import and Export

Users can import and export contacts, companies, and deals through CSV.

Priority: MUST
Operation: ADDED

### Scenario: Import valid CSV data

- GIVEN a valid CSV file
- WHEN the user uploads it through the import workflow
- THEN records are created or matched according to import rules

### Scenario: Import with row errors

- GIVEN a CSV file containing invalid rows
- WHEN the user runs the import
- THEN valid rows are processed and invalid rows are reported back clearly

## Requirement: Basic Dashboard Metrics

Users can view lightweight operational metrics.

Priority: SHOULD
Operation: ADDED

### Scenario: View dashboard summaries

- GIVEN active CRM data exists
- WHEN the user opens the dashboard
- THEN the user sees open deals, deals by stage, overdue tasks, and recent activity summaries

## Requirement: Ownership

Users can assign owners to contacts, companies, deals, and tasks.

Priority: MUST
Operation: ADDED

### Scenario: Assign a deal owner

- GIVEN an existing deal
- WHEN the user assigns an owner
- THEN the owner is saved and visible in the deal view

## Requirement: Lightweight Automation

The system can trigger simple reminders and stage-change logging.

Priority: SHOULD
Operation: ADDED

### Scenario: Reminder for overdue task

- GIVEN a task is overdue
- WHEN the reminder job runs
- THEN the task appears as overdue in the system and is visible to the assignee

### Scenario: Stage change creates activity

- GIVEN a deal changes stage
- WHEN the change is saved
- THEN an activity entry is created automatically
