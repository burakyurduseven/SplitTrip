# Tasarım sistemi başlangıcı

## Tasarım karakteri

SplitTrip sıcak, sosyal ve güvenilir hissettirmelidir. Görünüm klasik bir yönetim panelinden çok seyahat arkadaşları için hazırlanmış tüketici ürünü olmalıdır.

Seçilen başlangıç yönü: **Sıcak ve sosyal**.

## Renkler

Başlangıç tokenları:

| Token | Açık tema | Kullanım |
|---|---:|---|
| Canvas | `#F7F8F4` | Ana arka plan |
| Surface | `#FFFFFF` | Kart ve formlar |
| Ink | `#15251F` | Ana metin |
| Muted ink | `#64716B` | İkincil metin |
| Brand | `#0F766E` | Ana aksiyonlar |
| Brand soft | `#DDF4EF` | Seçili ve vurgulu alanlar |
| Positive | `#15803D` | Alacak ve başarı |
| Negative | `#DC5A4A` | Borç ve hata |
| Warning | `#B7791F` | Çakışma ve uyarı |
| Border | `#E1E7E3` | Ayırıcılar |

Durum yalnızca renkle anlatılmaz; işaret, ikon ve metin birlikte kullanılır.

## Tipografi

- Birincil font: Inter veya sistem sans-serif
- Sayısal tutarlar: tabular numerals
- Sayfa başlığı: güçlü fakat kompakt
- Gövde metni: mobilde en az 16 px
- Yardımcı metin: en az 12 px ve yeterli kontrast

## Yerleşim

- Önce 320–430 px mobil genişlik tasarlanır.
- Mobilde sayfa kenar boşluğu 16–20 px olur.
- İçerik masaüstünde yaklaşık 1120 px ile sınırlandırılır.
- Birincil mobil navigasyon altta bulunur: Özet, Program, Harcamalar, Bakiyeler.
- Bir ekranda tek baskın birincil aksiyon kullanılır.
- Dokunma hedefleri yaklaşık 44×44 px veya daha büyüktür.

## Bileşenler

- Seyahat kartı: tarih, üye avatarları, yaklaşan aktivite ve bakiye özeti
- Timeline satırı: saat, aktivite, konum ve çakışma durumu
- Harcama satırı: kategori, ödeyen, tutar ve kullanıcının payı
- Bakiye satırı: üye, pozitif/negatif tutar ve açıklayıcı metin
- Bottom sheet: mobil harcama ekleme ve filtreler
- Empty state: kısa açıklama ve tek net aksiyon
- Skeleton: son yerleşimin şeklini korur
- Toast: kısa işlem sonucu; kritik hatalar form/sayfa içinde kalır

## İçerik dili

- Kısa ve doğrudan Türkçe ifadeler
- “Borçlusun” yerine bağlama göre “Ödeyeceğin tutar”
- “Optimal ödeme” yerine “Önerilen ödeme planı”
- Hata mesajında ne olduğu ve kullanıcının ne yapabileceği birlikte belirtilir

## Erişilebilirlik

- Metin kontrastı WCAG AA hedefler.
- Form alanlarının görünür etiketi olur.
- Hata yalnızca renk ile gösterilmez.
- Klavye odağı belirgindir.
- Hareket azaltma tercihi desteklenir.
- İkon-only butonlarda erişilebilir ad bulunur.
