/**
 * ==============================================================================
 * COPE BURGERS PUERTO MADERO — GOOGLE APPS SCRIPT DATABASE
 * Base de datos en la nube para Facturas (Web + WhatsApp) y Cierres de Caja.
 * ==============================================================================
 * 
 * INSTRUCCIONES DE INSTALACIÓN (1 MINUTO):
 * 1. Abrí Google Drive (o creá un nuevo Google Sheet en tu carpeta 2026/Cope Madero).
 * 2. Nombralo: "Cope Burgers - Contabilidad y Facturas".
 * 3. En el menú superior hacé clic en: Extensiones -> Apps Script.
 * 4. Borrá el código que aparece y pegá TODO este archivo.
 * 5. Hacé clic en "Implementar" (botón azul arriba a la derecha) -> "Nueva implementación".
 * 6. En "Tipo" seleccioná: "Aplicación web".
 * 7. En "Quién tiene acceso" seleccioná: "Cualquier usuario" (Anyone).
 * 8. Hacé clic en "Implementar" y copiá la "URL de la aplicación web".
 * 9. Pegá esa URL en la web de Contabilidad de Cope (botón "☁️ Sheets" arriba).
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Hoja Facturas
  var sheetFacturas = ss.getSheetByName("Facturas");
  if (!sheetFacturas) {
    sheetFacturas = ss.insertSheet("Facturas");
    sheetFacturas.appendRow([
      "ID", "Fecha", "Proveedor", "Categoría", "Tipo Comprobante",
      "Nro Comprobante", "Monto Total ($)", "Estado Pago", "Notas / Detalle",
      "Origen (Web/WhatsApp)", "Fecha de Carga"
    ]);
    sheetFacturas.getRange("A1:K1").setFontWeight("bold").setBackground("#0047bb").setFontColor("#ffffff");
    sheetFacturas.setFrozenRows(1);
  }

  // 2. Hoja Cajas
  var sheetCajas = ss.getSheetByName("Cajas");
  if (!sheetCajas) {
    sheetCajas = ss.insertSheet("Cajas");
    sheetCajas.appendRow([
      "ID", "Fecha", "Turno", "Venta Fudo Total ($)", "Fudo Efectivo ($)",
      "Fudo MP ($)", "Fudo Tarjetas ($)", "Fudo Delivery ($)", "Efectivo Gaveta ($)",
      "Gastos Chica ($)", "Propinas ($)", "Total Justificado ($)",
      "Diferencia ($)", "Estado", "Observaciones", "Fecha de Carga"
    ]);
    sheetCajas.getRange("A1:P1").setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
    sheetCajas.setFrozenRows(1);
  }
}

function doPost(e) {
  try {
    setupSheets();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postData = "";

    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.data) {
      postData = JSON.parse(e.parameter.data);
    }

    var action = postData.action || "add_factura";
    var d = postData.data || {};

    if (action === "add_factura") {
      var sheetF = ss.getSheetByName("Facturas");
      sheetF.appendRow([
        d.id || ("fac_" + new Date().getTime()),
        d.fecha || Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd"),
        d.proveedor || "Sin Proveedor",
        d.categoria || "servicios",
        d.tipoComprobante || "Factura A",
        d.nroComprobante || "",
        Number(d.montoTotal) || 0,
        d.estadoPago || "pagado",
        d.notas || "",
        d.origen || "Web",
        new Date()
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        message: "Factura guardada correctamente en Google Sheets",
        id: d.id
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "add_caja") {
      var sheetC = ss.getSheetByName("Cajas");
      sheetC.appendRow([
        d.id || ("caja_" + new Date().getTime()),
        d.fecha || Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd"),
        d.turno || "Noche",
        Number(d.fudoTotal) || 0,
        Number(d.fudoEfectivo) || 0,
        Number(d.fudoMp) || 0,
        Number(d.fudoTarjetas) || 0,
        Number(d.fudoDelivery) || 0,
        Number(d.realEfectivo) || 0,
        Number(d.gastosCajaChica) || 0,
        Number(d.propinasPagadas) || 0,
        Number(d.totalJustificado) || 0,
        Number(d.diferencia) || 0,
        d.estado || "cuadrada",
        d.notas || "",
        new Date()
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        message: "Cierre de caja guardado en Google Sheets",
        id: d.id
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: "Acción no reconocida"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    setupSheets();
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Obtener Facturas
    var sheetF = ss.getSheetByName("Facturas");
    var dataF = sheetF.getDataRange().getValues();
    var facturas = [];

    for (var i = 1; i < dataF.length; i++) {
      var row = dataF[i];
      if (!row[0]) continue;
      facturas.push({
        id: String(row[0]),
        fecha: formatDateCell(row[1]),
        proveedor: String(row[2]),
        categoria: String(row[3]),
        tipoComprobante: String(row[4]),
        nroComprobante: String(row[5]),
        montoTotal: Number(row[6]) || 0,
        estadoPago: String(row[7]),
        notas: String(row[8] || ""),
        origen: String(row[9] || "Web"),
        createdAt: row[10] ? new Date(row[10]).toISOString() : new Date().toISOString()
      });
    }

    // Obtener Cajas
    var sheetC = ss.getSheetByName("Cajas");
    var dataC = sheetC.getDataRange().getValues();
    var cajas = [];

    for (var j = 1; j < dataC.length; j++) {
      var rowC = dataC[j];
      if (!rowC[0]) continue;
      cajas.push({
        id: String(rowC[0]),
        fecha: formatDateCell(rowC[1]),
        turno: String(rowC[2]),
        fudoTotal: Number(rowC[3]) || 0,
        fudoEfectivo: Number(rowC[4]) || 0,
        fudoMp: Number(rowC[5]) || 0,
        fudoTarjetas: Number(rowC[6]) || 0,
        fudoDelivery: Number(rowC[7]) || 0,
        realEfectivo: Number(rowC[8]) || 0,
        gastosCajaChica: Number(rowC[9]) || 0,
        propinasPagadas: Number(rowC[10]) || 0,
        totalJustificado: Number(rowC[11]) || 0,
        diferencia: Number(rowC[12]) || 0,
        estado: String(rowC[13]),
        notas: String(rowC[14] || ""),
        createdAt: rowC[15] ? new Date(rowC[15]).toISOString() : new Date().toISOString()
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      facturas: facturas,
      cajas: cajas
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDateCell(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT-3", "yyyy-MM-dd");
  }
  return String(val || "");
}
