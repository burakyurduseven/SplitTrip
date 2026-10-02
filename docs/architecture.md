# Architecture baseline

SplitTrip is a modular monolith consisting of one deployable backend and one frontend application. Microservices are intentionally excluded because the current product scope does not justify their operational cost.

## Directories

- `backend/`: Spring Boot REST API
- `frontend/`: mobile-first React application
- `docs/`: product, design, and architecture decisions

## Backend module rule

Business capabilities are separated into top-level feature packages. Each feature may introduce `api`, `application`, `domain`, and `infrastructure` packages when those boundaries provide value. Shared technical configuration belongs under `common`.

Modules must not depend directly on another module's internal implementation. Unnecessary interfaces and enterprise abstractions should not be introduced.

Initial packages:

- `com.splittrip.common.config`
- `com.splittrip.status.api`

Planned feature packages:

- `auth`
- `user`
- `trip`
- `itinerary`
- `expense`
- `settlement`

## Data management

PostgreSQL is the single source of persistent data. Database schema changes are managed exclusively through Flyway migrations. Hibernate validates the schema and does not create or mutate it.

## Deferred capabilities

Redis, WebSocket, maps, payment integrations, OCR, AI features, and PWA support are deliberately deferred until the core product is complete and a concrete need exists.
