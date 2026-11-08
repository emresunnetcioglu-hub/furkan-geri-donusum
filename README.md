# FURKAN GERİ DÖNÜŞÜM — Yönetim Panelli Kurumsal Site

Next.js 15 + Supabase: canlı ürün kataloğu, TL/kg fiyatları, güvenli yönetici oturumu, fiyat önerileri ve **manuel onay** iş akışı.

## Kurulum
1. Node.js 20+ ile `npm install`.
2. Supabase projesi açın, `supabase/schema.sql` dosyasını SQL Editor'da çalıştırın.
3. `.env.example` dosyasını `.env.local` olarak kopyalayın ve gerçek anahtarları doldurun. `SUPABASE_SERVICE_ROLE_KEY` asla tarayıcıya veya git deposuna koyulmaz.
4. Supabase Authentication > Users bölümünde yönetici hesabı oluşturun. Kullanıcının UUID'sini `insert into public.admin_users(user_id) values ('UUID');` ile ekleyin.
5. `npm run dev` çalıştırın; http://localhost:3000 açın. Yönetim panelinden ürünleri, gerçek fiyatları ve WhatsApp numarasını ekleyin.
6. Vercel'e dağıtırken environment variables alanına aynı değişkenleri girin.

## Fiyat önerisi otomasyonu
Fiyatlar otomatik olarak **asla yayınlanmaz**. Yönetim panelinde öneri mevcut fiyatla, değişim yüzdesiyle ve kaynakla görünür. Yönetici **Onayla** derse tek veritabanı işleminde ürün fiyatı güncellenir; **Reddet** derse değişmez.

`PRICE_FEED_URL` lisanslı/güvenilir bir HTTPS JSON endpoint'i olmalıdır. Bu proje henüz bir fiyat sağlayıcısına bağlı değildir; rastgele internet fiyatları kullanılmaz. Endpoint'in JSON çıktısı:

```json
[{"product_id":1,"proposed_price":200.50,"source":"Yetkili fiyat sağlayıcısı","source_url":"https://example.com/fiyat","observed_at":"2026-11-08T12:00:00Z"}]
```

`GET /api/sync-prices` çağrısında `Authorization: Bearer <PRICE_SYNC_SECRET>` header'ı gereklidir. Bu çağrı bekleyen önerileri ekler, fiyatları değiştirmez. Yetkili scheduler/cron kullanarak periyodik çalıştırılabilir. Endpoint sadece yetkili veri kaynağı bağlandığında etkinleşir. Tekrarlanan feed öğelerinin tekrar öneri yaratmasını engellemek için canlı ortamda benzersiz sağlayıcı kayıt kimliği ve idempotency uygulanması önerilir.

Yönetim panelinden ürün yanındaki `₺+` butonuyla manuel öneri de girilebilir.

## Güvenlik ve yayına hazırlık
- Supabase RLS açık; sadece `admin_users` tablosundaki kullanıcılar ürünleri ve fiyatları değiştirebilir. Onay işlemi yetki kontrolü yapan atomik SQL fonksiyonudur.
- İlk açılışta katalog boştur: doğrulanmamış örnek hurda fiyatları canlı yayınlanmaz.
- Telefon, adres, firma tanıtımı, yasal metinler ve gerçek ürün fotoğrafları yayından önce eklenmelidir.
- Fotoğraf yükleme sistemi ve teklif kayıt modülü sonraki geliştirme aşamasıdır.
- Gerçek fiyat sağlayıcısı ve veri kullanım izni ayrıca belirlenmelidir.
