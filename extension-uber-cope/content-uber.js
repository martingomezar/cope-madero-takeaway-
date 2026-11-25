// content-uber.js — Agente inyectado en Uber para carga automática de pedidos Cope

(function () {
  console.log('🍔 [Cope Delivery Agent] Inicializando en Uber...');

  // 1. Obtener datos del despacho (desde Storage o URL Hash)
  function getDispatchData(callback) {
    // Primero revisar URL Hash
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

    // Segundo: consultar al storage de la extensión
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'COPE_GET_ACTIVE_DISPATCH' }, (res) => {
        if (res && res.data) {
          // Solo usar si tiene menos de 10 minutos
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
          <button type="button" id="btnCopePasteAgain" class="btn-cope-copy">
            🎯 Cargar de Nuevo
          </button>
        </div>

        <div class="cope-hud-cta">
          👉 Seleccioná "Flash / Moto" y tocá <b>Confirmar</b> en Uber
        </div>
      </div>
    `;

    document.body.appendChild(hud);

    // Eventos del HUD
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

    hud.querySelector('#btnCopePasteAgain').addEventListener('click', () => {
      attemptAutoFill(data);
    });
  }

  // 4. Lógica de Autocompletado en Uber
  function attemptAutoFill(data) {
    const statusText = document.getElementById('copeStatusText');
    let attempts = 0;
    const maxAttempts = 15;

    const interval = setInterval(() => {
      attempts++;

      // Buscar inputs de destino en Uber
      const destinationInput = findDestinationInput();

      if (destinationInput) {
        clearInterval(interval);
        if (statusText) statusText.textContent = '✅ Destino cargado. Verificando opciones...';

        fillInput(destinationInput, data.destination);

        // Intentar seleccionar la primera sugerencia luego de 800ms
        setTimeout(() => {
          selectFirstAutocompleteOption();
        }, 800);

      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        if (statusText) {
          statusText.innerHTML = '⚠️ Hacé clic en "¿A dónde vas?" o pegá con <b>Ctrl + V</b>.';
        }
      }
    }, 600);
  }

  function findDestinationInput() {
    // 1. Por placeholder común
    const inputs = Array.from(document.querySelectorAll('input'));
    for (const inp of inputs) {
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
        // Evitar el de origen/pickup
        if (!ph.includes('origen') && !ph.includes('pickup') && !aria.includes('pickup')) {
          return inp;
        }
      }
    }

    // 2. Por último input de tipo search/text en el contenedor de búsqueda
    const searchBoxes = document.querySelectorAll('form, [role="search"], [data-tracking-name*="search"]');
    for (const box of searchBoxes) {
      const boxInputs = box.querySelectorAll('input[type="text"], input:not([type])');
      if (boxInputs.length >= 2) {
        return boxInputs[boxInputs.length - 1]; // El segundo suele ser destino
      }
    }

    return null;
  }

  function fillInput(el, text) {
    el.focus();
    el.value = text;

    // Disparar eventos nativos de React / Uber
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  }

  function selectFirstAutocompleteOption() {
    // Buscar opciones desplegadas
    const options = document.querySelectorAll(
      '[role="option"], [data-testid*="location-item"], [data-tracking-name*="suggestion"], li[tabindex]'
    );
    if (options.length > 0) {
      console.log('🍔 [Cope Delivery Agent] Seleccionando primera opción de dirección...');
      options[0].click();
      const statusText = document.getElementById('copeStatusText');
      if (statusText) statusText.textContent = '✅ Dirección fijada en el mapa.';
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