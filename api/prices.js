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
     * Kuyumcu tablosunu bul.
     * KUYUMCU SERBEST PİYASA başlamadan önceki
     * tabloyu kullanıyoruz.
     */

    const start =
      html.indexOf("KUYUMCU KUYUMCU");

    const end =
      html.indexOf("KUYUMCU SERBEST PİYASA");

    if (start === -1) {
      throw new Error("Kuyumcu tablosu bulunamadı.");
    }

    const tableHtml =
      end > start
        ? html.substring(start, end)
        : html.substring(start);


    /*
     * Satırları bul.
     */

    const rows =
      tableHtml.match(
        /<tr[\s\S]*?<\/tr>/gi
      ) || [];


    const data = [];


    for (const row of rows) {

      /*
       * Hücreleri bul.
       */

      const cells =
        row.match(
          /<td[\s\S]*?<\/td>/gi
        ) || [];

      if (cells.length < 2) {
        continue;
      }


      /*
       * HTML etiketlerini temizle.
       */

      const values =
        cells.map(cell =>
          cell
            .replace(
              /<script[\s\S]*?<\/script>/gi,
              ""
            )
            .replace(
              /<style[\s\S]*?<\/style>/gi,
              ""
            )
            .replace(
              /<[^>]+>/g,
              " "
            )
            .replace(
              /&nbsp;/gi,
              " "
            )
            .replace(
              /&amp;/gi,
              "&"
            )
            .replace(
              /\s+/g,
              " "
            )
            .trim()
        );


      const name = values[0];

      if (!name) {
        continue;
      }


      /*
       * Ürün satırının fiyatlarını hücrelerden al.
       *
       * Saat bilgisini dikkate almıyoruz.
       */

      const numbers = [];

      for (let i = 1; i < values.length; i++) {

        const text = values[i];

        /*
         * Saatleri temizle:
         * 15:40:34
         */

        const cleaned =
          text.replace(
            /\b\d{1,2}:\d{2}:\d{2}\b/g,
            ""
          );


        /*
         * Yüzde bilgisini temizle.
         */

        const withoutPercent =
          cleaned.replace(
            /[-+]?\d+(?:[.,]\d+)?\s*%/g,
            ""
          );


        /*
         * Sayıları bul.
         */

        const matches =
          withoutPercent.match(
            /\d+(?:[.,]\d+)?/g
          ) || [];


        for (const value of matches) {

          const number =
            Number(
              value
                .replace(/\./g, "")
                .replace(",", ".")
            );

          if (
            Number.isFinite(number)
          ) {
            numbers.push(number);
          }
        }
      }


      /*
       * En az alış + satış olmalı.
       */

      if (numbers.length < 2) {
        continue;
      }


      /*
       * Kaynaktaki ismi aynen koruyoruz.
       */

      data.push({
        code:
          "SOURCE_" +
          data.length,

        name: name,

        unit:
          name.includes("gr") ||
          name.includes("GRAM") ||
          name.includes("AYAR")
            ? "Gram"
            : "Adet",

        alis: numbers[0],

        satis: numbers[1],

        tarih:
          new Date().toISOString()
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

      source:
        "Canlı Altın - Kuyumcu",

      updated_at:
        new Date().toISOString(),

      data: data

    });


  } catch (error) {

    return res.status(502).json({

      error:
        "Canlı Altın kuyumcu verileri alınamadı.",

      details:
        error.message

    });
  }
}
