// api/orders.js — Vercel Serverless Function
// Gestión de pedidos Web a Web en tiempo real para Cope Burgers Puerto Madero
// Sincronizado en tiempo real con panel de Caja / Cocina

const CAJA_MASTER_PIN = process.env.CAJA_MASTER_PIN || '2904';
const NTFY_TOPIC = process.env.ORDERS_TOPIC || 'cope-madero-orders-live-c2904';

// Memoria volátil en el worker serverless (fallback rápido)
let serverlessMemoryOrders = [];

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PATCH,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Caja-PIN'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. CREAR NUEVO PEDIDO (Cliente desde la web)
  if (req.method === 'POST') {
    try {
      const orderData = req.body;
      if (!orderData || !orderData.items || !orderData.items.length) {
        return res.status(400).json({ error: 'El pedido debe contener al menos 1 producto.' });
      }

      const orderId = orderData.orderId || orderData.id || `COPE-${Date.now().toString().slice(-4)}`;
      const now = new Date();

      const newOrder = {
        id: orderId,
        created_at: orderData.created_at || now.toISOString(),
        customer: {
          name: (orderData.customer && orderData.customer.name) || 'Cliente Cope',
          phone: (orderData.customer && orderData.customer.phone) || ''
        },
        order_type: orderData.order_type || (orderData.delivery && orderData.delivery.isDelivery ? 'delivery' : 'takeaway'),
        pickup_time: orderData.pickup_time || (orderData.order_type === 'delivery' ? 'Envío Moto Uber Flash' : 'Take Away'),
        delivery: orderData.delivery ? {
          isDelivery: Boolean(orderData.delivery.isDelivery),
          address: orderData.delivery.address || '',
          apartment: orderData.delivery.apartment || '',
          fee: Number(orderData.delivery.fee) || 0,
          eta: orderData.delivery.eta || '25-35 min'
        } : null,
        items: (orderData.items || []).map((it) => ({
          id: it.id,
          name: it.name,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          variantLabel: it.variantLabel || null,
          isVeggie: Boolean(it.isVeggie),
          hasExtraMeat: Boolean(it.hasExtraMeat),
          drinkChoice: it.drinkChoice || null,
          notes: it.notes || ''
        })),
        subtotal: Number(orderData.subtotal) || 0,
        delivery_fee: Number(orderData.delivery_fee) || 0,
        total: Number(orderData.total) || 0,
        payment_method: orderData.payment_method || 'transferencia',
        payment_status: orderData.payment_status || (orderData.payment_method === 'mp_online' ? 'pendiente_mp' : 'pendiente_transferencia'),
        kitchen_status: orderData.kitchen_status || 'recibido', // recibido -> preparando -> listo -> entregado
        notes: orderData.notes || '',
        updated_at: now.toISOString()
      };

      // Guardar en memoria local
      serverlessMemoryOrders.unshift(newOrder);
      if (serverlessMemoryOrders.length > 100) serverlessMemoryOrders.pop();

      // Transmitir al topic en tiempo real para la pantalla de Caja / Cocina
      try {
        const isDelivery = newOrder.order_type === 'delivery';
        const titleMsg = isDelivery
          ? `🛵 NUEVO DELIVERY #${newOrder.id} (${newOrder.customer.name})`
          : `🍔 NUEVO TAKE AWAY #${newOrder.id} (${newOrder.customer.name})`;

        await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
          method: 'POST',
          headers: {
            'Title': titleMsg,
            'Tags': isDelivery ? 'motorcycle,hamburger' : 'package,hamburger',
            'Priority': 'urgent'
          },
          body: JSON.stringify({
            event: 'order_created',
            order: newOrder
          })
        });
      } catch (broadcastErr) {
        console.warn('Advertencia al difundir comanda:', broadcastErr.message);
      }

      return res.status(200).json({
        ok: true,
        orderId: newOrder.id,
        order: newOrder
      });
    } catch (err) {
      console.error('Error al registrar pedido:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // 2. CONSULTAR LISTA DE PEDIDOS (Panel de Caja / Cocina)
  if (req.method === 'GET') {
    const clientPin = req.query.pin || req.headers['x-caja-pin'];
    if (!clientPin || String(clientPin).trim() !== CAJA_MASTER_PIN) {
      return res.status(401).json({ error: 'Terminal no autorizada. PIN requerido.' });
    }

    try {
      // Consultar historial de ntfy (últimas 24 hs)
      const ordersMap = new Map();

      // Cargar memoria local primero
      serverlessMemoryOrders.forEach((o) => {
        ordersMap.set(o.id, o);
      });

      try {
        const ntfyRes = await fetch(`https://ntfy.sh/${NTFY_TOPIC}/json?poll=1&since=24h`, {
          cache: 'no-store'
        });
        if (ntfyRes.ok) {
          const rawText = await ntfyRes.text();
          const lines = rawText.trim().split('\n');
          for (const line of lines) {
            if (!line) continue;
            try {
              const msgObj = JSON.parse(line);
              if (msgObj.message) {
                const parsedPayload = JSON.parse(msgObj.message);
                if (parsedPayload.order && parsedPayload.order.id) {
                  const existing = ordersMap.get(parsedPayload.order.id);
                  if (!existing || new Date(parsedPayload.order.updated_at || 0) >= new Date(existing.updated_at || 0)) {
                    ordersMap.set(parsedPayload.order.id, parsedPayload.order);
                  }
                } else if (parsedPayload.event === 'order_status_updated' && parsedPayload.orderId) {
                  const existing = ordersMap.get(parsedPayload.orderId);
                  if (existing) {
                    existing.kitchen_status = parsedPayload.kitchen_status || existing.kitchen_status;
                    existing.payment_status = parsedPayload.payment_status || existing.payment_status;
                    existing.updated_at = parsedPayload.updated_at || new Date().toISOString();
                    ordersMap.set(parsedPayload.orderId, existing);
                  }
                }
              }
            } catch (pErr) {
              // skip unparseable message
            }
          }
        }
      } catch (pollErr) {
        console.warn('Error polling ntfy cache:', pollErr.message);
      }

      const allOrders = Array.from(ordersMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return res.status(200).json({
        ok: true,
        count: allOrders.length,
        orders: allOrders
      });
    } catch (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // 3. ACTUALIZAR ESTADO DE PEDIDO (Cajero / Cocina)
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const clientPin = req.query.pin || req.headers['x-caja-pin'];
    if (!clientPin || String(clientPin).trim() !== CAJA_MASTER_PIN) {
      return res.status(401).json({ error: 'Terminal no autorizada. PIN requerido.' });
    }

    try {
      const { orderId, kitchen_status, payment_status } = req.body || {};
      if (!orderId) {
        return res.status(400).json({ error: 'orderId es requerido' });
      }

      const now = new Date().toISOString();

      // Actualizar en memoria local si está
      const inMem = serverlessMemoryOrders.find((o) => o.id === orderId);
      if (inMem) {
        if (kitchen_status) inMem.kitchen_status = kitchen_status;
        if (payment_status) inMem.payment_status = payment_status;
        inMem.updated_at = now;
      }

      // Difundir actualización
      await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': `Estado comanda #${orderId}: ${kitchen_status || payment_status}`,
          'Tags': 'bell,fast_forward'
        },
        body: JSON.stringify({
          event: 'order_status_updated',
          orderId,
          kitchen_status,
          payment_status,
          updated_at: now
        })
      });

      return res.status(200).json({ ok: true, orderId, kitchen_status, payment_status });
    } catch (err) {
      console.error('Error updating order status:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
