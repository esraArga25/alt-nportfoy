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

    const products = [];

    function getPrice(label) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(
        escaped +
        "[\\s\\S]{0,500}?" +
        "(\\d+(?:\\.\\d+)?)\\s*" +
        "(\\d+(?:\\.\\d+)?)"
      );

      const match = html.match(regex);

      if (!match) return null;

      return {
        alis: Number(match[1]),
        satis: Number(match[2])
      };
    }

    const definitions = [
      {
        code: "ALTIN",
        name: "24 Ayar Gram Altın",
        label: "GRAM ALTIN"
      },
      {
        code: "22AYAR",
        name: "22 Ayar Gram Altın",
        label: "22-AYAR gr"
      },
      {
        code: "CEYREK_YENI",
        name: "Çeyrek Altın",
        label: "Kuyumcu Çeyrek Altın"
      },
      {
        code: "YARIM_YENI",
        name: "Yarım Altın",
        label: "Yarım Altın"
      },
      {
        code: "TAM_YENI",
        name: "Tam Altın",
        label: "Tam Altın"
      },
      {
        code: "ATA_YENI",
        name: "Ata Altın",
        label: "Ata Altın"
      }
    ];

    for (const item of definitions) {
      const price = getPrice(item.label);

      if (price) {
        products.push({
          code: item.code,
          name: item.name,
          alis: price.alis,
          satis: price.satis,
          tarih: new Date().toISOString()
        });
      }
    }

    if (!products.length) {
      throw new Error("Kuyumcu fiyatları okunamadı");
    }

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return res.status(200).json({
      source: "Canlı Altın - Kuyumcu",
      updated_at: new Date().toISOString(),
      data: products
    });

  } catch (error) {
    return res.status(502).json({
      error: "Canlı Altın fiyatları alınamadı.",
      details: error.message
    });
  }
}
