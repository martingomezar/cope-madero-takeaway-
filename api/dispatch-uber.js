// api/dispatch-uber.js — Vercel Serverless Function
// Despacho automático de moto de entrega vía Uber Direct API oficial

const STORE_ORIGIN = {
  business_name: 'Cope Burgers Puerto Madero',
  name: 'Cope Burgers Take Away',
  address: 'Macacha Güemes 260, Puerto Madero, CABA, Argentina',
  phone_number: '+5491173558077',
  lat: -34.604912,
  lng: -58.364747,
  pickup_notes: 'Retirar en mostrador de Cope Burgers'
};

function formatE164Phone(rawPhone) {
  if (!rawPhone) return '+5491173558077';
  let clean = String(rawPhone).replace(/[^\d+]/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('54')) return '+' + clean;
  if (clean.startsWith('11') || clean.startsWith('15')) {
    clean = clean.replace(/^15/, '11');
    return '+549' + clean;
  }
  return '+549' + clean;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const {
      orderId,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryApartment,
      notes,
      tip = 0
    } = req.body || {};

    if (!deliveryAddress || deliveryAddress.trim().length < 3) {
      return res.status(400).json({
        ok: false,
        error: 'MISSING_ADDRESS',
        message: 'Se requiere una dirección de entrega válida para despachar la moto.'
      });
    }

    const cleanStreet = deliveryAddress.trim();
    const cleanApt = (deliveryApartment || '').trim();
    let fullDest = cleanStreet;
    if (cleanApt && !fullDest.includes(cleanApt)) {
      fullDest += ' (' + cleanApt + ')';
    }
    if (!fullDest.toLowerCase().includes('caba') && !fullDest.toLowerCase().includes('buenos aires') && !fullDest.toLowerCase().includes('capital federal')) {
      fullDest += ', CABA, Argentina';
    }

    const clientId = process.env.UBER_CLIENT_ID;
    const clientSecret = process.env.UBER_CLIENT_SECRET;
    const customerId = process.env.UBER_CUSTOMER_ID; // ID de organización comercial en Uber Direct

    // Si aún no se cargaron las credenciales de Uber Direct en las variables de entorno de Vercel
    if (!clientId || !clientSecret) {
      return res.status(200).json({
        ok: false,
        mode: 'STANDBY_NO_API_KEYS',
        error: 'NO_UBER_CREDENTIALS',
        message: 'Para despacho 100% automático por API se requiere configurar UBER_CLIENT_ID, UBER_CLIENT_SECRET y UBER_CUSTOMER_ID en Vercel.',
        destination: fullDest,
        fallbackUniversalUrl: generateUberUniversalUrl(fullDest, customerName)
      });
    }

    // 1. Obtener Token OAuth de Uber Direct
    const authParams = new URLSearchParams();
    authParams.append('client_id', clientId);
    authParams.append('client_secret', clientSecret);
    authParams.append('grant_type', 'client_credentials');
    authParams.append('scope', 'eats.deliveries');

    const tokenRes = await fetch('https://auth.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: authParams.toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Error de autenticación con Uber OAuth (${tokenRes.status}): ${errText}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const baseHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    };

    const recipientPhone = formatE164Phone(customerPhone);
    const dropoffNotes = [
      notes ? notes : '',
      cleanApt ? `Piso/Depto: ${cleanApt}` : '',
      'Pedido Cope Burgers Take Away / Delivery'
    ].filter(Boolean).join(' · ');

    // 2. Cotizar entrega para obtener quote_id oficial
    let quoteId = null;
    const quoteUrl = customerId
      ? `https://api.uber.com/v1/customers/${customerId}/delivery_quotes`
      : `https://api.uber.com/v1/delivery_quotes`;

    try {
      const quoteRes = await fetch(quoteUrl, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          pickup_address: STORE_ORIGIN.address,
          dropoff_address: fullDest
        })
      });

      if (quoteRes.ok) {
        const quoteData = await quoteRes.json();
        quoteId = quoteData.id || quoteData.quote_id;
      }
    } catch (qErr) {
      console.warn('[Uber Quote Warning]', qErr.message);
    }

    // 3. Crear solicitud de entrega en Uber Direct API
    const targetUrl = customerId 
      ? `https://api.uber.com/v1/customers/${customerId}/deliveries`
      : `https://api.uber.com/v1/deliveries`;

    const deliveryPayload = {
      pickup_name: STORE_ORIGIN.name,
      pickup_business_name: STORE_ORIGIN.business_name,
      pickup_address: STORE_ORIGIN.address,
      pickup_phone_number: STORE_ORIGIN.phone_number,
      pickup_notes: STORE_ORIGIN.pickup_notes,
      dropoff_name: customerName || 'Cliente Cope Burgers',
      dropoff_address: fullDest,
      dropoff_phone_number: recipientPhone,
      dropoff_notes: dropoffNotes,
      manifest_items: [
        {
          name: `Comanda Cope Burgers #${orderId || 'S/N'}`,
          quantity: 1,
          size: 'small',
          price: 0
        }
      ],
      undeliverable_action: 'return',
      requires_dropoff_signature: false
    };

    if (quoteId) {
      deliveryPayload.quote_id = quoteId;
    }
    if (tip > 0) {
      deliveryPayload.tip = Math.round(tip * 100);
    }

    const dispatchRes = await fetch(targetUrl, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify(deliveryPayload)
    });

    const dispatchData = await dispatchRes.json();

    if (!dispatchRes.ok) {
      console.error('[Uber Direct API Error]', dispatchData);
      return res.status(dispatchRes.status).json({
        ok: false,
        error: 'UBER_DISPATCH_FAILED',
        message: dispatchData.message || 'Uber Direct rechazó la solicitud de despacho.',
        details: dispatchData,
        fallbackUniversalUrl: generateUberUniversalUrl(fullDest, customerName)
      });
    }

    // 4. Respuesta exitosa con Tracking en tiempo real
    return res.status(200).json({
      ok: true,
      mode: 'API_DIRECT',
      deliveryId: dispatchData.id,
      trackingUrl: dispatchData.tracking_url,
      status: dispatchData.status,
      fee: dispatchData.fee ? (dispatchData.fee / 100) : null,
      courier: dispatchData.courier || null,
      estimatedPickupTime: dispatchData.pickup_eta,
      estimatedDropoffTime: dispatchData.dropoff_eta
    });

  } catch (err) {
    console.error('Error in dispatch-uber:', err);
    return res.status(500).json({
      ok: false,
      error: 'SERVER_ERROR',
      message: err.message
    });
  }
}

function generateUberUniversalUrl(fullDest, customerName) {
  const pParams = new URLSearchParams({
    action: 'setPickup',
    'pickup[latitude]': STORE_ORIGIN.lat,
    'pickup[longitude]': STORE_ORIGIN.lng,
    'pickup[nickname]': STORE_ORIGIN.name,
    'pickup[formatted_address]': STORE_ORIGIN.address,
    'dropoff[latitude]': -34.6080,
    'dropoff[longitude]': -58.3680,
    'dropoff[nickname]': customerName || 'Destino Cliente',
    'dropoff[formatted_address]': fullDest
  });
  return `https://m.uber.com/ul/?${pParams.toString()}`;
}
