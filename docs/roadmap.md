# Development roadmap

Each phase is divided into small vertical slices that are completed with working code, tests, and focused commits.

## Phase 0 — Product foundation

- [x] MVP scope and roles
- [x] Initial domain model
- [x] Design system and interface direction
- [x] API contract conventions
- [ ] Incorporate wireframe feedback

## Phase 1 — Identity and users

- [x] User migration and entity
- [x] Registration use case and API
- [x] BCrypt password hashing and validation
- [x] Sign-in and short-lived access JWT
- [x] Secure refresh and sign-out approach
- [x] Profile endpoint
- [x] Registration and sign-in screens
- [x] Registration and authentication backend tests

Exit criterion: a user can register, sign in, and access their profile only with a valid session.

## Phase 2 — Trips and membership

- [x] Trip and TripMember models
- [x] Create, list, and view trips
- [ ] Owner/member authorization
- [ ] Secure invitation tokens
- [ ] Invitation acceptance, leaving, and member removal
- [x] Trip dashboard and creation interface
- [x] Trip detail shell

Exit criterion: one user can create a trip and securely invite another user to join.

## Phase 3 — Itinerary

- Activity model and APIs
- Daily timeline
- Unscheduled activities
- Date and time validation
- Schedule conflict warnings

Exit criterion: a group can collaboratively prepare its daily itinerary.

## Phase 4 — Expense engine

- Expense, ExpensePayment, and ExpenseShare models
- Equal split
- Exact-amount split
- Percentage split
- Minor-unit distribution and comprehensive unit tests
- Expense creation and editing interfaces

Exit criterion: all three split methods produce precise, tested results.

## Phase 5 — Balances and settlement

- Net balance queries
- Greedy debt simplification
- Suggested transfer interface
- Full and partial settlement records
- Financial history and void flows

Exit criterion: a group can settle its trip debts through the application.

## Phase 6 — Product quality

- Loading, empty, and error states
- Responsive and accessibility review
- Security and authorization tests
- N+1, query plan, and index review
- Stronger test coverage

## Phase 7 — Delivery and portfolio

- GitHub Actions CI
- Production deployment
- Demo account and data strategy
- README screenshots and architecture diagram
- CV and portfolio description

## Phase 8 — Post-MVP

Based on user feedback, only features that provide concrete value are selected from PWA support, notifications, maps, and other candidates.
