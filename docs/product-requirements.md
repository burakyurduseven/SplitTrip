# SplitTrip ürün gereksinimleri

## 1. Ürün amacı

SplitTrip, arkadaş gruplarının bir seyahati birlikte planlamasını, ortak giderleri doğru biçimde bölüştürmesini ve seyahat sonunda borçlarını anlaşılır bir ödeme planıyla kapatmasını sağlayan mobile-first bir web uygulamasıdır.

Ürün iki ayrı problemi tek akışta çözer:

1. Seyahat programını grup olarak oluşturmak.
2. Ortak harcamaları ve grup içi borçları yönetmek.

## 2. Hedef kullanıcı

- Arkadaş grubuyla kısa veya uzun seyahat düzenleyen kişiler
- Gezi sırasında programı ve harcamaları tek yerde tutmak isteyen gruplar
- Kimin ne ödediğini ve kime borçlu olduğunu kolayca görmek isteyen kullanıcılar

## 3. MVP başarı ölçütü

Bir grup uygulama içinde aşağıdaki akışı dışarıdan başka bir araca ihtiyaç duymadan tamamlayabilmelidir:

1. Hesap oluşturmak ve giriş yapmak
2. Seyahat oluşturmak
3. Davet bağlantısıyla gruba katılmak
4. Günlere aktivite eklemek
5. Ortak harcamaları üç farklı yöntemle bölmek
6. Güncel bakiyeleri görmek
7. Önerilen transferleri kaydederek borçları kapatmak

## 4. Roller ve yetkiler

### Ziyaretçi

- Landing sayfasını görebilir.
- Kayıt olabilir ve giriş yapabilir.
- Geçerli bir davet bağlantısını açabilir; katılmak için giriş yapması gerekir.

### Kullanıcı

- Profilini görebilir ve düzenleyebilir.
- Seyahat oluşturabilir.
- Üyesi olduğu seyahatleri listeleyebilir.
- Üyesi olmadığı seyahatlerin içeriklerine erişemez.

### Seyahat üyesi

- Seyahatin genel bilgilerini ve üyelerini görebilir.
- Aktivite ekleyebilir, kendi eklediği aktiviteyi düzenleyebilir.
- Harcama ekleyebilir ve kendi eklediği harcamayı düzenleyebilir.
- Bakiyeleri ve ödeme önerilerini görebilir.
- Ödeme kaydı oluşturabilir.
- Geçmiş finansal kaydı varsa seyahatten ayrıldığında kayıtları korunur.

### Seyahat sahibi

- Üye yetkilerinin tamamına sahiptir.
- Seyahat bilgilerini düzenleyebilir.
- Davet bağlantısı oluşturabilir ve yenileyebilir.
- Üye çıkarabilir.
- Sahipliği başka bir üyeye aktarabilir.
- Seyahati arşivleyebilir.

## 5. Fonksiyonel kapsam

### Kimlik ve profil

- E-posta ve şifreyle kayıt
- E-posta ve şifreyle giriş
- JWT tabanlı kimlik doğrulama
- Güvenli çıkış
- Kullanıcı profilini görüntüleme ve düzenleme
- Hesap silme altyapısı

### Seyahat

- Başlık, açıklama, başlangıç/bitiş tarihi ve varsayılan para birimiyle oluşturma
- Aktif ve arşivlenmiş seyahatleri listeleme
- Owner/member rolleri
- Süresi ve kullanım durumu bulunan güvenli davet tokenı
- Daveti kabul etme
- Sahipliği aktarma, seyahatten ayrılma ve üye çıkarma kuralları

### Program

- Seyahat tarih aralığındaki günleri gösterme
- Başlık, açıklama, konum metni, başlangıç ve bitiş zamanıyla aktivite ekleme
- Aktiviteleri saat sırasına koyma
- Plansız aktivite ekleme
- Çakışan zamanları engellemeden kullanıcıyı uyarma

### Harcamalar

- Başlık, tutar, para birimi, kategori, tarih ve açıklama
- Bir veya birden fazla ödeyen
- Harcamaya katılan üyeler
- Eşit, özel tutar ve yüzde bazlı bölüştürme
- Harcama düzenleme ve iptal etme
- Finansal geçmişi bozacak fiziksel silme yerine durum/geçmiş yaklaşımı

### Bakiye ve ödeme

- Üye bazında toplam ödeme, yükümlülük ve net bakiye
- Grup içi borç sadeleştirme
- Önerilen transferler
- Ödeme kaydı ve ödeme geçmişi
- Tam ve kısmi ödeme desteği

## 6. Temel iş kuralları

- Para hesapları backend'de `BigDecimal`, PostgreSQL'de `numeric` ile yapılır.
- Bir harcamanın payları toplamı harcama tutarına eşit olmalıdır.
- Yüzdelerin toplamı tam olarak 100 olmalıdır.
- Eşit bölünemeyen en küçük para birimleri, sabit üye sırasına göre deterministik dağıtılır.
- Başlangıç tarihi bitiş tarihinden sonra olamaz.
- Aktivite zamanı seyahat tarihleri dışında olamaz.
- Kullanıcı yalnızca üyesi olduğu seyahatin verilerine erişebilir.
- Owner, sahipliği devretmeden gruptan ayrılamaz.
- Finansal hareketler sonradan izlenebilir biçimde korunur.
- Greedy borç sadeleştirme sonucu “önerilen plan” olarak sunulur; “optimal” olarak adlandırılmaz.

## 7. MVP dışında

Çoklu para birimi dönüşümü, döviz kuru, harita, rota, OCR, fiş fotoğrafı, ödeme altyapısı, Redis, WebSocket, bildirim, çevrimdışı kullanım, PWA, yapay zekâ, PDF/Excel dışa aktarma ve gelişmiş grafikler MVP kapsamında değildir.

## 8. Kalite gereksinimleri

- Tutarlı problem-details tabanlı API hata cevapları
- Yetkisiz kaynak erişimine karşı testler
- Kritik işlemlerde transaction sınırları
- N+1 sorgu kontrolleri ve gerekli indeksler
- Finansal hesaplama motoru için kapsamlı birim testleri
- Kritik akışlar için PostgreSQL Testcontainers integration testleri
- Klavye kullanımı, odak görünürlüğü ve yeterli renk kontrastı
- Loading, empty, validation ve hata durumlarının tasarlanması
