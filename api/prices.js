export default async function handler(req, res) {
  const url = "https://canlialtinfiyatlari.com/kuyumcu.html";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    /*
     * =====================================================
     * ÜRÜNLER
     * =====================================================
     */
    const allowed = [
      "GRAM ALTIN",
      "Has Altın",
      "14-AYAR gr",
      "22-AYAR gr",
      "Kuyumcu Çeyrek Altın",
      "Yarım Altın",
      "Tam Altın",
      "Ata Altın",
      "Beşli Ata",
      "Çeyrek (Eski)",
      "Yarım (Eski)",
      "Tam (Eski)",
      "ALTIN ONS"
    ];

    /*
     * =====================================================
     * HTML TEMİZLEME
     * =====================================================
     */
    function clean(htmlText) {
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
    }

    /*
     * =====================================================
     * ALIŞ FİYATI
     * =====================================================
     *
     * Mevcut çalışan alış parser'ın aynısı.
     */
    function parsePrice(value) {
      if (!value) {
        return null;
      }

      let text = String(value)
        .trim()
        .replace(/\s/g, "");

      const match = text.match(
        /-?\d+(?:[.,]\d+)?/
      );

      if (!match) {
        return null;
      }

      text = match[0];

      /*
       * 6.584,90
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
       * Burada değiştirmiyoruz.
       */

      const number = Number(text);

      return Number.isFinite(number)
        ? number
        : null;
    }

    /*
     * =====================================================
     * SATIŞ FİYATI
     * =====================================================
     *
     * Kaynakta satış hücresinde bazı ürünlerde:
     *
     * 11607.00
     * 23208.00
     * 46245.00
     * 47026.00
     *
     * gibi değerler geliyor.
     *
     * Bunların:
     *
     * 11607
     * 23208
     * 46245
     * 47026
     *
     * olması gerekiyor.
     *
     * Ayrıca:
     *
     * 11.607,00
     *
     * formatını da destekliyor.
     */
    function parseSalePrice(value) {
      if (!value) {
        return null;
      }

      let text = String(value)
        .trim()
        .replace(/\s/g, "");

      /*
       * Yüzde bilgisinden ÖNCEKİ fiyatı al.
       *
       * Örnek:
       *
       * 11607.00-0.21%
       *
       * -> 11607.00
       */
      const match = text.match(
        /^\d+(?:[.,]\d+)*/
      );

      if (!match) {
        return null;
      }

      text = match[0];

      /*
       * 11.607,00
       *
       * -> 11607.00
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
       * 11607,00
       *
       * -> 11607.00
       */
      else if (text.includes(",")) {
        text = text.replace(",", ".");
      }

      /*
       * 11607.00
       *
       * -> 11607
       *
       * Buradaki .00 kuruş bilgisidir.
       */
      else if (text.includes(".")) {
        const parts = text.split(".");

        if (
          parts.length === 2 &&
          parts[1].length === 2
        ) {
          text = parts[0];
        }

        /*
         * 11.607
         *
         * -> 11607
         */
        else if (
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
     * =====================================================
     * TABLO SATIRLARI
     * =====================================================
     */
    const rows =
      html.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];

    const data = [];

    for (const row of rows) {

      /*
       * Hücreleri al.
       */
      const cells =
        row.match(
          /<t[dh]\b[\s\S]*?<\/t[dh]>/gi
        ) || [];

      if (cells.length < 3) {
        continue;
      }

      const values =
        cells.map(clean);

      /*
       * İlk hücre:
       *
       * Tam Altın 14:52:47
       *
       * saat kısmını kaldır.
       */
      const firstCell = values[0];

      const nameMatch =
        firstCell.match(
          /^(.+?)\s+\d{1,2}:\d{2}:\d{2}$/
        );

      if (!nameMatch) {
        continue;
      }

      const name =
        nameMatch[1].trim();

      /*
       * Bizim ürün değilse geç.
       */
      if (!allowed.includes(name)) {
        continue;
      }

      /*
       * ===================================================
       * ALIŞ
       * ===================================================
       */
      const alis =
        parsePrice(values[1]);

      /*
       * ===================================================
       * SATIŞ
       * ===================================================
       */
      const satis =
        parseSalePrice(values[2]);

      if (
        alis === null ||
        satis === null
      ) {
        continue;
      }

      /*
       * Birim.
       */
      let unit = "Adet";

      if (
        name === "GRAM ALTIN" ||
        name === "Has Altın" ||
        name === "14-AYAR gr" ||
        name === "22-AYAR gr"
      ) {
        unit = "Gram";
      }

      if (name === "ALTIN ONS") {
        unit = "Ons";
      }

      /*
       * Kaynaktaki isim aynen korunuyor.
       */
      data.push({
        code: `SOURCE_${data.length + 1}`,
        name: name,
        unit: unit,
        alis: alis,
        satis: satis,
        tarih: new Date().toISOString()
      });
    }

    /*
     * =====================================================
     * AYNI ÜRÜNÜ İKİ KEZ ALMA
     * =====================================================
     */
    const uniqueData = [];
    const seen = new Set();

    for (const item of data) {
      if (seen.has(item.name)) {
        continue;
      }

      seen.add(item.name);
      uniqueData.push(item);
    }

    if (!uniqueData.length) {
      throw new Error(
        "Kuyumcu ürünleri bulunamadı."
      );
    }

    /*
     * =====================================================
     * CACHE KAPAT
     * =====================================================
     */
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
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
     * JSON
     * =====================================================
     */
    return res.status(200).json({
      source: "Canlı Altın - Kuyumcu",
      updated_at: new Date().toISOString(),
      data: uniqueData
    });

  } catch (error) {

    console.error(error);

    return res.status(502).json({
      error: "Fiyat kaynağı okunamadı.",
      details: error.message
    });
  }
}
