// api/get-payments.js — Vercel Serverless Function para pantalla de cajeros
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN no configurado en Vercel' });
  }

  try {
    const limit = Math.min(Number(req.query.limit) || 15, 30);
    const mpUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}`;

    const mpRes = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!mpRes.ok) {
      const errData = await mpRes.json();
      return res.status(mpRes.status).json({ error: errData.message || 'Error al consultar Mercado Pago' });
    }

    const data = await mpRes.json();
    const results = (data.results || []).map((p) => {
      let payerName = 'Cliente';
      if (p.payer) {
        const first = p.payer.first_name || '';
        const last = p.payer.last_name || '';
        payerName = (first + ' ' + last).trim();
        if (!payerName && p.payer.email) payerName = p.payer.email.split('@')[0];
      }

      let methodLabel = p.payment_method_id || 'Mercado Pago';
      if (p.payment_type_id === 'account_money') methodLabel = 'Dinero en Cuenta MP';
      else if (p.payment_type_id === 'bank_transfer') methodLabel = 'Transferencia / CBU / CVU';
      else if (p.payment_type_id === 'debit_card') methodLabel = 'Tarjeta Débito';
      else if (p.payment_type_id === 'credit_card') methodLabel = 'Tarjeta Crédito';

      return {
        id: String(p.id),
        status: p.status,
        status_detail: p.status_detail,
        amount: p.transaction_amount,
        net_received_amount: p.transaction_details ? p.transaction_details.net_received_amount : p.transaction_amount,
        date_created: p.date_created,
        date_approved: p.date_approved,
        payer_name: payerName,
        payment_method: methodLabel,
        description: p.description || p.external_reference || 'Venta Cope Burgers',
        order_id: p.external_reference || null
      };
    });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      payments: results
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    return res.status(500).json({ error: err.message });
  }
}
