// api/sheets-sync.js — Vercel Serverless Function
// Proxy bidireccional entre la Web/WhatsApp y Google Sheets

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Sheets-Url'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sheetsUrl = req.headers['x-sheets-url'] || (req.body && req.body.sheetsUrl) || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!sheetsUrl || !sheetsUrl.startsWith('http')) {
    return res.status(400).json({
      ok: false,
      error: 'NO_SHEETS_URL',
      message: 'No se configuró la URL de Google Sheets en Vercel ni en la solicitud.'
    });
  }

  try {
    // 1. OBTENER DATOS (GET)
    if (req.method === 'GET') {
      const response = await fetch(`${sheetsUrl}?action=get_all`, {
        cache: 'no-store'
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    // 2. GUARDAR DATOS (POST)
    if (req.method === 'POST') {
      const response = await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error en proxy de Google Sheets:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
