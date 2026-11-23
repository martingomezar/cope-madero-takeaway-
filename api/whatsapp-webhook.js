// api/whatsapp-webhook.js — Vercel Serverless Function
// Recepción automática de fotos de facturas por WhatsApp, OCR con IA y guardado directo en Google Sheets

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'cope2026';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // =========================================================================
  // 1. VERIFICACIÓN DEL WEBHOOK DE META (GET)
  // =========================================================================
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] Verificación exitosa de Meta');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Token de verificación inválido' });
  }

  // =========================================================================
  // 2. RECEPCIÓN DE MENSAJES / FOTOS ENTRANTES (POST)
  // =========================================================================
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Responder 200 rápido a Meta para evitar reintentos automáticos
      res.status(200).json({ status: 'received' });

      // Extraer mensaje (compatible con Meta Cloud API y Gateways alternativos)
      let fromNumber = null;
      let imageBase64 = null;
      let mimeType = 'image/jpeg';
      let caption = '';

      // A) Payload oficial de WhatsApp Cloud API (Meta)
      if (body && body.entry && body.entry[0] && body.entry[0].changes && body.entry[0].changes[0].value) {
        const value = body.entry[0].changes[0].value;
        const message = value.messages && value.messages[0];

        if (!message) return; // Notificación de estado (delivered, read), ignorar

        fromNumber = message.from;

        if (message.type === 'image') {
          const mediaId = message.image.id;
          mimeType = message.image.mime_type || 'image/jpeg';
          caption = message.image.caption || '';

          if (WHATSAPP_TOKEN) {
            imageBase64 = await downloadMetaMediaAsBase64(mediaId, WHATSAPP_TOKEN);
          } else {
            console.warn('[WhatsApp] Falta WHATSAPP_TOKEN para descargar la imagen');
          }
        } else if (message.type === 'text') {
          // Si el usuario escribe texto de ayuda
          await sendWhatsAppReply(fromNumber, '👋 ¡Hola! Para registrar un gasto en Cope Burgers, sacale una foto clara a la factura o remito y enviala por este chat.');
          return;
        }
      }

      // B) Payload directo de Gateways QR (Evolution API / UltraMsg / Baileys) o testing
      else if (body && (body.image || body.imageBase64 || (body.data && body.data.message))) {
        fromNumber = body.from || body.phone || '5491100000000';
        imageBase64 = body.imageBase64 || body.image || (body.data && body.data.message && body.data.message.base64);
        caption = body.caption || '';
      }

      if (!imageBase64) {
        console.log('[WhatsApp] No se detectó imagen de factura en el mensaje');
        return;
      }

      console.log(`[WhatsApp] Procesando foto de factura de ${fromNumber}...`);

      // 3. PROCESAR IMAGEN CON GEMINI VISION
      const parsedData = await parseInvoiceWithGemini(imageBase64, mimeType, caption);

      console.log('[WhatsApp] Factura interpretada por IA:', parsedData);

      // 4. GUARDAR EN GOOGLE SHEETS
      const nuevaFactura = {
        id: 'fac_wpp_' + Date.now(),
        fecha: parsedData.fecha || new Date().toISOString().slice(0, 10),
        proveedor: parsedData.proveedor || 'Proveedor Desconocido',
        categoria: parsedData.categoria || 'servicios',
        tipoComprobante: parsedData.tipoComprobante || 'Factura A',
        nroComprobante: parsedData.nroComprobante || 'S/N',
        montoTotal: Number(parsedData.montoTotal) || 0,
        estadoPago: 'pagado',
        notas: (parsedData.notas ? parsedData.notas + ' ' : '') + `(Recibido por WhatsApp de +${fromNumber})`,
        origen: 'WhatsApp',
        createdAt: new Date().toISOString()
      };

      if (SHEETS_WEBHOOK_URL) {
        await saveToGoogleSheets(nuevaFactura);
      } else {
        console.warn('[WhatsApp] Falta GOOGLE_SHEETS_WEBHOOK_URL en Vercel para guardar la factura');
      }

      // 5. RESPONDER AL USUARIO POR WHATSAPP
      const confirmationText = 
        `✅ *Factura Registrada con Éxito*\n` +
        `🍔 *Cope Burgers Puerto Madero*\n\n` +
        `• *Proveedor:* ${nuevaFactura.proveedor}\n` +
        `• *Monto:* $ ${Math.round(nuevaFactura.montoTotal).toLocaleString('es-AR')}\n` +
        `• *Categoría:* ${formatCategoriaLabel(nuevaFactura.categoria)}\n` +
        `• *Comprobante:* ${nuevaFactura.tipoComprobante} ${nuevaFactura.nroComprobante}\n` +
        `• *Fecha:* ${formatDisplayDate(nuevaFactura.fecha)}\n` +
        (parsedData.notas ? `• *Detalle:* ${parsedData.notas}\n\n` : `\n`) +
        `_Ya figura en Google Sheets y en la web de Contabilidad._`;

      if (fromNumber && WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
        await sendWhatsAppReply(fromNumber, confirmationText);
      } else {
        console.log('[WhatsApp] Mensaje de confirmación generado:', confirmationText);
      }

    } catch (err) {
      console.error('[WhatsApp Webhook Error]:', err);
    }
  }
}

