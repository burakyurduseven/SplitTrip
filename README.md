# SplitTrip

A mobile-first, full-stack application for collaborative trip planning and shared expense management.

## Technology stack

- Backend: Java 21, Spring Boot 4, Spring Web MVC, Security, Data JPA, and Flyway
- Frontend: React, TypeScript, Vite, and Tailwind CSS
- Database: PostgreSQL
- API documentation: OpenAPI and Swagger UI
- Architecture: modular monolith

## Prerequisites

- JDK 21
- Node.js 22 or later
- Docker Desktop with Docker Compose

A system-wide Maven installation is not required. The repository includes Maven Wrapper.

## Local development

```powershell
Copy-Item .env.example .env
docker compose up -d
cd backend
.\mvnw.cmd spring-boot:run
```

In a separate terminal:

```powershell
cd frontend
npm install
npm run dev
```

- Web application: http://localhost:5173
- API status: http://localhost:8080/api/v1/status
- Swagger UI: http://localhost:8080/swagger-ui.html
- Actuator health: http://localhost:8080/actuator/health

## Quality checks

```powershell
cd backend
.\mvnw.cmd test

cd ..\frontend
npm run lint
npm run test
npm run build
```

## Project documentation

- Product scope and roles: `docs/product-requirements.md`
- Initial domain model: `docs/domain-model.md`
- Design system: `docs/design-system.md`
- Development roadmap: `docs/roadmap.md`
- API conventions: `docs/api-conventions.md`
- Architecture: `docs/architecture.md`
- Development environment: `docs/development-environment.md`
