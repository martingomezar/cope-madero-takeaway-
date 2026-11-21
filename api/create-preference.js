// api/create-preference.js — Vercel Serverless Function
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'MERCADO_PAGO_ACCESS_TOKEN no configurado en Vercel. Por favor configurá la variable MP_ACCESS_TOKEN en tu proyecto de Vercel.'
    });
  }

  try {
    const { items, customer, pickupTime, notes, orderId } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const mpItems = items.map((i) => ({
      id: String(i.id || i.key || 'item'),
      title: i.name + (i.variantLabel ? ` (${i.variantLabel})` : '') + (i.isVeggie ? ' [NotBurger Veggie]' : ''),
      quantity: Number(i.quantity) || 1,
      unit_price: Number(i.unitPrice),
      currency_id: 'ARS'
    }));

    const host = req.headers.host ? `https://${req.headers.host}` : 'https://cope-madero-takeaway.vercel.app';

    const preferenceData = {
      items: mpItems,
      payer: {
        name: customer ? customer.name : 'Cliente Cope',
        phone: {
          number: customer && customer.phone ? customer.phone : ''
        }
      },
      external_reference: orderId || `COPE-${Date.now()}`,
      statement_descriptor: 'COPE BURGERS',
      back_urls: {
        success: `${host}/?payment=success&orderId=${orderId || ''}`,
        failure: `${host}/?payment=failure&orderId=${orderId || ''}`,
        pending: `${host}/?payment=pending&orderId=${orderId || ''}`
      },
      auto_return: 'approved'
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(preferenceData)
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      console.error('Error MP API:', data);
      return res.status(mpRes.status).json({ error: data.message || 'Error al crear preferencia en Mercado Pago' });
    }

    return res.status(200).json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point
    });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}
