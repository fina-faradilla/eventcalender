# MASTER CODEX PROMPT
# TECHNOLIFE EVENT RESERVATION & MANAGEMENT SYSTEM

You are the Lead Full-Stack Developer, Software Architect, UI/UX Engineer, Database Engineer, Security Engineer, and QA Engineer for this project.

Your job is to BUILD the COMPLETE WORKING MVP of the Technolife Event Reservation & Management System inside the current VS Code project.

IMPORTANT:
- Do not only make a plan or documentation.
- Do not stop after one phase.
- Do not wait for confirmation between phases.
- Inspect the existing project first.
- Preserve useful existing code.
- Fix existing problems when necessary.
- Continue from PHASE 01 through PHASE 16 until the MVP is functional and tested.
- If a reasonable MVP assumption can be made, make it and document it instead of stopping unnecessarily.
- Do not add unrelated features.

---

# 01. PROJECT GOAL

Build an internal company web application for Technolife to manage events from:

PIC creates event
→ save draft
→ submit for approval
→ Approver reviews
→ Approve / Reject
→ approved event becomes scheduled
→ event appears in calendar
→ reminders and notifications
→ event progresses through its lifecycle.

The application must be suitable for an internship presentation/demo and structured so it can later be expanded into a production system.

---

# 02. TECHNOLOGY STACK

Use the existing project stack when it is already correctly configured.

Target stack:

- Frontend: React
- Styling: Tailwind CSS
- Backend: Laravel 13
- Database: MySQL
- Build tool: Vite
- Architecture: React → Laravel API → MySQL

Before installing anything, inspect:
- package.json
- composer.json
- existing Laravel version
- existing React/Vite/Tailwind setup
- routes
- controllers
- models
- migrations
- middleware
- authentication
- .env
- database configuration
- existing dependencies

Do not recreate or delete an existing working project unnecessarily.

---

# 03. DESIGN / COLOR PALETTE

The user will provide a Technolife color palette/design reference.

Treat the provided palette as the SOURCE OF TRUTH for the UI.

Use ONLY the provided visual direction for the application.

Apply it consistently to:
- Login
- Sidebar
- Navbar
- Dashboard
- Buttons
- Forms
- Cards
- Tables
- Badges
- Calendar
- Notifications
- Modals
- Alerts
- Empty states
- Loading states
- Error states

Do not introduce unrelated brand colors.

Design direction:
- modern
- clean
- professional
- corporate
- minimal
- organized
- responsive
- easy to use

Avoid:
- excessive gradients
- neon effects
- excessive glassmorphism
- excessive animation
- clutter
- unnecessary decorative elements

Use consistent spacing, typography, borders, cards, buttons, and status indicators.

---

# 04. RESPONSIVE DESIGN

Every page must work on:
- Desktop
- Laptop
- Tablet
- Mobile

Pay special attention to:
- sidebar
- navbar
- tables
- forms
- dashboard cards
- calendar
- modal
- notification panel
- dropdowns

Do not build desktop-only pages.

---

# 05. USER ROLES

There are 3 main roles:

1. PIC
2. APPROVER / ATASAN
3. ADMIN

Authorization MUST exist on the backend.

Frontend route protection is not sufficient by itself.

---

# 06. PIC PERMISSIONS

PIC can:
- Login
- Logout
- View Dashboard
- View Calendar
- View My Events
- Create Event
- Save Draft
- Edit Draft
- Submit Event
- View Event Detail
- View Event Status
- View Assigned Staff
- View Rejection Reason
- Resubmit Rejected Event
- View Notifications

PIC cannot:
- Approve
- Reject
- Manage users
- Manage venues
- Manage staff unless explicitly authorized

---

# 07. APPROVER PERMISSIONS

Approver can:
- Login
- Logout
- View Dashboard
- View Pending Approval
- View Event Detail
- View PIC
- View Date
- View Time
- View Venue
- View Staff
- Approve Event
- Reject Event
- Provide Rejection Reason
- View Calendar

Approver cannot access unauthorized admin functions.

---

# 08. ADMIN PERMISSIONS

Admin can:
- Login
- Logout
- View Dashboard
- Manage Users
- Manage PIC
- Manage Staff
- Manage Venue
- View All Events
- View Calendar
- View Notifications
- View Simple Reports

