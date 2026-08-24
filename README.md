# Altın Portföy v2

Vercel üzerinde doğrudan deploy edilebilir statik web uygulaması + serverless fiyat API'si.

## Özellikler
- Canlı altın fiyatlarını `/api/prices` üzerinden çeker.
- Birincil kaynak: Turkpidya public gold endpoint (Harem Altın verisi).
- Kapalıçarşı endpoint'i fallback olarak denenir.
- 30 saniyede bir fiyat yenileme.
- Kurulum gerektirmeyen cihaz-içi kullanıcı girişi.
- Kullanıcı bazlı portföy; miktar, maliyet, güncel değer ve kâr/zarar takibi.
- Kullanıcı ve portföy verileri yalnızca tarayıcı `localStorage` içinde tutulur.

## Vercel
Repo kökünde `index.html` ve `api/prices.js` olacak şekilde GitHub'a yükleyin. Vercel projeyi otomatik deploy eder.

## Not
Bu sürümde giriş gerçek bir kimlik doğrulama servisi değildir. Gerçek Google/e-posta login ve farklı cihazlarda ortak portföy için Supabase/Firebase gibi bir backend bağlanmalıdır.
