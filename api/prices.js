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

    // Kuyumcu tablosunu bul
    const start = html.indexOf("KUYUMCU KUYUMCU");
    const end = html.indexOf("KUYUMCU SERBEST PİYASA");

    if (start === -1) {
      throw new Error("Kuyumcu tablosu bulunamadı.");
    }

    const tableHtml =
      end > start
        ? html.slice(start, end)
        : html.slice(start);

    // Tablo satırlarını al
    const rows =
      tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];

    const data = [];

    for (const row of rows) {
      const cells =
        row.match(/<td[\s\S]*?<\/td>/gi) || [];

      // Ürün + alış + satış olması gerekiyor
      if (cells.length < 3) {
        continue;
      }

      const cleanCell = (htmlCell) => {
        return htmlCell
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/&amp;/gi, "&")
          .replace(/\s+/g, " ")
          .trim();
      };

      const cellValues = cells.map(cleanCell);

      /*
       * İlk hücre:
       *
       * GRAM ALTIN 15:40:34
       *
       * Buradan saati çıkarıyoruz.
       */
      let name = cellValues[0]
        .replace(/\b\d{1,2}:\d{2}:\d{2}\b/g, "")
        .trim();

      if (!name) {
        continue;
      }

      /*
       * Alış ve satış doğrudan 2. ve 3. hücre.
       *
       * Böylece:
       *
       * 6584.90 -> 6584.90
       *
       * olarak kalıyor.
       *
       * 10.720 gibi Türkçe binlik formatı
       * gelirse de doğru şekilde ele alıyoruz.
       */
      const alis = parsePrice(cellValues[1]);
      const satis = parsePrice(cellValues[2]);

      if (
        alis === null ||
        satis === null
      ) {
        continue;
      }

      /*
       * Kaynakta ürünün adı neyse
       * onu aynen kullanıyoruz.
       */
      let unit = "Adet";

      if (
        /\bgr\b/i.test(name) ||
        /GRAM/i.test(name)
      ) {
        unit = "Gram";
      } else if (
        /ONS/i.test(name)
      ) {
        unit = "Ons";
      }

      data.push({
        code: `SOURCE_${data.length}`,
        name: name,
        unit: unit,
        alis: alis,
        satis: satis,
        tarih: new Date().toISOString()
      });
    }

    if (!data.length) {
      throw new Error(
        "Kuyumcu fiyatları okunamadı."
      );
    }

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return res.status(200).json({
      source: "Canlı Altın - Kuyumcu",
      updated_at: new Date().toISOString(),
      data: data
    });

  } catch (error) {
    return res.status(502).json({
      error:
        "Canlı Altın kuyumcu verileri alınamadı.",
      details: error.message
    });
  }
}


/*
 * Fiyatı doğru şekilde sayıya çevirir.
 *
 * Kaynak:
 * 6584.90  -> 6584.90
 * 10720    -> 10720
 *
 * Eğer kaynak:
 * 6.584,90 -> 6584.90
 *
 * şeklinde gelirse onu da destekler.
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
    .replace(/[^\d.,-]/g, "");

  if (!text) {
    return null;
  }

  /*
   * 6.584,90
   * Türkçe format
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
   * ZATEN doğru format.
   * Noktayı silmiyoruz.
   */

  const number = Number(text);

  return Number.isFinite(number)
    ? number
    : null;
}
