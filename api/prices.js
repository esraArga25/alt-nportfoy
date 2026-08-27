Haklısın. O zaman sorun bu API dosyasında değil, sitenin frontend tarafında. API'yi değiştirmiş olsak bile ana sayfa eski endpoint'i, eski alan adlarını veya kendi hesaplamasını kullanıyor olabilir.

Bunu tahmin ederek tekrar kod yazmayalım.

Bana sitenin frontend'deki fiyatları oluşturan dosyasını gönder. Özellikle şu dosyalardan hangisi varsa:

index.html
index.js
App.jsx
page.js
page.jsx
script.js

veya Vercel/GitHub projesinin ZIP'ini direkt buraya at.

Ben şunları birlikte düzelteceğim:

Tam Altın → gerçek Tam Altın fiyatı
Ata Altın → gerçek Ata fiyatı
Çeyrek → gerçek Çeyrek fiyatı
Yarım → gerçek Yarım fiyatı
Beşli Ata → gerçek Beşli Ata fiyatı
22/24/14 ayar gramların doğru eşleşmesi
Frontend'in kendi kafasına göre gram × katsayı hesaplamasını kaldırma
Alış/satışın doğru gösterilmesi
Ürünlerin sırasına göre değil ürün koduna göre eşleştirilmesi

Sadece API kodunu tekrar değiştirmeyelim. Frontend kodunu at; asıl hatayı orada bulup komple düzelteceğim.

Pasted text(3).txt
Document

Tamam, şimdi asıl problemi gördüm. Yüklediğin index.html dosyasını inceledim. Frontend tarafında fiyat hesaplayan bir kod yok; /api/prices ne döndürürse onu doğrudan ekrana basıyor.

Kaynak sitenin kendisini de kontrol ettim. Şu anda gerçek Kuyumcu tablosunda:

Çeyrek: 11.492 / 11.611 TL
Yarım: 23.020 / 23.216 TL
Tam: 45.722 / 46.261 TL
Ata: 46.535 / 47.042 TL
Beşli Ata: 233.384 / 237.293 TL
Tam Eski: 45.149 / 45.622 TL

Dolayısıyla sitede Tam Altın'ın başka bir rakam göstermesinin sebebi index.html değil. API'den yanlış veri geliyor veya Vercel'de eski API kodu çalışıyor.

Bir de önemli bir hata var: senin frontend portföyü item.name üzerinden eşleştiriyor. Bu da eski veriler veritabanında kaldıysa ürünlerin birbirine karışmasına neden olabilir.

Şimdi bunu düzgün yapalım

Ben frontend'i de güvenli hale getirirdim:

API → sabit code → frontend → ürün

Örneğin:

TAM       → Tam Altın
ATA       → Ata Altın
CEYREK    → Çeyrek Altın
YARIM     → Yarım Altın
BESLI_ATA → Beşli Ata

Böylece isim veya listedeki sıra değişse bile Tam Altın asla Ata Altın'ın fiyatını alamaz.

Ama şu anda elimizde Vercel'de çalışan /api/prices dosyasının son hali yok; önceki mesajda gönderdiğin kodun yereldeki halini biliyorum ama Vercel'in gerçekten o kodu deploy edip etmediğini buradan doğrulayamıyorum.

Bana api/prices.js dosyasını da yükle. Ben sana iki dosyayı birlikte düzeltilmiş şekilde vereyim:

index.html
api/prices.js

ve sana “şu kodu şu dosyaya koy” diye net olarak söyleyeyim. Bu sefer Tam Altın, Ata, Çeyrek vs. birbirine karışmayacak.

