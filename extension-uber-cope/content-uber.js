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
    runAutomatedWorkflow(data);
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
          <span id="copeStatusText">Iniciando carga de pedido...</span>
        </div>

        <div class="cope-hud-actions" style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
          <button type="button" id="btnCopeSwitchEnvios" class="btn-cope-copy" style="color:#f59e0b;">
            📦 Pestaña Envíos
          </button>
          <button type="button" id="btnCopeFillAddresses" class="btn-cope-copy">
            📍 Cargar Direcciones
          </button>
          <button type="button" id="btnCopeSearch" class="btn-cope-copy">
            🔍 Buscar Viaje
          </button>
          <button type="button" id="btnCopeForceMoto" class="btn-cope-copy" style="color:#4ade80;">
            🛵 Seleccionar Moto
          </button>
        </div>

        <button type="button" id="btnCopeCopyAgain" class="btn-cope-copy" style="width:100%; margin-top:4px;">
          📋 Copiar Dirección al Portapapeles
        </button>

        <div class="cope-hud-cta">
          👉 Verificá que quede en <b>Moto / Envíos</b> y tocá <b>Confirmar</b> en Uber
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
        setStatus('¡Dirección copiada al portapapeles!');
      });
    });

    hud.querySelector('#btnCopeSwitchEnvios').addEventListener('click', () => {
      switchEnviosTab();
    });

    hud.querySelector('#btnCopeFillAddresses').addEventListener('click', () => {
      fillPickupAndDropoff(data);
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

  // 4. FLUJO COMPLETO AUTOMATIZADO
  function runAutomatedWorkflow(data) {
    let step = 1;
    let attempts = 0;
    const maxAttempts = 35;

    const timer = setInterval(() => {
      attempts++;

      // PASO 1: Si hay pestaña de "Envíos", hacer clic en Envíos (opcional)
      // PASO 2: Buscar inputs de recogida y destino y cargarlos
      const inputs = findUberInputs();

      if (inputs.pickupInput && inputs.dropoffInput) {
        setStatus('📍 Cargando origen (Cope) y destino (Cliente)...');

        // Cargar origen si está vacío
        if (!inputs.pickupInput.value || inputs.pickupInput.value.length < 5) {
          setReactInputValue(inputs.pickupInput, STORE_ORIGIN_ADDRESS);
          setTimeout(() => selectFirstAutocompleteOption(), 500);
        }

        // Cargar destino
        setTimeout(() => {
          if (!inputs.dropoffInput.value || inputs.dropoffInput.value !== data.destination) {
            setReactInputValue(inputs.dropoffInput, data.destination);
            setTimeout(() => selectFirstAutocompleteOption(), 600);
          }
        }, 600);

        // Luego de cargar ambos, hacer clic en "Buscar"
        setTimeout(() => {
          setStatus('🔍 Buscando opciones de viaje...');
          clickSearchButton();
          // Pasar a buscar Moto
          watchAndSelectMoto();
        }, 1800);

        clearInterval(timer);
        return;
      }

      // Si ya está en la pantalla de opciones de viaje (con mapa y lista de autos/motos)
      const motoClicked = findAndClickMoto();
      if (motoClicked) {
        clearInterval(timer);
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);
        setStatus('👉 Tocá <b>"Cargar Direcciones"</b> o pegá con <b>Ctrl + V</b>.');
      }
    }, 700);
  }

  // 5. CAMBIAR A PESTAÑA "ENVÍOS" SI ESTÁ DISPONIBLE
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

  // 6. BUSCAR INPUTS DE UBER
  function findUberInputs() {
    const allInputs = Array.from(document.querySelectorAll('input')).filter(i => !i.closest('#cope-uber-hud') && i.type !== 'hidden');

    let pickupInput = null;
    let dropoffInput = null;

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
        pickupInput = inp;
      } else if (
        ph.includes('destino') || ph.includes('dropoff') || ph.includes('dónde') || ph.includes('donde') ||
        ph.includes('where to') || ph.includes('entrega') ||
        aria.includes('destino') || aria.includes('dropoff') || aria.includes('destination') ||
        name.includes('dropoff') || id.includes('dropoff')
      ) {
        dropoffInput = inp;
      }
    }

    // Fallback: Si hay 2 o más inputs de texto en la zona de búsqueda
    if (!pickupInput || !dropoffInput) {
      const textInputs = allInputs.filter(i => i.type === 'text' || !i.type);
      if (textInputs.length >= 2) {
        if (!pickupInput) pickupInput = textInputs[0];
        if (!dropoffInput) dropoffInput = textInputs[1];
      }
    }

    return { pickupInput, dropoffInput };
  }

  // 7. ASIGNAR VALOR A UN INPUT CONTROLADO POR REACT (SETTER NATIVO)
  function setReactInputValue(input, value) {
    if (!input) return;
    input.focus();

    // Obtener el setter nativo del prototipo de HTMLInputElement para que React 16+ detecte el cambio
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(input, value);

    // Disparar la cadena de eventos de entrada
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  }

  // 8. CARGAR ORIGEN Y DESTINO MANUAL O AUTOMÁTICO
  function fillPickupAndDropoff(data) {
    const inputs = findUberInputs();
    if (inputs.pickupInput) {
      setReactInputValue(inputs.pickupInput, STORE_ORIGIN_ADDRESS);
    }
    if (inputs.dropoffInput) {
      setReactInputValue(inputs.dropoffInput, data.destination);
    }
    setStatus('📍 Direcciones cargadas. Tocá <b>Buscar</b> si no avanzó.');
  }

  // 9. CLIC EN SUGERENCIA DE AUTOCOMPLETADO DE UBER
  function selectFirstAutocompleteOption() {
    const options = Array.from(document.querySelectorAll(
      '[role="option"], [data-testid*="location-item"], [data-tracking-name*="suggestion"], li[tabindex], [data-testid*="autocomplete"]'
    )).filter(el => !el.closest('#cope-uber-hud'));

    if (options.length > 0) {
      console.log('🍔 [Cope Delivery Agent] Seleccionando sugerencia de dirección...');
      triggerRealClick(options[0]);
    }
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

  // 11. MONITOREAR Y CLICKEAR "MOTO" EN LA LISTA DE VIAJES
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

  // 12. ENCONTRAR Y CLICKEAR MOTO / FLASH
  function findAndClickMoto() {
    // A. Buscar por icono/imagen de Moto dentro de la web de Uber
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

    // B. Buscar por textos que contengan "moto" o "flash", EXCLUYENDO rigurosamente nuestro HUD
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

  // 13. CLIC REAL CON SECUENCIA DE EVENTOS
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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();