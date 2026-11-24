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
        } else if (message.type === 'document') {
          // Soporte directo para archivos PDF enviados por WhatsApp
          const doc = message.document;
          const mediaId = doc.id;
          mimeType = doc.mime_type || 'application/pdf';
          caption = doc.caption || doc.filename || '';

          if (WHATSAPP_TOKEN) {
            imageBase64 = await downloadMetaMediaAsBase64(mediaId, WHATSAPP_TOKEN);
          } else {
            console.warn('[WhatsApp] Falta WHATSAPP_TOKEN para descargar el documento PDF');
          }
        } else if (message.type === 'text') {
          // Si el usuario escribe texto de ayuda
          await sendWhatsAppReply(fromNumber, '👋 ¡Hola! Para registrar un gasto en Cope Burgers, enviá una foto clara o el archivo PDF de la factura/remito por este chat.');
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

      const rawMontoTotal = Number(parsedData.montoTotal) || 0;
      const rawMontoIva = Number(parsedData.montoIva) || 0;
      let rawMontoNeto = Number(parsedData.montoNeto) || 0;

      let montoTotal = rawMontoTotal;
      let montoIva = rawMontoIva;
      let montoNeto = rawMontoNeto;

      if (parsedData.tipoComprobante === 'Factura C' || parsedData.tipoComprobante === 'Remito / Ticket X') {
        montoIva = 0;
        if (montoTotal > 0 && montoNeto === 0) montoNeto = montoTotal;
        if (montoNeto > 0 && montoTotal === 0) montoTotal = montoNeto;
      } else if (montoIva > 0) {
        if (montoTotal > 0 && montoNeto >= montoTotal) {
          montoNeto = Math.round((montoTotal - montoIva) * 100) / 100;
        } else if (montoTotal === 0 && montoNeto > 0) {
          montoTotal = Math.round((montoNeto + montoIva) * 100) / 100;
        }
      }

      // 4. GUARDAR EN GOOGLE SHEETS
      const nuevaFactura = {
        id: 'fac_wpp_' + Date.now(),
        fecha: parsedData.fecha || new Date().toISOString().slice(0, 10),
        proveedor: parsedData.proveedor || 'Proveedor Desconocido',
        categoria: parsedData.categoria || 'servicios',
        tipoComprobante: parsedData.tipoComprobante || 'Factura A',
        nroComprobante: parsedData.nroComprobante || 'S/N',
        montoNeto: montoNeto,
        montoIva: montoIva,
        montoTotal: montoTotal,
        alicuotaIva: Number(parsedData.alicuotaIva) || (montoIva > 0 ? 21 : 0),
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
        `• *Subtotal Neto:* $ ${Math.round(nuevaFactura.montoNeto).toLocaleString('es-AR')}\n` +
        `• *IVA:* $ ${Math.round(nuevaFactura.montoIva).toLocaleString('es-AR')}\n` +
        `• *Total Bruto:* $ ${Math.round(nuevaFactura.montoTotal).toLocaleString('es-AR')}\n` +
        `• *Comprobante:* ${nuevaFactura.tipoComprobante} ${nuevaFactura.nroComprobante}\n` +
        `• *Categoría:* ${formatCategoriaLabel(nuevaFactura.categoria)}\n` +
        `• *Fecha:* ${formatDisplayDate(nuevaFactura.fecha)}\n` +
        (parsedData.notas ? `• *Detalle:* ${parsedData.notas}\n\n` : `\n`) +
        `_Ya figura discriminada en Google Sheets y en la web de Contabilidad._`;

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

// Llamar a Gemini Vision para extraer los datos fiscales de la foto o documento
async function parseInvoiceWithGemini(base64Data, mimeType, caption) {
  const apiKey = GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta GEMINI_API_KEY en variables de entorno de Vercel');
  }

  const cleanBase64 = base64Data.includes(';base64,') ? base64Data.split(';base64,')[1] : base64Data;

  const promptText = `
Sos un auditor fiscal y contador gastronómico argentino experto para la hamburguesería Cope Burgers Puerto Madero.
Tu tarea es examinar la foto de una factura de compra, ticket de controlador fiscal, o remito comercial argentino enviado por WhatsApp y LEER TEXTUALMENTE Y DISCRIMINAR los números fiscales reales.
Texto o contexto que escribió el usuario: "${caption || ''}"

¡REGLA SUPREMA: OCR ESTRICTO - PROHIBIDO CALCULAR O RE-CALCULAR MATEMÁTICAMENTE!:
NO hagas cálculos matemáticos automáticos ni inventes sumas si los números ya están impresos en el comprobante.
Debes LEER las cifras literales impresas en el documento.

ESTRUCTURA DE COMPROBANTES ARGENTINOS (AFIP / TICKETS):
Al pie del comprobante figuran casillas claramente separadas:
1. "Importe Neto Gravado" (o "Subtotal", o "Conceptos No Gravados / Exentos"):
   -> Asignar a "montoNeto".
   -> ATENCIÓN: Es el importe SIN IVA. NUNCA pongas aquí el "Importe Total" de la factura.
   -> Si la factura tiene "Conceptos No Gravados" u "Operaciones Exentas", súmalos al neto o pon el subtotal previo a impuestos.
   -> Si es Factura C o Monotributo (donde NO se discrimina IVA), aquí va el mismo valor que el Total impreso.

2. "IVA 21%", "IVA 10.5%", "IVA 27%":
   -> Asignar a "montoIva".
   -> Lee la cifra real impresa en la casilla de IVA del comprobante. NO la calcules multiplicando por 0.21.
   -> Asignar a "alicuotaIva" el porcentaje (21, 10.5, 27 o 0).
   -> Si es Factura C, ticket sin IVA discriminado o monotributo, "montoIva" = 0 y "alicuotaIva" = 0.

3. "Importe Total" (o "Total $", "Total a Pagar"):
   -> Asignar a "montoTotal".
   -> ¡ADVERTENCIA CRÍTICA!: Este es el TOTAL FINAL DE LA FACTURA que se paga al proveedor.
   -> ¡BAJO NINGUNA CIRCUNSTANCIA LE SUMES EL IVA ENCIMA AL IMPORTE TOTAL! El Importe Total YA incluye el IVA y cualquier otro concepto.
   -> El valor de "montoTotal" NUNCA puede ser mayor al número que está impreso como "Importe Total" en el comprobante.

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
  "montoNeto": number,
  "alicuotaIva": number,
  "montoIva": number,
  "montoTotal": number,
  "notas": "Breve resumen de los ítems comprados"
}
`;

  // Descubrir dinámicamente modelos habilitados en Google Generative Language API
  let candidateModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-001',
    'gemini-2.5-flash',
    'gemini-1.5-pro'
  ];

  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      const available = (listData.models || [])
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));
      if (available.length > 0) {
        candidateModels = available.sort((a, b) => {
          const score = name => {
            const n = name.toLowerCase();
            if (n.includes('embedding') || n.includes('aqa') || n.includes('imagen')) return -100;
            let s = 0;
            if (n.includes('flash')) s += 60;
            if (n.includes('2.5')) s += 40;
            else if (n.includes('2.0')) s += 30;
            else if (n.includes('1.5')) s += 20;
            if (n.includes('pro')) s += 15;
            return s;
          };
          return score(b) - score(a);
        });
      }
    }
  } catch (e) {
    console.warn('[WhatsApp Gemini] No se pudo listar modelos, usando fallback:', e.message);
  }

  let textOutput = null;
  let lastErr = null;

  for (const modelName of candidateModels.slice(0, 5)) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      let response = await fetch(endpoint, {
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

      if (response.status === 400) {
        // Reintentar sin response_mime_type si el modelo no lo admite
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptText },
                { inline_data: { mime_type: mimeType, data: cleanBase64 } }
              ]
            }],
            generationConfig: { temperature: 0.1 }
          })
        });
      }

      if (response.status === 404) continue;
      if (!response.ok) {
        lastErr = await response.text();
        continue;
      }

      const resJson = await response.json();
      textOutput = resJson.candidates && resJson.candidates[0] && resJson.candidates[0].content && resJson.candidates[0].content.parts && resJson.candidates[0].content.parts[0].text;
      if (textOutput) break;
    } catch (e) {
      lastErr = e.message;
    }
  }

  if (!textOutput && process.env.OPENROUTER_API_KEY) {
    console.warn('[WhatsApp Failover] Gemini no respondió, intentando con OpenRouter Vision...');
    try {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cope-madero-takeaway.vercel.app',
          'X-Title': 'Cope Burgers WhatsApp Webhook'
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          models: ['openrouter/free', 'nvidia/nemotron-3.5-super-vl:free', 'google/gemma-4-31b-it:free'],
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${cleanBase64}` } }
            ]
          }],
          temperature: 0.1
        })
      });
      if (orRes.ok) {
        const orData = await orRes.json();
        textOutput = orData.choices?.[0]?.message?.content;
      }
    } catch (e) {
      console.warn('[WhatsApp Failover] Error en OpenRouter:', e.message);
    }
  }

  if (!textOutput) {
    throw new Error(lastErr || 'No se pudo obtener respuesta de la IA en ningún modelo disponible.');
  }

  try {
    return JSON.parse(textOutput);
  } catch (e) {
    const match = textOutput.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('La IA no devolvió un JSON interpretable: ' + textOutput.slice(0, 100));
  }
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
