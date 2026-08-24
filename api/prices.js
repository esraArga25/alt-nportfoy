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
     * Sadece KUYUMCU tablosunu alıyoruz.
     */
    const startMarker = "KUYUMCU KUYUMCU";
    const endMarker = "KUYUMCU SERBEST PİYASA";

    const start = html.indexOf(startMarker);
    const end = html.indexOf(endMarker);

    if (start === -1) {
      throw new Error("Kuyumcu tablosu bulunamadı.");
    }

    const section =
      end > start
        ? html.substring(start, end)
        : html.substring(start);

    /*
     * HTML'i okunabilir metne çeviriyoruz.
     */
    const text = section
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<\/td>/gi, " | ")
      .replace(/<\/th>/gi, " | ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ");

    const lines = text
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);

    const data = [];

    for (const line of lines) {

      /*
       * Örnek:
       *
       * GRAM ALTIN | 15:40:34 | 6584.90 | 6649.83 -1.34%
       */

      const match = line.match(
        /^(.+?)\s*\|\s*(\d{1,2}:\d{2}:\d{2})\s*\|\s*([0-9.,]+)\s*\|\s*([0-9.,]+)/
      );

      if (!match) {
        continue;
      }

      const name = match[1]
        .replace(/\|/g, "")
        .trim();

      const time = match[2];

      const alis = parseSourceNumber(match[3]);
      const satis = parseSourceNumber(match[4]);

      if (
        !name ||
        alis === null ||
        satis === null
      ) {
        continue;
      }

      let unit = "Adet";

      if (
        /GRAM/i.test(name) ||
        /\bgr\b/i.test(name)
      ) {
        unit = "Gram";
      }

      if (/ONS/i.test(name)) {
        unit = "Ons";
      }

      data.push({
        code: `SOURCE_${data.length + 1}`,
        name: name,
        unit: unit,
        alis: alis,
        satis: satis,
        kaynak_saati: time
      });
    }

    if (!data.length) {
      throw new Error(
        "Kuyumcu ürünleri okunamadı."
      );
    }

    return res.status(200).json({
      source: "Canlı Altın - Kuyumcu",
      updated_at: new Date().toISOString(),
      data
    });

  } catch (error) {
    return res.status(502).json({
      error: "Fiyat kaynağı okunamadı.",
      details: error.message
    });
  }
}


/*
 * Kaynaktan gelen sayı:
 *
 * 6584.90  -> 6584.90
 * 6649.83  -> 6649.83
 * 10720    -> 10720
 * 6.584,90 -> 6584.90
 *
 * Noktalı ondalık değeri ASLA
 * 658490 yapmıyoruz.
 */
function parseSourceNumber(value) {
  if (!value) {
    return null;
  }

  let text = String(value).trim();

  /*
   * Türkçe format:
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
   * Sadece virgül:
   * 6584,90
   */
  else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  /*
   * Sadece nokta:
   * 6584.90
   *
   * DOKUNMUYORUZ.
   */

  const number = Number(text);

  return Number.isFinite(number)
    ? number
    : null;
}
