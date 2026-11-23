// api/ocr-factura.js — Vercel Serverless Function
// Reconocimiento óptico de comprobantes fiscales argentinos (AFIP / Tickets / Remitos / PDFs) con IA Vision

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Gemini-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg', apiKey: customKey } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere imageBase64 en el cuerpo de la solicitud.' });
    }

    const apiKey = customKey || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({
        ok: false,
        error: 'NO_API_KEY',
        message: 'No se configuró GEMINI_API_KEY en Vercel ni se proveyó una clave temporal. Podés ingresar tu clave gratuita de Google AI Studio en el panel.'
      });
    }

    // Limpiar prefijo data:...;base64, si viene incluido
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');

    const promptText = `
Sos un auditor y contador gastronómico argentino experto para la hamburguesería Cope Burgers Puerto Madero.
Tu tarea es examinar la foto o documento PDF de una factura electrónica de compra (AFIP Factura A, B o C), ticket térmico de controlador fiscal, o remito comercial argentino, y extraer los datos fiscales y financieros exactos en formato JSON estricto.

Reglas de extracción:
1. "proveedor": Razón social o nombre de fantasía del emisor (ej: "Cervecería y Maltería Quilmes", "Frigorífico Morres", "Panificadora San Telmo"). Si no es legible, poné "Proveedor no identificado".
2. "cuit": CUIT del emisor si figura (ej: "30-50024985-2").
3. "fecha": Fecha de emisión en formato exacto "YYYY-MM-DD". Si el año es de 2 dígitos (ej: 26), asumí 2026. Si no figura, poné la fecha de hoy.
4. "tipoComprobante": Debe ser exactamente uno de los siguientes:
   - "Factura A" (si tiene letra A en el encabezado)
   - "Factura B" (si tiene letra B)
   - "Factura C" (si tiene letra C)
   - "Remito / Ticket X" (tickets fiscales sin letra o remitos X)
5. "nroComprobante": Punto de venta y número con guión (ej: "0005-00123456").
6. "montoTotal": Monto final total a pagar con decimales como número puro (ej: 145800.50). ¡Importante! Buscar el "Total", "Importe Total", o la cifra final más grande.
7. "categoria": Asigná la categoría que mejor describa los productos o servicios facturados (ej: "carne", "panaderia", "papas", "bebidas", "packaging", "servicios", "sueldos", "marketing", "impuestos", "limpieza", etc.).
8. "notas": Breve resumen de los ítems principales facturados (ej: "60 kg Roast Beef, 40 kg Tapa de Asado").
9. "confianza": "alta", "media" o "baja".

Respondé ÚNICAMENTE un objeto JSON válido, sin bloques markdown ni texto extra:
{
  "proveedor": "string",
  "cuit": "string",
  "fecha": "YYYY-MM-DD",
  "categoria": "string",
  "tipoComprobante": "Factura A | Factura B | Factura C | Remito / Ticket X",
  "nroComprobante": "string",
  "montoTotal": number,
  "notas": "string",
  "confianza": "alta | media | baja"
}
`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: 'application/json'
      }
    };

    // Llamada con rotación inteligente de modelos (evita errores 404 si Google deprecó o movió endpoints)
    const textOutput = await callGeminiWithFallback(apiKey, geminiPayload);

    // Parsear JSON devuelto por la IA
    let parsedData = {};
    try {
      parsedData = JSON.parse(textOutput);
    } catch (parseErr) {
      const match = textOutput.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('La IA no devolvió un JSON válido: ' + textOutput.slice(0, 200));
      }
    }

    return res.status(200).json({
      ok: true,
      data: parsedData
    });

  } catch (err) {
    console.error('Error en ocr-factura:', err);
    return res.status(500).json({ ok: false, error: 'GEMINI_ERROR', details: err.message });
  }
}

// Llamada con fallback automático entre modelos y versiones (v1beta y v1)
async function callGeminiWithFallback(apiKey, payload) {
  const candidateEndpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
  ];

  let lastErrorDetails = null;

  for (const endpoint of candidateEndpoints) {
    try {
      const url = `${endpoint}?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 404) {
        console.warn(`[Gemini Fallback] Modelo en 404: ${endpoint}, probando siguiente alternativa...`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Gemini Error ${response.status}] en ${endpoint}:`, errText);
        lastErrorDetails = errText;
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error(errText);
        }
        continue;
      }

      const data = await response.json();
      const candidate = data.candidates && data.candidates[0];
      const textOutput = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;

      if (textOutput) {
        return textOutput;
      }
    } catch (err) {
      lastErrorDetails = err.message;
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('PERMISSION_DENIED'))) {
        throw err;
      }
    }
  }

  throw new Error(lastErrorDetails || 'No se pudo conectar con ningún modelo de Gemini disponible.');
}
