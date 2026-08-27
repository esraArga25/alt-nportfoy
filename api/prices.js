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
     * Sayfadaki bütün tablo satırlarını alıyoruz.
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
       * Hücre içindeki HTML'i temizle.
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
          .replace(/\s+/g, " ")
          .trim();
      }

      const values = cells.map(clean);

      /*
       * Gerçek kaynak yapısı:
       *
       * [ "GRAM ALTIN 03:21:52", "7032.88", "7119.19 -0.36%" ]
       *
       * veya bazı sayfalarda:
       *
       * [ "GRAM ALTIN 03:21:52", "7032.88", "7119.19", "-0.36%" ]
       */

      const firstCell = values[0];

      /*
       * Ürün + saat ayrıştır.
       */
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
       * Başlık satırlarını ve diğer tabloları ele.
       */
      if (
        name === "KUYUMCU KUYUMCU" ||
        name === "ALIŞ" ||
        name === "SATIŞ" ||
        name.includes("SERBEST PİYASA")
      ) {
        continue;
      }

      /*
       * Alış fiyatı ikinci hücre.
       */
      const alis =
        parsePrice(values[1]);

      /*
       * Satış fiyatı üçüncü hücre.
       * Eğer yüzde de aynı hücredeyse parsePrice
       * sadece ilk fiyatı alacak.
       */
      const satis =
        parsePrice(values[2]);

      if (
        alis === null ||
        satis === null
      ) {
        continue;
      }

      /*
       * Sadece Kuyumcu tablosundaki ürünleri almak için
       * bilinen ürünleri kontrol ediyoruz.
       *
       * Burada isimleri değiştirmiyoruz.
       * Kaynaktaki isim aynen kullanılıyor.
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

      if (!allowed.includes(name)) {
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
     * Aynı ürünü iki kere alma.
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

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

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


/*
 * Kaynaktan gelen fiyatı doğru sayıya çevirir.
 *
 * 7032.88  -> 7032.88
 * 7119.19  -> 7119.19
 * 11484    -> 11484
 * 6.584,90 -> 6584.90
 */
function parsePrice(value) {

  if (!value) {
    return null;
  }

  let text =
    String(value)
      .trim()
      .replace(/\s/g, "");

  /*
   * İlk fiyatı al.
   *
   * Örneğin:
   * "7119.19-0.36%"
   *
   * sadece:
   * "7119.19"
   */
  const match =
    text.match(
      /-?\d+(?:[.,]\d+)?/
    );

  if (!match) {
    return null;
  }

  text = match[0];

  /*
   * Türkçe:
   * 6.584,90
   */
  if (
    text.includes(".") &&
    text.includes(",")
  ) {
    text =
      text
        .replace(/\./g, "")
        .replace(",", ".");
  }

  /*
   * 6584,90
   */
  else if (text.includes(",")) {
    text =
      text.replace(",", ".");
  }

  /*
   * 6584.90
   * Burada noktaya DOKUNMUYORUZ.
   */

  const number =
    Number(text);

  return Number.isFinite(number)
    ? number
    : null;
}
