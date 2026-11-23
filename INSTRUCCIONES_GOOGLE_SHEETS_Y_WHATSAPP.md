# 🚀 Guía de Integración: Google Sheets, Escáner OCR y WhatsApp
### Cope Burgers Puerto Madero — Contabilidad y Finanzas

Este documento explica cómo utilizar las 3 fases del sistema implementado:
1. **Escaneo de facturas con foto directa desde el celular en la web.**
2. **Sincronización automática con una planilla de Google Sheets en tu Google Drive.**
3. **Recepción automática de facturas enviadas por WhatsApp con respuesta de confirmación inmediata.**

---

## 📸 Fase 1: Escanear Facturas desde la Web con la Cámara del Celular

Ya está activo en: [https://cope-madero-takeaway.vercel.app/contabilidad](https://cope-madero-takeaway.vercel.app/contabilidad)

### Cómo usarlo en el celular:
1. Abrí la web en tu celular e ingresá la clave `Cope2026`.
2. Andá a la pestaña **🧾 Facturas y Gastos**.
3. Tocá el botón azul **📸 Sacar Foto**.
4. Se abrirá la cámara de tu celular. Enfocá la factura o remito y sacale una foto.
5. El sistema comprimirá la imagen al instante y la IA de Visión (Gemini):
   - Leerá el **Proveedor**, **Fecha**, **Tipo y N° de Factura**, **Monto Total ($)** y **Categoría gastronómica**.
   - Rellenará todos los campos del formulario con una animación verde de confirmación.
6. Revisás los números en 5 segundos y tocás **"➕ Cargar Factura al Sistema"**.

---

## ☁️ Fase 2: Conectar con Google Sheets en tu Google Drive

Para que cada factura y cierre de caja se guarde automáticamente en una planilla de Google Sheets:

### Pasos (se hace una sola vez en 2 minutos):
1. En tu Google Drive (en la carpeta `G:\Mi unidad\2026\Cope Madero\`), creá una nueva **Hoja de cálculo de Google**.
2. Nombrala: **`Cope Burgers - Contabilidad y Facturas`**.
3. En el menú superior de la hoja, hacé clic en: **Extensiones** ➔ **Apps Script**.
4. Borrá cualquier código de ejemplo que aparezca y pegá el contenido completo del archivo:
   👉 `google-apps-script.js` (que tenés en esta carpeta).
5. Arriba a la derecha hacé clic en **Implementar** (botón azul) ➔ **Nueva implementación**.
6. En el engranaje ⚙️ seleccioná **Tipo: Aplicación web**.
7. Configurá:
   - **Ejecutar como:** *Yo (tu cuenta)*
   - **Quién tiene acceso:** *Cualquier usuario (Anyone)*
8. Hacé clic en **Implementar** y copiá la **URL de la aplicación web** generada (empieza con `https://script.google.com/macros/s/.../exec`).
9. Entrá a la web de Contabilidad, tocá el botón superior **☁️ Sheets**, pegá esa URL y tocá **Guardar y Probar Conexión**.

¡Listo! A partir de ese momento, cada vez que cargues una factura o guardes un cierre de caja, se agregará como una fila en tu planilla de Google Sheets.

---

## 📱 Fase 3: Enviar Facturas por WhatsApp

El endpoint `/api/whatsapp-webhook` ya está programado y listo para recibir fotos de facturas.

### Cómo funciona:
1. Un empleado o vos le sacan una foto a la factura desde WhatsApp y la mandan al chat del local.
2. WhatsApp envía la imagen a `https://cope-madero-takeaway.vercel.app/api/whatsapp-webhook`.
3. El webhook procesa la imagen con Gemini Vision.
4. Guarda la factura en tu Google Sheet automáticamente con la etiqueta `(Origen: WhatsApp)`.
5. El bot le responde al instante al remitente en WhatsApp:
   ```
   ✅ *Factura Registrada con Éxito*
   🍔 *Cope Burgers Puerto Madero*

   • *Proveedor:* Cervecería Quilmes
   • *Monto:* $ 185.000
   • *Categoría:* Bebidas (Food Cost)
   • *Comprobante:* Factura A 0005-00123456
   • *Fecha:* 23/11/2026

   _Ya figura en Google Sheets y en la web de Contabilidad._
   ```

### Variables de Entorno en Vercel (opcionales para WhatsApp oficial de Meta):
* `GEMINI_API_KEY`: Tu clave de Google AI Studio (para el reconocimiento OCR).
* `GOOGLE_SHEETS_WEBHOOK_URL`: La URL de la Web App de Apps Script creada en la Fase 2.
* `WHATSAPP_TOKEN`: Token de acceso del WhatsApp Business Cloud API.
* `WHATSAPP_PHONE_ID`: ID del número de WhatsApp emisor.
* `WHATSAPP_VERIFY_TOKEN`: `cope2026` (o el que elijas al configurar el webhook en Meta).

*(Si usás un gateway por código QR tipo Evolution API o UltraMsg, solo apuntás el webhook entrante a `https://cope-madero-takeaway.vercel.app/api/whatsapp-webhook` y listo).*
