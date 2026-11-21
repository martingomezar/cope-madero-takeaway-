// api/webhook.js — Recibe notificaciones automáticas de pago de Mercado Pago
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(200).send('Token not configured');
  }

  try {
    const { type, data } = req.body || {};

    if (type === 'payment' && data && data.id) {
      const paymentId = data.id;

      // Consultar estado del pago a la API de Mercado Pago
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (mpRes.ok) {
        const payment = await mpRes.json();
        console.log(`[Mercado Pago Webhook] Pago ${paymentId}: status = ${payment.status}, external_ref = ${payment.external_reference}`);
        // El pago fue chequeado y verificado en la API oficial de Mercado Pago
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Mercado Pago Webhook Error]:', err);
    return res.status(200).json({ received: true });
  }
}
