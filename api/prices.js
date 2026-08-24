export default async function handler(req, res) {
  try {
    const response = await fetch("https://kapalicarsi.apiluna.org/", {
      headers: { "Accept": "application/json", "User-Agent": "AltinPortfoy/1.0" },
      cache: "no-store"
    });
    if (!response.ok) {
      return res.status(502).json({ error: "Fiyat kaynağına ulaşılamadı" });
    }
    const data = await response.json();
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(JSON.stringify(data));
  } catch (e) {
    return res.status(502).json({ error: "Fiyat servisi geçici olarak kullanılamıyor" });
  }
}