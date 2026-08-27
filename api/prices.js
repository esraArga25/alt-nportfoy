export default async function handler(req, res) {
  const url = "https://canlialtinfiyatlari.com/kuyumcu.html";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        "Accept": "text/html"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Kaynak HTTP ${response.status}`);
    }

    const html = await response.text();

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

    function clean(value) {
      return String(value)
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
    }

    function parsePrice(value) {
      if (!value) {
        return null;
      }

      let text = String(value)
        .trim()
        .replace(/\s/g, "");

      /*
       * İlk fiyatı al.
       *
       * Örnek:
       * 46261-0.21%
       * 46.261,00
       * 46261
       */
      const match = text.match(/\d[\d.,]*/);

      if (!match) {
        return null;
      }

      text = match[0];

      /*
       * 46.261,50
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
       * 46261,50
       */
      else if (text.includes(",")) {
        text = text.replace(",", ".");
      }

      /*
       * 46.261
       *
       * Kuyumcu fiyatlarında bu binlik ayırıcıdır.
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

      const number = Number(text);

      return Number.isFinite(number)
        ? number
        : null;
    }

    /*
     * BÜTÜN TABLO SATIRLARINI AL.
     */
    const rows =
      html.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];

    const data = [];

    for (const row of rows) {
      const cells =
        row.match(
          /<t[dh]\b[\s\S]*?<\/t[dh]>/gi
        ) || [];

      if (cells.length < 3) {
        continue;
      }

      const values = cells.map(clean);

      /*
       * İlk hücre:
       *
       * "Tam Altın 09:31:22"
       *
       * saat kısmını çıkar.
       */
      const sourceName =
        values[0]
          .replace(
            /\s+\d{1,2}:\d{2}:\d{2}\s*$/,
            ""
          )
          .trim();

      const product =
        PRODUCTS[sourceName];

      /*
       * Bizim ürün değilse geç.
       */
      if (!product) {
        continue;
      }

      const alis =
        parsePrice(values[1]);

      const satis =
        parsePrice(values[2]);

      if (
        alis === null ||
        satis === null
      ) {
        continue;
      }

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
     * DUPLICATE TEMİZLE.
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
        "Kaynak sayfada hiçbir kuyumcu ürünü bulunamadı."
      );
    }

    /*
     * Ürünleri istediğimiz sıraya koy.
     */
    const ORDER = [
      "GRAM_24",
      "HAS_ALTIN",
      "GRAM_22",
      "GRAM_14",
      "CEYREK",
      "YARIM",
      "TAM",
      "ATA",
      "BESLI_ATA",
      "CEYREK_ESKI",
      "YARIM_ESKI",
      "TAM_ESKI",
      "ONS"
    ];

    uniqueData.sort(
      (a, b) =>
        ORDER.indexOf(a.code) -
        ORDER.indexOf(b.code)
    );

    /*
     * EKSİK ÜRÜNLER.
     */
    const found =
      new Set(
        uniqueData.map(item => item.code)
      );

    const missing_products =
      Object.values(PRODUCTS)
        .map(item => item.code)
        .filter(code => !found.has(code));

    /*
     * CACHE KAPAT.
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
     * JSON.
     */
    return res.status(200).json({
      source: "Canlı Altın - Kuyumcu",
      updated_at: new Date().toISOString(),
      products_count: uniqueData.length,
      missing_products,
      data: uniqueData
    });

  } catch (error) {

    console.error(
      "PRICE API ERROR:",
      error
    );

    /*
     * FRONTEND'İN JSON PARSE HATASI VERMEMESİ İÇİN
     * HATA DURUMUNDA DA JSON DÖNDÜR.
     */
    res.setHeader(
      "Content-Type",
      "application/json; charset=utf-8"
    );

    return res.status(500).json({
      error: "Fiyat API hatası",
      details: error?.message || String(error)
    });
  }
}
