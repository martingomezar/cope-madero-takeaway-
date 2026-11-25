// content-fudo.js — Agente inyectado en Fudo POS (app.fu.do) para carga automática de comandas Cope

(function () {
  console.log('🍔 [Cope POS Agent] Inicializando en Fudo POS (app.fu.do)...');

  let activeOrder = null;
  let lastAutoLoadedKey = '';

  function getOrderKey(order) {
    if (!order) return '';
    return `${order.orderId || ''}_${order.timestamp || ''}`;
  }

  function triggerAutoLoadIfNeeded(order) {
    if (!order || order.autoLoad === false) return;
    const key = getOrderKey(order);
    if (!key || lastAutoLoadedKey === key) return;
    try {
      if (sessionStorage.getItem('cope_fudo_loaded_' + key)) return;
      sessionStorage.setItem('cope_fudo_loaded_' + key, '1');
    } catch (e) {}
    lastAutoLoadedKey = key;
    setTimeout(() => {
      runFudoAutoLoad(order);
    }, 450);
  }

  // 1. Obtener comanda activa desde chrome.storage
  function checkActiveFudoOrder() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'COPE_GET_FUDO_ORDER' }, (res) => {
          if (chrome.runtime.lastError) return;
          if (res && res.data) {
            const ageMs = Date.now() - (res.data.timestamp || 0);
            // Expirar a los 30 min
            if (ageMs < 30 * 60 * 1000) {
              activeOrder = res.data;
              injectFudoHud(activeOrder);
              if (ageMs < 2 * 60 * 1000) {
                triggerAutoLoadIfNeeded(activeOrder);
              }
            } else {
              console.log('🍔 [Cope POS Agent] Comanda expirada (> 30 min).');
            }
          }
        });
      }
    } catch (e) {
      console.warn('🍔 [Cope Agent] Fudo context notice:', e);
    }
  }

  // 2. Escuchar mensajes en tiempo real desde la extensión (cuando entra un pedido o se hace clic en Caja)
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'COPE_NEW_FUDO_ORDER_ALERT' && message.data) {
        console.log('🍔 [Cope POS Agent] Nueva comanda recibida para Fudo:', message.data);
        activeOrder = message.data;
        injectFudoHud(activeOrder);
        playAlertSound();
        triggerAutoLoadIfNeeded(activeOrder);
        if (sendResponse) sendResponse({ status: 'RECEIVED' });
      }
    });
  }

  // 3. Crear HUD Flotante de Cope en Fudo
  function injectFudoHud(order) {
    let hud = document.getElementById('cope-fudo-hud');
    if (hud) hud.remove(); // Reemplazar con datos frescos si ya existía

    hud = document.createElement('div');
    hud.id = 'cope-fudo-hud';

    const items = order.items || [];
    const isDelivery = order.orderType === 'delivery';

    const itemsHtml = items.map((it) => {
      const variantText = it.variantTitle || (it.variant === 'doble' ? 'Doble' : (it.variant === 'simple' ? 'Simple' : ''));
      const extras = [];
      if (it.isVeggie) extras.push('Opción Veggie NotBurger');
      if (it.hasExtraMeat) extras.push('+1 Carne Extra');
      if (it.hasExtraCheddar) extras.push('+Extra Cheddar');
      if (it.hasExtraBacon) extras.push('+Extra Bacon');
      if (it.selectedDrink) extras.push(`Bebida: ${it.selectedDrink}`);
      if (it.notes) extras.push(`Nota: "${it.notes}"`);

      return `
        <div class="cope-fudo-item-row">
          <span class="cope-fudo-item-qty">${it.quantity || 1}x</span>
          <div class="cope-fudo-item-details">
            <span class="cope-fudo-item-name">${escapeHtml(it.name)} ${variantText ? `(${escapeHtml(variantText)})` : ''}</span>
            ${extras.length ? `<span class="cope-fudo-item-meta">${escapeHtml(extras.join(' · '))}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    hud.innerHTML = `
      <div class="cope-fudo-header">
        <div class="cope-title">
          <span>🍔</span>
          <span>Cope POS · Comanda Virtual</span>
        </div>
        <button type="button" class="cope-fudo-close" title="Cerrar">✕</button>
      </div>

      <div class="cope-fudo-body">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="cope-fudo-tag ${isDelivery ? 'delivery' : 'takeaway'}">
            ${isDelivery ? '🛵 Delivery en Moto' : '🛍️ Retiro en Local (Take Away)'}
          </span>
          <span style="font-size:12px; font-weight:800; color:#38bdf8;">#${escapeHtml(order.orderId || '')}</span>
        </div>

        <div class="cope-fudo-field">
          <span class="label">Cliente</span>
          <span class="val highlight">${escapeHtml(order.customerName || 'Cliente Online')}</span>
          ${order.customerPhone ? `<span style="font-size:11px; color:#cbd5e1;">📞 ${escapeHtml(order.customerPhone)}</span>` : ''}
          ${isDelivery && order.destination ? `<span style="font-size:11px; color:#a5f3fc; margin-top:2px;">📍 ${escapeHtml(order.destination)}</span>` : ''}
        </div>

        <div class="cope-fudo-field">
          <span class="label">Productos del Pedido</span>
          <div class="cope-fudo-items-box">
            ${itemsHtml || '<span style="color:#94a3b8;">Sin ítems detallados</span>'}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:6px 10px; border-radius:8px; border:1px solid #1e293b;">
          <span style="font-size:11px; color:#94a3b8;">Pago: <b>${escapeHtml(order.paymentMethod || 'Online')}</b></span>
          <span style="font-size:13px; font-weight:900; color:#4ade80;">Total: $${Number(order.total || 0).toLocaleString('es-AR')}</span>
        </div>

        <div id="copeFudoStatus" class="cope-fudo-status">
          <span>⏳</span>
          <span id="copeFudoStatusText">Listo para cargar en Fudo.</span>
        </div>

        <button type="button" id="btnCopeFudoAutoLoad" class="btn-fudo-primary">
          🚀 AUTO-CARGAR EN FUDO
        </button>

        <div class="cope-fudo-actions">
          <button type="button" id="btnCopeFudoCopySummary" class="btn-fudo-tool">
            📋 Copiar Comanda
          </button>
          <button type="button" id="btnCopeFudoCopyCustomer" class="btn-fudo-tool">
            👤 Copiar Cliente
          </button>
          <button type="button" id="btnCopeFudoOpenMostrador" class="btn-fudo-tool">
            🛒 Ir a Mostrador
          </button>
          <button type="button" id="btnCopeFudoSearchItem" class="btn-fudo-tool">
            🔍 Buscar Primer Ítem
          </button>
        </div>

        <div class="cope-fudo-cta">
          🖨️ Al cargar, verificá los ítems y tocá <b>Comandar</b> para imprimir en cocina.
        </div>
      </div>
    `;

    document.body.appendChild(hud);

    // Eventos del HUD
    hud.querySelector('.cope-fudo-close').addEventListener('click', () => {
      hud.remove();
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'COPE_CLEAR_FUDO_ORDER' });
      }
    });

    hud.querySelector('#btnCopeFudoAutoLoad').addEventListener('click', () => {
      runFudoAutoLoad(order);
    });

    hud.querySelector('#btnCopeFudoCopySummary').addEventListener('click', () => {
      const summaryText = buildKitchenSummaryText(order);
      navigator.clipboard.writeText(summaryText).then(() => {
        setFudoStatus('✅ ¡Comanda copiada! Pegala donde quieras.');
      });
    });

    hud.querySelector('#btnCopeFudoCopyCustomer').addEventListener('click', () => {
      navigator.clipboard.writeText(order.customerName || '').then(() => {
        setFudoStatus(`✅ Cliente copiado: <b>${escapeHtml(order.customerName || '')}</b>`);
      });
    });

    hud.querySelector('#btnCopeFudoOpenMostrador').addEventListener('click', () => {
      openMostradorTab();
    });

    hud.querySelector('#btnCopeFudoSearchItem').addEventListener('click', () => {
      if (items.length > 0) {
        searchProductInFudo(items[0].name);
      }
    });
  }

  function setFudoStatus(html) {
    const el = document.getElementById('copeFudoStatusText');
    if (el) el.innerHTML = html;
  }

  function normalizeText(str) {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // 4. FLUJO DE CARGA AUTOMATIZADA EN FUDO
  async function runFudoAutoLoad(order) {
    setFudoStatus('🛒 Abriendo Mostrador / Nuevo Pedido...');

    // 1. Asegurar pestaña Mostrador y abrir "+ Nuevo pedido"
    await openMostradorAndNewOrder(order);
    await sleep(800);

    // 2. Cargar cliente con formato "<Nombre> - Pedido Cope"
    const baseCustomer = (order.customerName || 'Cliente Online').trim();
    const fudoCustomerLabel = baseCustomer.toLowerCase().includes('pedido cope')
      ? baseCustomer
      : `${baseCustomer} - Pedido Cope`;

    setFudoStatus(`👤 Asignando cliente: <b>${escapeHtml(fudoCustomerLabel)}</b>...`);
    const custInput = await setCustomerInFudo(fudoCustomerLabel);
    await setCommentInFudo(order);
    await sleep(400);

    // 3. Si el buscador de productos aún no está visible, Fudo pide confirmar/crear el pedido primero ("Guardar" / "Crear")
    let searchInput = findFudoSearchInput(custInput);
    if (!searchInput) {
      const created = await clickCreateOrderConfirmButton();
      if (created) {
        setFudoStatus('📝 Pedido creado en Fudo, abriendo carga de productos...');
        await sleep(900);
      }
      // Esperar hasta 2.5s a que aparezca el buscador de productos
      for (let attempt = 0; attempt < 5 && !searchInput; attempt++) {
        searchInput = findFudoSearchInput(custInput);
        if (!searchInput) await sleep(500);
      }
    }

    if (!searchInput) {
      setFudoStatus(`⚠️ Se abrió el pedido para <b>${escapeHtml(fudoCustomerLabel)}</b>, pero no se encontró el buscador de productos.`);
      return;
    }

    // 4. Cargar cada producto en la orden
    const items = order.items || [];
    let addedCount = 0;
    const notFound = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      setFudoStatus(`🔍 Agregando (${i + 1}/${items.length}): <b>${escapeHtml(it.name)}</b>...`);
      const added = await addProductToFudo(it, custInput);
      if (added) {
        addedCount++;
        await sleep(500);
      } else {
        notFound.push(it.name);
        console.warn('No se pudo autoseleleccionar el ítem:', it.name);
      }
    }

    if (notFound.length === 0 && addedCount > 0) {
      setFudoStatus(`✅ <b>¡${addedCount} producto(s) agregado(s)!</b> Verificá y tocá <b>Comandar / Guardar</b>.`);
    } else if (addedCount > 0) {
      setFudoStatus(`⚠️ Cargados ${addedCount}/${items.length}. Faltó: <b>${escapeHtml(notFound.join(', '))}</b>`);
    } else {
      setFudoStatus(`⚠️ Cliente cargado, pero no coincidieron los ítems en Fudo. Usá "Buscar Primer Ítem" o copialos.`);
    }
  }

  // Click en botón Guardar / Crear si "+ Nuevo pedido" abrió el formulario inicial
  async function clickCreateOrderConfirmButton() {
    const btns = Array.from(document.querySelectorAll('button, input[type="submit"], a[role="button"], [role="button"]'))
      .filter(el => !el.closest('#cope-fudo-hud') && !el.closest('header') && !el.closest('nav') && isElementVisible(el));

    const confirmBtn = btns.find(el => {
      const t = normalizeText(el.innerText || el.textContent || el.value);
      if (!t || t.length > 35) return false;
      return (
        t === 'guardar' ||
        t === 'crear' ||
        t === 'crear pedido' ||
        t === 'abrir' ||
        t === 'aceptar' ||
        t === 'continuar' ||
        t === 'confirmar'
      );
    });

    if (confirmBtn) {
      console.log('🍔 [Cope POS Agent] Haciendo clic en confirmar/guardar nuevo pedido:', confirmBtn.innerText || confirmBtn.value);
      triggerRealClick(confirmBtn);
      return true;
    }
    return false;
  }

  // 5. ACCESO A MOSTRADOR Y "+ NUEVO PEDIDO"
  async function openMostradorAndNewOrder(order) {
    const isDelivery = order && order.orderType === 'delivery';
    const allClickables = () => Array.from(document.querySelectorAll('a, button, li, div[role="tab"], span, [role="button"]'))
      .filter(el => !el.closest('#cope-fudo-hud') && isElementVisible(el));

    // Paso A: Ir a pestaña Mostrador (o Delivery si existe y corresponde, sino Mostrador)
    const tabs = allClickables();
    const sectionBtn = tabs.find(el => {
      const t = normalizeText(el.innerText || el.textContent);
      if (isDelivery && t === 'delivery') return true;
      return t === 'mostrador' || t === 'para llevar' || t === 'take away';
    });

    if (sectionBtn) {
      triggerRealClick(sectionBtn);
      await sleep(600);
    }

    // Paso B: Hacer clic en "+ Nuevo pedido" / "Agregar pedido" / "+ Nuevo"
    const btnsAfter = allClickables();
    const newOrderBtn = btnsAfter.find(el => {
      const t = normalizeText(el.innerText || el.textContent);
      return (
        t === '+ nuevo pedido' ||
        t === 'nuevo pedido' ||
        t === 'agregar pedido' ||
        t === '+ agregar pedido' ||
        t === '+ nuevo' ||
        t === 'nuevo' ||
        (t.includes('nuevo') && t.includes('pedido')) ||
        (t.includes('agregar') && t.includes('pedido'))
      );
    });

    if (newOrderBtn) {
      console.log('🍔 [Cope POS Agent] Haciendo clic en botón de nuevo pedido:', newOrderBtn.innerText);
      triggerRealClick(newOrderBtn);
      await sleep(700);
      return true;
    }

    return !!sectionBtn;
  }

  function openMostradorTab() {
    openMostradorAndNewOrder(activeOrder);
  }

  // 6. ASIGNAR CLIENTE Y COMENTARIO EN FUDO
  function findFieldByLabels(keywords) {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea'))
      .filter(i => !i.closest('#cope-fudo-hud') && !i.closest('header') && !i.closest('nav') && isElementVisible(i));

    return inputs.find(i => {
      const ph = normalizeText(i.placeholder);
      const aria = normalizeText(i.getAttribute('aria-label'));
      const name = normalizeText(i.name);
      const id = normalizeText(i.id);
      const ngModel = normalizeText(i.getAttribute('ng-model') || i.getAttribute('formcontrolname'));

      if (keywords.some(k => ph.includes(k) || aria.includes(k) || name.includes(k) || id.includes(k) || ngModel.includes(k))) {
        return true;
      }

      // Buscar label cercano o contenedor inmediato con texto
      const container = i.closest('label, .form-group, .field, .input-group, mat-form-field, div');
      if (container) {
        const labelEl = container.querySelector('label, .label, span');
        const labelTxt = normalizeText(labelEl ? (labelEl.innerText || labelEl.textContent) : '');
        if (labelTxt && labelTxt.length < 40 && keywords.some(k => labelTxt.includes(k))) {
          return true;
        }
      }
      return false;
    });
  }

  async function setCustomerInFudo(customerLabel) {
    const custInput = findFieldByLabels(['cliente', 'customer', 'client', 'guest', 'nombre']);
    if (custInput) {
      console.log('🍔 [Cope POS Agent] Campo cliente encontrado:', custInput);
      await typeTextIntoInput(custInput, customerLabel);
      return custInput;
    }
    console.warn('🍔 [Cope POS Agent] No se encontró campo Cliente en Fudo.');
    return null;
  }

  async function setCommentInFudo(order) {
    if (!order) return false;
    const commentInput = findFieldByLabels(['comentario', 'observacion', 'nota', 'comment', 'note']);
    if (!commentInput) return false;
    const parts = [`Pedido Cope #${order.orderId || ''}`];
    if (order.orderType === 'delivery' && order.destination) {
      parts.push(`Delivery: ${order.destination}`);
    } else {
      parts.push('Take Away');
    }
    if (order.customerPhone) parts.push(`Tel: ${order.customerPhone}`);
    await typeTextIntoInput(commentInput, parts.join(' | '));
    return true;
  }

  // 7. AGREGAR PRODUCTO EN FUDO
  async function addProductToFudo(item, excludeEl) {
    const searchInput = findFudoSearchInput(excludeEl);
    if (!searchInput) return false;

    const cleanSearchName = cleanProductNameForFudo(item.name);
    const searchVariants = [cleanSearchName];
    const words = cleanSearchName.split(' ').filter(w => w.length > 2);
    if (words.length > 1) {
      searchVariants.push(words[0]);
    }

    let targetEl = null;

    for (const query of searchVariants) {
      await typeTextIntoInput(searchInput, query);
      await sleep(550);

      targetEl = findMatchingProductElement(query);
      if (targetEl) break;
    }

    if (targetEl) {
      console.log('🍔 [Cope POS Agent] Producto encontrado en Fudo, haciendo clic:', targetEl.innerText);
      triggerRealClick(targetEl);
      const qty = Number(item.quantity || 1);
      for (let q = 1; q < qty; q++) {
        await sleep(350);
        // Re-buscar o volver a hacer clic
        const nextEl = findMatchingProductElement(cleanSearchName) || targetEl;
        triggerRealClick(nextEl);
      }
      return true;
    }

    // Fallback: intentar seleccionar primera opción del autocompletado con ArrowDown + Enter
    try {
      searchInput.focus();
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
      await sleep(150);
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      await sleep(250);
    } catch (e) {}

    return false;
  }

  function findMatchingProductElement(query) {
    const normQuery = normalizeText(query);
    if (!normQuery) return null;
    const queryWords = normQuery.split(' ').filter(Boolean);

    const candidates = Array.from(document.querySelectorAll(
      '[role="option"], [role="menuitem"], [role="button"], .dropdown-item, .autocomplete-item, [data-testid*="product"], .product-item, .product, .item, .grid-item, button, li, tr, td, a, div, span'
    )).filter(el => {
      if (el.closest('#cope-fudo-hud') || el.closest('header') || el.closest('nav')) return false;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return false;
      return isElementVisible(el);
    });

    // Filtrar elementos hoja o tarjetas compactas que contengan las palabras del producto
    const matches = candidates.filter(el => {
      const txt = normalizeText(el.innerText || el.textContent);
      if (!txt || txt.length > 120) return false;
      // Evitar coincidir con el propio texto si es un contenedor gigante
      if (el.querySelectorAll('div, li, tr').length > 6) return false;
      return txt.includes(normQuery) || queryWords.every(w => txt.includes(w));
    });

    if (matches.length === 0) return null;

    // Preferir botones/opciones de lista/filas o el elemento más específico (menor longitud de texto)
    matches.sort((a, b) => {
      const aScore = (a.matches('[role="option"], li, button, a, .dropdown-item, .product-item') ? 0 : 50) + (a.innerText || '').length;
      const bScore = (b.matches('[role="option"], li, button, a, .dropdown-item, .product-item') ? 0 : 50) + (b.innerText || '').length;
      return aScore - bScore;
    });

    return matches[0];
  }

  function searchProductInFudo(name) {
    const searchInput = findFudoSearchInput();
    if (searchInput) {
      const clean = cleanProductNameForFudo(name);
      typeTextIntoInput(searchInput, clean);
      setFudoStatus(`🔍 Buscando en Fudo: <b>${escapeHtml(clean)}</b>`);
    } else {
      setFudoStatus('⚠️ No se encontró la barra de búsqueda de Fudo.');
    }
  }

  function findFudoSearchInput(excludeEl) {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'))
      .filter(i => i !== excludeEl && !i.closest('#cope-fudo-hud') && isElementVisible(i));

    // Prioridad 1: Input explícito de agregar/buscar producto
    const productInput = inputs.find(i => {
      const ph = normalizeText(i.placeholder);
      const aria = normalizeText(i.getAttribute('aria-label'));
      const ngModel = normalizeText(i.getAttribute('ng-model') || i.getAttribute('formcontrolname'));
      return (
        ph.includes('producto') ||
        ph.includes('agregar') ||
        ph.includes('anadir') ||
        ph.includes('codigo') ||
        ph.includes('articulo') ||
        aria.includes('producto') ||
        ngModel.includes('product')
      );
    });
    if (productInput) return productInput;

    // Prioridad 2: Buscador fuera de header/nav que no sea campo de cliente
    return inputs.find(i => {
      if (i.closest('header') || i.closest('nav')) return false;
      const ph = normalizeText(i.placeholder);
      const aria = normalizeText(i.getAttribute('aria-label'));
      const type = normalizeText(i.type);
      if (ph.includes('cliente') || aria.includes('cliente')) return false;
      return ph.includes('buscar') || aria.includes('buscar') || type === 'search';
    });
  }

  function cleanProductNameForFudo(name) {
    if (!name) return '';
    return name
      .replace(/\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 8. ESCRIBIR EN INPUT CON EVENTOS NATIVOS
  async function typeTextIntoInput(input, text) {
    if (!input) return;
    input.focus();
    input.click();
    await sleep(100);

    try {
      input.select();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      document.execCommand('insertText', false, text);
    } catch (e) {
      try {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(input, text);
        else input.value = text;
      } catch (err) {
        input.value = text;
      }
    }

    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  function triggerRealClick(target) {
    if (!target) return;
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {}

    const rect = target.getBoundingClientRect();
    const eventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
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

  function buildKitchenSummaryText(order) {
    let out = `🍔 COPE BURGERS · COMANDA #${order.orderId || 'S/N'}\n`;
    out += `Modalidad: ${order.orderType === 'delivery' ? '🛵 DELIVERY' : '🛍️ TAKE AWAY'}\n`;
    out += `Cliente: ${order.customerName || 'Cliente Online'}\n`;
    if (order.customerPhone) out += `Tel: ${order.customerPhone}\n`;
    if (order.destination) out += `Destino: ${order.destination}\n`;
    out += `-----------------------------\n`;
    (order.items || []).forEach(it => {
      const v = it.variantTitle || (it.variant === 'doble' ? 'Doble' : (it.variant === 'simple' ? 'Simple' : ''));
      out += `${it.quantity || 1}x ${it.name} ${v ? `(${v})` : ''}\n`;
      if (it.isVeggie) out += `   * Opción Veggie NotBurger\n`;
      if (it.hasExtraMeat) out += `   * +1 Carne Extra\n`;
      if (it.hasExtraCheddar) out += `   * +Extra Cheddar\n`;
      if (it.hasExtraBacon) out += `   * +Extra Bacon\n`;
      if (it.selectedDrink) out += `   * Bebida: ${it.selectedDrink}\n`;
      if (it.notes) out += `   * Nota cocina: "${it.notes}"\n`;
    });
    out += `-----------------------------\n`;
    out += `Total: $${Number(order.total || 0).toLocaleString('es-AR')}\n`;
    out += `Pago: ${order.paymentMethod || 'Online'}\n`;
    return out;
  }

  function playAlertSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
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

  // Iniciar al cargar
  window.addEventListener('DOMContentLoaded', checkActiveFudoOrder);
  window.addEventListener('load', checkActiveFudoOrder);
  setTimeout(checkActiveFudoOrder, 1500);
})();
