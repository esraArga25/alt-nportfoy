export default async function handler(req, res) {
  const sources = [
    {
      name: "Turkpidya / Harem Altın",
      url: "https://turkpidya.com/wp-json/turkpidya-data/v1/gold",

      normalize: (payload) => {
        if (!payload || !Array.isArray(payload.prices)) {
          throw new Error("Unexpected primary payload");
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

        return payload.prices
          .filter((item) => codeMap[item.type])
          .map((item) => ({
            code: codeMap[item.type],
            name: getName(codeMap[item.type]),
            alis: toNumber(item.buy),
            satis: toNumber(item.sell),
            degisim: toNumber(item.change_percent),
            tarih:
              payload.last_updated ||
              payload.price_date ||
              null
          }));
      }
    },

    {
      name: "Kapalıçarşı API",
      url: "https://kapalicarsi.apiluna.org/",

      normalize: (payload) => {
        if (!Array.isArray(payload)) {
          throw new Error("Unexpected fallback payload");
        }

        const codeMap = {
          ALTIN: "ALTIN",
          GRAM: "ALTIN",
          GRAM24: "ALTIN",

          AYAR22: "22AYAR",
          GRAM22: "22AYAR",
          "22AYAR": "22AYAR",

          CEYREK: "CEYREK_YENI",
          CEYREK_YENI: "CEYREK_YENI",

          YARIM: "YARIM_YENI",
          YARIM_YENI: "YARIM_YENI",

          TAM: "TAM_YENI",
          TAM_YENI: "TAM_YENI",

          ATA: "ATA_YENI",
          ATA_YENI: "ATA_YENI",

          CUMHURIYET: "CUMHURIYET",

          GREMSE: "GREMSE_YENI",
          GREMSE_YENI: "GREMSE_YENI"
        };

        return payload
          .map((item) => {
            const originalCode = String(
              item.code || ""
            ).toUpperCase();

            const code = codeMap[originalCode];

            if (!code) return null;

            return {
              code,
              name: getName(code),
              alis: toNumber(item.alis),
              satis: toNumber(item.satis),
              degisim: toNumber(
                item.degisim ??
                item.change ??
                item.change_percent
              ),
              tarih: item.tarih || null
            };
          })
          .filter(Boolean);
      }
    }
  ];

  function getName(code) {
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

    return names[code] || code;
  }

  function toNumber(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    let text = String(value).trim();

    if (text.includes(",") && text.includes(".")) {
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

  const errors = [];

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        method: "GET",

        headers: {
          Accept: "application/json",
          "User-Agent": "AltinPortfoy/3.0"
        },

        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const payload = await response.json();

      const data = source.normalize(payload);

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Empty data");
      }

      // Aynı ürün birden fazla geldiyse son kaydı kullan.
      const unique = new Map();

      for (const item of data) {
        if (item.code) {
          unique.set(item.code, item);
        }
      }

      const finalData = Array.from(
        unique.values()
      );

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
      );

      return res.status(200).json({
        source: source.name,
        updated_at: new Date().toISOString(),
        data: finalData
      });

    } catch (error) {
      errors.push(
        `${source.name}: ${error.message}`
      );
    }
  }

  return res.status(502).json({
    error:
      "Fiyat kaynaklarına şu anda ulaşılamıyor.",
    details: errors
  });
}
