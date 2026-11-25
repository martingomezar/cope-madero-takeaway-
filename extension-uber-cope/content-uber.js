// content-uber.js — Agente inyectado en Uber para carga automática de pedidos Cope

(function () {
  console.log('🍔 [Cope Delivery Agent] Inicializando en Uber...');

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
          if (Date.now() - (res.data.timestamp || 0) < 10 * 60 * 1000) {
            callback(res.data);
          } else {
            console.log('🍔 [Cope Delivery Agent] El pedido en memoria ya expiró (> 10 min).');
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
    attemptAutoFill(data);
    watchAndSelectMoto();
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
          <span id="copeStatusText">Buscando campo de destino en Uber...</span>
        </div>

        <div class="cope-hud-actions">
          <button type="button" id="btnCopeCopyAgain" class="btn-cope-copy">
            📋 Copiar Dirección
          </button>
          <button type="button" id="btnCopeForceMoto" class="btn-cope-copy">
            🎯 Clic en Moto
          </button>
        </div>

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
        const status = document.getElementById('copeStatusText');
        if (status) status.textContent = '¡Dirección copiada al portapapeles!';
      });
    });

    hud.querySelector('#btnCopeForceMoto').addEventListener('click', () => {
      const ok = findAndClickMoto();
      const status = document.getElementById('copeStatusText');
      if (!ok && status) {
        status.innerHTML = '⚠️ No se encontró la opción de Moto aún. Esperando que cargue...';
      }
    });
  }

  // 4. Lógica de Autocompletado de Dirección en Uber
  function attemptAutoFill(data) {
    const statusText = document.getElementById('copeStatusText');
    let attempts = 0;
    const maxAttempts = 15;

    const interval = setInterval(() => {
      attempts++;
      const destinationInput = findDestinationInput();

      if (destinationInput) {
        clearInterval(interval);
        if (statusText) statusText.textContent = '✅ Destino cargado. Seleccionando sugerencia...';

        fillInput(destinationInput, data.destination);

        setTimeout(() => {
          selectFirstAutocompleteOption();
          watchAndSelectMoto();
        }, 900);

      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        watchAndSelectMoto();
      }
    }, 600);
  }

  function findDestinationInput() {
    const inputs = Array.from(document.querySelectorAll('input'));
    for (const inp of inputs) {
      if (inp.closest('#cope-uber-hud')) continue;

      const ph = (inp.placeholder || '').toLowerCase();
      const aria = (inp.getAttribute('aria-label') || '').toLowerCase();
      const name = (inp.name || '').toLowerCase();
      const id = (inp.id || '').toLowerCase();

      if (
        ph.includes('dónde') || ph.includes('donde') || ph.includes('where to') ||
        ph.includes('destino') || ph.includes('destination') || ph.includes('entrega') ||
        aria.includes('destino') || aria.includes('destination') ||
        name.includes('dropoff') || id.includes('dropoff')
      ) {
        if (!ph.includes('origen') && !ph.includes('pickup') && !aria.includes('pickup')) {
          return inp;
        }
      }
    }

    const searchBoxes = document.querySelectorAll('form, [role="search"], [data-tracking-name*="search"]');
    for (const box of searchBoxes) {
      if (box.closest('#cope-uber-hud')) continue;
      const boxInputs = box.querySelectorAll('input[type="text"], input:not([type])');
      if (boxInputs.length >= 2) {
        return boxInputs[boxInputs.length - 1];
      }
    }

    return null;
  }

  function fillInput(el, text) {
    el.focus();
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  }

  function selectFirstAutocompleteOption() {
    const options = Array.from(document.querySelectorAll(
      '[role="option"], [data-testid*="location-item"], [data-tracking-name*="suggestion"], li[tabindex]'
    )).filter(el => !el.closest('#cope-uber-hud'));

    if (options.length > 0) {
      console.log('🍔 [Cope Delivery Agent] Seleccionando primera opción de dirección...');
      triggerRealClick(options[0]);
      const statusText = document.getElementById('copeStatusText');
      if (statusText) statusText.textContent = '✅ Dirección fijada. Buscando Moto...';
      watchAndSelectMoto();
    }
  }

  // 5. SELECCIÓN AUTOMÁTICA DE "MOTO" / "FLASH" EN LA LISTA DE VIAJES DE UBER
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
    }, 600);
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

  function findAndClickMoto() {
    const statusText = document.getElementById('copeStatusText');

    // A. Buscar primero por icono/imagen de Moto dentro de la web de Uber
    const motoImages = Array.from(document.querySelectorAll('img')).filter((img) => {
      if (img.closest('#cope-uber-hud')) return false; // NUNCA dentro de nuestro HUD
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
        if (statusText) statusText.innerHTML = '🛵 <b>¡Moto seleccionada!</b> Revisá tarifa y confirmá.';
        return true;
      }
    }

    // B. Buscar por textos que contengan "moto" o "flash", EXCLUYENDO rigurosamente nuestro HUD
    const allElements = Array.from(document.querySelectorAll(
      '[role="radio"], [role="button"], button, li, div[data-testid*="product"], div[data-testid*="ride"], [data-tracking-name*="product"], div[tabindex]'
    ));

    const candidates = allElements.length > 0 ? allElements : Array.from(document.querySelectorAll('div, li, button'));

    for (const el of candidates) {
      if (el.closest('#cope-uber-hud')) continue; // EXCLUIR NUESTRO HUD

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

      // Descartar si solo es auto (Comfort, Black, XL) o si es UberX puro sin Moto
      const isCarOnly = (text.includes('uberx') && !text.includes('moto')) || text.includes('comfort') || text.includes('black') || text.includes('uberxl');

      if (hasMoto && !isCarOnly && el.offsetParent !== null) {
        console.log('🍔 [Cope Delivery Agent] Opción Moto/Flash encontrada en Uber:', text);
        const clickable = el.closest('[role="radio"], [role="button"], button, li') || el;
        triggerRealClick(clickable);

        if (statusText) {
          statusText.innerHTML = '🛵 <b>¡Moto seleccionada!</b> Revisá tarifa y confirmá.';
        }
        return true;
      }
    }

    return false;
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