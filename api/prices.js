export default async function handler(req, res) {
  const sources = [
    {
      name: 'Turkpidya / Harem Altın',
      url: 'https://turkpidya.com/wp-json/turkpidya-data/v1/gold',
      normalize: (payload) => {
        if (!payload || !Array.isArray(payload.prices)) throw new Error('Unexpected primary payload');
        const codeMap = {
          gram_24k: 'ALTIN',
          gram_22k: '22AYAR',
          ceyrek: 'CEYREK_YENI',
          yarim: 'YARIM_YENI',
          tam: 'TAM_YENI',
          ata: 'ATA_YENI',
          cumhuriyet: 'CUMHURIYET'
        };
        const rows = payload.prices
          .filter(x => codeMap[x.type])
          .map(x => ({
            code: codeMap[x.type],
            name: x.name_tr,
            alis: Number(x.buy),
            satis: Number(x.sell),
            degisim: Number(x.change_percent),
            tarih: payload.last_updated || payload.price_date || null
          }));

        // 22 ayar bilezik için gram 22 ayar referansını gösteriyoruz.
        const gram22 = rows.find(x => x.code === '22AYAR');
        if (gram22) rows.push({ ...gram22, code: 'BILEZIK', name: '22 Ayar Bilezik (referans)' });
        return rows;
      }
    },
    {
      name: 'Kapalıçarşı API fallback',
      url: 'https://kapalicarsi.apiluna.org/',
      normalize: (payload) => {
        if (!Array.isArray(payload)) throw new Error('Unexpected fallback payload');
        return payload.map(x => ({
          code: x.code,
          name: x.name || x.code,
          alis: toNumber(x.alis),
          satis: toNumber(x.satis),
          tarih: x.tarih || null
        }));
      }
    }
  ];

  function toNumber(v) {
    if (typeof v === 'number') return v;
    const s = String(v ?? '').trim();
    if (!s) return NaN;
    if (s.includes(',') && s.includes('.')) return Number(s.replace(/\./g, '').replace(',', '.'));
    if (s.includes(',')) return Number(s.replace(',', '.'));
    return Number(s);
  }

  const errors = [];
  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AltinPortfoy/2.0'
        },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const data = source.normalize(payload);
      if (!data.length) throw new Error('Empty data');

      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
      return res.status(200).json({ source: source.name, data });
    } catch (e) {
      errors.push(`${source.name}: ${e.message}`);
    }
  }

  return res.status(502).json({
    error: 'Fiyat kaynaklarına şu anda ulaşılamıyor.',
    details: errors
  });
}