// Descargar archivo binario desde Meta Graph API y convertir a base64
async function downloadMetaMediaAsBase64(mediaId, token) {
  // 1. Obtener URL de descarga temporal
  const metaUrlRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const mediaInfo = await metaUrlRes.json();
  if (!mediaInfo.url) throw new Error('No se obtuvo URL de medios de Meta');

  // 2. Descargar bytes de la imagen
  const mediaFileRes = await fetch(mediaInfo.url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const arrayBuffer = await mediaFileRes.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

// Enviar mensaje de texto de respuesta por WhatsApp
async function sendWhatsAppReply(to, text) {
  try {
    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
      })
    });
  } catch (err) {
    console.error('Error al enviar respuesta por WhatsApp:', err.message);
  }
}

// Llamar a Gemini Vision para extraer los datos fiscales de la foto
async function parseInvoiceWithGemini(base64Data, mimeType, caption) {
  const apiKey = GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta GEMINI_API_KEY en variables de entorno');
  }

  const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');

  const promptText = `
Sos un auditor y contador gastronómico argentino experto para la hamburguesería Cope Burgers Puerto Madero.
Tu tarea es examinar la foto de una factura de compra, ticket de controlador fiscal, o remito comercial argentino enviado por WhatsApp y extraer los datos en formato JSON estricto.
Texto o contexto que escribió el usuario: "${caption || ''}"

Categorías exactas:
- "carne" (Carne, medallones, roast beef, tapa, vacío, panceta, pollo)
- "panaderia" (Pan brioche, pan de papa, verduras, lechuga, tomate, cebolla)
- "papas" (Papas congeladas bastón, aceite de freír, cheddar en barra, salsas, condimentos)
- "bebidas" (Cerveza barril/lata, gaseosas Pepsi/7Up, aguas, bebidas)
- "packaging" (Cajas de burger, bolsas kraft, papel antigrasa, servilletas, vasos, stickers)
- "servicios" (Alquiler en Dique 4, expensas, luz Edenor, gas, reparaciones, mantenimiento)
- "sueldos" (Sueldos, adelantos, propinas, varios)

Respondé ÚNICAMENTE un objeto JSON con este formato:
{
  "proveedor": "Nombre del proveedor",
  "fecha": "YYYY-MM-DD",
  "categoria": "carne | panaderia | papas | bebidas | packaging | servicios | sueldos",
  "tipoComprobante": "Factura A | Factura B | Factura C | Remito / Ticket X",
  "nroComprobante": "string",
  "montoTotal": number,
  "notas": "Breve resumen de los ítems comprados"
}
`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: promptText },
          { inline_data: { mime_type: mimeType, data: cleanBase64 } }
        ]
      }],
      generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
    })
  });

  const resJson = await response.json();
  const textOutput = resJson.candidates && resJson.candidates[0] && resJson.candidates[0].content && resJson.candidates[0].content.parts[0].text;
  return JSON.parse(textOutput);
}

// Guardar fila en Google Sheets a través del Web App de Apps Script
async function saveToGoogleSheets(factura) {
  try {
    await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_factura',
        data: factura
      })
    });
    console.log('[Google Sheets] Factura de WhatsApp guardada exitosamente');
  } catch (err) {
    console.error('Error al guardar en Google Sheets:', err.message);
  }
}

function formatCategoriaLabel(cat) {
  const map = {
    carne: '🥩 Carne y Medallones (Food Cost)',
    panaderia: '🥖 Panadería y Verdulería (Food Cost)',
    papas: '🍟 Papas e Insumos Congelados (Food Cost)',
    bebidas: '🥤 Bebidas (Food Cost)',
    packaging: '📦 Packaging y Descartables',
    servicios: '⚡ Servicios y Alquiler',
    sueldos: '👥 Sueldos y Varios'
  };
  return map[cat] || cat;
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : isoDate;
}
