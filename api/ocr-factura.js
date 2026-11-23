// api/ocr-factura.js — Vercel Serverless Function
// Reconocimiento óptico de comprobantes fiscales argentinos (AFIP / Tickets / Remitos / PDFs)
// con Google Gemini AI y respaldo automático / opcional con OpenRouter Vision

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Gemini-Key, X-OpenRouter-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET de diagnóstico: verificar clave
  if (req.method === 'GET') {
    const provider = req.query.provider || 'gemini';
    if (provider === 'openrouter') {
      const openRouterKey = req.query.key || req.headers['x-openrouter-key'] || process.env.OPENROUTER_API_KEY;
      if (!openRouterKey) {
        return res.status(401).json({ ok: false, error: 'NO_API_KEY', message: 'No se proveyó clave de OpenRouter.' });
      }
      const check = await verifyOpenRouterKey(openRouterKey);
      return res.status(check.ok ? 200 : (check.status || 400)).json(check);
    } else {
      const apiKey = req.query.key || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ ok: false, error: 'NO_API_KEY', message: 'No se proveyó clave de Gemini.' });
      }
      const check = await resolveAvailableGeminiModels(apiKey);
      if (!check.ok) {
        return res.status(check.status || 500).json({ ok: false, error: check.error, details: check.details });
      }
      return res.status(200).json({ ok: true, provider: 'gemini', models: check.models, selectedModel: check.models[0] });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      imageBase64, 
      mimeType = 'image/jpeg', 
      apiKey: customGeminiKey, 
      openRouterKey: customOpenRouterKey,
      provider = 'auto', // 'auto' | 'gemini' | 'openrouter'
      test = false,
      testProvider = 'gemini' // 'gemini' | 'openrouter'
    } = req.body || {};

    const geminiKey = customGeminiKey || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    const openRouterKey = customOpenRouterKey || req.headers['x-openrouter-key'] || process.env.OPENROUTER_API_KEY;

    // Modo prueba de conexión
    if (test) {
      if (testProvider === 'openrouter' || (!geminiKey && openRouterKey)) {
        if (!openRouterKey) {
          return res.status(400).json({ ok: false, error: 'NO_KEY', details: 'No se proporcionó clave de OpenRouter para verificar.' });
        }
        const check = await verifyOpenRouterKey(openRouterKey);
        return res.status(check.ok ? 200 : (check.status || 400)).json(check);
      } else {
        if (!geminiKey) {
          return res.status(400).json({ ok: false, error: 'NO_KEY', details: 'No se proporcionó clave de Gemini para verificar.' });
        }
        const check = await resolveAvailableGeminiModels(geminiKey);
        if (!check.ok) {
          return res.status(check.status || 400).json({ ok: false, error: check.error, details: check.details });
        }
        return res.status(200).json({ ok: true, provider: 'gemini', models: check.models, selectedModel: check.models[0] });
      }
    }

    if (!geminiKey && !openRouterKey) {
      return res.status(401).json({
        ok: false,
        error: 'NO_API_KEY',
        message: 'No se configuró ninguna clave de IA (Gemini ni OpenRouter). Podés ingresar tu clave gratuita en el panel.'
      });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere imageBase64 en el cuerpo de la solicitud.' });
    }

    // Limpiar prefijo data:...;base64, si viene incluido
    const cleanBase64 = imageBase64.includes(';base64,') ? imageBase64.split(';base64,')[1] : imageBase64;

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

    let textOutput = null;
    let providerUsed = 'gemini';
    let geminiErr = null;

    // Ejecución con failover automático inteligente
    if (provider === 'openrouter' || (!geminiKey && openRouterKey)) {
      try {
        textOutput = await callOpenRouterVision(openRouterKey, promptText, mimeType, cleanBase64);
        providerUsed = 'openrouter';
      } catch (err) {
        if (geminiKey) {
          console.warn('[OCR Failover] OpenRouter falló, intentando con Gemini...', err.message);
          textOutput = await callGeminiWithFallback(geminiKey, promptText, mimeType, cleanBase64);
          providerUsed = 'gemini (fallback)';
        } else {
          throw err;
        }
      }
    } else {
      // Estrategia por defecto: Gemini primero, con fallback automático a OpenRouter si falla
      try {
        textOutput = await callGeminiWithFallback(geminiKey, promptText, mimeType, cleanBase64);
        providerUsed = 'gemini';
      } catch (err) {
        geminiErr = err;
        if (openRouterKey) {
          console.warn(`[OCR Failover] Gemini falló (${err.message}), activando respaldo con OpenRouter...`);
          try {
            textOutput = await callOpenRouterVision(openRouterKey, promptText, mimeType, cleanBase64);
            providerUsed = 'openrouter (fallback)';
          } catch (orErr) {
            throw new Error(`Fallaron ambos proveedores. Gemini: ${geminiErr.message}. OpenRouter: ${orErr.message}`);
          }
        } else {
          throw err;
        }
      }
    }

    // Parsear JSON devuelto por la IA
    const parsedData = extractJsonFromText(textOutput);

    return res.status(200).json({
      ok: true,
      provider: providerUsed,
      data: parsedData
    });

  } catch (err) {
    console.error('Error en ocr-factura:', err);
    return res.status(500).json({ ok: false, error: 'OCR_ERROR', details: err.message });
  }
}

// ============================================================================
// GOOGLE GEMINI VISION
// ============================================================================