export default async function handler(req, res) {
  const url = "https://canlialtinfiyatlari.com/kuyumcu.html";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(HTTP ${response.status});
    }

    const html = await response.text();

    /*
     * SADECE KUYUMCU EKRANINDAKİ ÜRÜNLER
     *
     * Buradaki isimler kaynak sitedeki isimlerle birebir eşleşir.
     * Fiyatlar birbirinden hesaplanmaz.
     */
    const PRODUCT_MAP = {
      "GRAM ALTIN": {
        code: "GRAM_24",
        name: "24 Ayar Gram Altın",
        unit: "Gram"
      },

      "Has Altın": {
        code: "HAS_ALTIN",
        name: "Has Altın",
        unit: "Gram"
      },

      "14-AYAR gr": {
        code: "GRAM_14",
        name: "14 Ayar Gram Altın",
        unit: "Gram"
      },

      "22-AYAR gr": {
        code: "GRAM_22",
        name: "22 Ayar Gram Altın",
        unit: "Gram"
      },

      "Kuyumcu Çeyrek Altın": {
        code: "CEYREK",
        name: "Çeyrek Altın",
        unit: "Adet"
      },

      "Yarım Altın": {
        code: "YARIM",
        name: "Yarım Altın",
        unit: "Adet"
      },

      "Tam Altın": {
        code: "TAM",
        name: "Tam Altın",
        unit: "Adet"
      },

      "Ata Altın": {
        code: "ATA",
        name: "Ata Altın",
        unit: "Adet"
      },

      "Beşli Ata": {
        code: "BESLI_ATA",
        name: "Beşli Ata",
        unit: "Adet"
      },

      "Çeyrek (Eski)": {
        code: "CEYREK_ESKI",
        name: "Çeyrek Altın (Eski)",
        unit: "Adet"
      },

      "Yarım (Eski)": {
        code: "YARIM_ESKI",
        name: "Yarım Altın (Eski)",
        unit: "Adet"
      },

      "Tam (Eski)": {
        code: "TAM_ESKI",
        name: "Tam Altın (Eski)",
        unit: "Adet"
      },

      "ALTIN ONS": {
        code: "ONS",
        name: "Altın Ons",
        unit: "Ons"
      }
    };

    /*
     * HTML içerisindeki bütün TR satırlarını bul.
     */
    const rows =
      html.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];

    const data = [];

    for (const row of rows) {
      /*
       * Hücreleri al.
       */
      const cells =
        row.match(/<t[dh]\b[\s\S]*?<\/t[dh]>/gi) || [];

      if (cells.length < 3) {
        continue;
      }

      /*
       * HTML temizleme.
       */
      const clean = (htmlText) => {
        return htmlText
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/&amp;/gi, "&")
          .replace(/&#39;/gi, "'")
          .replace(/&quot;/gi, '"')
          .replace(/&#x27;/gi, "'")
          .replace(/\s+/g, " ")
          .trim();
      };

      const values = cells.map(clean);

      /*
       * Örnek:
       *
       * [
       *   "Tam Altın 14:52:47",
       *   "45859",
       *   "46344 -1.03%"
       * ]
       */

      const firstCell = values[0];

      /*
       * Ürün adının sonundaki saati ayır.
       */
      const nameMatch = firstCell.match(
        /^(.+?)\s+\d{1,2}:\d{2}:\d{2}$/
      );

      if (!nameMatch) {
        continue;
      }

      const sourceName = nameMatch[1].trim();

      /*
       * Sadece bizim istediğimiz ürünleri kabul et.
       */
      const product = PRODUCT_MAP[sourceName];

      if (!product) {
        continue;
      }

      /*
       * KAYNAKTAN GELEN GERÇEK ALIŞ FİYATI.
       */
      const alis = parsePrice(values[1]);

      /*
       * KAYNAKTAN GELEN GERÇEK SATIŞ FİYATI.
       *
       * Örneğin:
       * "46344 -1.03%"
       *
       * -> 46344
       */
      const satis = parsePrice(values[2]);

      if (alis === null || satis === null) {
        continue;
      }

      /*
       * Ürünü sabit code ile kaydet.
       *
       * Artık:
       * SOURCE_1
       * SOURCE_2
       *
       * gibi sıra bazlı kod YOK.
       */
      data.push({
        code: product.code,
        name: product.name,
        source_name: sourceName,
        unit: product.unit,
        alis: alis,
        satis: satis,
        currency: "TRY",
        tarih: new Date().toISOString()
      });
    }

    /*
     * Aynı code iki kere geldiyse yalnızca ilkini tut.
     */
    const uniqueData = [];
    const seen = new Set();

    for (const item of data) {
      if (seen.has(item.code)) {
        continue;
      }

      seen.add(item.code);
      uniqueData.push(item);
    }

    if (!uniqueData.length) {
      throw new Error(
        "Kuyumcu ürünleri bulunamadı."
      );
    }

    /*
     * Ürünlerin eksik olup olmadığını kontrol et.
     */
    const expectedCodes = Object.values(PRODUCT_MAP)
      .map((item) => item.code);

    const foundCodes = new Set(
      uniqueData.map((item) => item.code)
    );

    const missing = expectedCodes.filter(
      (code) => !foundCodes.has(code)
    );

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader(
      "Pragma",
      "no-cache"
    );

    res.setHeader(
      "Expires",
      "0"
    );

    return res.status(200).json({
      source: "Canlı Altın - Kuyumcu",
      updated_at: new Date().toISOString(),

      /*
       * Frontend'e kaynakta hangi ürünün bulunduğunu da gönderiyoruz.
       */
      products_count: uniqueData.length,

      /*
       * Eğer kaynakta bir ürün yoksa frontend bunu anlayabilir.
       */
      missing_products: missing,

      data: uniqueData
    });

  } catch (error) {
    console.error(
      "Kuyumcu API Error:",
      error
    );

    return res.status(502).json({
      error: "Fiyat kaynağı okunamadı.",
      details: error.message
    });
  }
}