Do not automatically create an approval override for Admin.

---

# 09. EVENT DATA

Event must support:

- id
- created_by
- event_name
- event_type
- event_date
- start_time
- end_time
- venue_id
- custom_venue
- staff_required
- description
- notes
- status
- created_at
- updated_at

Assigned staff must be modeled as a relationship/table, not as a substitute for staff_required.

---

# 10. EVENT TYPES

Provide:
- Meeting
- Training
- Seminar
- Workshop
- Exhibition
- Gathering
- Internal Event
- External Event
- Other

If Other is selected:
- show Custom Event Type
- require it before submission

---

# 11. VENUES

Initial venues:
- Ballroom
- Training Center
- Plaza Exhibition
- Resto
- Other

If Other is selected:
- show Custom Venue
- require it before submission

---

# 12. STAFF

Keep these concepts separate:

Staff Required
and
Assigned Staff

Example:
Staff Required = 8
Assigned Staff = 5

Display:
5 / 8 Staff Assigned

If 8 / 8:
Staff Requirement Fulfilled

If 5 / 8:
Staff Assignment Incomplete

Use a proper event_staff relationship/table.

---

# 13. EVENT STATUS

Use centralized status definitions:

- DRAFT
- PENDING_APPROVAL
- APPROVED
- REJECTED
- SCHEDULED
- ONGOING
- COMPLETED
- CANCELLED

Do not scatter status strings throughout the code.

---

# 14. EVENT LIFECYCLE

Main flow:

PIC
→ Create Event
→ DRAFT
→ Submit
→ PENDING_APPROVAL
→ Approver Review
→ APPROVED
→ SCHEDULED
→ ONGOING
→ COMPLETED

Rejection flow:

PENDING_APPROVAL
→ REJECTED
→ PIC sees rejection reason
→ Edit
→ Resubmit
→ PENDING_APPROVAL

Prevent invalid state transitions.

---

# 15. EVENT CREATION

Create Event form:

- Event Name
- Event Type
- Event Date
- Start Time
- End Time
- Venue
- Custom Venue
- Staff Required
- Assigned Staff
- Description
- Notes

Actions:
- Save Draft
- Submit for Approval

Save Draft:
→ DRAFT

Submit:
→ PENDING_APPROVAL

---

# 16. VALIDATION

Frontend validation improves user experience.

Backend validation is the source of truth.

Validate:
- required fields
- event date
- start time
- end time
- start < end
- event type
- custom event type
- venue
- custom venue
- staff required
- assigned staff
- authorization
- venue conflicts
- staff conflicts

Show clear inline validation messages.

---

# 17. VENUE CONFLICT

A venue conflict occurs when:

same venue
+
same date
+
overlapping time.

Example:

Event A: 09:00–15:00
Event B: 13:00–17:00

Result:
CONFLICT

Example message:
"Ballroom sudah digunakan pada 09:00 - 15:00."

The backend MUST enforce this rule.

---

# 18. STAFF CONFLICT

A staff conflict occurs when:

same staff
+
same date
+
overlapping time.

Example:

Event A: 10:00–14:00
Another event: 12:00–15:00

Result:
CONFLICT

Example message:
"Staff tersebut sudah memiliki event pada 12:00 - 15:00."

The backend MUST enforce this rule.

---

# 19. TIME BOUNDARY

Use consistent interval logic.

Example:

Event A: 09:00–12:00
Event B: 12:00–15:00

These DO NOT overlap.

Create automated tests for this boundary case.

---

# 20. APPROVAL WORKFLOW

Submit:
DRAFT → PENDING_APPROVAL

Approve:
PENDING_APPROVAL → APPROVED → SCHEDULED

Reject:
PENDING_APPROVAL → REJECTED

Reject MUST require a rejection reason.

Resubmit:
REJECTED → Edit → Submit → PENDING_APPROVAL

Only APPROVER can approve/reject.

PIC cannot approve/reject.

Unauthorized users must receive an appropriate forbidden response.

---

# 21. APPROVAL HISTORY

Store approval information.

Minimum fields:
- event_id
- approver_id
- status
- rejection_reason
- approved_at
- created_at
- updated_at

Prefer maintaining approval history rather than overwriting all previous decisions.

---

# 22. CALENDAR

Build a responsive event calendar.

