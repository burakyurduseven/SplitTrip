# SplitTrip product requirements

## 1. Product purpose

SplitTrip is a mobile-first web application that enables groups of friends to plan a trip together, split shared expenses accurately, and settle their debts through a clear payment plan at the end of the trip.

It combines two connected problems in one product:

1. Collaborative trip planning
2. Shared expense and debt management

## 2. Target users

- People organizing short or long trips with friends
- Groups that want their itinerary and expenses in one place
- Users who need a clear view of who paid, who owes, and how to settle

## 3. MVP success criterion

A group must be able to complete this flow without relying on another tool:

1. Create an account and sign in
2. Create a trip
3. Join through an invitation link
4. Add activities to trip days
5. Record and split expenses using three methods
6. Review current balances
7. Record suggested transfers and settle debts

## 4. Roles and permissions

### Visitor

- Can view the landing page.
- Can register and sign in.
- Can open a valid invitation link but must sign in before joining.

### User

- Can view and edit their profile.
- Can create a trip.
- Can list trips they belong to.
- Cannot access data from trips they do not belong to.

### Trip member

- Can view trip details and members.
- Can add activities and edit activities they created.
- Can add expenses and edit expenses they created.
- Can view balances and suggested settlements.
- Can record a settlement.
- Keeps historical financial records after leaving a trip.

### Trip owner

- Has all member permissions.
- Can edit trip details.
- Can create and rotate invitation links.
- Can remove members.
- Can transfer ownership to another member.
- Can archive the trip.

## 5. Functional scope

### Identity and profile

- Registration with email and password
- Sign-in with email and password
- JWT-based authentication
- Secure sign-out
- View and update profile
- Account deletion foundation

### Trips

- Create a trip with a title, description, date range, and default currency
- List active and archived trips
- Owner and member roles
- Secure invitation tokens with expiration and usage state
- Accept an invitation
- Ownership transfer, leave, and member removal rules

### Itinerary

- Display the days in the trip date range
- Add an activity with title, description, location text, start time, and end time
- Sort activities chronologically
- Add unscheduled activities
- Warn about overlapping activities without blocking the user

### Expenses

- Title, amount, currency, category, date, and description
- One or more payers
- Participating members
- Equal, exact-amount, and percentage splits
- Edit and void an expense
- Preserve financial history instead of physically deleting records

### Balances and settlements

- Total paid, total owed, and net balance per member
- Group debt simplification
- Suggested transfers
- Settlement records and history
- Full and partial settlements

## 6. Core business rules

- Monetary calculations use `BigDecimal` in Java and `numeric` in PostgreSQL.
- Expense shares must add up to the expense amount.
- Percentage splits must add up to exactly 100 percent.
- Indivisible minor currency units are distributed deterministically using a stable member order.
- A trip start date cannot be after its end date.
- Activity times cannot fall outside the trip date range.
- Users may access only trips they belong to.
- An owner cannot leave before transferring ownership.
- Financial records remain traceable after edits or membership changes.
- A greedy debt simplification result is called a “suggested plan,” never an “optimal plan.”

## 7. Outside the MVP

Currency conversion, historical exchange rates, maps, routing, OCR, payment integrations, Redis, WebSocket, notifications, offline support, PWA, AI features, PDF/Excel export, and advanced analytics are outside the MVP. Receipt and invoice attachments are included, without OCR processing.

## 8. Quality requirements

- Consistent Problem Details API error responses
- Authorization tests for protected resources
- Explicit transaction boundaries for critical operations
- N+1 query reviews and appropriate indexes
- Comprehensive unit tests for financial calculations
- PostgreSQL Testcontainers integration tests for critical workflows
- Keyboard access, visible focus states, and sufficient color contrast
- Designed loading, empty, validation, and error states