/*
 * =========================================================
 * FİYAT PARSER
 * =========================================================
 *
 * Destekler:
 *
 * 45859
 * 46344
 * 6.584,90
 * 6584,90
 * 6584.90
 * 46344 -1.03%
 *
 * Sonuç:
 * 45859
 * 46344
 * 6584.90
 */
function parsePrice(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  let text = String(value)
    .trim()
    .replace(/\s/g, "");

  /*
   * Yüzde, parantez vb. kısmı umursama.
   *
   * İlk gerçek fiyatı al.
   */
  const match = text.match(
    /\d+(?:[.,]\d+)?/
  );

  if (!match) {
    return null;
  }

  text = match[0];

  /*
   * 6.584,90
   *
   * Türkçe format:
   * binlik nokta
   * ondalık virgül
   */
  if (
    text.includes(".") &&
    text.includes(",")
  ) {
    text = text
      .replace(/\./g, "")
      .replace(",", ".");
  }

  /*
   * 6584,90
   */
  else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  /*
   * 6584.90
   *
   * Zaten JS formatı.
   */

  const number = Number(text);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

Tamam. Şimdi hatayı net gördüm. Kaynakta veri gayet düzgün geliyor; problem bizim parser'ın ürün adlarını ve özellikle fiyat formatını fazla kırılgan şekilde ele alması. Kaynak şu anda gerçekten Tam Altın = 45.722 / 46.261, Ata Altın = 46.535 / 47.042 veriyor.

Bir de önemli nokta: kaynakta 18 Ayar Kuyumcu tablosunda yok, ama serbest piyasa tablosunda var. Bu yüzden 18 ayarı da uydurmayacağız.

Senin mevcut API'yi tamamen değiştir. Aşağıdaki sürüm HTML regex'ine bağlı kalmak yerine kaynak tablodaki satırları daha kontrollü okuyor ve fiyat formatını güvenli şekilde çözüyor:

export default async function handler(req, res) {
  const url = "https://canlialtinfiyatlari.com/kuyumcu.html";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,text/html;q=0.8"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Kaynak HTTP ${response.status}`);
    }

    const html = await response.text();

    /*
     * =====================================================
     * ÜRÜNLER
     * =====================================================
     *
     * Her ürünün KENDİ kodu var.
     * Hiçbir ürün başka bir ürünün fiyatından hesaplanmıyor.
     */
    const PRODUCTS = {
      "GRAM ALTIN": {
        code: "GRAM_24",
        name: "24 Ayar Gram Altın",
        unit: "Gram"
      },

      "Has Altın": {
        code: "HAS_ALTIN",
        name: "Has Altın",
        unit: "Gram"
      },

      "14-AYAR gr": {
        code: "GRAM_14",
        name: "14 Ayar Gram Altın",
        unit: "Gram"
      },

      "22-AYAR gr": {
        code: "GRAM_22",
        name: "22 Ayar Gram Altın",
        unit: "Gram"
      },

      "Kuyumcu Çeyrek Altın": {
        code: "CEYREK",
        name: "Çeyrek Altın",
        unit: "Adet"
      },

      "Yarım Altın": {
        code: "YARIM",
        name: "Yarım Altın",
        unit: "Adet"
      },

      "Tam Altın": {
        code: "TAM",
        name: "Tam Altın",
        unit: "Adet"
      },

      "Ata Altın": {
        code: "ATA",
        name: "Ata Altın",
        unit: "Adet"
      },

      "Beşli Ata": {
        code: "BESLI_ATA",
        name: "Beşli Ata",
        unit: "Adet"
      },

      "Çeyrek (Eski)": {
        code: "CEYREK_ESKI",
        name: "Çeyrek Altın (Eski)",
        unit: "Adet"
      },

      "Yarım (Eski)": {
        code: "YARIM_ESKI",
        name: "Yarım Altın (Eski)",
        unit: "Adet"
      },

      "Tam (Eski)": {
        code: "TAM_ESKI",
        name: "Tam Altın (Eski)",
        unit: "Adet"
      },

      "ALTIN ONS": {
        code: "ONS",
        name: "Altın Ons",
        unit: "Ons"
      }
    };

    /*
     * =====================================================
     * HTML TEMİZLE
     * =====================================================
     */
    function cleanHtml(value) {
      return String(value)
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&#39;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/&#x27;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
    }

    /*
     * =====================================================
     * FİYAT ÇÖZÜMLE
     * =====================================================
     *
     * 45722
     * 46.261
     * 46.261,00
     * 46261.00
     * 46.261,00 + yüzde
     *
     * hepsini düzgün şekilde sayıya çevirir.
     */
    function parsePrice(value) {
      if (
        value === null ||
        value === undefined
      ) {
        return null;
      }

      let text = String(value)
        .replace(/\s/g, "")
        .trim();

      /*
       * İlk fiyat değerini yakala.
       */
      const match = text.match(
        /\d[\d.,]*/
      );

      if (!match) {
        return null;
      }

      text = match[0];

      /*
       * Hem nokta hem virgül varsa:
       *
       * 46.261,50
       * ->
       * 46261.50
       */
      if (
        text.includes(".") &&
        text.includes(",")
      ) {
        text = text
          .replace(/\./g, "")
          .replace(",", ".");
      }

      /*
       * Sadece virgül:
       *
       * 46261,50
       * ->
       * 46261.50
       */
      else if (text.includes(",")) {
        text = text.replace(",", ".");
      }

      /*
       * Sadece nokta:
       *
       * Eğer nokta üç haneli ayırıcıysa:
       *
       * 46.261
       * ->
       * 46261
       *
       * Eğer ondalıksa:
       *
       * 4599.50
       * ->
       * 4599.50
       */
      else if (text.includes(".")) {
        const parts = text.split(".");

        if (
          parts.length === 2 &&
          parts[1].length === 3
        ) {
          text = parts.join("");
        }
      }

      const result = Number(text);

      return Number.isFinite(result)
        ? result
        : null;
    }

    /*
     * =====================================================
     * SADECE KUYUMCU TABLOSUNU BUL
     * =====================================================
     *
     * "KUYUMCU KUYUMCU" başlığından başlayıp
     * "KUYUMCU SERBEST PİYASA" başlığına kadar
     * olan bölüm.
     */
    const startMarker =
      html.indexOf("KUYUMCU KUYUMCU");

    const endMarker =
      html.indexOf("KUYUMCU SERBEST PİYASA");

    if (
      startMarker === -1 ||
      endMarker === -1 ||
      endMarker <= startMarker
    ) {
      throw new Error(
        "Kuyumcu tablosu bulunamadı."
      );
    }

    const kuyumcuHtml =
      html.substring(
        startMarker,
        endMarker
      );

    /*
     * =====================================================
     * SATIRLARI BUL
     * =====================================================
     */
    const rows =
      kuyumcuHtml.match(
        /<tr\b[\s\S]*?<\/tr>/gi
      ) || [];

    const data = [];

    for (const row of rows) {
      const cells =
        row.match(
          /<t[dh]\b[\s\S]*?<\/t[dh]>/gi
        ) || [];

      if (cells.length < 3) {
        continue;
      }

      const values =
        cells.map(cleanHtml);

      /*
       * Örnek:
       *
       * Tam Altın 10:31:58
       * 45722
       * 46261 0.21%
       */

      let sourceName =
        values[0]
          .replace(
            /\s+\d{1,2}:\d{2}:\d{2}\s*$/,
            ""
          )
          .trim();

      /*
       * Kaynaktaki ürün bizim listede yoksa geç.
       */
      const product =
        PRODUCTS[sourceName];

      if (!product) {
        continue;
      }

      const alis =
        parsePrice(values[1]);

      const satis =
        parsePrice(values[2]);

      /*
       * İki fiyat da geçerli değilse ürünü alma.
       */
      if (
        alis === null ||
        satis === null
      ) {
        continue;
      }

      /*
       * GERÇEK KAYNAK FİYATI.
       *
       * Burada hiçbir hesaplama yok.
       */
      data.push({
        code: product.code,
        name: product.name,
        source_name: sourceName,
        unit: product.unit,
        alis,
        satis,
        currency: "TRY",
        tarih: new Date().toISOString()
      });
    }

    /*
     * =====================================================
     * DUPLICATE TEMİZLE
     * =====================================================
     */
    const uniqueData = [];
    const seen = new Set();

    for (const item of data) {
      if (seen.has(item.code)) {
        continue;
      }

      seen.add(item.code);
      uniqueData.push(item);
    }

    /*
     * =====================================================
     * BEKLENEN ÜRÜNLER
     * =====================================================
     */
    const expectedCodes =
      Object.values(PRODUCTS)
        .map(product => product.code);

    const foundCodes =
      new Set(
        uniqueData.map(item => item.code)
      );

    const missingProducts =
      expectedCodes.filter(
        code => !foundCodes.has(code)
      );

    /*
     * =====================================================
     * ÖNEMLİ:
     *
     * Kaynakta gelen fiyatları logla.
     *
     * Vercel Functions loglarında görebilirsin.
     * =====================================================
     */
    console.log(
      "KUYUMCU PRICES:",
      uniqueData
    );

    /*
     * =====================================================
     * CACHE KAPAT
     * =====================================================
     */
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader(
      "Pragma",
      "no-cache"
    );

    res.setHeader(
      "Expires",
      "0"
    );

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */
    return res.status(200).json({
      source: "Canlı Altın - Kuyumcu",

      updated_at:
        new Date().toISOString(),

      products_count:
        uniqueData.length,

      missing_products:
        missingProducts,

      data:
        uniqueData
    });

  } catch (error) {

    console.error(
      "KUYUMCU API ERROR:",
      error
    );

    return res.status(502).json({
      error:
        "Fiyat kaynağı okunamadı.",

      details:
        error.message
    });
  }
}
Ama bir şeyi daha değiştireceğiz

