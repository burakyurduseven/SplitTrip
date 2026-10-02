# Geliştirme yol haritası

Her aşama çalışan, test edilmiş ve ayrı commit'lerle tamamlanan küçük dikey dilimlere bölünür.

## Aşama 0 — Ürün temeli

- [x] MVP kapsamı ve roller
- [x] Başlangıç veri modeli
- [x] Tasarım sistemi ve ekran yönü
- [ ] API sözleşmesi kuralları
- [ ] Wireframe geri bildiriminin işlenmesi

## Aşama 1 — Kimlik ve kullanıcı

- User migration ve entity
- Kayıt use case'i ve API'si
- BCrypt şifreleme ve doğrulamalar
- Giriş ve kısa ömürlü access JWT
- Güvenli yenileme/çıkış yaklaşımı
- Profil endpoint'i
- Kayıt ve giriş ekranları
- Unit ve integration testleri

Çıkış kriteri: Kullanıcı kayıt olabilir, giriş yapabilir ve yalnızca geçerli oturumla profilini görebilir.

## Aşama 2 — Seyahat ve üyelik

- Trip ve TripMember modeli
- Seyahat oluşturma/listeleme/detay
- Owner/member yetkilendirmesi
- Güvenli davet tokenları
- Davet kabulü, ayrılma ve üye çıkarma
- Seyahat listesi ve detay kabuğu

Çıkış kriteri: Bir kullanıcı seyahat oluşturup başka bir kullanıcıyı güvenli şekilde gruba ekleyebilir.

## Aşama 3 — Program

- Activity modeli ve API'leri
- Günlük timeline
- Plansız aktiviteler
- Zaman ve tarih doğrulamaları
- Çakışma uyarıları

Çıkış kriteri: Grup, seyahatin günlük programını ortaklaşa hazırlayabilir.

## Aşama 4 — Harcama motoru

- Expense, ExpensePayment ve ExpenseShare modelleri
- Eşit bölüştürme
- Özel tutarla bölüştürme
- Yüzdeyle bölüştürme
- Kuruş dağıtımı ve kapsamlı birim testleri
- Harcama ekleme/düzenleme ekranları

Çıkış kriteri: Üç bölüştürme yöntemi kesin ve test edilmiş sonuç üretir.

## Aşama 5 — Bakiye ve kapatma

- Net bakiye sorguları
- Greedy borç sadeleştirme
- Önerilen transfer ekranı
- Tam/kısmi settlement kaydı
- Finansal geçmiş ve iptal akışları

Çıkış kriteri: Grup, seyahat sonunda borçlarını uygulama üzerinden kapatabilir.

## Aşama 6 — Ürün kalitesi

- Loading, empty ve error state'leri
- Responsive ve erişilebilirlik denetimi
- Güvenlik/yetkilendirme testleri
- N+1, sorgu planı ve indeks kontrolü
- Test kapsamının güçlendirilmesi

## Aşama 7 — Yayın ve portföy

- GitHub Actions CI
- Production deployment
- Demo hesap/veri stratejisi
- README ekran görüntüleri ve mimari diyagram
- CV ve portföy açıklaması

## Aşama 8 — MVP sonrası

Kullanıcı geri bildirimine göre PWA, bildirim, harita veya diğer aday özelliklerden yalnızca gerçek değer sağlayanlar seçilir.
