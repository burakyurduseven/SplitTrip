# Development environment verification

Environment verified on October 2, 2026:

| Tool | Status |
|---|---|
| Node.js | 26.5.0 installed |
| npm | 11.17.0 installed |
| Git | 2.55.0 installed |
| Java / JDK | Eclipse Temurin 21.0.12.1 installed |
| Maven | Not installed system-wide; Maven Wrapper is used |
| Docker | Docker Desktop 29.8.1 installed |
| Docker Compose | 5.5.1 installed |
| WSL | WSL 2 enabled |

## Verified checks

- Maven backend build and JUnit tests passed.
- The PostgreSQL 17.11 container started and reported healthy.
- Flyway successfully applied `V1__baseline.sql`.
- The status API returned `ok` and Actuator health returned `UP`.
- The OpenAPI document was accessible.
