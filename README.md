# SplitTrip

Mobile-first, full-stack seyahat gideri paylaşım uygulaması.

## Teknoloji

- Backend: Java 21, Spring Boot 4, Spring Web MVC, Security, Data JPA, Flyway
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Veritabanı: PostgreSQL
- API dokümantasyonu: OpenAPI ve Swagger UI
- Mimari: modüler monolith

## Gereksinimler

- JDK 21
- Node.js 22 veya üzeri
- Docker Desktop (Compose dahil)

Maven'ın ayrıca kurulması gerekmez; Maven Wrapper depoya dahildir.

## Yerel geliştirme

```powershell
Copy-Item .env.example .env
docker compose up -d
cd backend
.\mvnw.cmd spring-boot:run
```

Ayrı bir terminalde:

```powershell
cd frontend
npm install
npm run dev
```

- Web: http://localhost:5173
- API durumu: http://localhost:8080/api/v1/status
- Swagger UI: http://localhost:8080/swagger-ui.html
- Actuator health: http://localhost:8080/actuator/health

## Kontroller

```powershell
cd backend
.\mvnw.cmd test

cd ..\frontend
npm run lint
npm run test
npm run build
```

## Proje dokümantasyonu

- Ürün kapsamı ve roller: `docs/product-requirements.md`
- Başlangıç veri modeli: `docs/domain-model.md`
- Tasarım sistemi: `docs/design-system.md`
- Geliştirme sırası: `docs/roadmap.md`
- Mimari yaklaşım: `docs/architecture.md`
- Geliştirme ortamı: `docs/development-environment.md`
