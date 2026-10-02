# Geliştirme ortamı kontrolü

2 Ekim 2026 tarihinde doğrulanan geliştirme ortamı:

| Araç | Durum |
|---|---|
| Node.js | 26.5.0 kurulu |
| npm | 11.17.0 kurulu |
| Git | 2.55.0 kurulu |
| Java / JDK | Eclipse Temurin 21.0.12.1 kurulu |
| Maven | Sistem genelinde kurulu değil; Maven Wrapper kullanılacak |
| Docker | Docker Desktop 29.8.1 kurulu |
| Docker Compose | 5.5.1 kurulu |
| WSL | WSL 2 etkin |

## Doğrulanan kontroller

- Backend Maven build ve JUnit testi başarılı.
- PostgreSQL 17.11 container'ı sağlıklı başladı.
- Flyway `V1__baseline.sql` migration'ını başarıyla uyguladı.
- Status API `ok`, Actuator health `UP` döndürdü.
- OpenAPI dokümanı erişilebilir durumda.
