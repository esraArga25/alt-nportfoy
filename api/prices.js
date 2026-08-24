export default async function handler(req, res) {
  const url = "https://turkpidya.com/wp-json/turkpidya-data/v1/gold";

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AltinPortfoy/4.0"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();

    if (!payload || !Array.isArray(payload.prices)) {
      throw new Error("Beklenmeyen API cevabı");
    }

    const codeMap = {
      gram_24k: "ALTIN",
      gram_22k: "22AYAR",
      ceyrek: "CEYREK_YENI",
      yarim: "YARIM_YENI",
      tam: "TAM_YENI",
      ata: "ATA_YENI",
      cumhuriyet: "CUMHURIYET",
      gremse: "GREMSE_YENI"
    };

    const names = {
      ALTIN: "24 Ayar Gram Altın",
      "22AYAR": "22 Ayar Gram Altın",
      CEYREK_YENI: "Çeyrek Altın",
      YARIM_YENI: "Yarım Altın",
      TAM_YENI: "Tam Altın",
      ATA_YENI: "Ata Altın",
      CUMHURIYET: "Cumhuriyet Altını",
      GREMSE_YENI: "Gremse Altın"
    };

    const data = payload.prices
      .filter(item => codeMap[item.type])
      .map(item => {
        const code = codeMap[item.type];

        return {
          code: code,
          name: names[code],
          alis: toNumber(item.buy),
          satis: toNumber(item.sell),
          degisim: toNumber(item.change_percent),
          tarih:
            payload.last_updated ||
            payload.price_date ||
            null
        };
      });

    if (!data.length) {
      throw new Error("Ürün verisi bulunamadı");
    }

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return res.status(200).json({
      source: "Turkpidya / Harem Altın",
      updated_at: new Date().toISOString(),
      data: data
    });

  } catch (error) {
    return res.status(502).json({
      error: "Fiyat kaynağına ulaşılamadı.",
      details: error.message
    });
  }
}

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  let text = String(value).trim();

  // 6.270,87 → 6270.87
  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    text = text
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  text = text.replace(/[^\d.-]/g, "");

  const number = Number(text);

  return Number.isFinite(number)
    ? number
    : null;
}
