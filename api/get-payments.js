// api/get-payments.js — Vercel Serverless Function
// Consulta en tiempo real las últimas transacciones acreditadas (ingresos/cobros) en Mercado Pago
// Protegido con PIN de seguridad para las terminales de caja

const CAJA_MASTER_PIN = process.env.CAJA_MASTER_PIN || '2904';

// Cache en memoria a nivel de función serverless para datos del comercio vendedor
let cachedMerchantInfo = null;

async function getMerchantInfo(token) {
  if (cachedMerchantInfo) return cachedMerchantInfo;

  // Si se configuró manualmente un MP_COLLECTOR_ID en las variables de Vercel
  const envCollectorId = process.env.MP_COLLECTOR_ID;
  if (envCollectorId) {
    cachedMerchantInfo = {
      id: String(envCollectorId).trim(),
      email: '',
      nickname: 'Configurado por ENV'
    };
    return cachedMerchantInfo;
  }

  try {
    const meRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (meRes.ok) {
      const meData = await meRes.json();
      if (meData && meData.id) {
        cachedMerchantInfo = {
          id: String(meData.id),
          email: (meData.email || '').toLowerCase().trim(),
          nickname: meData.nickname || ''
        };
        console.log(`[MercadoPago] Comercio Cope detectado: ID ${cachedMerchantInfo.id} (${cachedMerchantInfo.nickname || cachedMerchantInfo.email})`);
        return cachedMerchantInfo;
      }
    } else {
      console.warn(`[MercadoPago users/me] Error ${meRes.status} al consultar perfil de comercio.`);
    }
  } catch (err) {
    console.warn('[MercadoPago users/me Exception]:', err.message);
  }

  return null;
}

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
    const merchant = await getMerchantInfo(token);
    const merchantId = merchant ? merchant.id : null;
    const merchantEmail = merchant ? merchant.email : null;

    const limit = Math.min(Number(req.query.limit) || 60, 100);
    const offset = Number(req.query.offset) || 0;

    let mpUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}&offset=${offset}`;

    // Si tenemos el collector.id, filtrar en la query para que MP devuelva SOLO cobros de la tienda
    if (merchantId) {
      mpUrl += `&collector.id=${encodeURIComponent(merchantId)}`;
    }

    if (req.query.begin_date) {
      mpUrl += `&range=date_created&begin_date=${encodeURIComponent(req.query.begin_date)}`;
      if (req.query.end_date) {
        mpUrl += `&end_date=${encodeURIComponent(req.query.end_date)}`;
      }
    }

    let mpRes = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Si por alguna razón MP rechaza el filtro collector.id, reintentar sin él y filtrar en memoria
    if (!mpRes.ok && merchantId) {
      console.warn(`[MercadoPago] Falló búsqueda con collector.id (${mpRes.status}), reintentando búsqueda general.`);
      let fallbackUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=${limit}&offset=${offset}`;
      if (req.query.begin_date) {
        fallbackUrl += `&range=date_created&begin_date=${encodeURIComponent(req.query.begin_date)}`;
        if (req.query.end_date) {
          fallbackUrl += `&end_date=${encodeURIComponent(req.query.end_date)}`;
        }
      }
      mpRes = await fetch(fallbackUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    if (!mpRes.ok) {
      const errData = await mpRes.json().catch(() => ({}));
      return res.status(mpRes.status).json({ error: errData.message || 'Error al consultar Mercado Pago' });
    }

    const data = await mpRes.json();

    // FILTRO ESTRICTO: Solo COBROS / INGRESOS de ventas del comercio
    // Excluir compras, egresos, gastos o pagos salientes hechos por la cuenta
    const rawResults = data.results || [];
    const salesOnly = rawResults.filter((p) => {
      // 1. Si el comercio fue el PAGADOR (egreso/gasto), descartar de inmediato
      if (merchantId && p.payer && String(p.payer.id) === merchantId) {
        return false;
      }
      if (merchantEmail && p.payer && p.payer.email && p.payer.email.toLowerCase() === merchantEmail) {
        return false;
      }

      // 2. Si el dinero fue cobrado por OTRA cuenta (collector_id diferente al de Cope), descartar
      if (merchantId && p.collector_id && String(p.collector_id) !== merchantId) {
        return false;
      }

      // 3. Descartar operaciones personales/financieras que no son ventas de comida
      const opType = (p.operation_type || '').toLowerCase();
      if (['cellphone_recharge', 'investment', 'money_exchange', 'payment_addition'].includes(opType)) {
        return false;
      }

      return true;
    });

    const results = salesOnly.map((p) => {
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
          (it) => it.id === 'uber-delivery' || (it.title && (it.title.includes('Moto') || it.title.includes('Delivery')))
        );
        if (delItem) {
          isDelivery = true;
          deliveryFee = Number(delItem.unit_price) || 0;
        }
      }

      const pickupObj = {
        addressLine1: 'Macacha Güemes 260',
        addressLine2: 'Puerto Madero, CABA',
        id: 'cope-burgers-puerto-madero',
        name: 'Cope Burgers Puerto Madero',
        latitude: -34.6049,
        longitude: -58.3647,
        provider: 'uber_places',
        source: 'SEARCH'
      };
      const pickupJson = encodeURIComponent(JSON.stringify(pickupObj));
      const pickupFormatted = encodeURIComponent('Macacha Güemes 260, Puerto Madero, CABA');

      let uberLink = null;
      if (isDelivery) {
        if (deliveryAddress) {
          const dropObj = {
            addressLine1: deliveryAddress,
            addressLine2: (deliveryApartment ? deliveryApartment + ', ' : '') + 'Puerto Madero, CABA',
            name: payerName || 'Cliente',
            latitude: -34.6080,
            longitude: -58.3630,
            provider: 'uber_places',
            source: 'SEARCH'
          };
          const dropJson = encodeURIComponent(JSON.stringify(dropObj));
          const fullDest = encodeURIComponent(deliveryAddress + (deliveryApartment ? ' (' + deliveryApartment + ')' : '') + ', Puerto Madero, CABA');
          uberLink = `https://m.uber.com/go/connect/home?pickup=${pickupJson}&pickupAddressName=${encodeURIComponent('Cope Burgers Puerto Madero')}&pickupLat=-34.6049&pickupLng=-58.3647&drop%5B0%5D=${dropJson}&destinationAddressName=${fullDest}&destinationLat=-34.6080&destinationLng=-58.3630`;
        } else {
          uberLink = `https://m.uber.com/go/connect/home?pickup=${pickupJson}&pickupAddressName=${encodeURIComponent('Cope Burgers Puerto Madero')}&pickupLat=-34.6049&pickupLng=-58.3647`;
        }
      }

      return {
        id: String(p.id),
        status: p.status,
        status_detail: p.status_detail,
        amount: p.transaction_amount,
        net_received_amount: p.transaction_details ? p.transaction_details.net_received_amount : p.transaction_amount,
        total_paid_amount: p.transaction_details ? p.transaction_details.total_paid_amount : p.transaction_amount,
        fee_details: p.fee_details || [],
        charges_details: p.charges_details || [],
        taxes_amount: p.taxes_amount || 0,
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
        uber_link: uberLink,
        collector_id: p.collector_id ? String(p.collector_id) : null,
        operation_type: p.operation_type || null
      };
    });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      merchant_id: merchantId,
      merchant_nickname: merchant ? merchant.nickname : null,
      paging: data.paging || null,
      payments: results
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    return res.status(500).json({ error: err.message });
  }
}