Support:
- Month View
- Event indicator
- Event title
- Date
- Start time
- End time
- Venue
- Status
- Event detail

Filters:
- Venue
- Event Type
- Status
- PIC

Clicking an event should open/view Event Detail.

Also provide Upcoming Events.

Calendar visibility:
- DRAFT: not a confirmed calendar event
- REJECTED: not a confirmed calendar event
- APPROVED/SCHEDULED: show as confirmed event

---

# 23. DASHBOARD

PIC Dashboard:
- Total My Events
- Pending Approval
- Upcoming Events
- Today's Events
- Recent Notifications

Approver Dashboard:
- Pending Approval Count
- Approved Today
- Rejected Today
- Upcoming Events
- Pending Approval List

Admin Dashboard:
- Total Events
- Upcoming Events
- Active PIC
- Total Staff
- Total Venue
- Recent Events

All dashboard statistics must come from the backend/database.

Never hardcode dashboard numbers.

---

# 24. NOTIFICATIONS

Implement real in-app notifications.

Also create service abstractions for:
- Email
- WhatsApp

Do NOT send real external messages in development/demo.

The architecture should allow real providers to be connected later without rewriting event business logic.

---

# 25. REMINDERS

Support:
- H-7
- H-3
- H-1
- H-1 Hour

Recipients:
- PIC
- Assigned Staff

Email:
- PIC

WhatsApp:
- PIC + Assigned Staff

Reminder data should include:
- event_id
- reminder_type
- scheduled_at
- channel
- recipient
- status
- sent_at
- created_at
- updated_at

Create a safe development/demo simulation for these reminders.

The simulation must generate in-app notifications and mock channel activity only.

---

# 26. DATABASE

Use MySQL.

Minimum entities:
- users
- roles
- venues
- events
- event_staff
- approvals
- notifications
- reminders

Use:
- primary keys
- foreign keys
- indexes
- constraints
- timestamps
- proper relationships

Use Laravel migrations and seeders.

Use factories if useful.

Do not use destructive database resets unless explicitly requested.

---

# 27. REQUIRED PAGES

Public:
- Login

PIC:
- Dashboard
- Calendar
- My Events
- Create Event
- Edit Event
- Event Detail
- Notifications

Approver:
- Dashboard
- Pending Approval
- Approval Detail
- Calendar
- Event Detail

Admin:
- Dashboard
- User Management
- Staff Management
- Venue Management
- Event Management
- Calendar
- Reports

---

# 28. LOGIN

Build a professional login page using the provided palette.

Must support:
- authentication
- validation errors
- loading state
- authentication errors
- role-based redirect
- protected pages
- logout

Never expose passwords or secrets.

---

# 29. NAVIGATION

Role-based navigation:

PIC sees PIC features.

Approver sees Approver features.

Admin sees Admin features.

Desktop:
- sidebar/navigation

Mobile:
- responsive drawer/menu

---

# 30. EVENT LISTS

PIC:
- My Events

Approver:
- Pending Approval

Admin:
- All Events

Useful columns:
- Event
- Date
- Time
- Venue
- PIC
- Staff
- Status
- Actions

Support where appropriate:
- search
- filter
- pagination
- status badges
- responsive layout

---

# 31. EVENT DETAIL

Display:
- event name
- event type
- date
- start time
- end time
- venue
- custom venue
- PIC
- staff required
- assigned staff
- assignment progress
- description
- notes
- status
- approval information
- rejection reason
- event history

Actions depend on role and current event status.

---

# 32. REUSABLE UI COMPONENTS

Create reusable components where useful:

- Button
- Input
- Select
- Date Input
- Time Input
- Textarea
- Card
- Badge
- Modal
- Dropdown
- Sidebar
- Navbar
- Table
- Pagination
- Calendar
- Notification Item
- Toast
- Alert
- Empty State
- Loading State
- Error State
- Confirmation Dialog

Avoid unnecessary abstraction.

---

# 33. ERROR HANDLING

Frontend:
- validation error
- server error
- unauthorized
- forbidden
- not found
- conflict
- loading
- empty state

Backend:
- appropriate HTTP status codes
- consistent API responses
- safe error messages

Never expose stack traces or secrets to users.

---

# 34. SECURITY

