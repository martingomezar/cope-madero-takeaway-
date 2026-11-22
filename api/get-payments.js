// api/get-payments.js — Vercel Serverless Function
// Consulta en tiempo real las últimas transacciones acreditadas en Mercado Pago
// Protegido con PIN de seguridad para las terminales de caja

const CAJA_MASTER_PIN = '2904';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Caja-PIN'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validación de PIN
  const clientPin = req.query.pin || req.headers['x-caja-pin'];
  if (!clientPin || String(clientPin).trim() !== CAJA_MASTER_PIN) {
    return res.status(401).json({
      error: 'Terminal no autorizada. PIN de seguridad incorrecto o ausente.'
    });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'MERCADO_PAGO_ACCESS_TOKEN no configurado en Vercel.'
    });
  }

  try {
    const limit = Math.min(Number(req.query.limit) || 60, 100);
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
      let payerName = '';
      if (p.payer) {
        const first = p.payer.first_name || '';
        const last = p.payer.last_name || '';
        payerName = (first + ' ' + last).trim();
        if (!payerName && p.payer.email) payerName = p.payer.email.split('@')[0];
      }
      if (!payerName) {
        payerName = p.payment_type_id === 'bank_transfer' ? 'Transferencia Recibida' : 'Cliente Mercado Pago';
      }

      let methodLabel = p.payment_method_id || 'Mercado Pago';
      if (p.payment_type_id === 'account_money') methodLabel = 'Dinero en Cuenta MP';
      else if (p.payment_type_id === 'bank_transfer') methodLabel = 'Transferencia / CBU / CVU';
      else if (p.payment_type_id === 'debit_card') methodLabel = 'Tarjeta Débito';
      else if (p.payment_type_id === 'credit_card') methodLabel = 'Tarjeta Crédito';

      // Detección de pedidos Delivery con Uber Moto
      let isDelivery = false;
      let deliveryAddress = '';
      let deliveryApartment = '';
      let deliveryFee = 0;

      if (p.metadata && (p.metadata.order_type === 'delivery' || p.metadata.delivery_address)) {
        isDelivery = true;
        deliveryAddress = p.metadata.delivery_address || '';
        deliveryApartment = p.metadata.delivery_apartment || '';
        deliveryFee = Number(p.metadata.delivery_fee) || 0;
      } else if (p.description && p.description.toLowerCase().includes('delivery')) {
        isDelivery = true;
      } else if (p.additional_info && Array.isArray(p.additional_info.items)) {
        const delItem = p.additional_info.items.find(
          (it) => it.id === 'uber-delivery' || (it.title && it.title.includes('Moto Uber'))
        );
        if (delItem) {
          isDelivery = true;
          deliveryFee = Number(delItem.unit_price) || 0;
        }
      }

      const uberLink = isDelivery && deliveryAddress
        ? `https://m.uber.com/looking?pickup=${encodeURIComponent('Macacha Güemes 260, Puerto Madero')}&dropoff=${encodeURIComponent(deliveryAddress + ', CABA')}`
        : (isDelivery ? `https://m.uber.com/looking?pickup=${encodeURIComponent('Macacha Güemes 260, Puerto Madero')}` : null);

      return {
        id: String(p.id),
        status: p.status,
        status_detail: p.status_detail,
        amount: p.transaction_amount,
        net_received_amount: p.transaction_details ? p.transaction_details.net_received_amount : p.transaction_amount,
        date_created: p.date_created,
        date_approved: p.date_approved,
        payer_name: payerName,
        payment_type: p.payment_type_id || 'other',
        payment_method: methodLabel,
        description: p.description || p.external_reference || 'Venta Cope Burgers',
        order_id: p.external_reference || null,
        order_type: isDelivery ? 'delivery' : 'takeaway',
        delivery_address: deliveryAddress,
        delivery_apartment: deliveryApartment,
        delivery_fee: deliveryFee,
        uber_link: uberLink
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
