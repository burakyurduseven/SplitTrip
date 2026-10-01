# Mimari başlangıç noktası

SplitTrip tek deploy edilebilir backend ve tek frontend uygulamasından oluşan modüler bir monolith'tir.

## Dizinler

- `backend/`: Spring Boot REST API
- `frontend/`: mobile-first React uygulaması
- `docs/`: mimari ve ürün kararları

## Backend modül kuralı

İşlevler üst seviye paketlerle ayrılır. Her özellik kendi `api`, `application`, `domain` ve `infrastructure` alt paketlerini ihtiyaç oldukça açar. Ortak teknik yapı `common` altında tutulur. Modüller birbirlerinin iç sınıflarına doğrudan bağlanmamalıdır.

Başlangıç paketleri:

- `com.splittrip.common.config`
- `com.splittrip.status.api`

## Veri yönetimi

PostgreSQL tek veri kaynağıdır. Şema yalnızca Flyway migration'larıyla değiştirilir; Hibernate şemayı doğrular ve oluşturmaz.

## İlk aşama kapsamı dışında

Redis, WebSocket, harita, ödeme, OCR, yapay zekâ ve PWA henüz eklenmeyecektir. PWA desteği ürünün son aşamasında ele alınacaktır.
