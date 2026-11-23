/**
 * COPE BURGERS PUERTO MADERO — MÓDULO DE CONTABILIDAD Y FINANZAS
 * Conciliación diaria Fudo POS, Arqueo de Caja Chica, Facturación con Escáner OCR y Google Sheets Cloud Sync.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cope_accounting_v1';
  const AUTH_PASS = 'Cope2026';
  const SESSION_AUTH_KEY = 'cope_contab_auth';
  const LOCAL_AUTH_KEY = 'cope_contab_remember';
  const GEMINI_KEY_STORAGE = 'cope_gemini_api_key';
  const SHEETS_URL_STORAGE = 'cope_sheets_url';

  // Categorías fijas de gastronomía
  const CATEGORIES = [
    { id: 'carne', name: 'Carne y Medallones (Food Cost)', isFoodCost: true, badgeClass: 'food' },
    { id: 'panaderia', name: 'Panadería y Verdulería (Food Cost)', isFoodCost: true, badgeClass: 'food' },
    { id: 'papas', name: 'Papas e Insumos Congelados (Food Cost)', isFoodCost: true, badgeClass: 'food' },
    { id: 'bebidas', name: 'Bebidas (Cerveza, Gaseosas, Agua)', isFoodCost: true, badgeClass: 'beverage' },
    { id: 'packaging', name: 'Packaging y Descartables', isFoodCost: false, badgeClass: 'packaging' },
    { id: 'servicios', name: 'Servicios, Alquiler y Mantenimiento', isFoodCost: false, badgeClass: 'services' },
    { id: 'sueldos', name: 'Sueldos, Adelantos y Varios', isFoodCost: false, badgeClass: '' }
  ];

  // Estado de la aplicación
  let state = {
    cajas: [],
    facturas: []
  };

  // Elementos DOM
  const els = {};

  /* ==========================================================================
     INICIALIZACIÓN
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    setupAuth();
    loadState();
    bindEvents();
    initDefaults();
    renderAll();
    checkGoogleSheetsStatus();
  });

  function cacheDom() {
    // Auth
    els.authModal = document.getElementById('authModal');
    els.authForm = document.getElementById('authForm');
    els.authPassword = document.getElementById('authPassword');
    els.authRemember = document.getElementById('authRemember');
    els.authError = document.getElementById('authError');
    els.btnLogout = document.getElementById('btnLogout');

    // Tabs
    els.tabButtons = document.querySelectorAll('.tab-btn');
    els.tabPanels = document.querySelectorAll('.tab-panel');
    els.badgeCajasCount = document.getElementById('badgeCajasCount');
    els.badgeFacturasCount = document.getElementById('badgeFacturasCount');

    // Header Sync & Modals
    els.btnSheetsSyncModal = document.getElementById('btnSheetsSyncModal');
    els.sheetsStatusLabel = document.getElementById('sheetsStatusLabel');
    els.btnApiKeyModal = document.getElementById('btnApiKeyModal');
    els.sheetsModal = document.getElementById('sheetsModal');
    els.formSheetsConfig = document.getElementById('formSheetsConfig');
    els.sheetsWebhookUrl = document.getElementById('sheetsWebhookUrl');
    els.btnCloseSheetsModal = document.getElementById('btnCloseSheetsModal');
    els.btnSyncNow = document.getElementById('btnSyncNow');

    els.apiKeyModal = document.getElementById('apiKeyModal');
    els.formApiKeyConfig = document.getElementById('formApiKeyConfig');
    els.inputGeminiApiKey = document.getElementById('inputGeminiApiKey');
    els.btnCloseApiKeyModal = document.getElementById('btnCloseApiKeyModal');

    // Formulario Caja
    els.formCaja = document.getElementById('formCaja');
    els.cajaFecha = document.getElementById('cajaFecha');
    els.cajaTurno = document.getElementById('cajaTurno');
    els.fudoTotal = document.getElementById('fudoTotal');
    els.fudoEfectivo = document.getElementById('fudoEfectivo');
    els.fudoMp = document.getElementById('fudoMp');
    els.fudoTarjetas = document.getElementById('fudoTarjetas');
    els.fudoDelivery = document.getElementById('fudoDelivery');
    els.realEfectivo = document.getElementById('realEfectivo');
    els.gastosCajaChica = document.getElementById('gastosCajaChica');
    els.propinasPagadas = document.getElementById('propinasPagadas');
    els.cajaNotas = document.getElementById('cajaNotas');

    // Monitor reactivo de diferencia
    els.diffMonitorCard = document.getElementById('diffMonitorCard');
    els.diffValue = document.getElementById('diffValue');
    els.diffStatusText = document.getElementById('diffStatusText');
    els.diffDetail = document.getElementById('diffDetail');

    // Tabla Cajas
    els.tableCajasBody = document.getElementById('tableCajasBody');
    els.emptyCajasState = document.getElementById('emptyCajasState');

    // Escáner OCR Factura
    els.btnScanCamera = document.getElementById('btnScanCamera');
    els.btnScanFile = document.getElementById('btnScanFile');
    els.inputScanCamera = document.getElementById('inputScanCamera');
    els.inputScanFile = document.getElementById('inputScanFile');
    els.ocrPreviewBox = document.getElementById('ocrPreviewBox');
    els.ocrPreviewImg = document.getElementById('ocrPreviewImg');
    els.ocrStatusTitle = document.getElementById('ocrStatusTitle');
    els.ocrStatusDesc = document.getElementById('ocrStatusDesc');
    els.btnCancelOcr = document.getElementById('btnCancelOcr');

    // Formulario Factura
    els.formFactura = document.getElementById('formFactura');
    els.facturaFecha = document.getElementById('facturaFecha');
    els.facturaProveedor = document.getElementById('facturaProveedor');
    els.proveedoresList = document.getElementById('proveedoresList');
    els.facturaCategoria = document.getElementById('facturaCategoria');
    els.facturaTipo = document.getElementById('facturaTipo');
    els.facturaNumero = document.getElementById('facturaNumero');
    els.facturaMonto = document.getElementById('facturaMonto');
    els.facturaEstado = document.getElementById('facturaEstado');
    els.facturaNotas = document.getElementById('facturaNotas');

    // Tabla Facturas y filtros
    els.tableFacturasBody = document.getElementById('tableFacturasBody');
    els.emptyFacturasState = document.getElementById('emptyFacturasState');
    els.filtroFacturaMes = document.getElementById('filtroFacturaMes');
    els.filtroFacturaCategoria = document.getElementById('filtroFacturaCategoria');
    els.filtroFacturaEstado = document.getElementById('filtroFacturaEstado');
    els.filtroFacturaBusqueda = document.getElementById('filtroFacturaBusqueda');

    // Dashboard P&L
    els.dashboardMes = document.getElementById('dashboardMes');
    els.kpiVentas = document.getElementById('kpiVentas');
    els.kpiVentasSub = document.getElementById('kpiVentasSub');
    els.kpiEgresos = document.getElementById('kpiEgresos');
    els.kpiEgresosSub = document.getElementById('kpiEgresosSub');
    els.kpiResultado = document.getElementById('kpiResultado');
    els.kpiResultadoSub = document.getElementById('kpiResultadoSub');
    els.kpiFoodCost = document.getElementById('kpiFoodCost');
    els.kpiFoodCostFill = document.getElementById('kpiFoodCostFill');
    els.kpiFoodCostSub = document.getElementById('kpiFoodCostSub');
    els.kpiDeuda = document.getElementById('kpiDeuda');
    els.kpiDeudaSub = document.getElementById('kpiDeudaSub');
    els.expensesBreakdown = document.getElementById('expensesBreakdown');

    // Exportación y backup
    els.btnExportExcelCajas = document.getElementById('btnExportExcelCajas');
    els.btnExportExcelFacturas = document.getElementById('btnExportExcelFacturas');
    els.btnBackup = document.getElementById('btnBackup');
    els.btnRestore = document.getElementById('btnRestore');
    els.fileRestoreInput = document.getElementById('fileRestoreInput');
    els.toastContainer = document.getElementById('toastContainer');
  }

  /* ==========================================================================
     AUTENTICACIÓN
     ========================================================================== */
  function setupAuth() {
    const isRemembered = localStorage.getItem(LOCAL_AUTH_KEY) === 'true';
    const isSessionActive = sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';

    if (isRemembered || isSessionActive) {
      if (els.authModal) els.authModal.classList.add('hidden');
    } else {
      if (els.authModal) {
        els.authModal.classList.remove('hidden');
        setTimeout(() => els.authPassword && els.authPassword.focus(), 100);
      }
    }

    if (els.authForm) {
      els.authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = (els.authPassword.value || '').trim();
        if (pass === AUTH_PASS) {
          sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
          if (els.authRemember && els.authRemember.checked) {
            localStorage.setItem(LOCAL_AUTH_KEY, 'true');
          }
          if (els.authError) els.authError.classList.add('hidden');
          els.authModal.classList.add('hidden');
          showToast('Bienvenido a Contabilidad Cope Burgers', 'success');
        } else {
          if (els.authError) {
            els.authError.textContent = 'Clave incorrecta. Reintentá nuevamente.';
            els.authError.classList.remove('hidden');
          }
          els.authPassword.value = '';
          els.authPassword.focus();
        }
      });
    }

    if (els.btnLogout) {
      els.btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem(SESSION_AUTH_KEY);
        localStorage.removeItem(LOCAL_AUTH_KEY);
        if (els.authPassword) els.authPassword.value = '';
        if (els.authModal) els.authModal.classList.remove('hidden');
        showToast('Sesión cerrada con éxito');
      });
    }
  }

  /* ==========================================================================
     ESTADO & LOCALSTORAGE
     ========================================================================== */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.cajas = Array.isArray(parsed.cajas) ? parsed.cajas : [];
        state.facturas = Array.isArray(parsed.facturas) ? parsed.facturas : [];
      } else {
        state = { cajas: [], facturas: [] };
        saveState();
      }
    } catch (err) {
      console.error('Error al leer localStorage:', err);
      state = { cajas: [], facturas: [] };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        cajas: state.cajas,
        facturas: state.facturas,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Error al guardar localStorage:', err);
      showToast('Error al guardar datos localmente', 'error');
    }
  }

  function initDefaults() {
    const today = new Date().toISOString().split('T')[0];
    if (els.cajaFecha && !els.cajaFecha.value) els.cajaFecha.value = today;
    if (els.facturaFecha && !els.facturaFecha.value) els.facturaFecha.value = today;

    if (els.sheetsWebhookUrl) {
      els.sheetsWebhookUrl.value = localStorage.getItem(SHEETS_URL_STORAGE) || '';
    }
    if (els.inputGeminiApiKey) {
      els.inputGeminiApiKey.value = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
    }

    populateMonthSelectors();
    updateProveedoresDatalist();
  }

  function populateMonthSelectors() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const months = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const ym = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      months.push({ ym, label: label.charAt(0).toUpperCase() + label.slice(1) });
      date.setMonth(date.getMonth() - 1);
    }

    if (els.dashboardMes) {
      els.dashboardMes.innerHTML = '<option value="all">Todo el Histórico</option>' + 
        months.map(m => `<option value="${m.ym}" ${m.ym === currentMonth ? 'selected' : ''}>${m.label}</option>`).join('');
    }

    if (els.filtroFacturaMes) {
      els.filtroFacturaMes.innerHTML = '<option value="all">Todos los Meses</option>' + 
        months.map(m => `<option value="${m.ym}">${m.label}</option>`).join('');
    }
  }

  function updateProveedoresDatalist() {
    if (!els.proveedoresList) return;
    const provs = Array.from(new Set(state.facturas.map(f => (f.proveedor || '').trim()).filter(Boolean))).sort();
    els.proveedoresList.innerHTML = provs.map(p => `<option value="${escapeHtml(p)}"></option>`).join('');
  }

  /* ==========================================================================
     EVENTOS
     ========================================================================== */
  function bindEvents() {
    // Tabs
    els.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    // Conciliación en tiempo real (inputs de caja)
    const cajaInputs = [
      els.fudoEfectivo,
      els.realEfectivo,
      els.gastosCajaChica,
      els.propinasPagadas
    ];
    cajaInputs.forEach(input => {
      if (input) {
        input.addEventListener('input', updateDiffMonitor);
      }
    });

    // Submit de Cierre de Caja
    if (els.formCaja) {
      els.formCaja.addEventListener('submit', handleCajaSubmit);
    }

    // Submit de Factura
    if (els.formFactura) {
      els.formFactura.addEventListener('submit', handleFacturaSubmit);
    }

    // Filtros de Facturas
    [els.filtroFacturaMes, els.filtroFacturaCategoria, els.filtroFacturaEstado].forEach(sel => {
      if (sel) sel.addEventListener('change', renderFacturasTable);
    });
    if (els.filtroFacturaBusqueda) {
      els.filtroFacturaBusqueda.addEventListener('input', debounce(renderFacturasTable, 200));
    }

    // Filtro de Dashboard
    if (els.dashboardMes) {
      els.dashboardMes.addEventListener('change', renderDashboard);
    }

    // Escáner OCR Facturas
    if (els.btnScanCamera && els.inputScanCamera) {
      els.btnScanCamera.addEventListener('click', () => els.inputScanCamera.click());
      els.inputScanCamera.addEventListener('change', handleScanInput);
    }
    if (els.btnScanFile && els.inputScanFile) {
      els.btnScanFile.addEventListener('click', () => els.inputScanFile.click());
      els.inputScanFile.addEventListener('change', handleScanInput);
    }
    if (els.btnCancelOcr) {
      els.btnCancelOcr.addEventListener('click', () => {
        if (els.ocrPreviewBox) els.ocrPreviewBox.classList.add('hidden');
      });
    }

    // Modales de Configuración
    if (els.btnSheetsSyncModal && els.sheetsModal) {
      els.btnSheetsSyncModal.addEventListener('click', () => els.sheetsModal.classList.remove('hidden'));
    }
    if (els.btnCloseSheetsModal && els.sheetsModal) {
      els.btnCloseSheetsModal.addEventListener('click', () => els.sheetsModal.classList.add('hidden'));
    }
    if (els.formSheetsConfig) {
      els.formSheetsConfig.addEventListener('submit', handleSaveSheetsConfig);
    }
    if (els.btnSyncNow) {
      els.btnSyncNow.addEventListener('click', fetchFromGoogleSheets);
    }

    if (els.btnApiKeyModal && els.apiKeyModal) {
      els.btnApiKeyModal.addEventListener('click', () => els.apiKeyModal.classList.remove('hidden'));
    }
    if (els.btnCloseApiKeyModal && els.apiKeyModal) {
      els.btnCloseApiKeyModal.addEventListener('click', () => els.apiKeyModal.classList.add('hidden'));
    }
    if (els.formApiKeyConfig) {
      els.formApiKeyConfig.addEventListener('submit', handleSaveApiKeyConfig);
    }

    // Exportar Excel CSV
    if (els.btnExportExcelCajas) {
      els.btnExportExcelCajas.addEventListener('click', () => exportCajasCsv());
    }
    if (els.btnExportExcelFacturas) {
      els.btnExportExcelFacturas.addEventListener('click', () => exportFacturasCsv());
    }

    // Backup & Restore JSON
    if (els.btnBackup) {
      els.btnBackup.addEventListener('click', exportBackupJson);
    }
    if (els.btnRestore && els.fileRestoreInput) {
      els.btnRestore.addEventListener('click', () => els.fileRestoreInput.click());
      els.fileRestoreInput.addEventListener('change', handleRestoreFile);
    }
  }

  function switchTab(tabId) {
    els.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    els.tabPanels.forEach(panel => {
      panel.classList.toggle('hidden', panel.id !== `panel-${tabId}`);
    });

    if (tabId === 'dashboard') {
      renderDashboard();
    }
  }

  /* ==========================================================================
     CONCILIACIÓN EN TIEMPO REAL (MONITOR DE DIFERENCIA)
     ========================================================================== */
  function calculateCashDiff() {
    const fudoEf = parseFloat(els.fudoEfectivo ? els.fudoEfectivo.value : 0) || 0;
    const realEf = parseFloat(els.realEfectivo ? els.realEfectivo.value : 0) || 0;
    const gastos = parseFloat(els.gastosCajaChica ? els.gastosCajaChica.value : 0) || 0;
    const propinas = parseFloat(els.propinasPagadas ? els.propinasPagadas.value : 0) || 0;

    const totalJustificado = realEf + gastos + propinas;
    const diff = totalJustificado - fudoEf;

    return { fudoEf, realEf, gastos, propinas, totalJustificado, diff };
  }

  function updateDiffMonitor() {
    if (!els.diffMonitorCard) return;

    const { fudoEf, totalJustificado, diff } = calculateCashDiff();
    const absDiff = Math.abs(diff);

    els.diffMonitorCard.classList.remove('cuadrada', 'sobrante', 'faltante');

    if (absDiff <= 150) {
      els.diffMonitorCard.classList.add('cuadrada');
      if (els.diffValue) els.diffValue.textContent = formatMoney(diff);
      if (els.diffStatusText) els.diffStatusText.textContent = 'Caja Cuadrada ✅';
      if (els.diffDetail) {
        els.diffDetail.textContent = `Efectivo Justificado: ${formatMoney(totalJustificado)} vs Fudo: ${formatMoney(fudoEf)}`;
      }
    } else if (diff > 150) {
      els.diffMonitorCard.classList.add('sobrante');
      if (els.diffValue) els.diffValue.textContent = `+${formatMoney(diff)}`;
      if (els.diffStatusText) els.diffStatusText.textContent = 'Sobrante en Caja ⚠️';
      if (els.diffDetail) {
        els.diffDetail.textContent = `Hay más efectivo en gaveta del registrado en Fudo. Revisá ventas sin cargar.`;
      }
    } else {
      els.diffMonitorCard.classList.add('faltante');
      if (els.diffValue) els.diffValue.textContent = formatMoney(diff);
      if (els.diffStatusText) els.diffStatusText.textContent = 'Faltante en Caja ❌';
      if (els.diffDetail) {
        els.diffDetail.textContent = `Falta dinero en gaveta. Verificá si hubo gastos menores sin ticket o propinas abonadas.`;
      }
    }
  }

  /* ==========================================================================
     HANDLER: CIERRE DE CAJA (FUDO VS ARQUEO)
     ========================================================================== */
  async function handleCajaSubmit(e) {
    e.preventDefault();

    const fecha = els.cajaFecha.value;
    const turno = els.cajaTurno.value;
    const fudoTotal = parseFloat(els.fudoTotal.value) || 0;
    const fudoEf = parseFloat(els.fudoEfectivo.value) || 0;
    const fudoMp = parseFloat(els.fudoMp.value) || 0;
    const fudoTarjetas = parseFloat(els.fudoTarjetas.value) || 0;
    const fudoDelivery = parseFloat(els.fudoDelivery.value) || 0;

    const realEf = parseFloat(els.realEfectivo.value) || 0;
    const gastos = parseFloat(els.gastosCajaChica.value) || 0;
    const propinas = parseFloat(els.propinasPagadas.value) || 0;
    const notas = (els.cajaNotas.value || '').trim();

    const totalJustificado = realEf + gastos + propinas;
    const diff = totalJustificado - fudoEf;

    let estado = 'cuadrada';
    if (Math.abs(diff) > 150) {
      estado = diff > 0 ? 'sobrante' : 'faltante';
    }

    const nuevoCierre = {
      id: 'caja_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      fecha,
      turno,
      fudoTotal,
      fudoEfectivo: fudoEf,
      fudoMp,
      fudoTarjetas,
      fudoDelivery,
      realEfectivo: realEf,
      gastosCajaChica: gastos,
      propinasPagadas: propinas,
      totalJustificado,
      diferencia: diff,
      estado,
      notas,
      createdAt: new Date().toISOString()
    };

    state.cajas.unshift(nuevoCierre);
    saveState();
    renderCajasTable();
    renderDashboard();

    // Sincronizar con Google Sheets si está configurado
    syncRowToGoogleSheets('caja', nuevoCierre);

    // Reset
    els.fudoTotal.value = '';
    els.fudoEfectivo.value = '';
    els.fudoMp.value = '';
    els.fudoTarjetas.value = '';
    els.fudoDelivery.value = '';
    els.realEfectivo.value = '';
    els.gastosCajaChica.value = '';
    els.propinasPagadas.value = '';
    els.cajaNotas.value = '';
    updateDiffMonitor();

    showToast(`Cierre de caja guardado (${turno})`, 'success');
  }

  function renderCajasTable() {
    if (!els.tableCajasBody) return;

    if (els.badgeCajasCount) {
      els.badgeCajasCount.textContent = state.cajas.length;
    }

    if (state.cajas.length === 0) {
      els.tableCajasBody.innerHTML = '';
      if (els.emptyCajasState) els.emptyCajasState.classList.remove('hidden');
      return;
    }

    if (els.emptyCajasState) els.emptyCajasState.classList.add('hidden');

    const html = state.cajas.map(c => {
      let badgeClass = 'badge-cuadrada';
      let badgeText = 'Cuadrada';
      if (c.estado === 'sobrante') {
        badgeClass = 'badge-sobrante';
        badgeText = 'Sobrante';
      } else if (c.estado === 'faltante') {
        badgeClass = 'badge-faltante';
        badgeText = 'Faltante';
      }

      return `
        <tr>
          <td><strong>${formatDisplayDate(c.fecha)}</strong></td>
          <td><span class="badge" style="background:#f1f5f9;color:#334155;">${escapeHtml(c.turno)}</span></td>
          <td class="tabular"><strong>${formatMoney(c.fudoTotal)}</strong></td>
          <td class="tabular">${formatMoney(c.fudoEfectivo)}</td>
          <td class="tabular">${formatMoney(c.totalJustificado)}</td>
          <td class="tabular" style="font-weight:800;color:${c.diferencia === 0 ? '#10b981' : (c.diferencia > 0 ? '#1e40af' : '#ef4444')}">
            ${c.diferencia > 0 ? '+' : ''}${formatMoney(c.diferencia)}
          </td>
          <td><span class="badge ${badgeClass}">${badgeText}</span></td>
          <td>
            <button type="button" class="btn-icon" title="Eliminar registro" onclick="window.copeContab.deleteCaja('${c.id}')">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');

    els.tableCajasBody.innerHTML = html;
  }

  /* ==========================================================================
     ESCÁNER OCR INTELIGENTE (FOTO / CÁMARA -> IA -> FORMULARIO)
     ========================================================================== */
  async function handleScanInput(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!els.ocrPreviewBox) return;
    els.ocrPreviewBox.classList.remove('hidden');
    if (els.ocrStatusTitle) els.ocrStatusTitle.textContent = '📸 Procesando imagen...';
    if (els.ocrStatusDesc) els.ocrStatusDesc.textContent = 'Optimizando resolución para escaneo fiscal.';

    try {
      const { base64Data, dataUrl } = await compressImageForOcr(file, 1600, 0.85);
      if (els.ocrPreviewImg) els.ocrPreviewImg.src = dataUrl;

      if (els.ocrStatusTitle) els.ocrStatusTitle.textContent = '🔍 Analizando comprobante con IA...';
      if (els.ocrStatusDesc) els.ocrStatusDesc.textContent = 'Extrayendo proveedor, fecha, montos e IVA.';

      const customKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';

      const res = await fetch('/api/ocr-factura', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': customKey
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
          apiKey: customKey
        })
      });

      const resJson = await res.json();

      if (!res.ok || !resJson.ok) {
        if (resJson.error === 'NO_API_KEY') {
          if (els.ocrStatusTitle) els.ocrStatusTitle.textContent = '🔑 Se requiere Gemini API Key';
          if (els.ocrStatusDesc) els.ocrStatusDesc.textContent = 'Hacé clic en el botón "OCR" arriba para ingresar tu clave gratuita.';
          if (els.apiKeyModal) els.apiKeyModal.classList.remove('hidden');
          return;
        }
        throw new Error(resJson.details || resJson.error || 'Error al procesar la imagen con OCR.');
      }

      const data = resJson.data || {};
      applyOcrDataToForm(data);

      if (els.ocrStatusTitle) els.ocrStatusTitle.textContent = '✅ Factura reconocida con éxito';
      if (els.ocrStatusDesc) els.ocrStatusDesc.textContent = `${data.proveedor || 'Proveedor'} · Total: ${formatMoney(data.montoTotal || 0)}. Revisá y guardá.`;

      showToast(`Factura de ${data.proveedor || 'proveedor'} detectada`, 'success');

    } catch (err) {
      console.error('Error durante el escaneo OCR:', err);
      if (els.ocrStatusTitle) els.ocrStatusTitle.textContent = '⚠️ No se pudo procesar la foto';
      if (els.ocrStatusDesc) els.ocrStatusDesc.textContent = err.message || 'Intentá con una foto más nítida o ingresá manualmente.';
      showToast('Error en el escaneo: ' + (err.message || 'Error de lectura'), 'error');
    } finally {
      e.target.value = '';
    }
  }

  function applyOcrDataToForm(data) {
    if (data.fecha && els.facturaFecha) {
      els.facturaFecha.value = data.fecha;
      flashInput(els.facturaFecha);
    }
    if (data.proveedor && els.facturaProveedor) {
      els.facturaProveedor.value = data.proveedor;
      flashInput(els.facturaProveedor);
    }
    if (data.categoria && els.facturaCategoria) {
      els.facturaCategoria.value = data.categoria;
      flashInput(els.facturaCategoria);
    }
    if (data.tipoComprobante && els.facturaTipo) {
      els.facturaTipo.value = data.tipoComprobante;
      flashInput(els.facturaTipo);
    }
    if (data.nroComprobante && els.facturaNumero) {
      els.facturaNumero.value = data.nroComprobante;
      flashInput(els.facturaNumero);
    }
    if (data.montoTotal && els.facturaMonto) {
      els.facturaMonto.value = data.montoTotal;
      flashInput(els.facturaMonto);
    }
    if (data.notas && els.facturaNotas) {
      els.facturaNotas.value = data.notas;
      flashInput(els.facturaNotas);
    }
  }

  function flashInput(input) {
    input.classList.add('field-highlight');
    setTimeout(() => input.classList.remove('field-highlight'), 1500);
  }

  function compressImageForOcr(file, maxDimension = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64Data = dataUrl.split(',')[1];
          resolve({ base64Data, dataUrl });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ==========================================================================
     HANDLER: CARGA DE FACTURAS Y EGRESOS
     ========================================================================== */
  async function handleFacturaSubmit(e) {
    e.preventDefault();

    const fecha = els.facturaFecha.value;
    const proveedor = (els.facturaProveedor.value || '').trim();
    const categoria = els.facturaCategoria.value;
    const tipoComprobante = els.facturaTipo.value;
    const nroComprobante = (els.facturaNumero.value || '').trim();
    const montoTotal = parseFloat(els.facturaMonto.value) || 0;
    const estadoPago = els.facturaEstado.value;
    const notas = (els.facturaNotas.value || '').trim();

    if (!proveedor) {
      showToast('Ingresá el nombre del proveedor', 'error');
      return;
    }
    if (montoTotal <= 0) {
      showToast('El monto debe ser mayor a 0', 'error');
      return;
    }

    const nuevaFactura = {
      id: 'fac_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      fecha,
      proveedor,
      categoria,
      tipoComprobante,
      nroComprobante,
      montoTotal,
      estadoPago,
      notas,
      createdAt: new Date().toISOString()
    };

    state.facturas.unshift(nuevaFactura);
    saveState();
    updateProveedoresDatalist();
    renderFacturasTable();
    renderDashboard();

    // Sincronizar en tiempo real con Google Sheets
    syncRowToGoogleSheets('factura', nuevaFactura);

    // Reset
    els.facturaProveedor.value = '';
    els.facturaNumero.value = '';
    els.facturaMonto.value = '';
    els.facturaNotas.value = '';
    if (els.ocrPreviewBox) els.ocrPreviewBox.classList.add('hidden');

    showToast(`Factura de ${proveedor} cargada correctamente`, 'success');
  }

  function renderFacturasTable() {
    if (!els.tableFacturasBody) return;

    if (els.badgeFacturasCount) {
      els.badgeFacturasCount.textContent = state.facturas.length;
    }

    const selMes = els.filtroFacturaMes ? els.filtroFacturaMes.value : 'all';
    const selCat = els.filtroFacturaCategoria ? els.filtroFacturaCategoria.value : 'all';
    const selEstado = els.filtroFacturaEstado ? els.filtroFacturaEstado.value : 'all';
    const busqueda = (els.filtroFacturaBusqueda ? els.filtroFacturaBusqueda.value : '').toLowerCase().trim();

    let list = state.facturas.filter(f => {
      if (selMes !== 'all' && (!f.fecha || !f.fecha.startsWith(selMes))) return false;
      if (selCat !== 'all' && f.categoria !== selCat) return false;
      if (selEstado !== 'all' && f.estadoPago !== selEstado) return false;
      if (busqueda) {
        const text = `${f.proveedor} ${f.nroComprobante} ${f.notas}`.toLowerCase();
        if (!text.includes(busqueda)) return false;
      }
      return true;
    });

    if (list.length === 0) {
      els.tableFacturasBody.innerHTML = '';
      if (els.emptyFacturasState) els.emptyFacturasState.classList.remove('hidden');
      return;
    }

    if (els.emptyFacturasState) els.emptyFacturasState.classList.add('hidden');

    const html = list.map(f => {
      const catObj = CATEGORIES.find(c => c.id === f.categoria) || { name: f.categoria, badgeClass: '' };
      const isPaid = f.estadoPago === 'pagado';

      return `
        <tr>
          <td><strong>${formatDisplayDate(f.fecha)}</strong></td>
          <td><strong>${escapeHtml(f.proveedor)}</strong></td>
          <td><span class="cat-badge ${catObj.badgeClass}">${escapeHtml(catObj.name)}</span></td>
          <td class="tabular">${escapeHtml(f.tipoComprobante)} ${escapeHtml(f.nroComprobante || 'S/N')}</td>
          <td class="tabular" style="font-weight:900;">${formatMoney(f.montoTotal)}</td>
          <td>
            <button type="button" class="badge ${isPaid ? 'badge-pagado' : 'badge-pendiente'}" style="cursor:pointer;" title="Click para alternar estado" onclick="window.copeContab.togglePagoFactura('${f.id}')">
              ${isPaid ? 'Pagada ✅' : 'Pendiente ⏳'}
            </button>
          </td>
          <td>
            <button type="button" class="btn-icon" title="Eliminar factura" onclick="window.copeContab.deleteFactura('${f.id}')">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');

    els.tableFacturasBody.innerHTML = html;
  }

  /* ==========================================================================
     DASHBOARD P&L Y KPIS GASTRONÓMICOS
     ========================================================================== */
  function renderDashboard() {
    const selMes = els.dashboardMes ? els.dashboardMes.value : 'all';

    const filteredCajas = state.cajas.filter(c => selMes === 'all' || (c.fecha && c.fecha.startsWith(selMes)));
    const filteredFacturas = state.facturas.filter(f => selMes === 'all' || (f.fecha && f.fecha.startsWith(selMes)));

    const ventasTotales = filteredCajas.reduce((acc, c) => acc + (c.fudoTotal || 0), 0);
    const diasCajas = filteredCajas.length;

    const egresosTotales = filteredFacturas.reduce((acc, f) => acc + (f.montoTotal || 0), 0);
    const resultadoOperativo = ventasTotales - egresosTotales;
    const margenOperativo = ventasTotales > 0 ? (resultadoOperativo / ventasTotales) * 100 : 0;

    const foodCostFacturas = filteredFacturas.filter(f => {
      const cat = CATEGORIES.find(c => c.id === f.categoria);
      return cat && cat.isFoodCost;
    });
    const foodCostTotal = foodCostFacturas.reduce((acc, f) => acc + (f.montoTotal || 0), 0);
    const ratioFoodCost = ventasTotales > 0 ? (foodCostTotal / ventasTotales) * 100 : 0;

    const facturasPendientes = filteredFacturas.filter(f => f.estadoPago === 'pendiente');
    const deudaPendiente = facturasPendientes.reduce((acc, f) => acc + (f.montoTotal || 0), 0);

    if (els.kpiVentas) els.kpiVentas.textContent = formatMoney(ventasTotales);
    if (els.kpiVentasSub) els.kpiVentasSub.textContent = `${diasCajas} ${diasCajas === 1 ? 'turno cerrado' : 'turnos cerrados'}`;

    if (els.kpiEgresos) els.kpiEgresos.textContent = formatMoney(egresosTotales);
    if (els.kpiEgresosSub) els.kpiEgresosSub.textContent = `${filteredFacturas.length} facturas registradas`;

    if (els.kpiResultado) {
      els.kpiResultado.textContent = formatMoney(resultadoOperativo);
      els.kpiResultado.style.color = resultadoOperativo >= 0 ? '#059669' : '#ef4444';
    }
    if (els.kpiResultadoSub) {
      els.kpiResultadoSub.textContent = `Margen: ${margenOperativo.toFixed(1)}% de ventas`;
    }

    if (els.kpiFoodCost) {
      els.kpiFoodCost.textContent = `${ratioFoodCost.toFixed(1)}%`;
    }
    if (els.kpiFoodCostFill) {
      const fillW = Math.min(Math.max(ratioFoodCost, 0), 100);
      els.kpiFoodCostFill.style.width = `${fillW}%`;
      els.kpiFoodCostFill.className = 'food-cost-fill ' + (ratioFoodCost <= 33 ? 'good' : (ratioFoodCost <= 38 ? 'warning' : 'danger'));
    }
    if (els.kpiFoodCostSub) {
      els.kpiFoodCostSub.textContent = `${formatMoney(foodCostTotal)} (Objetivo: 28% a 32%)`;
    }

    if (els.kpiDeuda) els.kpiDeuda.textContent = formatMoney(deudaPendiente);
    if (els.kpiDeudaSub) els.kpiDeudaSub.textContent = `${facturasPendientes.length} facturas por pagar`;

    renderExpensesBreakdown(filteredFacturas, egresosTotales);
  }

  function renderExpensesBreakdown(facturas, egresosTotales) {
    if (!els.expensesBreakdown) return;

    if (facturas.length === 0 || egresosTotales === 0) {
      els.expensesBreakdown.innerHTML = '<p class="form-hint">No hay gastos registrados en el período seleccionado.</p>';
      return;
    }

    const byCat = {};
    CATEGORIES.forEach(c => byCat[c.id] = 0);
    facturas.forEach(f => {
      byCat[f.categoria] = (byCat[f.categoria] || 0) + (f.montoTotal || 0);
    });

    const rows = CATEGORIES.map(c => {
      const monto = byCat[c.id] || 0;
      const pct = egresosTotales > 0 ? (monto / egresosTotales) * 100 : 0;
      return { ...c, monto, pct };
    }).sort((a, b) => b.monto - a.monto);

    const html = rows.map(r => `
      <div class="breakdown-row">
        <div class="breakdown-meta">
          <span>${escapeHtml(r.name)}</span>
          <span class="tabular">${formatMoney(r.monto)} (${r.pct.toFixed(1)}%)</span>
        </div>
        <div class="breakdown-meter">
          <div class="breakdown-fill" style="width: ${r.pct.toFixed(1)}%;"></div>
        </div>
      </div>
    `).join('');

    els.expensesBreakdown.innerHTML = `<div class="breakdown-list">${html}</div>`;
  }

  /* ==========================================================================
     SINCRONIZACIÓN CON GOOGLE SHEETS
     ========================================================================== */
  function checkGoogleSheetsStatus() {
    const url = localStorage.getItem(SHEETS_URL_STORAGE);
    if (!els.btnSheetsSyncModal || !els.sheetsStatusLabel) return;

    if (url && url.startsWith('http')) {
      els.btnSheetsSyncModal.classList.remove('offline');
      els.sheetsStatusLabel.textContent = 'Sheets: Conectado';
    } else {
      els.btnSheetsSyncModal.classList.add('offline');
      els.sheetsStatusLabel.textContent = 'Sheets: Offline';
    }
  }

  function handleSaveSheetsConfig(e) {
    e.preventDefault();
    const url = (els.sheetsWebhookUrl.value || '').trim();
    if (!url) {
      localStorage.removeItem(SHEETS_URL_STORAGE);
      checkGoogleSheetsStatus();
      if (els.sheetsModal) els.sheetsModal.classList.add('hidden');
      showToast('Desconectado de Google Sheets');
      return;
    }

    localStorage.setItem(SHEETS_URL_STORAGE, url);
    checkGoogleSheetsStatus();
    if (els.sheetsModal) els.sheetsModal.classList.add('hidden');
    showToast('URL de Google Sheets guardada', 'success');

    fetchFromGoogleSheets();
  }

  async function syncRowToGoogleSheets(type, data) {
    const webhookUrl = localStorage.getItem(SHEETS_URL_STORAGE);
    if (!webhookUrl || !webhookUrl.startsWith('http')) return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type === 'caja' ? 'add_caja' : 'add_factura',
          data: data
        })
      });
      console.log(`[Google Sheets] ${type} sincronizada exitosamente`);
    } catch (err) {
      console.warn('[Google Sheets] Advertencia al sincronizar fila:', err.message);
    }
  }

  async function fetchFromGoogleSheets() {
    const webhookUrl = localStorage.getItem(SHEETS_URL_STORAGE);
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      showToast('Primero ingresá la URL del Web App de Google Sheets', 'error');
      return;
    }

    showToast('Sincronizando con Google Sheets...', 'default');

    try {
      const res = await fetch(`${webhookUrl}?action=get_all`, {
        cache: 'no-store'
      });
      const data = await res.json();

      if (data && (Array.isArray(data.facturas) || Array.isArray(data.cajas))) {
        const existingFacturaIds = new Set(state.facturas.map(f => f.id));
        const remoteFacturas = (data.facturas || []).filter(f => !existingFacturaIds.has(f.id));

        const existingCajaIds = new Set(state.cajas.map(c => c.id));
        const remoteCajas = (data.cajas || []).filter(c => !existingCajaIds.has(c.id));

        if (remoteFacturas.length > 0 || remoteCajas.length > 0) {
          state.facturas = [...remoteFacturas, ...state.facturas];
          state.cajas = [...remoteCajas, ...state.cajas];
          saveState();
          renderAll();
          showToast(`Sincronizado: +${remoteFacturas.length} facturas, +${remoteCajas.length} cajas`, 'success');
        } else {
          showToast('Google Sheets ya está al día', 'success');
        }
      }
    } catch (err) {
      console.error('Error al sincronizar desde Google Sheets:', err);
      showToast('Error de conexión con Google Sheets: ' + err.message, 'error');
    }
  }

  function handleSaveApiKeyConfig(e) {
    e.preventDefault();
    const key = (els.inputGeminiApiKey.value || '').trim();
    if (key) {
      localStorage.setItem(GEMINI_KEY_STORAGE, key);
      showToast('Clave de Gemini guardada en este equipo', 'success');
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
      showToast('Clave de Gemini eliminada');
    }
    if (els.apiKeyModal) els.apiKeyModal.classList.add('hidden');
  }

  /* ==========================================================================
     GLOBAL API HANDLERS (DELETE & TOGGLE)
     ========================================================================== */
  window.copeContab = {
    deleteCaja(id) {
      if (!confirm('¿Eliminar este cierre de caja?')) return;
      state.cajas = state.cajas.filter(c => c.id !== id);
      saveState();
      renderCajasTable();
      renderDashboard();
      showToast('Cierre de caja eliminado');
    },

    deleteFactura(id) {
      if (!confirm('¿Eliminar esta factura?')) return;
      state.facturas = state.facturas.filter(f => f.id !== id);
      saveState();
      updateProveedoresDatalist();
      renderFacturasTable();
      renderDashboard();
      showToast('Factura eliminada');
    },

    togglePagoFactura(id) {
      const fac = state.facturas.find(f => f.id === id);
      if (!fac) return;
      fac.estadoPago = fac.estadoPago === 'pagado' ? 'pendiente' : 'pagado';
      saveState();
      renderFacturasTable();
      renderDashboard();
      showToast(`Estado de factura actualizado (${fac.estadoPago})`);
    }
  };

  /* ==========================================================================
     EXPORTACIÓN A EXCEL (CSV ARGENTINO)
     ========================================================================== */
  function exportCajasCsv() {
    if (state.cajas.length === 0) {
      showToast('No hay cierres de caja para exportar', 'error');
      return;
    }

    const headers = [
      'Fecha', 'Turno', 'Fudo Total', 'Fudo Efectivo', 'Fudo Mercado Pago',
      'Fudo Tarjetas', 'Fudo Delivery Apps', 'Efectivo Contado',
      'Gastos Caja Chica', 'Propinas Efectivo', 'Total Justificado',
      'Diferencia', 'Estado', 'Notas'
    ];

    const rows = state.cajas.map(c => [
      c.fecha, `"${c.turno}"`, formatDecimalCsv(c.fudoTotal), formatDecimalCsv(c.fudoEfectivo),
      formatDecimalCsv(c.fudoMp), formatDecimalCsv(c.fudoTarjetas), formatDecimalCsv(c.fudoDelivery),
      formatDecimalCsv(c.realEfectivo), formatDecimalCsv(c.gastosCajaChica), formatDecimalCsv(c.propinasPagadas),
      formatDecimalCsv(c.totalJustificado), formatDecimalCsv(c.diferencia), `"${c.estado}"`,
      `"${(c.notas || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    downloadFile(csvContent, `Cope_Cajas_Fudo_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    showToast('Archivo CSV descargado para Excel');
  }

  function exportFacturasCsv() {
    if (state.facturas.length === 0) {
      showToast('No hay facturas para exportar', 'error');
      return;
    }

    const headers = [
      'Fecha', 'Proveedor', 'Categoria', 'Tipo Comprobante',
      'Numero Comprobante', 'Monto Total', 'Estado Pago', 'Notas'
    ];

    const rows = state.facturas.map(f => {
      const catObj = CATEGORIES.find(c => c.id === f.categoria) || { name: f.categoria };
      return [
        f.fecha, `"${(f.proveedor || '').replace(/"/g, '""')}"`, `"${catObj.name}"`,
        `"${f.tipoComprobante}"`, `"${f.nroComprobante || ''}"`, formatDecimalCsv(f.montoTotal),
        `"${f.estadoPago}"`, `"${(f.notas || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    downloadFile(csvContent, `Cope_Facturas_Gastos_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    showToast('Archivo CSV de Facturas descargado');
  }

  function formatDecimalCsv(num) {
    if (num === null || num === undefined) return '0,00';
    return Number(num).toFixed(2).replace('.', ',');
  }

  /* ==========================================================================
     BACKUP & RESTORE COMPLETO (JSON)
     ========================================================================== */
  function exportBackupJson() {
    const backupData = {
      app: 'Cope Burgers Contabilidad',
      version: 1,
      exportedAt: new Date().toISOString(),
      cajas: state.cajas,
      facturas: state.facturas
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    downloadFile(jsonStr, `backup-cope-contabilidad-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    showToast('Backup JSON descargado exitosamente', 'success');
  }

  function handleRestoreFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed || (!Array.isArray(parsed.cajas) && !Array.isArray(parsed.facturas))) {
          throw new Error('Formato de archivo inválido.');
        }

        if (confirm(`Se restaurarán ${parsed.cajas ? parsed.cajas.length : 0} cierres y ${parsed.facturas ? parsed.facturas.length : 0} facturas. ¿Deseás continuar?`)) {
          state.cajas = Array.isArray(parsed.cajas) ? parsed.cajas : [];
          state.facturas = Array.isArray(parsed.facturas) ? parsed.facturas : [];
          saveState();
          updateProveedoresDatalist();
          renderAll();
          showToast('Backup restaurado con éxito', 'success');
        }
      } catch (err) {
        alert('Error al leer el archivo de backup: ' + err.message);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /* ==========================================================================
     HELPERS & FORMATTERS
     ========================================================================== */
  function renderAll() {
    renderCajasTable();
    renderFacturasTable();
    renderDashboard();
    updateDiffMonitor();
  }

  function formatMoney(amount) {
    if (isNaN(amount) || amount === null) return '$ 0';
    return '$ ' + Math.round(amount).toLocaleString('es-AR');
  }

  function formatDisplayDate(isoDate) {
    if (!isoDate) return '-';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function showToast(message, type = 'default') {
    if (!els.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'success' : (type === 'error' ? 'error' : '')}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

})();
