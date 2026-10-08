# SplitTrip Portfolio Guide

## CV description

**SplitTrip — Collaborative Travel Planning & Expense Sharing Platform**  
Built a mobile-first full-stack web application with Java 21, Spring Boot, React, TypeScript, PostgreSQL, and Docker. Implemented secure JWT authentication with refresh-token rotation, collaborative itinerary voting and scheduling, trip checklists, flexible expense splitting, receipt attachments, balance simplification, Flyway migrations, Testcontainers integration tests, Playwright end-to-end tests, and GitHub Actions CI.

## Short CV bullets

- Designed a modular-monolith Spring Boot backend with explicit domain boundaries for authentication, users, trips, itinerary planning, and shared expenses.
- Built a responsive React and TypeScript interface for activity voting, overlapping timeline scheduling, collaborative checklists, and auditable group balances.
- Added 36 backend tests against PostgreSQL containers, component tests, desktop/mobile Playwright journeys, Docker packaging, and automated GitHub Actions checks.

## 30-second interview pitch

SplitTrip solves two problems that usually make group travel difficult: agreeing on a plan and keeping shared spending fair. I built it as a mobile-first full-stack web application. The backend is a Java 21 and Spring Boot modular monolith backed by PostgreSQL and Flyway. The React and TypeScript frontend lets a group suggest and vote on activities, turn selected ideas into a visual itinerary, manage preparation tasks, split expenses using different methods, attach documents, and record settlements. I also focused on engineering quality through secure token rotation, explicit authorization rules, Testcontainers integration testing, Playwright browser testing, Docker, and CI.

## Technical decisions to explain

### Why a modular monolith?

The product benefits from one transactional database and simple deployment, while package boundaries keep authentication, users, trips, and shared-expense logic separate. Microservices would add network, consistency, and operational complexity without solving a current scaling problem.

### Why decimal values for money?

Expense calculations use decimal arithmetic rather than floating-point values. Split validation also handles rounding remainders deterministically so member shares always reconcile with the original expense total.

### How is authentication secured?

Access tokens are short-lived JWTs. Refresh tokens are opaque, hashed before persistence, rotated on refresh, and delivered through an `HttpOnly` cookie. Protected operations enforce both authentication and trip-level membership or ownership rules.

### How are balances simplified?

Each member's net position is calculated from payments, allocated shares, and recorded settlements. A deterministic greedy matching pass then connects debtors to creditors and produces a compact set of suggested repayments.

### Why Testcontainers and Playwright?

Testcontainers checks JPA mappings, Flyway migrations, PostgreSQL behavior, and API rules against the same database engine used by the application. Playwright verifies that critical flows work across the actual frontend, backend, cookies, and database rather than testing those layers only in isolation.

## Suggested repository walkthrough

1. Start with the product screenshots and the tested user journey in the README.
2. Explain the modular-monolith diagram and why it fits the project.
3. Show a Flyway migration and one backend integration test.
4. Show the Playwright journey and the green GitHub Actions workflow.
5. Demonstrate one domain-heavy feature, preferably expense splitting or balance simplification.