Implement:
- backend authorization
- request validation
- protected routes
- ownership/permission checks
- safe resource access
- IDOR prevention
- secure authentication
- CSRF/session protection where applicable
- secret protection

Never expose:
- passwords
- API keys
- tokens
- database passwords
- .env secrets

Never hardcode production credentials.

---

# 35. API ARCHITECTURE

Use clean Laravel API endpoints.

Use:
- appropriate HTTP methods
- appropriate HTTP status codes
- validation
- authorization
- resource responses

Keep responsibilities separated between:
- controllers
- requests/validation
- business logic
- models
- services where useful

Do not overengineer.

---

# 36. DEMO DATA

Create development seed data with dummy accounts:

PIC:
- Name: Demo PIC
- Role: PIC

APPROVER:
- Name: Demo Approver
- Role: APPROVER

ADMIN:
- Name: Demo Admin
- Role: ADMIN

Also seed:
- staff
- venues
- sample events
- notifications

Use dummy data only.

---

# 37. DEVELOPMENT PHASES

Use the following phases as the internal build sequence.

Do NOT stop between phases.

## PHASE 01 — REQUIREMENT ANALYSIS
Analyze functional requirements, non-functional requirements, roles, lifecycle, validation, notification, and MVP scope.

## PHASE 02 — BUSINESS RULES
Define permissions, status transitions, approval, rejection, conflict, calendar, and notification rules.

## PHASE 03 — USER FLOW
Implement the flow for PIC, Approver, and Admin, including normal, error, rejection, conflict, and unauthorized flows.

## PHASE 04 — USE CASE
Cover login, logout, event creation, draft, submission, approval, rejection, resubmission, calendar, notifications, reminders, users, staff, venues, and reports.

## PHASE 05 — DATABASE
Implement migrations, models, relationships, seeders, indexes, and constraints.

## PHASE 06 — UI/UX
Implement the actual UI using the provided Technolife palette and responsive design.

## PHASE 07 — PROJECT SETUP
Complete Laravel, React, Tailwind, Vite, API, database, and environment setup if needed.

## PHASE 08 — AUTHENTICATION & AUTHORIZATION
Implement authentication, roles, protected routes, authorization, navigation, and demo users.

## PHASE 09 — EVENT MANAGEMENT
Implement event CRUD, drafts, submission, validation, assigned staff, and status handling.

## PHASE 10 — CONFLICT VALIDATION
Implement venue conflict, staff conflict, date validation, time overlap, and boundary tests.

## PHASE 11 — APPROVAL
Implement pending approval, detail, approve, reject, rejection reason, approval history, and resubmission.

## PHASE 12 — CALENDAR
Implement calendar, filters, events, event detail, upcoming events, and responsive behavior.

## PHASE 13 — NOTIFICATION
Implement in-app notifications, reminder model/service, mock email, mock WhatsApp, and reminder simulation.

## PHASE 14 — DASHBOARD
Implement role-specific dashboards with real backend data.

## PHASE 15 — TESTING
Run and fix backend tests, feature tests, validation tests, authorization tests, conflict tests, approval tests, frontend checks, and build checks.

## PHASE 16 — DEMO PREPARATION
Prepare demo data and verify the complete presentation flow.

---

# 38. REQUIRED TEST SCENARIOS

Test at minimum:

Authentication:
- PIC login
- Approver login
- Admin login
- invalid login

Authorization:
- PIC cannot approve
- unauthorized user cannot access Admin
- unauthorized user cannot modify another user's event

Event:
- create
- save draft
- edit draft
- submit
- invalid event

Conflict:
- venue conflict
- staff conflict
- boundary time
- different venue
- different staff
- different date

Approval:
- approve
- reject
- rejection reason required
- resubmit

Calendar:
- approved event appears
- scheduled event appears
- draft is not a confirmed event
- rejected event is not a confirmed event

Notification:
- notification generated
- reminder simulation
- correct recipients

Responsive:
- desktop
- tablet
- mobile

---

# 39. DEMO SCENARIO

Prepare:

Event Name:
Technolife Internal Training

Event Type:
Training

Date:
20 August 2026

Start:
09:00

End:
15:00

Venue:
Training Center

Staff Required:
5

Assigned Staff:
5

Description:
Internal training event.

Demo flow:

PIC Login
→ Dashboard
→ Calendar
→ Create Event
→ Save Draft
→ Edit
→ Submit