async function resolveAvailableGeminiModels(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) {
      const errText = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(errText); } catch (_) {}
      const errMsg = (parsed && parsed.error && parsed.error.message) || errText;
      return {
        ok: false,
        status: res.status,
        error: res.status === 400 ? 'API_KEY_INVALID' : (res.status === 403 ? 'PERMISSION_DENIED' : 'GOOGLE_API_ERROR'),
        details: errMsg
      };
    }

    const data = await res.json();
    const models = data.models || [];

    const usable = models
      .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));

    usable.sort((a, b) => {
      const score = name => {
        const n = name.toLowerCase();
        if (n.includes('embedding') || n.includes('aqa') || n.includes('imagen')) return -100;
        let s = 0;
        if (n.includes('flash')) s += 60;
        if (n.includes('2.5')) s += 40;
        else if (n.includes('2.0')) s += 30;
        else if (n.includes('1.5')) s += 20;
        if (n.includes('pro')) s += 15;
        if (n.includes('latest')) s += 5;
        if (n.includes('exp')) s -= 5;
        return s;
      };
      return score(b) - score(a);
    });

    if (usable.length === 0) {
      return {
        ok: true,
        models: [
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-flash-latest',
          'gemini-1.5-flash-002',
          'gemini-1.5-flash-001',
          'gemini-2.5-flash',
          'gemini-1.5-pro'
        ]
      };
    }

    return { ok: true, models: usable };
  } catch (err) {
    console.warn('[resolveAvailableGeminiModels] Exception en ListModels:', err.message);
    return {
      ok: true,
      models: [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash-002',
        'gemini-1.5-flash-001',
        'gemini-2.5-flash',
        'gemini-1.5-pro'
      ]
    };
  }
}

async function callGeminiWithFallback(apiKey, promptText, mimeType, cleanBase64) {
  const discovery = await resolveAvailableGeminiModels(apiKey);
  if (!discovery.ok) {
    if (discovery.status === 400 || discovery.error === 'API_KEY_INVALID') {
      throw new Error('Tu Gemini API Key no es válida. Revisá que la hayas copiado completa de aistudio.google.com/app/apikey.');
    }
    if (discovery.status === 403 || discovery.error === 'PERMISSION_DENIED') {
      throw new Error(`Permisos insuficientes con tu Gemini API Key (${discovery.details}).`);
    }
    throw new Error(`Error de Google Gemini (${discovery.status}): ${discovery.details}`);
  }

  const candidateModels = discovery.models.slice(0, 6);
  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                { inline_data: { mime_type: mimeType, data: cleanBase64 } }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json'
          }
        })
      });

      if (response.status === 400) {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  { inline_data: { mime_type: mimeType, data: cleanBase64 } }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1
            }
          })
        });
      }

      if (response.status === 404) {
        lastError = `Modelo ${modelName} no encontrado (404)`;
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        lastError = errText;
        continue;
      }

      const data = await response.json();
      const candidate = data.candidates && data.candidates[0];
      const textOutput = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;

      if (textOutput) {
        return textOutput;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(lastError || 'No se pudo conectar con ningún modelo de Gemini disponible.');
}

// ============================================================================
// OPENROUTER VISION
// ============================================================================

async function verifyOpenRouterKey(openRouterKey) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://cope-madero-takeaway.vercel.app',
        'X-Title': 'Cope Burgers Contabilidad'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(errText); } catch (_) {}
      return {
        ok: false,
        status: res.status,
        error: 'OPENROUTER_KEY_INVALID',
        details: (parsed && parsed.error && parsed.error.message) || errText
      };
    }

    const data = await res.json();
    return {
      ok: true,
      provider: 'openrouter',
      label: data.data?.label || 'OpenRouter API Key',
      models: [
        'openrouter/free',
        'nvidia/nemotron-3.5-super-vl:free',
        'google/gemma-4-31b-it:free',
        'inclusionai/ling-3.2-flash:free'
      ],
      selectedModel: 'openrouter/free (Router Automático de Modelos de Visión)'
    };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      error: 'OPENROUTER_CONNECTION_ERROR',
      details: err.message
    };
  }
}

async function callOpenRouterVision(openRouterKey, promptText, mimeType, cleanBase64) {
  const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

  const payload = {
    model: 'openrouter/free',
    models: [
      'openrouter/free',
      'nvidia/nemotron-3.5-super-vl:free',
      'google/gemma-4-31b-it:free',
      'inclusionai/ling-3.2-flash:free'
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: promptText
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl
            }
          }
        ]
      }
    ],
    temperature: 0.1
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://cope-madero-takeaway.vercel.app',
      'X-Title': 'Cope Burgers Contabilidad'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsed = null;
    try { parsed = JSON.parse(errText); } catch (_) {}
    throw new Error((parsed && parsed.error && parsed.error.message) || `OpenRouter Error ${response.status}: ${errText}`);
  }

  const resJson = await response.json();
  const choice = resJson.choices && resJson.choices[0];
  const textOutput = choice && choice.message && choice.message.content;
  if (!textOutput) {
    throw new Error('OpenRouter devolvió una respuesta vacía.');
  }

  return textOutput;
}

// ============================================================================
// HELPERS
// ============================================================================

function extractJsonFromText(textOutput) {
  try {
    return JSON.parse(textOutput);
  } catch (e1) {
    const codeBlockMatch = textOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (e2) {}
    }
    const braceMatch = textOutput.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch (e3) {}
    }
    throw new Error('La IA no devolvió un JSON válido: ' + textOutput.slice(0, 150));
  }
}