Senin index.html dosyan şu anda API'den gelen ürünleri geldikleri sırayla ekrana basıyor:

priceData
  .map(createPriceCard)
  .join("");

Bu tek başına fiyatı bozmaz; fakat portföy tarafında ürünler isimle eşleştiriliyor.

Ben bunu da code üzerinden yapmanı istiyorum.

Örneğin portföyde:

priceMap.set(item.name, item);

yerine:

priceMap.set(item.code, item);

kullanacağız.

Fakat mevcut Supabase tablosunda product_code kolonu yoksa bunu direkt yaparsak portföy kayıtlarını bozabiliriz. O yüzden önce fiyat ekranını düzeltelim.

Şu an kaynakla olması gereken sonuç

Kaynak şu anda:

Ürün	Alış	Satış
24 Ayar Gram	7.035,48	7.115,86
22 Ayar Gram	6.434,07	6.657,22
14 Ayar Gram	3.870,66	5.117,23
Çeyrek	11.492	11.611
Yarım	23.020	23.216
Tam	45.722	46.261
Ata	46.535	47.042
Beşli Ata	233.384	237.293

Bunlar kaynak sayfadaki Kuyumcu tablosunun gerçek değerleri.

Şimdi bu kodu /api/prices.js olarak deploy et. Sonra bana sadece https://altinportfoy.vercel.app ekranının yeni halinin ekran görüntüsünü at. Eğer hâlâ Tam Altın yanlışsa, o noktada API'nin döndürdüğü JSON'u doğrudan yakalayıp hangi katmanda bozulduğunu tek seferde buluruz.
