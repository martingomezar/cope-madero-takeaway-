// content-uber.js — Agente inyectado en Uber para carga automática de pedidos Cope

(function () {
  console.log('🍔 [Cope Delivery Agent] Inicializando en Uber...');

  const STORE_ORIGIN_ADDRESS = 'Macacha Güemes 260, Puerto Madero';
  let activeDispatchData = null;

  // Limpiar dirección para que el buscador de Uber (Places) no falle por notas de depto o piso
  function cleanAddressForSearch(addr) {
    if (!addr) return '';
    let clean = addr
      .replace(/\(.*?\)/g, '') // Quitar (4° B, Dique 2), notas entre paréntesis
      .replace(/\b(piso|depto|departamento|dpto|timbre|torre|oficina|of\.)\s*[\w\d\s°º-]+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    // Limpiar comas duplicadas o al final
    clean = clean.replace(/,\s*,/g, ', ').replace(/,\s*$/, '').trim();
    // Asegurar contexto de zona para geocodificación precisa
    if (!clean.toLowerCase().includes('caba') && !clean.toLowerCase().includes('buenos aires') && !clean.toLowerCase().includes('capital federal') && !clean.toLowerCase().includes('madero')) {
      clean += ', Puerto Madero, CABA';
    }
    return clean;
  }

  // 1. Obtener datos del despacho (desde Storage o URL Hash)
  function getDispatchData(callback) {
    if (window.location.hash && window.location.hash.includes('cope_delivery=')) {
      try {
        const rawJson = decodeURIComponent(window.location.hash.split('cope_delivery=')[1]);
        const data = JSON.parse(rawJson);
        activeDispatchData = data;
        callback(data);
        return;
      } catch (e) {
        console.warn('Error parseando cope_delivery desde hash:', e);
      }
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'COPE_GET_ACTIVE_DISPATCH' }, (res) => {
        if (res && res.data) {
          if (Date.now() - (res.data.timestamp || 0) < 20 * 60 * 1000) {
            activeDispatchData = res.data;
            callback(res.data);
          } else {
            console.log('🍔 [Cope Delivery Agent] El pedido en memoria ya expiró (> 20 min).');
          }
        }
      });
    }
  }

  // 2. Iniciar cuando la página esté lista
  getDispatchData((data) => {
    if (!data || !data.destination) return;
    console.log('🍔 [Cope Delivery Agent] Pedido activo detectado:', data);

    injectHud(data);
    setupFocusAutoFill(data);

    // Dar tiempo a Uber para renderizar su UI antes de iniciar el flujo
    setTimeout(() => {
      runAutomatedWorkflow(data);
    }, 1000);
  });

  // 3. Crear HUD Flotante de Cope
  function injectHud(data) {
    if (document.getElementById('cope-uber-hud')) return;

    const cleanDest = cleanAddressForSearch(data.cleanDestination || data.destination);
    const fullDest = data.destination;

    const hud = document.createElement('div');
    hud.id = 'cope-uber-hud';
    hud.innerHTML = `
      <div class="cope-hud-header">
        <div class="cope-title">
          <span>🍔</span>
          <span>Cope Delivery Agent</span>
        </div>
        <button type="button" class="cope-hud-close" title="Cerrar">✕</button>
      </div>
      <div class="cope-hud-body">
        <div class="cope-hud-field">
          <span class="label">Punto de Retiro (Local)</span>
          <span class="val">Macacha Güemes 260, Puerto Madero</span>
        </div>

        <div class="cope-hud-field">
          <span class="label">Destino del Cliente</span>
          <span class="val highlight">${escapeHtml(fullDest)}</span>
          <span style="font-size:11px; color:#94a3b8; margin-top:2px;">Búsqueda GPS: <i>${escapeHtml(cleanDest)}</i></span>
        </div>

        ${data.customerName ? `
        <div class="cope-hud-field">
          <span class="label">Cliente / Comanda</span>
          <span class="val">${escapeHtml(data.customerName)} ${data.orderId ? `(#${data.orderId})` : ''}</span>
          ${data.customerPhone ? `<span style="font-size:11px; color:#cbd5e1;">📞 ${escapeHtml(data.customerPhone)}</span>` : ''}
        </div>` : ''}

        <div id="copeAutoFillStatus" class="cope-hud-status">
          <span>⏳</span>
          <span id="copeStatusText">Iniciando carga de direcciones...</span>
        </div>

        <!-- Botón principal de carga -->
        <button type="button" id="btnCopeAutoFill" class="btn-cope-copy" style="background:#0284c7; color:#ffffff; font-weight:800; padding:10px; font-size:12px; border:none; box-shadow:0 2px 8px rgba(2,132,199,0.4);">
          🚀 REINTENTAR CARGA AUTOMÁTICA
        </button>

        <!-- Botones de ayuda directa 1-clic -->
        <div class="cope-hud-actions" style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
          <button type="button" id="btnCopePasteDropoff" class="btn-cope-copy" style="color:#38bdf8;">
            👉 Pegar Destino
          </button>
          <button type="button" id="btnCopePastePickup" class="btn-cope-copy" style="color:#e2e8f0;">
            👉 Pegar Local
          </button>
          <button type="button" id="btnCopeCopyClean" class="btn-cope-copy" style="color:#a5f3fc;">
            📋 Copiar Destino
          </button>
          <button type="button" id="btnCopeCopyApt" class="btn-cope-copy" style="color:#fde047;">
            🏢 Copiar Depto/Piso
          </button>
          <button type="button" id="btnCopeSearch" class="btn-cope-copy" style="color:#cbd5e1;">
            🔍 Clic en Buscar
          </button>
          <button type="button" id="btnCopeForceMoto" class="btn-cope-copy" style="color:#4ade80; font-weight:800;">
            🛵 Clic en Moto
          </button>
        </div>

        <div class="cope-hud-cta" id="copeHudCta">
          👉 Verificá que quede en <b>Moto</b> y tocá <b>Confirmar</b> en Uber
        </div>
      </div>
    `;

    document.body.appendChild(hud);

    hud.querySelector('.cope-hud-close').addEventListener('click', () => {
      hud.remove();
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'COPE_CLEAR_UBER_DISPATCH' });
      }
    });

    hud.querySelector('#btnCopeAutoFill').addEventListener('click', () => {
      runAutomatedWorkflow(data);
    });

    hud.querySelector('#btnCopePasteDropoff').addEventListener('click', async () => {
      setStatus('🏁 Pegando destino en Uber...');
      const els = findLocationElements();
      if (els.dropoffEl) {
        await typeTextIntoInput(els.dropoffEl, cleanDest);
        setStatus('✅ Destino cargado. Verificá la sugerencia.');
      } else {
        setStatus('⚠️ No se encontró el campo de destino. Tocá primero el campo en Uber.');
      }
    });

    hud.querySelector('#btnCopePastePickup').addEventListener('click', async () => {
      setStatus('📍 Pegando retiro (local) en Uber...');
      const els = findLocationElements();
      if (els.pickupEl) {
        await typeTextIntoInput(els.pickupEl, STORE_ORIGIN_ADDRESS);
        setStatus('✅ Punto de retiro cargado.');
      } else {
        setStatus('⚠️ No se encontró el campo de recogida.');
      }
    });

    hud.querySelector('#btnCopeCopyClean').addEventListener('click', () => {
      navigator.clipboard.writeText(cleanDest).then(() => {
        setStatus('✅ ¡Dirección limpia copiada! Pegala en Destino con <b>Ctrl + V</b>.');
      });
    });

    hud.querySelector('#btnCopeCopyApt').addEventListener('click', () => {
      const aptText = data.apartment || (fullDest.match(/\((.*?)\)/) ? fullDest.match(/\((.*?)\)/)[1] : fullDest);
      navigator.clipboard.writeText(aptText).then(() => {
        setStatus(`✅ Piso/Depto copiado: <b>${escapeHtml(aptText)}</b> (para notas del chofer).`);
      });
    });

    hud.querySelector('#btnCopeSearch').addEventListener('click', () => {
      clickSearchButton();
    });

    hud.querySelector('#btnCopeForceMoto').addEventListener('click', () => {
      findAndClickMoto();
    });
  }

  function setStatus(text) {
    const el = document.getElementById('copeStatusText');
    if (el) el.innerHTML = text;
  }

  // 4. AUTO-RELLENO AL DETECTAR FOCO EN CUALQUIER INPUT DE UBER
  function setupFocusAutoFill(data) {
    const cleanDest = cleanAddressForSearch(data.cleanDestination || data.destination);

    document.addEventListener('focusin', async (e) => {
      if (!e.target || e.target.tagName !== 'INPUT' || e.target.closest('#cope-uber-hud')) return;

      const ph = (e.target.placeholder || '').toLowerCase();
      const aria = (e.target.getAttribute('aria-label') || '').toLowerCase();

      // Si es el campo de recogida
      if (ph.includes('recogida') || ph.includes('origen') || aria.includes('recogida') || aria.includes('pickup')) {
        if (!e.target.value || e.target.value.length < 5) {
          console.log('🍔 [Cope Delivery Agent] Foco en Recogida detectado.');
          await typeTextIntoInput(e.target, STORE_ORIGIN_ADDRESS);
        }
      }

      // Si es el campo de destino
      if (ph.includes('destino') || ph.includes('dónde') || ph.includes('donde') || aria.includes('destino') || aria.includes('dropoff') || aria.includes('destination')) {
        if (!e.target.value || e.target.value.length < 5) {
          console.log('🍔 [Cope Delivery Agent] Foco en Destino detectado.');
          await typeTextIntoInput(e.target, cleanDest);
        }
      }
    }, true);
  }

  // 5. FLUJO DE CARGA AUTOMATIZADO PRINCIPAL
  async function runAutomatedWorkflow(data) {
    const cleanDest = cleanAddressForSearch(data.cleanDestination || data.destination);
    setStatus('📍 Localizando campos de dirección en Uber...');

    const els = findLocationElements();

    // Paso 1: Rellenar y confirmar Destino del Cliente
    if (els.dropoffEl) {
      setStatus(`🏁 Escribiendo destino: <b>${escapeHtml(cleanDest)}</b>...`);
      await typeTextIntoInput(els.dropoffEl, cleanDest);
      await sleep(600);
      selectFirstAutocompleteOption();
    } else {
      console.warn('🍔 [Cope Delivery Agent] No se detectó campo dropoffEl en la primera pasada.');
    }

    await sleep(800);

    // Paso 2: Rellenar Punto de Recogida (Local Cope) si está vacío
    const updatedEls = findLocationElements();
    if (updatedEls.pickupEl) {
      const val = updatedEls.pickupEl.value || updatedEls.pickupEl.innerText || '';
      if (!val || val.length < 5) {
        setStatus('📍 Escribiendo punto de retiro: <b>Macacha Güemes 260</b>...');
        await typeTextIntoInput(updatedEls.pickupEl, STORE_ORIGIN_ADDRESS);
        await sleep(600);
        selectFirstAutocompleteOption();
      }
    }

    await sleep(900);

    // Paso 3: Clic en Buscar para calcular tarifas
    setStatus('🔍 Solicitando cálculo de tarifas...');
    clickSearchButton();

    // Paso 4: Monitorear y seleccionar opción Moto
    watchAndSelectMoto();
  }

  // 6. ESCRITURA REAL EN INPUT CON EVENTOS NATIVOS
  async function typeTextIntoInput(input, text) {
    if (!input) return false;

    // Si es un div o button que abre el input, hacerle clic
    if (input.tagName !== 'INPUT') {
      triggerRealClick(input);
      await sleep(350);
      const innerInput = document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : input.querySelector('input');
      if (innerInput) {
        input = innerInput;
      } else {
        return false;
      }
    }

    input.focus();
    input.click();
    await sleep(150);

    // Método A: document.execCommand (simula pulsación nativa del teclado en el navegador)
    let typed = false;
    try {
      input.select();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      typed = document.execCommand('insertText', false, text);
    } catch (e) {
      typed = false;
    }

    // Método B: Setter de React si execCommand no cambió el valor
    if (!typed || input.value !== text) {
      try {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        ).set;
        nativeInputValueSetter.call(input, text);
      } catch (err) {
        input.value = text;
      }
    }

    // Disparar eventos de input y change para React y validaciones
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    await sleep(250);

    // Disparar Flecha Abajo para desplegar el autocompletado
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, bubbles: true }));
    await sleep(400);

    // Intentar seleccionar la sugerencia que aparece en el desplegable
    const selected = selectFirstAutocompleteOption();
    if (!selected) {
      // Simular tecla Enter para forzar selección de la primera opción
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    }

    return true;
  }

  // 7. BUSCADOR INTELIGENTE DE ELEMENTOS DE UBICACIÓN
  function findLocationElements() {
    const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'))
      .filter(i => !i.closest('#cope-uber-hud'));

    const allInteractives = Array.from(document.querySelectorAll(
      'input, button, [role="button"], [role="combobox"], [data-testid*="input"], [data-testid*="location"], div[tabindex]'
    )).filter(el => !el.closest('#cope-uber-hud') && !el.closest('header') && !el.closest('nav'));

    let pickupEl = null;
    let dropoffEl = null;

    // Buscar primero en inputs
    for (const inp of allInputs) {
      const ph = (inp.placeholder || '').toLowerCase();
      const aria = (inp.getAttribute('aria-label') || '').toLowerCase();
      const name = (inp.name || '').toLowerCase();
      const id = (inp.id || '').toLowerCase();

      if (
        ph.includes('recogida') || ph.includes('origen') || ph.includes('pickup') ||
        aria.includes('recogida') || aria.includes('pickup') ||
        name.includes('pickup') || id.includes('pickup')
      ) {
        pickupEl = inp;
      } else if (
        ph.includes('destino') || ph.includes('dropoff') || ph.includes('dónde') || ph.includes('donde') ||
        ph.includes('where to') || ph.includes('entrega') ||
        aria.includes('destino') || aria.includes('dropoff') || aria.includes('destination') ||
        name.includes('dropoff') || id.includes('dropoff')
      ) {
        dropoffEl = inp;
      }
    }

    // Si no se encontraron por placeholder, buscar por texto visible en contenedores interactivos
    if (!pickupEl || !dropoffEl) {
      for (const el of allInteractives) {
        const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
        if (txt.length > 70) continue;

        if (!pickupEl && (txt.includes('ubicación de recogida') || txt === 'recogida' || txt.includes('punto de partida'))) {
          pickupEl = el.querySelector('input') || el;
        }
        if (!dropoffEl && (txt.includes('ubicación de destino') || txt === 'destino' || txt.includes('¿a dónde vas?') || txt.includes('a donde vas'))) {
          dropoffEl = el.querySelector('input') || el;
        }
      }
    }

    // Fallback específico para la tarjeta "Consigue un viaje" (m.uber.com/go/home)
    if (!pickupEl || !dropoffEl) {
      const card = Array.from(document.querySelectorAll('div, section, form')).find(c => {
        if (c.closest('#cope-uber-hud') || c.closest('header')) return false;
        const t = (c.innerText || '').toLowerCase();
        return t.includes('consigue un viaje') || t.includes('get a ride');
      });

      if (card) {
        const cardInputs = Array.from(card.querySelectorAll('input:not([type="hidden"])'));
        if (cardInputs.length >= 2) {
          if (!pickupEl) pickupEl = cardInputs[0];
          if (!dropoffEl) dropoffEl = cardInputs[1];
        }
      }
    }

    return { pickupEl, dropoffEl };
  }

  // 8. AUTOCOMPLETADO
  function selectFirstAutocompleteOption() {
    const options = Array.from(document.querySelectorAll(
      '[role="option"], ul[role="listbox"] > li, [data-testid*="location-item"], [data-tracking-name*="suggestion"], li[tabindex], [data-testid*="autocomplete"], div[role="listbox"] div[role="button"]'
    )).filter(el => !el.closest('#cope-uber-hud'));

    if (options.length > 0) {
      console.log('🍔 [Cope Delivery Agent] Seleccionando sugerencia de dirección...');
      triggerRealClick(options[0]);
      return true;
    }
    return false;
  }

  // 9. BOTÓN BUSCAR
  function clickSearchButton() {
    const buttons = Array.from(document.querySelectorAll('button')).filter(b => !b.closest('#cope-uber-hud') && !b.closest('header') && !b.closest('nav'));
    const searchBtn = buttons.find(b => {
      const t = (b.innerText || b.textContent || '').trim().toLowerCase();
      return t === 'buscar' || t.includes('buscar') || t.includes('search') || t.includes('ver precios') || t.includes('conseguir un viaje');
    });

    if (searchBtn) {
      console.log('🍔 [Cope Delivery Agent] Botón Buscar presionado...');
      triggerRealClick(searchBtn);
      setStatus('⏳ Calculando tarifas y opciones...');
      return true;
    }
    return false;
  }

  // 10. MONITOREO Y SELECCIÓN ESTRICTA DE MOTO
  function watchAndSelectMoto() {
    let attempts = 0;
    const maxAttempts = 30;

    const motoInterval = setInterval(() => {
      attempts++;
      const clicked = findAndClickMoto();

      if (clicked) {
        clearInterval(motoInterval);
      } else if (attempts >= maxAttempts) {
        clearInterval(motoInterval);
        const statusText = document.getElementById('copeStatusText');
        if (statusText && !statusText.innerHTML.includes('¡Moto seleccionada!')) {
          statusText.innerHTML = '👉 Tocá <b>Moto</b> en la lista de opciones de Uber.';
        }
      }
    }, 700);
  }

  function findAndClickMoto() {
    // IMPORTANTE: Excluir explícitamente el header y barra superior para NO confundir con la pestaña "Envíos"
    const headerEl = document.querySelector('header, nav, [role="navigation"]');

    // A. Buscar imágenes de moto en los resultados de viaje
    const motoImages = Array.from(document.querySelectorAll('img')).filter((img) => {
      if (img.closest('#cope-uber-hud')) return false;
      if (headerEl && headerEl.contains(img)) return false;
      const alt = (img.alt || '').toLowerCase();
      const src = (img.src || '').toLowerCase();
      return (
        alt.includes('moto') || alt.includes('motorcycle') || alt.includes('two_wheeler') ||
        src.includes('moto') || src.includes('motorcycle') || src.includes('two_wheeler')
      );
    });

    for (const img of motoImages) {
      const card = img.closest('[role="radio"], [role="button"], button, li, [data-testid*="product"]') || img.parentElement;
      if (card && !card.closest('#cope-uber-hud') && card.offsetParent !== null) {
        console.log('🍔 [Cope Delivery Agent] Moto encontrada por imagen:', img.alt || img.src);
        triggerRealClick(card);
        setStatus('🛵 <b>¡Moto seleccionada!</b> Revisá tarifa y confirmá en Uber.');
        return true;
      }
    }

    // B. Buscar tarjetas de producto en la lista de opciones
    const productCards = Array.from(document.querySelectorAll(
      '[role="radio"], [data-testid*="product"], [data-testid*="ride-option"], [data-tracking-name*="product"], li[role="button"], div[role="button"]'
    )).filter(el => {
      if (el.closest('#cope-uber-hud')) return false;
      if (headerEl && headerEl.contains(el)) return false;
      return true;
    });

    for (const card of productCards) {
      const text = (card.innerText || card.textContent || '').trim().toLowerCase();
      if (!text || text.length > 120) continue;

      // Debe ser una opción de viaje con Moto (excluyendo UberX, Comfort, Black)
      const hasMoto = (
        text.includes('uber moto') ||
        text.includes('flash moto') ||
        (text.includes('moto') && !text.includes('uberx') && !text.includes('comfort'))
      );

      if (hasMoto && card.offsetParent !== null) {
        console.log('🍔 [Cope Delivery Agent] Opción Moto encontrada:', text);
        triggerRealClick(card);
        setStatus('🛵 <b>¡Moto seleccionada!</b> Revisá tarifa y confirmá en Uber.');
        return true;
      }
    }

    return false;
  }

  function triggerRealClick(target) {
    if (!target) return;
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {}

    const rect = target.getBoundingClientRect();
    const clientX = rect.left + (rect.width > 0 ? rect.width / 2 : 10);
    const clientY = rect.top + (rect.height > 0 ? rect.height / 2 : 10);

    const eventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX,
      clientY
    };

    target.dispatchEvent(new PointerEvent('pointerdown', eventInit));
    target.dispatchEvent(new MouseEvent('mousedown', eventInit));
    target.dispatchEvent(new PointerEvent('pointerup', eventInit));
    target.dispatchEvent(new MouseEvent('mouseup', eventInit));
    target.dispatchEvent(new MouseEvent('click', eventInit));

    if (typeof target.click === 'function') {
      target.click();
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