Approver Login
→ Pending Approval
→ Event Detail
→ Approve

PIC Login
→ Calendar
→ Event appears as scheduled

Then simulate:
- H-7
- H-3
- H-1
- H-1 Hour

Verify notifications.

---

# 40. AMBIGUOUS BUSINESS RULES

If a business rule is not explicitly defined:
- choose the simplest safe MVP implementation
- document the assumption
- do not block the entire build unnecessarily

Potential future confirmations:
- exact approval hierarchy
- multiple approvers
- approver assignment rules
- editing after approval
- staff confirmation
- real WhatsApp provider
- real email provider
- exact reminder scheduling
- cancellation behavior
- automatic/manual ONGOING
- automatic/manual COMPLETED
- Admin approval override
- rescheduling after approval

Use mock/placeholder integrations where external provider details are not available.

---

# 41. ERROR RECOVERY

When an error occurs:

1. Inspect the actual error.
2. Identify the root cause.
3. Fix the root cause.
4. Re-run the relevant test/build.
5. Verify the fix.
6. Continue.

Do not:
- hide errors
- comment out broken functionality
- delete functionality just to make tests pass
- ignore build failures

---

# 42. DEPENDENCIES

Before installing a dependency:
- inspect existing dependencies
- determine whether the current stack already solves the problem

If a dependency is genuinely required:
- use a stable option
- keep it minimal
- integrate it cleanly

Do not install unnecessary packages.

---

# 43. DATABASE SAFETY

Do not:
- drop all tables
- reset the database
- delete existing data
- force migration reset

unless explicitly instructed.

Prefer safe/additive migrations.

---

# 44. FINAL QUALITY REVIEW

Before declaring completion, review:

UI:
- palette
- typography
- spacing
- buttons
- forms
- cards
- tables
- badges
- sidebar
- navbar
- dashboard
- calendar
- notifications
- modals
- responsive behavior
- loading states
- empty states
- error states

Functionality:
- authentication
- authorization
- event lifecycle
- conflict detection
- approval
- calendar
- notification
- reminders
- admin

Security:
- authorization
- protected endpoints
- validation
- secret protection
- resource access
- IDOR prevention

---

# 45. FINAL BUILD CHECK

Run the appropriate commands to verify:

- backend tests
- frontend build
- lint/checks if configured
- migrations
- seeders
- routes
- API functionality

Fix errors that prevent the MVP from running.

---

# 46. DO NOT ADD UNRELATED FEATURES

Do not add:
- payment
- public booking
- ecommerce
- chat
- social media
- payroll
- employee attendance
- unnecessary AI
- unnecessary analytics
- unrelated external integrations

Stay within the Technolife Event Reservation & Management System scope.

---

# 47. FINAL REPORT

After the complete implementation, provide:

## PROJECT STATUS
MVP COMPLETE / PARTIALLY COMPLETE / BLOCKED

## TECHNOLOGY
Frontend
Backend
Database

## FEATURES COMPLETED
List completed features.

## AUTHENTICATION
List authentication features.

## AUTHORIZATION
List role permissions.

## EVENT MANAGEMENT
List event functionality.

## APPROVAL
List approval functionality.

## VALIDATION
List venue/staff conflict functionality.

## CALENDAR
List calendar functionality.

## NOTIFICATION
List notification/reminder functionality.

## ADMIN
List admin functionality.

## TESTING
List tests and results.

## FILES CREATED
List important files.

## FILES MODIFIED
List important files.

## ASSUMPTIONS
List assumptions.

## REQUIRES BUSINESS CONFIRMATION
List remaining decisions.

## HOW TO RUN
Provide exact commands for:
- backend
- frontend
- database
- migrations
- seeders

## DEMO ACCOUNT
Provide dummy development credentials.

## FINAL NOTES
Mention only remaining non-blocking improvements.

---

# FINAL INSTRUCTION

START BUILDING THE COMPLETE APPLICATION NOW.

Inspect the project first.

Then implement the complete MVP.

Do not stop after planning.

Do not stop after a single phase.

Do not wait for user confirmation between phases.

Proceed through PHASE 01 → PHASE 16.

Build the actual working website.

Use the provided Technolife color palette.

Respect the requirements.

Test continuously.

Fix errors.

Complete the MVP.
