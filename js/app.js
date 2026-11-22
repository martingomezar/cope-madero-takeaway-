/**
 * Lógica Principal — Cope Burgers Puerto Madero (Take Away)
 */
(function () {
  const CFG = window.COPE_CONFIG || {};
  const PRODUCTS = window.COPE_PRODUCTS || [];
  const CATEGORIES = window.COPE_CATEGORIES || [];
  const Cart = window.CopeCart;

  const STORAGE_USER_KEY = 'cope_madero_user_v1';

  let currentCategory = 'todas';
  let searchQuery = '';
  let activeModalProduct = null;
  let activeModalVariantId = null;
  let activeModalIsVeggie = false;
  let activeModalHasExtraMeat = false;
  let activeModalDrink = null;
  let activeModalQty = 1;

  // DOM Elements
  const els = {
    // Header & Meta
    storeTitle: document.getElementById('storeTitle'),
    storeAddress: document.getElementById('storeAddress'),
    storeAddressLink: document.getElementById('storeAddressLink'),
    storeInstagramLink: document.getElementById('storeInstagramLink'),
    storeStatusBadge: document.getElementById('storeStatusBadge'),
    storeStatusText: document.getElementById('storeStatusText'),
    storeHoursText: document.getElementById('storeHoursText'),

    // Search & Filter
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    categoriesNav: document.getElementById('categoriesNav'),
    productsGrid: document.getElementById('productsGrid'),
    emptySearchState: document.getElementById('emptySearchState'),

    // Sticky Bottom Cart Bar
    bottomCartBar: document.getElementById('bottomCartBar'),
    bottomCartCount: document.getElementById('bottomCartCount'),
    bottomCartTotal: document.getElementById('bottomCartTotal'),
    btnOpenCart: document.getElementById('btnOpenCart'),

    // Cart Drawer / Modal
    cartDrawerBackdrop: document.getElementById('cartDrawerBackdrop'),
    btnCloseCart: document.getElementById('btnCloseCart'),
    cartItemsList: document.getElementById('cartItemsList'),
    cartEmptyNotice: document.getElementById('cartEmptyNotice'),
    cartSummaryBox: document.getElementById('cartSummaryBox'),
    cartSubtotalText: document.getElementById('cartSubtotalText'),
    cartTotalText: document.getElementById('cartTotalText'),
    btnClearCart: document.getElementById('btnClearCart'),
    btnGoToCheckout: document.getElementById('btnGoToCheckout'),

    // Product Customization Modal
    productModalBackdrop: document.getElementById('productModalBackdrop'),
    btnCloseProductModal: document.getElementById('btnCloseProductModal'),
    modalProductImg: document.getElementById('modalProductImg'),
    modalProductBadge: document.getElementById('modalProductBadge'),
    modalProductName: document.getElementById('modalProductName'),
    modalProductDesc: document.getElementById('modalProductDesc'),
    modalVariantsGroup: document.getElementById('modalVariantsGroup'),
    modalVariantsList: document.getElementById('modalVariantsList'),
    modalExtraMeatGroup: document.getElementById('modalExtraMeatGroup'),
    modalExtraMeatCheckbox: document.getElementById('modalExtraMeatCheckbox'),
    modalVeggieGroup: document.getElementById('modalVeggieGroup'),
    modalVeggieCheckbox: document.getElementById('modalVeggieCheckbox'),
    modalDrinkGroup: document.getElementById('modalDrinkGroup'),
    modalDrinkSelect: document.getElementById('modalDrinkSelect'),
    modalNotesInput: document.getElementById('modalNotesInput'),
    modalQtyMinus: document.getElementById('modalQtyMinus'),
    modalQtyPlus: document.getElementById('modalQtyPlus'),
    modalQtyVal: document.getElementById('modalQtyVal'),
    btnModalAddCart: document.getElementById('btnModalAddCart'),
    modalAddCartPrice: document.getElementById('modalAddCartPrice'),

    // Checkout Modal
    checkoutModalBackdrop: document.getElementById('checkoutModalBackdrop'),
    btnCloseCheckout: document.getElementById('btnCloseCheckout'),
    checkoutForm: document.getElementById('checkoutForm'),
    checkoutName: document.getElementById('checkoutName'),
    checkoutPhone: document.getElementById('checkoutPhone'),
    orderTypeTakeaway: document.getElementById('orderTypeTakeaway'),
    orderTypeDelivery: document.getElementById('orderTypeDelivery'),
    deliveryFieldsWrapper: document.getElementById('deliveryFieldsWrapper'),
    deliveryAddress: document.getElementById('deliveryAddress'),
    deliveryApartment: document.getElementById('deliveryApartment'),
    deliveryNeighborhood: document.getElementById('deliveryNeighborhood'),
    uberQuoteBox: document.getElementById('uberQuoteBox'),
    uberQuotePrice: document.getElementById('uberQuotePrice'),
    uberQuoteEta: document.getElementById('uberQuoteEta'),
    pickupTimeGroup: document.getElementById('pickupTimeGroup'),
    pickupTimeAsap: document.getElementById('pickupTimeAsap'),
    pickupTimeScheduled: document.getElementById('pickupTimeScheduled'),
    scheduledTimeWrapper: document.getElementById('scheduledTimeWrapper'),
    scheduledTimeSelect: document.getElementById('scheduledTimeSelect'),
    paymentMethodsList: document.getElementById('paymentMethodsList'),
    checkoutNotes: document.getElementById('checkoutNotes'),
    checkoutItemsPreview: document.getElementById('checkoutItemsPreview'),
    checkoutShippingRow: document.getElementById('checkoutShippingRow'),
    checkoutShippingText: document.getElementById('checkoutShippingText'),
    checkoutTotalText: document.getElementById('checkoutTotalText'),
    btnSubmitOrder: document.getElementById('btnSubmitOrder'),

    // Success Screen Modal
    successModalBackdrop: document.getElementById('successModalBackdrop'),
    successCustomerName: document.getElementById('successCustomerName'),
    successPickupTime: document.getElementById('successPickupTime'),
    successTotalText: document.getElementById('successTotalText'),
    btnReopenWhatsApp: document.getElementById('btnReopenWhatsApp'),
    btnNewOrder: document.getElementById('btnNewOrder'),

    // Toast Notification
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg')
  };

  let lastGeneratedWaUrl = '';

  // =========================================================================
  // FORMATTERS & UTILS
  // =========================================================================
  function formatMoney(amount) {
    const num = Number(amount || 0);
    return '$' + num.toLocaleString('es-AR');
  }

  function showToast(msg) {
    if (!els.toast) return;
    els.toastMsg.textContent = msg;
    els.toast.classList.add('visible');
    setTimeout(() => {
      els.toast.classList.remove('visible');
    }, 2400);
  }

  function getSavedUserData() {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveUserData(data) {
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // =========================================================================
  // INIT
  // =========================================================================
  function init() {
    renderStoreMeta();
    renderCategories();
    renderProducts();
    populatePaymentMethods();
    bindEvents();

    // Suscribir render de carrito
    Cart.subscribe(renderCartUi);

    // Cargar datos previos de usuario
    const user = getSavedUserData();
    if (user.name) els.checkoutName.value = user.name;
    if (user.phone) els.checkoutPhone.value = user.phone;

    // Detectar retorno de Mercado Pago
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      showToast('🎉 ¡Pago Acreditado con Éxito en Mercado Pago! Tu pedido ya está confirmado.');
    }
  }

  function renderStoreMeta() {
    if (els.storeTitle) els.storeTitle.textContent = CFG.STORE_NAME + ' · ' + CFG.BRANCH_NAME;
    if (els.storeAddress) els.storeAddress.textContent = CFG.ADDRESS + ', ' + CFG.CITY;
    if (els.storeAddressLink && CFG.MAPS_URL) els.storeAddressLink.href = CFG.MAPS_URL;
    if (els.storeInstagramLink && CFG.INSTAGRAM_URL) els.storeInstagramLink.href = CFG.INSTAGRAM_URL;
    if (els.storeHoursText) els.storeHoursText.textContent = CFG.SCHEDULE.display;

    // Calcular si está abierto
    const openH = (CFG.SCHEDULE && CFG.SCHEDULE.openHour) || 12;
    const closeH = (CFG.SCHEDULE && CFG.SCHEDULE.closeHour) || 23;
    const now = new Date();
    const curHour = now.getHours();
    const isOpen = curHour >= openH && curHour < closeH;

    if (els.storeStatusBadge) {
      els.storeStatusBadge.className = 'status-badge ' + (isOpen ? 'open' : 'closed');
      els.storeStatusText.textContent = isOpen
        ? 'Abierto ahora · Retiro en ' + CFG.PREP_MINUTES + ' min'
        : 'Cerrado ahora · Abre a las ' + openH + ':00 hs';
    }
  }

  // =========================================================================
  // CATEGORIES & PRODUCTS RENDER
  // =========================================================================
  function renderCategories() {
    if (!els.categoriesNav) return;

    els.categoriesNav.innerHTML = CATEGORIES.map((cat) => {
      const isActive = cat.id === currentCategory;
      const count = cat.id === 'todas'
        ? PRODUCTS.length
        : (cat.id === 'veggie'
            ? PRODUCTS.filter((p) => p.hasVeggieOption).length
            : PRODUCTS.filter((p) => p.category === cat.id).length);

      return `
        <button type="button" class="category-pill ${isActive ? 'active' : ''}" data-category="${cat.id}">
          <span class="category-icon">${cat.icon}</span>
          <span class="category-label">${cat.label}</span>
          <span class="category-count">${count}</span>
        </button>
      `;
    }).join('');

    els.categoriesNav.querySelectorAll('.category-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.category;
        renderCategories();
        renderProducts();
      });
    });
  }

  function renderProducts() {
    if (!els.productsGrid) return;

    let filtered = PRODUCTS.slice();

    // Filtro por categoría (soporte para categoría veggie)
    if (currentCategory === 'veggie') {
      filtered = filtered.filter((p) => p.hasVeggieOption);
    } else if (currentCategory !== 'todas') {
      filtered = filtered.filter((p) => p.category === currentCategory);
    }

    // Filtro por búsqueda
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.badge && p.badge.toLowerCase().includes(q))
        );
      });
    }

    if (!filtered.length) {
      els.productsGrid.innerHTML = '';
      els.emptySearchState.classList.remove('hidden');
      return;
    }

    els.emptySearchState.classList.add('hidden');

    els.productsGrid.innerHTML = filtered.map((prod) => {
      // Precio a mostrar en tarjeta
      let priceHtml = '';
      if (prod.hasVariants && Array.isArray(prod.variants)) {
        const minP = Math.min(...prod.variants.map((v) => v.price));
        priceHtml = `<span class="price-prefix">Desde</span> <span class="price-value">${formatMoney(minP)}</span>`;
      } else {
        priceHtml = `<span class="price-value">${formatMoney(prod.price)}</span>`;
      }

      const badgeHtml = prod.badge
        ? `<span class="card-badge">${prod.badge}</span>`
        : '';

      const btnLabel = prod.hasVariants || prod.hasDrinkSelection || prod.canAddExtraMeat || prod.hasVeggieOption ? 'Personalizar' : '+ Agregar';

      return `
        <article class="product-card" data-product-id="${prod.id}">
          <div class="card-image-wrap">
            <img src="${prod.image}" alt="${prod.name}" class="card-img" loading="lazy" />
            ${badgeHtml}
          </div>
          <div class="card-body">
            <div class="card-title-row">
              <h3 class="card-title">${prod.name}</h3>
            </div>
            <p class="card-desc">${prod.description}</p>
            <div class="card-footer">
              <div class="card-price">${priceHtml}</div>
              <button type="button" class="btn btn-sm btn-primary btn-add" data-quick-id="${prod.id}">
                ${btnLabel}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Eventos en tarjetas
    els.productsGrid.querySelectorAll('.product-card').forEach((card) => {
      const pId = card.dataset.productId;
      const prod = PRODUCTS.find((x) => x.id === pId);
      if (!prod) return;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-add') && !prod.hasVariants && !prod.hasDrinkSelection && !prod.canAddExtraMeat && !prod.hasVeggieOption) {
          e.stopPropagation();
          Cart.addItem(prod, { quantity: 1 });
          showToast(`✓ Agregado: ${prod.name}`);
          return;
        }
        openProductModal(prod);
      });
    });
  }

  // =========================================================================
  // PRODUCT CUSTOMIZATION MODAL
  // =========================================================================
  function openProductModal(prod) {
    activeModalProduct = prod;
    activeModalQty = 1;
    activeModalIsVeggie = false;
    activeModalHasExtraMeat = false;
    els.modalNotesInput.value = '';

    els.modalProductName.textContent = prod.name;
    els.modalProductDesc.textContent = prod.description;
    els.modalProductBadge.textContent = prod.badge || '';
    els.modalProductBadge.classList.toggle('hidden', !prod.badge);

    // Variantes (Simple / Doble si aplica a combos)
    if (prod.hasVariants && Array.isArray(prod.variants)) {
      els.modalVariantsGroup.classList.remove('hidden');
      const def = prod.variants.find((v) => v.isDefault) || prod.variants[0];
      activeModalVariantId = def.id;

      els.modalVariantsList.innerHTML = prod.variants.map((v) => {
        const isChecked = v.id === activeModalVariantId;
        return `
          <label class="variant-pill ${isChecked ? 'selected' : ''}">
            <input type="radio" name="modal_variant" value="${v.id}" ${isChecked ? 'checked' : ''} />
            <div class="variant-info">
              <span class="variant-name">${v.label}</span>
              <span class="variant-price">${formatMoney(v.price)}</span>
            </div>
          </label>
        `;
      }).join('');

      els.modalVariantsList.querySelectorAll('input[name="modal_variant"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
          activeModalVariantId = e.target.value;
          updateProductModalImage();
          updateModalAddPrice();
          els.modalVariantsList.querySelectorAll('.variant-pill').forEach((p) => {
            p.classList.toggle('selected', p.querySelector('input').checked);
          });
        });
      });
    } else {
      els.modalVariantsGroup.classList.add('hidden');
      activeModalVariantId = null;
    }

    // Extra Carne Smash
    if (prod.canAddExtraMeat) {
      els.modalExtraMeatGroup.classList.remove('hidden');
      els.modalExtraMeatCheckbox.checked = false;
      els.modalExtraMeatCheckbox.disabled = false;
      els.modalExtraMeatGroup.style.opacity = '1';
      els.modalExtraMeatGroup.style.pointerEvents = 'auto';
    } else {
      els.modalExtraMeatGroup.classList.add('hidden');
      els.modalExtraMeatCheckbox.checked = false;
      els.modalExtraMeatCheckbox.disabled = false;
      els.modalExtraMeatGroup.style.opacity = '1';
      els.modalExtraMeatGroup.style.pointerEvents = 'auto';
    }

    // Opción Veggie (Not Burger)
    if (prod.hasVeggieOption) {
      els.modalVeggieGroup.classList.remove('hidden');
      els.modalVeggieCheckbox.checked = false;
    } else {
      els.modalVeggieGroup.classList.add('hidden');
      els.modalVeggieCheckbox.checked = false;
    }

    // Selección de Bebida (Para Combos y Sampler)
    if (prod.hasDrinkSelection && Array.isArray(prod.drinks)) {
      els.modalDrinkGroup.classList.remove('hidden');
      activeModalDrink = prod.drinks[0].label;
      els.modalDrinkSelect.innerHTML = prod.drinks.map((d) => {
        return `<option value="${d.label}">${d.label}</option>`;
      }).join('');
    } else {
      els.modalDrinkGroup.classList.add('hidden');
      activeModalDrink = null;
    }

    updateProductModalImage();
    updateModalAddPrice();
    updateModalQtyDisplay();

    els.productModalBackdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function updateProductModalImage() {
    if (!activeModalProduct) return;
    let img = activeModalProduct.image;
    if (activeModalVariantId === 'simple' && activeModalProduct.imageSimple) {
      img = activeModalProduct.imageSimple;
    } else if (activeModalVariantId === 'doble' && activeModalProduct.imageDoble) {
      img = activeModalProduct.imageDoble;
    }
    els.modalProductImg.src = img;
  }

  function closeProductModal() {
    els.productModalBackdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
    activeModalProduct = null;
  }

  function updateModalQtyDisplay() {
    els.modalQtyVal.textContent = String(activeModalQty);
    updateModalAddPrice();
  }

  function updateModalAddPrice() {
    if (!activeModalProduct) return;
    let unitPrice = 0;
    if (activeModalProduct.hasVariants && Array.isArray(activeModalProduct.variants)) {
      const v = activeModalProduct.variants.find((x) => x.id === activeModalVariantId) || activeModalProduct.variants[0];
      unitPrice = v.price;
    } else {
      unitPrice = activeModalProduct.price || 0;
    }
    if (activeModalHasExtraMeat && activeModalProduct.canAddExtraMeat) {
      unitPrice += (activeModalProduct.extraMeatPrice || 4000);
    }
    const total = unitPrice * activeModalQty;
    els.modalAddCartPrice.textContent = formatMoney(total);
  }

  // =========================================================================
  // CART UI & DRAWER
  // =========================================================================
  function renderCartUi(items) {
    const count = Cart.getCount();
    const total = Cart.getTotal();

    // Actualizar barra inferior flotante
    if (count > 0) {
      els.bottomCartCount.textContent = count === 1 ? '1 ítem' : count + ' ítems';
      els.bottomCartTotal.textContent = formatMoney(total);
      els.bottomCartBar.classList.remove('hidden');
    } else {
      els.bottomCartBar.classList.add('hidden');
      closeCartDrawer();
      closeCheckoutModal();
    }

    // Actualizar lista en Cart Drawer
    if (!items.length) {
      els.cartEmptyNotice.classList.remove('hidden');
      els.cartSummaryBox.classList.add('hidden');
      els.cartItemsList.innerHTML = '';
      return;
    }

    els.cartEmptyNotice.classList.add('hidden');
    els.cartSummaryBox.classList.remove('hidden');
    els.cartSubtotalText.textContent = formatMoney(total);
    els.cartTotalText.textContent = formatMoney(total);

    els.cartItemsList.innerHTML = items.map((item) => {
      const details = [];
      if (item.variantLabel) details.push(item.variantLabel);
      if (item.hasExtraMeat) details.push('🥩 +1 Extra Carne Smash');
      if (item.isVeggie) details.push('<span class="cart-notburger-badge"><img src="img/notco-cross.svg" alt="✕" class="notco-cart-cross" /> Not Burger (Veggie)</span>');
      if (item.drinkChoice) details.push('🥤 ' + item.drinkChoice);
      if (item.notes) details.push('📝 ' + item.notes);

      const detailsHtml = details.length
        ? `<div class="cart-item-details">${details.join(' · ')}</div>`
        : '';

      const lineTotal = item.unitPrice * item.quantity;

      return `
        <div class="cart-item-row" data-cart-key="${item.key}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-thumb" />
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            ${detailsHtml}
            <div class="cart-item-price-unit">${formatMoney(item.unitPrice)} c/u</div>
          </div>
          <div class="cart-item-actions">
            <div class="qty-pill">
              <button type="button" class="qty-btn btn-cart-minus" data-key="${item.key}" aria-label="Restar">−</button>
              <span class="qty-num">${item.quantity}</span>
              <button type="button" class="qty-btn btn-cart-plus" data-key="${item.key}" aria-label="Sumar">+</button>
            </div>
            <div class="cart-item-total">${formatMoney(lineTotal)}</div>
          </div>
        </div>
      `;
    }).join('');

    // Eventos sumar/restar en el carrito
    els.cartItemsList.querySelectorAll('.btn-cart-minus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const item = items.find((i) => i.key === key);
        if (item) Cart.updateQuantity(key, item.quantity - 1);
      });
    });

    els.cartItemsList.querySelectorAll('.btn-cart-plus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const item = items.find((i) => i.key === key);
        if (item) Cart.updateQuantity(key, item.quantity + 1);
      });
    });
  }

  function openCartDrawer() {
    if (Cart.getCount() === 0) {
      showToast('Tu carrito está vacío. ¡Elegí tu hamburguesa favorita!');
      return;
    }
    els.cartDrawerBackdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function closeCartDrawer() {
    els.cartDrawerBackdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  // =========================================================================
  // CHECKOUT MODAL & TIME SLOTS
  // =========================================================================
  function populatePickupTimeSlots() {
    if (!els.scheduledTimeSelect) return;

    const openH = (CFG.SCHEDULE && CFG.SCHEDULE.openHour) || 12;
    const closeH = (CFG.SCHEDULE && CFG.SCHEDULE.closeHour) || 23;

    const slots = [];
    const now = new Date();
    const curHour = now.getHours();
    const curMin = now.getMinutes();

    let startHour = curHour;
    let startMin = Math.ceil((curMin + 20) / 15) * 15;
    if (startMin >= 60) {
      startHour += Math.floor(startMin / 60);
      startMin = startMin % 60;
    }

    const isBeforeOpen = curHour < openH;
    const isClosed = curHour < openH || curHour >= closeH;

    if (isClosed) {
      // Fuera de horario: ofrecer turnos para la apertura (12:00 hs en adelante)
      for (let h = openH; h <= closeH; h++) {
        for (let m = 0; m < 60; m += 15) {
          if (h === closeH && m > 0) continue;
          const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} hs`;
          slots.push(timeStr);
        }
      }
    } else {
      // Dentro de horario de atención
      for (let h = startHour; h <= closeH; h++) {
        const minStart = (h === startHour) ? startMin : 0;
        for (let m = minStart; m < 60; m += 15) {
          if (h === closeH && m > 0) continue; // Último retiro a las 23:00 hs
          const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} hs`;
          slots.push(timeStr);
        }
      }
    }

    if (!slots.length) {
      slots.push(`${openH}:00 hs (Próxima apertura)`);
    }

    els.scheduledTimeSelect.innerHTML = slots.map((s) => {
      return `<option value="${s}">${s}</option>`;
    }).join('');
  }

  function populatePaymentMethods() {
    if (!els.paymentMethodsList) return;
    const methods = CFG.PAYMENT_METHODS || [];

    els.paymentMethodsList.innerHTML = methods.map((m, idx) => {
      const isChecked = idx === 0;
      const extraHint = m.id === 'transferencia' ? `<span class="pay-hint">Alias: <strong>${CFG.ALIAS_MP}</strong></span>` : '';
      return `
        <label class="payment-method-pill ${isChecked ? 'selected' : ''}">
          <input type="radio" name="checkout_payment" value="${m.id}" ${isChecked ? 'checked' : ''} />
          <div class="pay-row">
            <span class="pay-icon">${m.icon}</span>
            <div class="pay-text">
              <span class="pay-label">${m.label}</span>
              ${extraHint}
            </div>
          </div>
        </label>
      `;
    }).join('');

    els.paymentMethodsList.querySelectorAll('input[name="checkout_payment"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        els.paymentMethodsList.querySelectorAll('.payment-method-pill').forEach((p) => {
          p.classList.toggle('selected', p.querySelector('input').checked);
        });
      });
    });
  }

  let isDeliverySelected = false;
  let currentDeliveryFee = 0;
  let quoteDebounceTimer = null;

  function updateDeliveryTotals() {
    const subtotal = Cart.getTotal();
    const finalTotal = isDeliverySelected ? (subtotal + currentDeliveryFee) : subtotal;
    if (els.checkoutTotalText) {
      els.checkoutTotalText.textContent = formatMoney(finalTotal);
    }
    if (els.checkoutShippingRow) {
      els.checkoutShippingRow.classList.toggle('hidden', !isDeliverySelected);
    }
    if (els.checkoutShippingText) {
      els.checkoutShippingText.textContent = formatMoney(currentDeliveryFee);
    }
  }

  function updateDeliveryMode() {
    isDeliverySelected = Boolean(els.orderTypeDelivery && els.orderTypeDelivery.checked);
    if (els.deliveryFieldsWrapper) {
      els.deliveryFieldsWrapper.classList.toggle('hidden', !isDeliverySelected);
    }
    if (els.pickupTimeGroup) {
      els.pickupTimeGroup.classList.toggle('hidden', isDeliverySelected);
    }
    if (isDeliverySelected) {
      fetchUberQuote();
    } else {
      currentDeliveryFee = 0;
      updateDeliveryTotals();
    }
  }

  async function fetchUberQuote() {
    if (!isDeliverySelected) return;
    const address = els.deliveryAddress ? els.deliveryAddress.value.trim() : '';
    const neighborhood = els.deliveryNeighborhood ? els.deliveryNeighborhood.value : '';

    let defaultZoneFee = 1900;
    let defaultZoneEta = '15 - 25 min';
    if (neighborhood === 'puerto_madero') {
      defaultZoneFee = 1900;
      defaultZoneEta = '15 - 25 min';
    } else if (neighborhood === 'san_telmo' || neighborhood === 'monserrat') {
      defaultZoneFee = 2400;
      defaultZoneEta = '20 - 30 min';
    } else if (neighborhood === 'retiro' || neighborhood === 'constitucion') {
      defaultZoneFee = 2900;
      defaultZoneEta = '25 - 35 min';
    } else if (neighborhood === 'palermo') {
      defaultZoneFee = 3800;
      defaultZoneEta = '35 - 45 min';
    } else {
      defaultZoneFee = 2600;
      defaultZoneEta = '25 - 35 min';
    }

    currentDeliveryFee = defaultZoneFee;
    if (els.uberQuotePrice) els.uberQuotePrice.textContent = formatMoney(currentDeliveryFee);
    if (els.uberQuoteEta) els.uberQuoteEta.textContent = `⏱️ Tiempo estimado: ~${defaultZoneEta}`;
    updateDeliveryTotals();

    if (address.length >= 4) {
      try {
        const res = await fetch(`/api/quote-uber?dropoff_address=${encodeURIComponent(address)}&neighborhood=${encodeURIComponent(neighborhood)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.fee) {
            currentDeliveryFee = Number(data.fee);
            if (els.uberQuotePrice) els.uberQuotePrice.textContent = formatMoney(currentDeliveryFee);
            if (els.uberQuoteEta) els.uberQuoteEta.textContent = `⏱️ Tiempo estimado: ~${data.eta}`;
            updateDeliveryTotals();
          }
        }
      } catch (e) {
        console.warn('Quote api notice:', e.message);
      }
    }
  }

  function openCheckoutModal() {
    if (Cart.getCount() === 0) return;
    closeCartDrawer();

    populatePickupTimeSlots();

    // Recuperar datos guardados
    const saved = getSavedUserData();
    if (saved.name && els.checkoutName) els.checkoutName.value = saved.name;
    if (saved.phone && els.checkoutPhone) els.checkoutPhone.value = saved.phone;
    if (saved.address && els.deliveryAddress) els.deliveryAddress.value = saved.address;
    if (saved.apartment && els.deliveryApartment) els.deliveryApartment.value = saved.apartment;

    const items = Cart.getItems();
    els.checkoutItemsPreview.innerHTML = items.map((i) => {
      const extras = [];
      if (i.variantLabel) extras.push(i.variantLabel.split(' ')[0]);
      if (i.isVeggie) extras.push('🌱 Not Burger');
      if (i.hasExtraMeat) extras.push('+Extra Carne');
      if (i.drinkChoice) extras.push(`🥤 ${i.drinkChoice}`);
      const extraText = extras.length ? ` (${extras.join(', ')})` : '';

      return `
        <div class="checkout-item-line">
          <span>${i.quantity}x ${i.name}${extraText}</span>
          <span class="tabular">${formatMoney(i.unitPrice * i.quantity)}</span>
        </div>
      `;
    }).join('');

    updateDeliveryMode();

    els.checkoutModalBackdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function closeCheckoutModal() {
    els.checkoutModalBackdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  // =========================================================================
  // SUBMIT ORDER TO WHATSAPP
  // =========================================================================
  function handleSubmitOrder(e) {
    e.preventDefault();

    const name = els.checkoutName.value.trim();
    const phone = els.checkoutPhone.value.trim();
    if (!name) {
      showToast('Por favor ingresá tu nombre para preparar el pedido.');
      els.checkoutName.focus();
      return;
    }
    if (!phone || phone.length < 8) {
      showToast('Por favor ingresá un número de teléfono válido.');
      els.checkoutPhone.focus();
      return;
    }

    const isDelivery = Boolean(els.orderTypeDelivery && els.orderTypeDelivery.checked);
    let deliveryAddress = '';
    let deliveryApartment = '';

    if (isDelivery) {
      deliveryAddress = els.deliveryAddress ? els.deliveryAddress.value.trim() : '';
      deliveryApartment = els.deliveryApartment ? els.deliveryApartment.value.trim() : '';
      if (!deliveryAddress || deliveryAddress.length < 4) {
        showToast('Por favor ingresá la calle y número para el envío en moto.');
        if (els.deliveryAddress) els.deliveryAddress.focus();
        return;
      }
    }

    saveUserData({
      name,
      phone,
      address: deliveryAddress,
      apartment: deliveryApartment
    });

    let pickupTimeStr = '';
    const now = new Date();
    const openH = (CFG.SCHEDULE && CFG.SCHEDULE.openHour) || 12;
    const closeH = (CFG.SCHEDULE && CFG.SCHEDULE.closeHour) || 23;
    const isClosedNow = now.getHours() < openH || now.getHours() >= closeH;

    if (isDelivery) {
      pickupTimeStr = `Envío en Moto Uber Flash (~25-35 min)`;
    } else if (els.pickupTimeAsap && els.pickupTimeAsap.checked) {
      if (isClosedNow) {
        pickupTimeStr = `Próxima apertura (${openH}:00 hs) · Local cerrado ahora`;
      } else {
        const prep = new Date(now.getTime() + (CFG.PREP_MINUTES || 20) * 60000);
        const approxHour = `${String(prep.getHours()).padStart(2, '0')}:${String(prep.getMinutes()).padStart(2, '0')} hs`;
        pickupTimeStr = `Lo antes posible (~${approxHour})`;
      }
    } else {
      pickupTimeStr = (els.scheduledTimeSelect && els.scheduledTimeSelect.value) || 'A coordinar';
    }

    const selectedPayRadio = document.querySelector('input[name="checkout_payment"]:checked');
    const payMethodId = selectedPayRadio ? selectedPayRadio.value : 'transferencia';
    const payMethodObj = (CFG.PAYMENT_METHODS || []).find((m) => m.id === payMethodId);
    const payLabel = payMethodObj ? payMethodObj.label : 'Mercado Pago / Transferencia';

    const notes = els.checkoutNotes ? els.checkoutNotes.value.trim() : '';
    const items = Cart.getItems();
    const subtotal = Cart.getTotal();
    const shippingFee = isDelivery ? currentDeliveryFee : 0;
    const finalTotal = subtotal + shippingFee;

    let msg = isDelivery
      ? `🛵 *NUEVO PEDIDO DELIVERY UBER — COPE PUERTO MADERO* 🛵\n`
      : `🍔 *NUEVO PEDIDO TAKE AWAY — COPE PUERTO MADERO* 🍔\n`;
    msg += `------------------------------------------\n`;
    msg += `👤 *Cliente:* ${name}\n`;
    msg += `📱 *Teléfono:* ${phone}\n`;

    if (isDelivery) {
      msg += `📍 *Dirección de Entrega:* ${deliveryAddress}\n`;
      if (deliveryApartment) {
        msg += `🏢 *Piso / Depto:* ${deliveryApartment}\n`;
      }
      msg += `🛵 *Modalidad:* Envío en Moto (Uber Flash)\n`;
      msg += `⏱️ *Tiempo estimado:* 25-35 min\n`;
    } else {
      msg += `⏰ *Horario de Retiro:* ${pickupTimeStr}\n`;
      msg += `📍 *Retira en:* ${CFG.ADDRESS}, ${CFG.BRANCH_NAME}\n`;
    }

    msg += `💳 *Forma de Pago:* ${payLabel}\n`;
    if (payMethodId === 'transferencia') {
      msg += `   ↳ _Alias MP: ${CFG.ALIAS_MP}_\n`;
    }
    msg += `------------------------------------------\n\n`;
    msg += `📋 *DETALLE DEL PEDIDO:*\n`;

    items.forEach((item, idx) => {
      const lineTotal = formatMoney(item.unitPrice * item.quantity);
      msg += `${idx + 1}. *${item.quantity}x ${item.name}*\n`;
      if (item.variantLabel) {
        msg += `   ↳ Tamaño: ${item.variantLabel}\n`;
      }
      if (item.hasExtraMeat) {
        msg += `   ↳ 🥩 Extra: +1 Medallón Carne Smash (+$4.000)\n`;
      }
      if (item.isVeggie) {
        msg += `   ↳ 🌱 Opción Vegetariana: Con Not Burger y pan 100% vegano\n`;
      }
      if (item.drinkChoice) {
        msg += `   ↳ 🥤 Bebida: ${item.drinkChoice}\n`;
      }
      if (item.notes) {
        msg += `   ↳ 📝 Aclaración: ${item.notes}\n`;
      }
      msg += `   ↳ Subtotal: ${lineTotal}\n\n`;
    });

    if (isDelivery && shippingFee > 0) {
      msg += `🛵 *Costo Envío Moto Uber:* ${formatMoney(shippingFee)}\n`;
    }

    msg += `------------------------------------------\n`;
    msg += `💰 *TOTAL A PAGAR: ${formatMoney(finalTotal)}*\n`;
    msg += `------------------------------------------\n`;

    if (notes) {
      msg += `💬 *Notas adicionales:* ${notes}\n`;
    }

    msg += `\n_Pedido generado desde la web de Cope Burgers Puerto Madero_`;

    if (payMethodId === 'mp_online') {
      const orderId = `COPE-${Date.now().toString().slice(-6)}`;
      els.btnSubmitOrder.disabled = true;
      els.btnSubmitOrder.textContent = 'Generando cobro seguro en Mercado Pago...';

      fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer: { name, phone },
          pickupTime: pickupTimeStr,
          notes,
          orderId,
          delivery: isDelivery ? {
            isDelivery: true,
            address: deliveryAddress,
            apartment: deliveryApartment,
            fee: shippingFee
          } : null
        })
      })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.init_point) {
          msg += `💳 *Estado:* Cobro online Mercado Pago Checkout Pro\n`;
          msg += `🆔 *Referencia:* ${orderId}\n`;
          const waUrl = `https://wa.me/${CFG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
          lastGeneratedWaUrl = waUrl;

          showToast('✓ Redirigiendo a Mercado Pago para abonar...');
          Cart.clearCart();
          closeCheckoutModal();
          window.location.href = data.init_point;
        } else {
          showToast('Aviso: MP Online requiere configurar MP_ACCESS_TOKEN. Podés abonar por Alias.');
          els.btnSubmitOrder.disabled = false;
          els.btnSubmitOrder.textContent = 'Confirmar y Enviar Pedido →';
          finishWhatsappOrder(name, pickupTimeStr, finalTotal, msg);
        }
      })
      .catch((err) => {
        console.error('Error al conectar con Mercado Pago:', err);
        showToast('Conectando por WhatsApp para coordinar pago...');
        els.btnSubmitOrder.disabled = false;
        els.btnSubmitOrder.textContent = 'Confirmar y Enviar Pedido →';
        finishWhatsappOrder(name, pickupTimeStr, finalTotal, msg);
      });
      return;
    }

    finishWhatsappOrder(name, pickupTimeStr, finalTotal, msg);
  }

  function finishWhatsappOrder(name, pickupTimeStr, total, msg) {
    const waUrl = `https://wa.me/${CFG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    lastGeneratedWaUrl = waUrl;

    els.successCustomerName.textContent = name;
    els.successPickupTime.textContent = pickupTimeStr;
    els.successTotalText.textContent = formatMoney(total);

    Cart.clearCart();
    closeCheckoutModal();

    window.open(waUrl, '_blank');

    els.successModalBackdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function closeSuccessModal() {
    els.successModalBackdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================
  function bindEvents() {
    els.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      els.clearSearchBtn.classList.toggle('hidden', !searchQuery);
      renderProducts();
    });

    els.clearSearchBtn.addEventListener('click', () => {
      els.searchInput.value = '';
      searchQuery = '';
      els.clearSearchBtn.classList.add('hidden');
      renderProducts();
      els.searchInput.focus();
    });

    els.btnOpenCart.addEventListener('click', openCartDrawer);
    els.btnCloseCart.addEventListener('click', closeCartDrawer);
    els.cartDrawerBackdrop.addEventListener('click', (e) => {
      if (e.target === els.cartDrawerBackdrop) closeCartDrawer();
    });

    els.btnClearCart.addEventListener('click', () => {
      if (confirm('¿Seguro que querés vaciar todo el carrito?')) {
        Cart.clearCart();
      }
    });

    els.btnGoToCheckout.addEventListener('click', openCheckoutModal);
    els.btnCloseCheckout.addEventListener('click', closeCheckoutModal);

    const btnVeggie = document.getElementById('btnFilterVeggieBanner');
    if (btnVeggie) {
      btnVeggie.addEventListener('click', () => {
        currentCategory = 'veggie';
        renderCategories();
        renderProducts();
        if (els.productsGrid) els.productsGrid.scrollIntoView({ behavior: 'smooth' });
      });
    }
    els.checkoutModalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.checkoutModalBackdrop) closeCheckoutModal();
    });

    if (els.orderTypeTakeaway) {
      els.orderTypeTakeaway.addEventListener('change', updateDeliveryMode);
    }
    if (els.orderTypeDelivery) {
      els.orderTypeDelivery.addEventListener('change', updateDeliveryMode);
    }
    if (els.deliveryAddress) {
      els.deliveryAddress.addEventListener('input', () => {
        clearTimeout(quoteDebounceTimer);
        quoteDebounceTimer = setTimeout(fetchUberQuote, 400);
      });
    }
    if (els.deliveryNeighborhood) {
      els.deliveryNeighborhood.addEventListener('change', fetchUberQuote);
    }

    els.pickupTimeAsap.addEventListener('change', () => {
      els.scheduledTimeWrapper.classList.add('hidden');
    });
    els.pickupTimeScheduled.addEventListener('change', () => {
      els.scheduledTimeWrapper.classList.remove('hidden');
    });

    els.checkoutForm.addEventListener('submit', handleSubmitOrder);

    els.btnCloseProductModal.addEventListener('click', closeProductModal);
    els.productModalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.productModalBackdrop) closeProductModal();
    });

    els.modalQtyMinus.addEventListener('click', () => {
      if (activeModalQty > 1) {
        activeModalQty -= 1;
        updateModalQtyDisplay();
      }
    });

    els.modalQtyPlus.addEventListener('click', () => {
      if (activeModalQty < 20) {
        activeModalQty += 1;
        updateModalQtyDisplay();
      }
    });

    els.modalExtraMeatCheckbox.addEventListener('change', (e) => {
      activeModalHasExtraMeat = e.target.checked;
      if (activeModalHasExtraMeat && activeModalIsVeggie) {
        activeModalIsVeggie = false;
        els.modalVeggieCheckbox.checked = false;
      }
      updateModalAddPrice();
    });

    els.modalVeggieCheckbox.addEventListener('change', (e) => {
      activeModalIsVeggie = e.target.checked;
      if (activeModalIsVeggie) {
        activeModalHasExtraMeat = false;
        els.modalExtraMeatCheckbox.checked = false;
        els.modalExtraMeatCheckbox.disabled = true;
        els.modalExtraMeatGroup.style.opacity = '0.4';
        els.modalExtraMeatGroup.style.pointerEvents = 'none';
      } else {
        els.modalExtraMeatCheckbox.disabled = false;
        els.modalExtraMeatGroup.style.opacity = '1';
        els.modalExtraMeatGroup.style.pointerEvents = 'auto';
      }
      updateModalAddPrice();
    });

    els.modalDrinkSelect.addEventListener('change', (e) => {
      activeModalDrink = e.target.value;
    });

    els.btnModalAddCart.addEventListener('click', () => {
      if (!activeModalProduct) return;
      Cart.addItem(activeModalProduct, {
        variantId: activeModalVariantId,
        isVeggie: activeModalIsVeggie,
        hasExtraMeat: activeModalHasExtraMeat,
        drinkChoice: activeModalDrink,
        notes: els.modalNotesInput.value.trim(),
        quantity: activeModalQty
      });
      showToast(`✓ Agregado: ${activeModalProduct.name} (${activeModalQty})`);
      closeProductModal();
    });

    els.btnReopenWhatsApp.addEventListener('click', () => {
      if (lastGeneratedWaUrl) {
        window.open(lastGeneratedWaUrl, '_blank');
      }
    });

    els.btnNewOrder.addEventListener('click', () => {
      closeSuccessModal();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!els.productModalBackdrop.classList.contains('hidden')) closeProductModal();
        else if (!els.checkoutModalBackdrop.classList.contains('hidden')) closeCheckoutModal();
        else if (!els.cartDrawerBackdrop.classList.contains('hidden')) closeCartDrawer();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
