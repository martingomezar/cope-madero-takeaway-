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

    // Hacer el HUD arrastrable desde la barra superior
    const headerEl = hud.querySelector('.cope-fudo-header');
    if (headerEl) {
      let isDragging = false;
      let startX = 0, startY = 0, origLeft = 0, origTop = 0;
      headerEl.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        isDragging = true;
        const rect = hud.getBoundingClientRect();
        hud.style.bottom = 'auto';
        hud.style.right = 'auto';
        hud.style.left = rect.left + 'px';
        hud.style.top = rect.top + 'px';
        startX = e.clientX;
        startY = e.clientY;
        origLeft = rect.left;
        origTop = rect.top;
        e.preventDefault();
      });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        hud.style.left = Math.max(0, Math.min(window.innerWidth - 100, origLeft + (e.clientX - startX))) + 'px';
        hud.style.top = Math.max(0, Math.min(window.innerHeight - 60, origTop + (e.clientY - startY))) + 'px';
      });
      window.addEventListener('mouseup', () => { isDragging = false; });
    }

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

    // 3. Si estamos en el panel "NUEVO PEDIDO" (botón "Crear" visible), hacer clic en Crear primero
    const createBtn = findCreateOrderConfirmButton();
    if (createBtn) {
      setFudoStatus(`📝 Creando pedido para <b>${escapeHtml(fudoCustomerLabel)}</b>...`);
      triggerRealClick(createBtn);
      await sleep(1000);
    }

    // Esperar hasta 3s a que aparezca el buscador de productos del pedido creado
    let searchInput = null;
    for (let attempt = 0; attempt < 6 && !searchInput; attempt++) {
      searchInput = findFudoSearchInput(custInput);
      if (!searchInput) await sleep(500);
    }

    if (!searchInput) {
      setFudoStatus(`⚠️ Pedido creado para <b>${escapeHtml(fudoCustomerLabel)}</b>, pero no se encontró el buscador de productos.`);
      return;
    }

    // 4. Expandir ítems del pedido web al catálogo exacto de Fudo
    const fudoQueue = expandOrderItemsForFudo(order.items || []);
    let addedCount = 0;
    const notFound = [];

    for (let i = 0; i < fudoQueue.length; i++) {
      const fItem = fudoQueue[i];
      setFudoStatus(`🔍 Agregando (${i + 1}/${fudoQueue.length}): <b>${escapeHtml(fItem.fudoName)}</b>...`);
      const added = await addProductToFudo(fItem, custInput);
      if (added) {
        addedCount++;
        await sleep(500);
      } else {
        notFound.push(fItem.fudoName);
        console.warn('No se pudo autoseleccionar el ítem en Fudo:', fItem.fudoName);
      }
    }

    if (notFound.length === 0 && addedCount > 0) {
      setFudoStatus(`✅ <b>¡${addedCount} ítem(s) cargado(s) en Fudo!</b> Verificá y tocá <b>Comandar / Guardar</b>.`);
    } else if (addedCount > 0) {
      setFudoStatus(`⚠️ Cargados ${addedCount}/${fudoQueue.length}. Faltó: <b>${escapeHtml(notFound.join(', '))}</b>`);
    } else {
      setFudoStatus(`⚠️ Cliente cargado, pero no coincidieron los ítems en Fudo. Usá "Buscar Primer Ítem" o copialos.`);
    }
  }

  // Buscar botón Crear / Guardar del panel NUEVO PEDIDO
  function findCreateOrderConfirmButton() {
    const btns = Array.from(document.querySelectorAll('button, input[type="submit"], a[role="button"], [role="button"]'))
      .filter(el => !el.closest('#cope-fudo-hud') && !el.closest('header') && !el.closest('nav') && isElementVisible(el));

    return btns.find(el => {
      const t = normalizeText(el.innerText || el.textContent || el.value);
      if (!t || t.length > 35) return false;
      return (
        t === 'crear' ||
        t === 'crear pedido' ||
        t === 'guardar' ||
        t === 'abrir' ||
        t === 'aceptar' ||
        t === 'continuar'
      );
    }) || null;
  }

  // 5. ACCESO A MOSTRADOR Y "+ NUEVO PEDIDO"
  async function openMostradorAndNewOrder(order) {
    const isDelivery = order && order.orderType === 'delivery';
    const allClickables = () => Array.from(document.querySelectorAll('a, button, li, div[role="tab"], span, [role="button"]'))
      .filter(el => !el.closest('#cope-fudo-hud') && isElementVisible(el));

    // Paso A: Ir a pestaña Mostrador
    const tabs = allClickables();
    const sectionBtn = tabs.find(el => {
      const t = normalizeText(el.innerText || el.textContent);
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
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="search"]), textarea'))
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

      // Subir hasta 3 niveles (tr, li, form-group, row, div) buscando label/td/span hermano o padre
      let node = i.parentElement;
      for (let depth = 0; depth < 3 && node && node !== document.body; depth++) {
        const labelCandidates = node.querySelectorAll('label, th, td, span, .label');
        for (const lbl of labelCandidates) {
          if (lbl.contains(i)) continue;
          const lblTxt = normalizeText(lbl.innerText || lbl.textContent);
          if (lblTxt && lblTxt.length < 35 && keywords.some(k => lblTxt === k || lblTxt.includes(k))) {
            return true;
          }
        }
        // También revisar hermano anterior del padre (ej: <div>Cliente</div><div><input></div>)
        const prev = node.previousElementSibling;
        if (prev) {
          const prevTxt = normalizeText(prev.innerText || prev.textContent);
          if (prevTxt && prevTxt.length < 35 && keywords.some(k => prevTxt === k || prevTxt.includes(k))) {
            return true;
          }
        }
        node = node.parentElement;
      }
      return false;
    });
  }

  async function setCustomerInFudo(customerLabel) {
    let custInput = findFieldByLabels(['cliente', 'customer', 'client', 'guest']);
    // Fallback en Fudo v2: único input visible en el panel derecho (x > 45% de pantalla) antes de Comentario
    if (!custInput) {
      const rightInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="search"])'))
        .filter(i => !i.closest('#cope-fudo-hud') && !i.closest('header') && !i.closest('nav') && isElementVisible(i))
        .filter(i => i.getBoundingClientRect().left > window.innerWidth * 0.45);
      if (rightInputs.length > 0) {
        custInput = rightInputs[0];
      }
    }
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

    // Sumar notas/extras/bebidas de cada ítem para que salgan en comanda
    const itemNotes = [];
    (order.items || []).forEach(it => {
      const details = [];
      if (it.hasExtraCheddar) details.push('+Extra Cheddar');
      if (it.hasExtraBacon) details.push('+Extra Bacon');
      if (it.selectedDrink) details.push(`Bebida: ${it.selectedDrink}`);
      if (it.notes) details.push(it.notes);
      if (details.length > 0) {
        itemNotes.push(`${it.quantity || 1}x ${it.name}: ${details.join(', ')}`);
      }
    });
    if (itemNotes.length > 0) {
      parts.push(`Notas: ${itemNotes.join(' / ')}`);
    }

    await typeTextIntoInput(commentInput, parts.join(' | '));
    return true;
  }

  // 6B. MAPEO EXACTO AL CATÁLOGO DE FUDO (CSV OFICIAL)
  function expandOrderItemsForFudo(items) {
    const queue = [];

    const pushProduct = (fudoName, quantity, itemComment) => {
      if (!fudoName) return;
      queue.push({ fudoName, quantity: Number(quantity) || 1, itemComment: itemComment || '' });
    };

    for (const it of items) {
      const qty = Number(it.quantity) || 1;
      const id = normalizeText(it.id);
      const name = normalizeText(it.name);
      const variant = normalizeText(it.variantTitle || it.variant);
      const isVeggie = !!it.isVeggie || id.includes('not') || name.includes('notburger') || name.includes('not burger') || name.includes('veggie');
      const isDoble = id.startsWith('doble-') || variant.includes('doble') || name.includes('doble');
      const isCombo = id.startsWith('combo-') || name.includes('combo');

      let extraMeatConsumed = false;

      const mainNotes = [];
      if (it.selectedDrink && isCombo) mainNotes.push(`Bebida: ${it.selectedDrink}`);
      if (it.notes) mainNotes.push(it.notes);
      const mainComment = mainNotes.join(' · ');
      const mainIdxBefore = queue.length;

      // 1. Producto principal
      if (id === 'sampler-cope' || name.includes('sampler')) {
        pushProduct('SAMPLER COPE', qty);
      } else if (id === 'papas-fritas' || (name.includes('papas') && !name.includes('promo') && !name.includes('combo'))) {
        pushProduct('PAPAS FRITAS', qty);
      } else if (id === 'promo-after-office-cervezas-papas' || name.includes('after office')) {
        pushProduct('Cerveza Tirada x 350cc', qty * 2);
        pushProduct('PAPAS FRITAS', qty);
      } else if (id === 'promo-almuerzo-cheeseburger-papas' || (name.includes('promo') && name.includes('cheeseburger'))) {
        pushProduct(isVeggie ? 'CHEESEBURGUER NOT CO' : 'CHEESE BURGUER SIMPLE', qty);
        pushProduct('PAPAS FRITAS', qty);
      } else if (id === 'pepsi-black-lata' || name.includes('pepsi black')) {
        pushProduct('Pepsi Black Lata 350cc', qty);
      } else if (id === 'pepsi-lata' || name.includes('pepsi')) {
        pushProduct('Pepsi Lata 350cc', qty);
      } else if (id === '7up-lata' || name.includes('7up')) {
        pushProduct('7UP Lata 350cc', qty);
      } else if (id === 'agua-con-gas' || (name.includes('agua') && name.includes('gas'))) {
        pushProduct('Agua Con Gas Eco de los Andes 500cc', qty);
      } else if (id === 'agua-mineral' || name.includes('agua')) {
        pushProduct('Agua Sin Gas Nestle PV 500cc', qty);
      } else if (isCombo) {
        if (isVeggie) {
          if (id.includes('bacon') || name.includes('bacon')) pushProduct('Cheese & Bacon Not Co', qty);
          else if (id.includes('clasica') || name.includes('clasica')) pushProduct('Clasica Not Co', qty);
          else if (id.includes('gran-cope') || name.includes('gran cope')) pushProduct('Gran Cope Not Co', qty);
          else pushProduct('CHEESEBURGUER NOT CO', qty);
          pushProduct('PAPAS FRITAS', qty);
        } else {
          const wantDoble = !!it.hasExtraMeat || isDoble;
          if (wantDoble) extraMeatConsumed = true;
          if (id.includes('bacon') || name.includes('bacon')) {
            pushProduct(wantDoble ? 'combo cheese bacon doble' : 'combo cheese bacon simple', qty);
          } else if (id.includes('clasica') || name.includes('clasica')) {
            pushProduct(wantDoble ? 'combo clasica doble' : 'combo clasica simple', qty);
          } else if (id.includes('gran-cope') || name.includes('gran cope')) {
            pushProduct(wantDoble ? 'combo gran cope doble' : 'combo gran cope simple', qty);
          } else {
            pushProduct(wantDoble ? 'combo cheese burguer doble' : 'combo cheese burguer simple', qty);
          }
        }
      } else if (id.includes('bacon') || name.includes('bacon')) {
        if (isVeggie) {
          pushProduct('Cheese & Bacon Not Co', qty);
        } else {
          pushProduct(isDoble ? 'CHEESE BACON DOBL' : 'CHEESE BACON SIMPLE', qty);
        }
      } else if (id.includes('gran-cope') || name.includes('gran cope')) {
        if (isVeggie) {
          pushProduct('Gran Cope Not Co', qty);
        } else {
          pushProduct(isDoble ? 'GRAN COPE DOBL' : 'GRAN COPE SIMPLE', qty);
        }
      } else if (id.includes('clasica') && !name.includes('cheeseburger')) {
        if (isVeggie) {
          pushProduct('Clasica Not Co', qty);
        } else {
          pushProduct(isDoble ? 'CLASICA DOBLE' : 'CLASICA SIMPLE', qty);
        }
      } else if (id.includes('cheese-burger') || id.includes('cheeseburger') || id.includes('not-burger') || name.includes('cheeseburger') || name.includes('cheese burger') || isVeggie) {
        if (isVeggie) {
          pushProduct('CHEESEBURGUER NOT CO', qty);
        } else {
          pushProduct(isDoble ? 'CHEESE BURGUER DOBLE' : 'CHEESE BURGUER SIMPLE', qty);
        }
      } else {
        pushProduct(cleanProductNameForFudo(it.name), qty);
      }

      if (mainComment && queue.length > mainIdxBefore) {
        queue[mainIdxBefore].itemComment = mainComment;
      }

      // 2. Adicionales (Extra Carne ya precargado; Extra... lleva comentario Cheddar/Bacon)
      if (it.hasExtraMeat && !extraMeatConsumed) {
        pushProduct('Extra Carne.', qty);
      }
      if (it.hasExtraCheddar) {
        pushProduct('Extra...', qty, 'Extra Cheddar');
      }
      if (it.hasExtraBacon) {
        pushProduct('Extra...', qty, 'Extra Bacon');
      }
    }

    return queue;
  }

  // 7. AGREGAR PRODUCTO EN FUDO
  async function addProductToFudo(item, excludeEl) {
    const searchInput = findFudoSearchInput(excludeEl);
    if (!searchInput) return false;

    const exactFudoName = item.fudoName || cleanProductNameForFudo(item.name);
    const noDotsName = exactFudoName.replace(/\.+$/g, '').trim();
    const searchVariants = [exactFudoName];
    if (noDotsName && noDotsName !== exactFudoName) {
      searchVariants.push(noDotsName);
    }
    const words = normalizeText(noDotsName).split(' ').filter(w => w.length > 2);
    if (words.length > 1) {
      searchVariants.push(words.slice(0, 2).join(' '));
    }

    let targetEl = null;

    for (const query of searchVariants) {
      // Limpiar input previo para forzar nuevo ciclo de búsqueda en AngularJS
      await clearAndTypeInput(searchInput, query);
      await sleep(650);

      targetEl = findMatchingProductElement(exactFudoName) || findMatchingProductElement(query);
      if (targetEl) break;
    }

    if (targetEl) {
      console.log('🍔 [Cope POS Agent] Producto encontrado en Fudo, haciendo clic:', targetEl.innerText);
      const qty = Number(item.quantity || 1);
      triggerRealClick(targetEl);
      for (let q = 1; q < qty; q++) {
        await sleep(450);
        // En Fudo v2, volver a buscar en el dropdown para sumar otra unidad si se cerró
        await clearAndTypeInput(searchInput, noDotsName || exactFudoName);
        await sleep(550);
        const nextEl = findMatchingProductElement(exactFudoName) || findMatchingProductElement(noDotsName);
        if (nextEl) triggerRealClick(nextEl);
      }
      if (item.itemComment) {
        await sleep(250);
        await attachItemCommentInFudo(item.itemComment, searchInput);
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

  // Agregar comentario al último ítem agregado en ADICIONAR (ej: Extra Cheddar, Extra Bacon, Sin salsa)
  async function attachItemCommentInFudo(commentText, searchInput) {
    if (!commentText) return false;
    try {
      const commentBtns = Array.from(document.querySelectorAll(
        '[ng-click*="comment" i], [title*="comentar" i], [aria-label*="comentar" i], [class*="comment" i], button, a, i, span'
      )).filter(el => {
        if (el.closest('#cope-fudo-hud') || el.closest('header') || el.closest('nav')) return false;
        if (!isElementVisible(el)) return false;
        const rect = el.getBoundingClientRect();
        if (rect.left < window.innerWidth * 0.45) return false;
        const ngClick = normalizeText(el.getAttribute('ng-click') || '');
        const title = normalizeText(el.getAttribute('title') || el.getAttribute('aria-label') || '');
        const cls = normalizeText(typeof el.className === 'string' ? el.className : '');
        return ngClick.includes('comment') || title.includes('comentar') || title.includes('nota') || cls.includes('comment');
      });

      if (commentBtns.length === 0) return false;
      // El ítem recién agregado suele ser el último (o el primero según orden de Fudo; en ADICIONAR es el último renglón amarillo)
      const targetBtn = commentBtns[commentBtns.length - 1];
      triggerRealClick(targetBtn);
      await sleep(300);

      // Buscar el input/textarea que se abrió para escribir el comentario del ítem
      const commentInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea'))
        .filter(i => i !== searchInput && !i.closest('#cope-fudo-hud') && !i.closest('header') && !i.closest('nav') && isElementVisible(i))
        .filter(i => {
          const ph = normalizeText(i.placeholder);
          const ngModel = normalizeText(i.getAttribute('ng-model') || '');
          const type = normalizeText(i.type);
          return i.tagName === 'TEXTAREA' || ph.includes('comentar') || ph.includes('nota') || ngModel.includes('comment') || type === 'text';
        });

      const targetInput = commentInputs[commentInputs.length - 1];
      if (targetInput) {
        await typeTextIntoInput(targetInput, commentText);
        await sleep(120);
        targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        await sleep(150);
        // Si abrió modal con botón Guardar/Aceptar, tocarlo
        const okBtn = Array.from(document.querySelectorAll('button, [role="button"]'))
          .filter(b => !b.closest('#cope-fudo-hud') && isElementVisible(b))
          .find(b => ['aceptar', 'guardar', 'ok'].includes(normalizeText(b.innerText || b.textContent)));
        if (okBtn) triggerRealClick(okBtn);
        return true;
      }
    } catch (e) {
      console.warn('🍔 [Cope POS Agent] Aviso agregando comentario al ítem:', e);
    }
    return false;
  }

  async function clearAndTypeInput(input, text) {
    if (!input) return;
    input.focus();
    input.click();
    await sleep(60);
    try {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(input, '');
      else input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(80);
    } catch (e) {}
    await typeTextIntoInput(input, text);
    try {
      input.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    } catch (e) {}
  }

  function findMatchingProductElement(query) {
    const normQuery = normalizeText(query).replace(/\.+$/g, '').trim();
    if (!normQuery) return null;
    const queryWords = normQuery.split(' ').filter(Boolean);

    const candidates = Array.from(document.querySelectorAll(
      '[role="option"], .dropdown-menu li a, .dropdown-menu li, ul[class*="typeahead"] li, ul[class*="autocomplete"] li, .dropdown-item, .autocomplete-item, [data-testid*="product"], .product-item, .product, .item, li, a, button, div, span'
    )).filter(el => {
      if (el.closest('#cope-fudo-hud') || el.closest('header') || el.closest('nav')) return false;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return false;
      // Evitar hacer clic en ítems ya agregados dentro de la tabla de ventas o totales
      if (el.closest('table') && !el.closest('.dropdown-menu')) return false;
      return isElementVisible(el);
    });

    // Filtrar elementos hoja o tarjetas compactas que contengan las palabras del producto
    const matches = candidates.filter(el => {
      const txt = normalizeText(el.innerText || el.textContent);
      if (!txt || txt.length > 120) return false;
      if (el.querySelectorAll('div, li, tr').length > 6) return false;
      return txt.includes(normQuery) || queryWords.every(w => txt.includes(w));
    });

    if (matches.length === 0) return null;

    // Priorizar fuertemente opciones dentro de listas desplegables / autocompletado
    matches.sort((a, b) => {
      const aInDropdown = a.closest('.dropdown-menu, [role="listbox"], ul[class*="typeahead"], ul[class*="autocomplete"]') ? 0 : 100;
      const bInDropdown = b.closest('.dropdown-menu, [role="listbox"], ul[class*="typeahead"], ul[class*="autocomplete"]') ? 0 : 100;
      const aTag = a.matches('[role="option"], li, a, button, .dropdown-item, .product-item') ? 0 : 40;
      const bTag = b.matches('[role="option"], li, a, button, .dropdown-item, .product-item') ? 0 : 40;
      return (aInDropdown + aTag + (a.innerText || '').length) - (bInDropdown + bTag + (b.innerText || '').length);
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
    // Nunca buscar productos mientras siga abierto el formulario "NUEVO PEDIDO" con el botón Crear
    if (findCreateOrderConfirmButton()) return null;

    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'))
      .filter(i => i !== excludeEl && !i.closest('#cope-fudo-hud') && !i.closest('header') && !i.closest('nav') && isElementVisible(i));

    // Prioridad 1: Input explícito de agregar/buscar producto en panel derecho
    const productInput = inputs.find(i => {
      const rect = i.getBoundingClientRect();
      if (rect.left < window.innerWidth * 0.45) return false;
      const ph = normalizeText(i.placeholder);
      const aria = normalizeText(i.getAttribute('aria-label'));
      const ngModel = normalizeText(i.getAttribute('ng-model') || i.getAttribute('formcontrolname'));
      return (
        ph.includes('busca') ||
        ph.includes('producto') ||
        ph.includes('agregar') ||
        ph.includes('anadir') ||
        ph.includes('codigo') ||
        ph.includes('articulo') ||
        aria.includes('busca') ||
        aria.includes('producto') ||
        ngModel.includes('product') ||
        ngModel.includes('addition')
      );
    });
    if (productInput) return productInput;

    // Prioridad 2: Buscador dentro del panel derecho (nunca el filtro de ventas de la izquierda)
    return inputs.find(i => {
      const rect = i.getBoundingClientRect();
      if (rect.left < window.innerWidth * 0.45) return false;
      const ph = normalizeText(i.placeholder);
      const aria = normalizeText(i.getAttribute('aria-label'));
      const type = normalizeText(i.type);
      if (ph.includes('cliente') || aria.includes('cliente')) return false;
      return ph.includes('buscar') || aria.includes('buscar') || type === 'search' || type === 'text';
    });
  }

  function cleanProductNameForFudo(name) {
    if (!name) return '';
    return name
      .replace(/\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 8. ESCRIBIR EN INPUT CON EVENTOS NATIVOS (sin execCommand global que pueda borrar otro campo)
  async function typeTextIntoInput(input, text) {
    if (!input) return;
    input.focus();
    await sleep(60);

    try {
      const proto = input.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(input, text);
      else input.value = text;
    } catch (err) {
      input.value = text;
    }

    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
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
