export default async function handler(req, res) {
  const sources = [
    {
      name: "Canlı Altın - Kuyumcu",
      url: "https://canlialtinfiyatlari.com/kuyumcu.html"
    }
  ];

  try {
    const response = await fetch(sources[0].url, {
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
     * Sayfadaki tablo satırını bulur.
     * Fiyat olarak sadece <td> içindeki alış/satış
     * hücrelerini kullanırız.
     *
     * Böylece 03:21:52 gibi saatleri fiyat sanmaz.
     */
    function findRow(label) {
      const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

      for (const row of rows) {
        const cleanRow = row
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (
          cleanRow
            .toLowerCase()
            .includes(label.toLowerCase())
        ) {
          const cells =
            row.match(/<td[\s\S]*?<\/td>/gi) || [];

          const values = [];

          for (const cell of cells) {
            const text = cell
              .replace(/<[^>]+>/g, " ")
              .replace(/&nbsp;/gi, " ")
              .replace(/\s+/g, " ")
              .trim();

            /*
             * Hücredeki tüm sayıları bul.
             */
            const matches =
              text.match(/\d+(?:[.,]\d+)?/g) || [];

            for (const value of matches) {
              const number = Number(
                value.replace(",", ".")
              );

              if (
                Number.isFinite(number) &&
                number > 100
              ) {
                values.push(number);
              }
            }
          }

          /*
           * İlk iki büyük sayı alış ve satış.
           */
          if (values.length >= 2) {
            return {
              alis: values[0],
              satis: values[1]
            };
          }
        }
      }

      return null;
    }

    const products = [];

    /*
     * 24 AYAR GRAM
     */
    const gram = findRow("GRAM ALTIN");

    if (gram) {
      products.push({
        code: "ALTIN",
        name: "24 Ayar Gram Altın",
        unit: "Gram",
        alis: gram.alis,
        satis: gram.satis
      });
    }

    /*
     * 22 AYAR BİLEZİK
     *
     * Canlı Altın kuyumcu ekranındaki
     * 22-AYAR gr verisi kullanılır.
     *
     * Bu, 22 ayar gram altın kartından
     * AYRI bir ürün olarak gösterilir.
     */
    const bilezik = findRow("22-AYAR gr");

    if (bilezik) {
      products.push({
        code: "BILEZIK22",
        name: "22 Ayar Bilezik Gram Fiyatı",
        unit: "Gram",
        alis: bilezik.alis,
        satis: bilezik.satis
      });
    }

    /*
     * ÇEYREK
     */
    const ceyrek = findRow(
      "Kuyumcu Çeyrek Altın"
    );

    if (ceyrek) {
      products.push({
        code: "CEYREK",
        name: "Çeyrek Altın",
        unit: "Adet",
        alis: ceyrek.alis,
        satis: ceyrek.satis
      });
    }

    /*
     * YARIM
     */
    const yarim = findRow("Yarım Altın");

    if (yarim) {
      products.push({
        code: "YARIM",
        name: "Yarım Altın",
        unit: "Adet",
        alis: yarim.alis,
        satis: yarim.satis
      });
    }

    /*
     * TAM
     */
    const tam = findRow("Tam Altın");

    if (tam) {
      products.push({
        code: "TAM",
        name: "Tam Altın",
        unit: "Adet",
        alis: tam.alis,
        satis: tam.satis
      });
    }

    /*
     * ATA
     */
    const ata = findRow("Ata Altın");

    if (ata) {
      products.push({
        code: "ATA",
        name: "Ata Altın",
        unit: "Adet",
        alis: ata.alis,
        satis: ata.satis
      });
    }

    /*
     * CUMHURİYET
     *
     * Öncelikle Cumhuriyet Altını satırını arıyoruz.
     */
    const cumhuriyet = findRow(
      "Cumhuriyet Altını"
    );

    if (cumhuriyet) {
      products.push({
        code: "CUMHURIYET",
        name: "Cumhuriyet Altını",
        unit: "Adet",
        alis: cumhuriyet.alis,
        satis: cumhuriyet.satis
      });
    }

    /*
     * 22 AYAR ALTIN
     *
     * Bilezik ile aynı fiyatı KULLANMIYORUZ.
     *
     * Canlı Altın kuyumcu ekranında ayrı bir
     * 22 ayar gram altın kotasyonu bulunmuyorsa
     * burada sahte fiyat üretmiyoruz.
     */
    const serbestResponse = await fetch(
      "https://canlialtinfiyatlari.com/altin/anlik-altin",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html"
        },
        cache: "no-store"
      }
    );

    if (serbestResponse.ok) {
      const serbestHtml =
        await serbestResponse.text();

      const rows =
        serbestHtml.match(/<tr[\s\S]*?<\/tr>/gi) ||
        [];

      for (const row of rows) {
        const text = row
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (
          text
            .toLowerCase()
            .startsWith("22 ayar altın")
        ) {
          const cells =
            row.match(/<td[\s\S]*?<\/td>/gi) ||
            [];

          const values = [];

          for (const cell of cells) {
            const cellText = cell
              .replace(/<[^>]+>/g, " ")
              .replace(/&nbsp;/gi, " ")
              .trim();

            const nums =
              cellText.match(
                /\d+(?:[.,]\d+)?/g
              ) || [];

            for (const value of nums) {
              const number = Number(
                value.replace(",", ".")
              );

              if (
                Number.isFinite(number) &&
                number > 100
              ) {
                values.push(number);
              }
            }
          }

          if (values.length >= 2) {
            products.push({
              code: "22AYAR",
              name: "22 Ayar Altın",
              unit: "Gram",
              alis: values[0],
              satis: values[1]
            });
          }

          break;
        }
      }
    }

    if (!products.length) {
      throw new Error(
        "Hiçbir fiyat verisi okunamadı."
      );
    }

    return res.status(200).json({
      source: "Canlı Altın",
      updated_at: new Date().toISOString(),
      data: products
    });

  } catch (error) {
    return res.status(502).json({
      error: "Altın fiyatları alınamadı.",
      details: error.message
    });
  }
}
