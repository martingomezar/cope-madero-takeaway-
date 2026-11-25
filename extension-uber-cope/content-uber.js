// content-uber.js — Agente inyectado en Uber para carga automática de pedidos Cope

(function () {
  console.log('🍔 [Cope Delivery Agent] Inicializando en Uber...');

  const STORE_ORIGIN_ADDRESS = 'Macacha Güemes 260, Puerto Madero, CABA';

  // 1. Obtener datos del despacho (desde Storage o URL Hash)
  function getDispatchData(callback) {
    if (window.location.hash && window.location.hash.includes('cope_delivery=')) {
      try {
        const rawJson = decodeURIComponent(window.location.hash.split('cope_delivery=')[1]);
        const data = JSON.parse(rawJson);
        callback(data);
        return;
      } catch (e) {
        console.warn('Error parseando cope_delivery desde hash:', e);
      }
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'COPE_GET_ACTIVE_DISPATCH' }, (res) => {
        if (res && res.data) {
          if (Date.now() - (res.data.timestamp || 0) < 15 * 60 * 1000) {
            callback(res.data);
          } else {
            console.log('🍔 [Cope Delivery Agent] El pedido en memoria ya expiró (> 15 min).');
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
    setTimeout(() => {
      runAutomatedWorkflow(data);
    }, 800);
  });

  // 3. Crear HUD Flotante de Cope
  function injectHud(data) {
    if (document.getElementById('cope-uber-hud')) return;

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
          <span class="val highlight">${escapeHtml(data.destination)}</span>
        </div>

        ${data.customerName ? `
        <div class="cope-hud-field">
          <span class="label">Cliente / Comanda</span>
          <span class="val">${escapeHtml(data.customerName)} ${data.orderId ? `(#${data.orderId})` : ''}</span>
        </div>` : ''}

        <div id="copeAutoFillStatus" class="cope-hud-status">
          <span>⏳</span>
          <span id="copeStatusText">Iniciando carga de direcciones...</span>
        </div>

        <div class="cope-hud-actions" style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
          <button type="button" id="btnCopeFillAddresses" class="btn-cope-copy" style="background:#0284c7; color:#ffffff; font-weight:800;">
            🚀 Auto Cargar Todo
          </button>
          <button type="button" id="btnCopeForceMoto" class="btn-cope-copy" style="color:#4ade80;">
            🛵 Seleccionar Moto
          </button>
          <button type="button" id="btnCopeSearch" class="btn-cope-copy">
            🔍 Clic en Buscar
          </button>
          <button type="button" id="btnCopeSwitchEnvios" class="btn-cope-copy" style="color:#f59e0b;">
            📦 Pestaña Envíos
          </button>
        </div>

        <button type="button" id="btnCopeCopyAgain" class="btn-cope-copy" style="width:100%; margin-top:4px;">
          📋 Copiar Dirección al Portapapeles (Ctrl+V)
        </button>

        <div class="cope-hud-cta">
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

    hud.querySelector('#btnCopeCopyAgain').addEventListener('click', () => {
      navigator.clipboard.writeText(data.destination).then(() => {
        setStatus('¡Dirección copiada! Hacé clic en Destino y presioná Ctrl + V');
      });
    });

    hud.querySelector('#btnCopeSwitchEnvios').addEventListener('click', () => {
      switchEnviosTab();
    });

    hud.querySelector('#btnCopeFillAddresses').addEventListener('click', () => {
      executeCompleteLoad(data);
    });

    hud.querySelector('#btnCopeSearch').addEventListener('click', () => {
      clickSearchButton();
    });

    hud.querySelector('#btnCopeForceMoto').addEventListener('click', () => {
      const ok = findAndClickMoto();
      if (!ok) {
        setStatus('⚠️ Buscando tarjeta de Moto en la lista...');
      }
    });
  }

  function setStatus(text) {
    const el = document.getElementById('copeStatusText');
    if (el) el.innerHTML = text;
  }

  // 4. FLUJO PRINCIPAL AUTOMATIZADO
  function runAutomatedWorkflow(data) {
    executeCompleteLoad(data);
  }

  // 5. EJECUTAR CARGA COMPLETA (ORIGEN + DESTINO + BUSCAR + MOTO)
  async function executeCompleteLoad(data) {
    setStatus('📍 Buscando campos de Origen y Destino...');

    const els = await waitForLocationElements(5000);

    if (!els.pickupEl && !els.dropoffEl) {
      console.warn('No se encontraron elementos de ubicación.');
      setStatus('⚠️ No se detectaron los campos. Hacé clic en Destino y pegá con <b>Ctrl+V</b>.');
      return;
    }

    // A. CARGAR RECOGIDA / ORIGEN (Macacha Güemes 260)
    if (els.pickupEl) {
      setStatus('📍 Escribiendo origen: Macacha Güemes 260...');
      await interactAndType(els.pickupEl, STORE_ORIGIN_ADDRESS);
      await sleep(800);
      selectFirstAutocompleteOption();
    }

    await sleep(600);

    // B. CARGAR DESTINO (Cliente)
    const refreshedEls = findLocationElements();
    const targetDropoff = refreshedEls.dropoffEl || els.dropoffEl;

    if (targetDropoff) {
      setStatus('🏁 Escribiendo destino: ' + escapeHtml(data.destination));
      await interactAndType(targetDropoff, data.destination);
      await sleep(900);
      selectFirstAutocompleteOption();
    }

    await sleep(1000);

    // C. CLIC EN BOTÓN "BUSCAR"
    setStatus('🔍 Presionando "Buscar" para cotizar...');
    const searchClicked = clickSearchButton();

    // D. ESPERAR Y SELECCIONAR MOTO
    watchAndSelectMoto();
  }

  // 6. INTERACTUAR CON UN CAMPO (SEA INPUT O BOTÓN/DIV TRIGGER) Y ESCRIBIR
  async function interactAndType(element, text) {
    if (!element) return;

    // Si es un div o button que abre el input real al hacer clic
    if (element.tagName !== 'INPUT') {
      triggerRealClick(element);
      await sleep(350);
    }

    // Buscar si ahora hay un input activo o enfocado
    let activeInput = document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : null;
    if (!activeInput) {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])')).filter(i => !i.closest('#cope-uber-hud'));
      if (inputs.length > 0) {
        // Usar el input más reciente
        activeInput = inputs[inputs.length - 1];
      }
    }

    const inputToUse = activeInput || (element.tagName === 'INPUT' ? element : null);

    if (inputToUse) {
      setReactInputValue(inputToUse, text);
    } else {
      console.warn('No se pudo encontrar el input para escribir:', text);
    }
  }

  // 7. BUSCAR ELEMENTOS DE UBICACIÓN (INPUTS O BOTONES QUE PARECEN INPUTS)
  function findLocationElements() {
    const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'))
      .filter(i => !i.closest('#cope-uber-hud'));

    const allInteractives = Array.from(document.querySelectorAll(
      'input, button, [role="button"], [role="combobox"], [data-testid*="input"], [data-testid*="location"], div[tabindex]'
    )).filter(el => !el.closest('#cope-uber-hud'));

    let pickupEl = null;
    let dropoffEl = null;

    // 1. Por placeholder, aria-label o name de inputs
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

    // 2. Si no eran inputs, buscar por texto visible (ej: "Ubicación de recogida" / "Ubicación de destino")
    if (!pickupEl || !dropoffEl) {
      for (const el of allInteractives) {
        const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
        if (txt.length > 70) continue;

        if (!pickupEl && (txt.includes('ubicación de recogida') || txt === 'recogida' || txt.includes('punto de partida'))) {
          pickupEl = el;
        }
        if (!dropoffEl && (txt.includes('ubicación de destino') || txt === 'destino' || txt.includes('¿a dónde vas?') || txt.includes('a donde vas'))) {
          dropoffEl = el;
        }
      }
    }

    // 3. Fallback en el contenedor "Consigue un viaje"
    if (!pickupEl || !dropoffEl) {
      const card = Array.from(document.querySelectorAll('div, section, form')).find(c => {
        if (c.closest('#cope-uber-hud')) return false;
        const t = (c.innerText || '').toLowerCase();
        return t.includes('consigue un viaje') || t.includes('get a ride');
      });

      if (card) {
        const cardInputs = Array.from(card.querySelectorAll('input:not([type="hidden"])'));
        if (cardInputs.length >= 2) {
          if (!pickupEl) pickupEl = cardInputs[0];
          if (!dropoffEl) dropoffEl = cardInputs[1];
        } else {
          const clickables = Array.from(card.querySelectorAll('button, [role="button"], div[tabindex="0"]'));
          if (clickables.length >= 2) {
            if (!pickupEl) pickupEl = clickables[0];
            if (!dropoffEl) dropoffEl = clickables[1];
          }
        }
      }
    }

    return { pickupEl, dropoffEl };
  }

  function waitForLocationElements(timeoutMs = 5000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const res = findLocationElements();
        if (res.pickupEl || res.dropoffEl || Date.now() - start > timeoutMs) {
          resolve(res);
        } else {
          setTimeout(check, 300);
        }
      };
      check();
    });
  }

  // 8. ASIGNAR VALOR A UN INPUT CONTROLADO POR REACT (SETTER NATIVO + EVENTOS)
  function setReactInputValue(input, value) {
    if (!input) return;
    input.focus();

    try {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      nativeInputValueSetter.call(input, value);
    } catch (e) {
      input.value = value;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true }));
  }

  // 9. CLIC EN PRIMERA SUGERENCIA DE AUTOCOMPLETADO DE UBER
  function selectFirstAutocompleteOption() {
    const options = Array.from(document.querySelectorAll(
      '[role="option"], [data-testid*="location-item"], [data-tracking-name*="suggestion"], li[tabindex], [data-testid*="autocomplete"]'
    )).filter(el => !el.closest('#cope-uber-hud'));

    if (options.length > 0) {
      console.log('🍔 [Cope Delivery Agent] Seleccionando sugerencia de dirección...');
      triggerRealClick(options[0]);
      return true;
    }
    return false;
  }

  // 10. HACER CLIC EN EL BOTÓN "BUSCAR"
  function clickSearchButton() {
    const buttons = Array.from(document.querySelectorAll('button')).filter(b => !b.closest('#cope-uber-hud'));
    const searchBtn = buttons.find(b => {
      const t = (b.innerText || b.textContent || '').trim().toLowerCase();
      return t === 'buscar' || t.includes('buscar') || t.includes('search') || t.includes('ver precios') || t.includes('conseguir un viaje');
    });

    if (searchBtn) {
      console.log('🍔 [Cope Delivery Agent] Botón Buscar encontrado. Haciendo clic...');
      triggerRealClick(searchBtn);
      setStatus('⏳ Calculando tarifas y opciones...');
      return true;
    }
    return false;
  }

  // 11. CAMBIAR A PESTAÑA "ENVÍOS"
  function switchEnviosTab() {
    const allTabs = Array.from(document.querySelectorAll('a, button, div[role="tab"]')).filter(el => !el.closest('#cope-uber-hud'));
    const enviosTab = allTabs.find(el => {
      const t = (el.innerText || el.textContent || '').trim().toLowerCase();
      return t.includes('envío') || t.includes('envios') || t.includes('package');
    });

    if (enviosTab) {
      console.log('🍔 [Cope Delivery Agent] Cambiando a pestaña Envíos...');
      triggerRealClick(enviosTab);
      setStatus('📦 Cambiando a pestaña Envíos...');
      return true;
    }
    return false;
  }

  // 12. MONITOREAR Y CLICKEAR "MOTO" EN LA LISTA DE VIAJES
  function watchAndSelectMoto() {
    let attempts = 0;
    const maxAttempts = 35;

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
    }, 600);
  }

  function findAndClickMoto() {
    // Buscar por imagen de moto
    const motoImages = Array.from(document.querySelectorAll('img')).filter((img) => {
      if (img.closest('#cope-uber-hud')) return false;
      const alt = (img.alt || '').toLowerCase();
      const src = (img.src || '').toLowerCase();
      return (
        alt.includes('moto') || alt.includes('flash') ||
        src.includes('moto') || src.includes('flash') ||
        src.includes('motorcycle') || src.includes('two_wheeler')
      );
    });

    for (const img of motoImages) {
      const card = img.closest('[role="radio"], [role="button"], button, li, [data-testid], [tabindex]') || img.parentElement;
      if (card && !card.closest('#cope-uber-hud') && card.offsetParent !== null) {
        console.log('🍔 [Cope Delivery Agent] Moto encontrada por imagen:', img.alt || img.src);
        triggerRealClick(card);
        setStatus('🛵 <b>¡Moto seleccionada!</b> Revisá tarifa y confirmá.');
        return true;
      }
    }

    // Buscar por texto de Moto
    const allElements = Array.from(document.querySelectorAll(
      '[role="radio"], [role="button"], button, li, div[data-testid*="product"], div[data-testid*="ride"], [data-tracking-name*="product"], div[tabindex]'
    ));
    const candidates = allElements.length > 0 ? allElements : Array.from(document.querySelectorAll('div, li, button'));

    for (const el of candidates) {
      if (el.closest('#cope-uber-hud')) continue;

      const text = (el.innerText || el.textContent || '').trim().toLowerCase();
      if (!text || text.length > 100) continue;

      const hasMoto = (
        text.includes('uber moto') ||
        text.includes('flash moto') ||
        text.includes('uber flash') ||
        text.includes('envío') ||
        text.includes('envios') ||
        /\bmoto\b/i.test(text) ||
        /\bflash\b/i.test(text)
      );

      const isCarOnly = (text.includes('uberx') && !text.includes('moto')) || text.includes('comfort') || text.includes('black') || text.includes('uberxl');

      if (hasMoto && !isCarOnly && el.offsetParent !== null) {
        console.log('🍔 [Cope Delivery Agent] Opción Moto/Flash encontrada en Uber:', text);
        const clickable = el.closest('[role="radio"], [role="button"], button, li') || el;
        triggerRealClick(clickable);
        setStatus('🛵 <b>¡Moto seleccionada!</b> Revisá tarifa y confirmá.');
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