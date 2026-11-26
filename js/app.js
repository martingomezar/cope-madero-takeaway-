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
  let activeModalHasExtraCheddar = false;
  let activeModalHasExtraBacon = false;
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
    bottomCartLabel: document.getElementById('bottomCartLabel'),
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
    lblExtraMeatText: document.getElementById('lblExtraMeatText'),
    modalExtraCheddarGroup: document.getElementById('modalExtraCheddarGroup'),
    modalExtraCheddarCheckbox: document.getElementById('modalExtraCheddarCheckbox'),
    lblExtraCheddarText: document.getElementById('lblExtraCheddarText'),
    modalExtraBaconGroup: document.getElementById('modalExtraBaconGroup'),
    modalExtraBaconCheckbox: document.getElementById('modalExtraBaconCheckbox'),
    lblExtraBaconText: document.getElementById('lblExtraBaconText'),
    modalVeggieGroup: document.getElementById('modalVeggieGroup'),
    modalVeggieCheckbox: document.getElementById('modalVeggieCheckbox'),
    modalDrinkGroup: document.getElementById('modalDrinkGroup'),
    modalDrinkSelect: document.getElementById('modalDrinkSelect'),
    modalNotesInput: document.getElementById('modalNotesInput'),
    modalQtyMinus: document.getElementById('modalQtyMinus'),
    modalQtyPlus: document.getElementById('modalQtyPlus'),
    modalQtyVal: document.getElementById('modalQtyVal'),
    btnModalAddCart: document.getElementById('btnModalAddCart'),
    btnModalAddCartLabel: document.getElementById('btnModalAddCartLabel'),
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
    successOrderBadge: document.getElementById('successOrderBadge'),
    successCustomerName: document.getElementById('successCustomerName'),
    successDeliveryType: document.getElementById('successDeliveryType'),
    successPickupTime: document.getElementById('successPickupTime'),
    successLocationText: document.getElementById('successLocationText'),
    successTotalText: document.getElementById('successTotalText'),
    successTransferBox: document.getElementById('successTransferBox'),
    successAliasText: document.getElementById('successAliasText'),
    btnCopyAlias: document.getElementById('btnCopyAlias'),
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
  // SISTEMA MULTILENGUAJE (ES / EN / PT)
  // =========================================================================
  function applyLanguage(lang) {
    if (!window.COPE_I18N) return;
    window.COPE_I18N.setLang(lang);
    const t = window.COPE_I18N.t;

    // Actualizar botones de banderas en la barra superior
    document.querySelectorAll('.flag-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Textos del Header y Meta
    const badgeEl = document.getElementById('i18nHeaderBadge');
    if (badgeEl) badgeEl.textContent = t('badge_takeaway');

    const sloganEl = document.getElementById('i18nHeaderSlogan');
    if (sloganEl) sloganEl.textContent = t('slogan');

    const takeawayNoticeEl = document.getElementById('takeawayNoticeText');
    if (takeawayNoticeEl) takeawayNoticeEl.innerHTML = t('takeaway_notice_html');

    if (els.searchInput) els.searchInput.placeholder = t('search_placeholder');
    if (els.storeHoursText) els.storeHoursText.textContent = t('schedule_label');

    const emptyTitle = document.querySelector('#emptySearchState h3');
    if (emptyTitle) emptyTitle.textContent = t('no_results_title');
    const emptyDesc = document.querySelector('#emptySearchState p');
    if (emptyDesc) emptyDesc.textContent = t('no_results_desc');

    // Cart Drawer
    const cartTitle = document.querySelector('.drawer-title');
    if (cartTitle) cartTitle.textContent = t('cart_title');
    if (els.btnClearCart) els.btnClearCart.textContent = t('cart_btn_clear');
    if (els.btnGoToCheckout) els.btnGoToCheckout.textContent = t('cart_btn_checkout');

    // Checkout Modal
    const checkoutTitle = document.getElementById('checkoutModalTitle');
    if (checkoutTitle) checkoutTitle.textContent = t('checkout_title');

    const optTakeawaySpan = document.querySelector('#orderTypeTakeaway ~ span');
    if (optTakeawaySpan) optTakeawaySpan.textContent = t('opt_takeaway');
    const optDeliverySpan = document.querySelector('#orderTypeDelivery ~ span');
    if (optDeliverySpan) optDeliverySpan.textContent = t('opt_delivery');

    if (els.deliveryAddress) els.deliveryAddress.placeholder = t('delivery_addr_placeholder');
    if (els.deliveryApartment) els.deliveryApartment.placeholder = t('delivery_apt_placeholder');

    if (els.checkoutName) els.checkoutName.placeholder = t('field_name_placeholder');
    if (els.checkoutPhone) els.checkoutPhone.placeholder = t('field_phone_placeholder');
    if (els.checkoutNotes) els.checkoutNotes.placeholder = t('checkout_notes_placeholder');

    if (els.btnSubmitOrder) {
      const span = els.btnSubmitOrder.querySelector('span');
      if (span) span.textContent = t('btn_submit_order');
    }

    if (!CFG.ENABLE_ORDERING) {
      if (els.bottomCartLabel) {
        els.bottomCartLabel.textContent = t('coming_soon_order');
      }
      if (els.btnModalAddCartLabel) {
        els.btnModalAddCartLabel.textContent = t('coming_soon_order');
      }
    } else {
      if (els.bottomCartLabel) {
        els.bottomCartLabel.textContent = 'Ver Pedido';
      }
      if (els.btnModalAddCartLabel) {
        els.btnModalAddCartLabel.textContent = t('btn_add') ? `${t('btn_add')} al Pedido` : 'Agregar al Pedido';
      }
    }

    const waBtn = document.getElementById('floatingWhatsappBtn');
    if (waBtn) {
      const msg = encodeURIComponent(t('wa_order_msg'));
      waBtn.href = `https://wa.me/5491173558077?text=${msg}`;
      waBtn.title = t('wa_order_btn') || 'WhatsApp';
      waBtn.setAttribute('aria-label', t('wa_order_btn') || 'WhatsApp');
    }

    // Promociones Destacadas (Spotlight Bar)
    const slBadge = document.getElementById('spotlightLunchBadge');
    if (slBadge) slBadge.textContent = t('promo_lunch_badge');
    const slTitle = document.getElementById('spotlightLunchTitle');
    if (slTitle) slTitle.textContent = t('promo_lunch_title');
    const slDesc = document.getElementById('spotlightLunchDesc');
    if (slDesc) slDesc.innerHTML = t('promo_lunch_desc');
    const slBtn = document.getElementById('spotlightLunchBtn');
    if (slBtn) slBtn.textContent = t('promo_btn_action');
    const slPill = document.getElementById('spotlightLunchPill');
    if (slPill) slPill.textContent = t('promo_lunch_pill');

    const saBadge = document.getElementById('spotlightAfterBadge');
    if (saBadge) saBadge.textContent = t('promo_after_badge');
    const saTitle = document.getElementById('spotlightAfterTitle');
    if (saTitle) saTitle.textContent = t('promo_after_title');
    const saDesc = document.getElementById('spotlightAfterDesc');
    if (saDesc) saDesc.innerHTML = t('promo_after_desc');
    const saBtn = document.getElementById('spotlightAfterBtn');
    if (saBtn) saBtn.textContent = t('promo_btn_action');
    const saPill = document.getElementById('spotlightAfterPill');
    if (saPill) saPill.textContent = t('promo_after_pill');

    renderCategories();
    renderProducts();
    populatePaymentMethods();
  }

  // =========================================================================
  // INIT
  // =========================================================================
  function init() {
    renderStoreMeta();
    const currentLang = window.COPE_I18N ? window.COPE_I18N.init() : 'es';
    applyLanguage(currentLang);
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
      Cart.clearCart();
      try { localStorage.removeItem('cope_pending_order'); } catch (e) {}
      const returnedOrderId = urlParams.get('orderId');
      showToast('🎉 ¡Pago acreditado en Mercado Pago! Tu pedido ya está confirmado en cocina.');
      if (returnedOrderId) {
        fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: returnedOrderId, payment_status: 'aprobado' })
        }).catch(() => {});
      }
    } else if (urlParams.get('payment') === 'failure') {
      showToast('Aviso: El pago no fue procesado. Tu carrito sigue guardado para reintentar.');
    }
  }

  function renderStoreMeta() {
    if (els.storeTitle) els.storeTitle.textContent = CFG.STORE_NAME + ' · ' + CFG.BRANCH_NAME;
    if (els.storeAddress) els.storeAddress.textContent = CFG.LOCATION_LABEL || 'Puerto Madero · Dique 4';
    if (els.storeAddressLink && CFG.MAPS_URL) els.storeAddressLink.href = CFG.MAPS_URL;
    if (els.storeInstagramLink && CFG.INSTAGRAM_URL) els.storeInstagramLink.href = CFG.INSTAGRAM_URL;
    if (els.storeHoursText) els.storeHoursText.textContent = CFG.SCHEDULE.display;

    // Calcular si está abierto
    const openH = (CFG.SCHEDULE && CFG.SCHEDULE.openHour) || 11;
    const closeH = (CFG.SCHEDULE && CFG.SCHEDULE.closeHour) || 23;
    const now = new Date();
    const curHour = now.getHours();
    const isOpen = curHour >= openH && curHour < closeH;

    if (els.storeStatusBadge) {
      els.storeStatusBadge.className = 'status-badge ' + (isOpen ? 'open' : 'closed');
      els.storeStatusText.textContent = isOpen
        ? (window.COPE_I18N ? window.COPE_I18N.t('status_open') : 'Abierto · Retiro en ' + CFG.PREP_MINUTES + ' min')
        : (window.COPE_I18N ? window.COPE_I18N.t('status_closed') : 'Cerrado') + ' · Abre ' + openH + ':00 hs';
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

      const locCat = window.COPE_I18N ? window.COPE_I18N.getLocalizedCategory(cat) : cat;

      return `
        <button type="button" class="category-pill ${isActive ? 'active' : ''}" data-category="${cat.id}">
          <span class="category-icon">${cat.icon}</span>
          <span class="category-label">${locCat.label}</span>
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

  function getProductQuickTags(prod) {
    const tags = [];
    const desc = (prod.description || '').toLowerCase();
    const name = (prod.name || '').toLowerCase();

    if (prod.isPromo && prod.scheduleBadge) {
      tags.push({ label: `⏰ ${prod.scheduleBadge}`, type: 'promo' });
    }

    if (prod.category === 'simples') {
      tags.push({ label: '🥩 110g Carne', type: 'meat' });
    } else if (prod.category === 'dobles') {
      tags.push({ label: '🥩🥩 220g Doble Carne', type: 'meat' });
    } else if (prod.category === 'combos') {
      tags.push({ label: '🍟 Con Papas', type: 'combo' });
      tags.push({ label: '🥤 Con Bebida', type: 'combo' });
    }

    if (desc.includes('cheddar') || name.includes('cheese')) {
      tags.push({ label: '🧀 Cheddar', type: 'cheese' });
    }
    if (desc.includes('bacon')) {
      tags.push({ label: '🥓 Bacon Crispy', type: 'bacon' });
    }
    if (prod.hasVeggieOption) {
      tags.push({ label: '🌱 NotCo', type: 'veggie' });
    }
    if (prod.category === 'bebidas') {
      tags.push({ label: '🧊 Bien Fría', type: 'drink' });
    }
    if (prod.category === 'acompanamientos') {
      tags.push({ label: '🍟 Crujientes', type: 'fries' });
    }

    return tags.slice(0, 3);
  }

  function renderProducts() {
    if (!els.productsGrid) return;

    let filtered = PRODUCTS.slice();

    // Filtro por categoría (soporte para categoría veggie y promos)
    if (currentCategory === 'veggie') {
      filtered = filtered.filter((p) => p.hasVeggieOption);
    } else if (currentCategory === 'promos') {
      filtered = filtered.filter((p) => p.category === 'promos' || p.isPromo);
    } else if (currentCategory !== 'todas') {
      filtered = filtered.filter((p) => p.category === currentCategory);
    }

    // Filtro por búsqueda
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((p) => {
        const lp = window.COPE_I18N ? window.COPE_I18N.getLocalizedProduct(p) : p;
        return (
          p.name.toLowerCase().includes(q) ||
          lp.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (lp.description && lp.description.toLowerCase().includes(q)) ||
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

    els.productsGrid.innerHTML = filtered.map((origProd) => {
      const prod = window.COPE_I18N ? window.COPE_I18N.getLocalizedProduct(origProd) : origProd;

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

      const quickTags = getProductQuickTags(origProd);
      const quickTagsHtml = quickTags.length
        ? `<div class="card-tags">${quickTags.map((t) => `<span class="card-tag tag-${t.type}">${t.label}</span>`).join('')}</div>`
        : '';

      const isCustomizable = origProd.hasVariants || origProd.hasDrinkSelection || origProd.canAddExtraMeat || origProd.hasVeggieOption || origProd.canAddExtraCheddar || origProd.canAddExtraBacon;
      const promoOpen = !origProd.isPromo || isPromoAvailableNow(origProd);
      const btnDisabled = !CFG.ENABLE_ORDERING || !promoOpen;
      const btnLabel = !promoOpen && origProd.promoSchedule
        ? `⏰ Solo ${origProd.promoSchedule.startHour} a ${origProd.promoSchedule.endHour} hs`
        : (isCustomizable
          ? (window.COPE_I18N ? window.COPE_I18N.t('btn_customize') : 'Personalizar')
          : (window.COPE_I18N ? `+ ${window.COPE_I18N.t('btn_add')}` : '+ Agregar'));

      return `
        <article class="product-card ${origProd.isPromo ? 'is-promo-card' : ''}" data-product-id="${origProd.id}">
          <div class="card-image-wrap">
            <img src="${prod.image}" alt="${prod.name}" class="card-img" loading="lazy" />
            ${badgeHtml}
          </div>
          <div class="card-body">
            <div class="card-title-row">
              <h3 class="card-title">${prod.name}</h3>
            </div>
            ${quickTagsHtml}
            <p class="card-desc">${prod.description}</p>
            <div class="card-footer">
              <div class="card-price">${priceHtml}</div>
              <button type="button" class="btn btn-sm btn-primary btn-add" ${btnDisabled ? 'disabled style="opacity:0.55; cursor:not-allowed;"' : ''} data-quick-id="${prod.id}">
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
        if (!CFG.ENABLE_ORDERING && e.target.closest('.btn-add')) {
          e.stopPropagation();
          showToast(window.COPE_I18N ? window.COPE_I18N.t('coming_soon_order') : 'Próximamente podrás pedir aquí');
          return;
        }
        if (prod.isPromo && !isPromoAvailableNow(prod)) {
          e.stopPropagation();
          const schedLabel = prod.promoSchedule ? prod.promoSchedule.label : 'en el horario de la promo';
          showToast(`⏰ Promo disponible únicamente ${schedLabel}`);
          return;
        }
        if (e.target.closest('.btn-add') && !prod.hasVariants && !prod.hasDrinkSelection && !prod.canAddExtraMeat && !prod.hasVeggieOption && !prod.canAddExtraCheddar && !prod.canAddExtraBacon) {
          e.stopPropagation();
          Cart.addItem(prod, { quantity: 1 });
          showToast(`✓ Agregado: ${prod.name}`);
          return;
        }
        openProductModal(prod);
      });
    });
  }

  function isPromoAvailableNow(prod) {
    if (!prod || !prod.isPromo || !prod.promoSchedule) return true;
    try {
      const arNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
      const day = arNow.getDay(); // 0=Dom, 1=Lun .. 5=Vie, 6=Sab
      const hour = arNow.getHours();
      const { days, startHour, endHour } = prod.promoSchedule;
      if (Array.isArray(days) && !days.includes(day)) return false;
      return hour >= startHour && hour < endHour;
    } catch (e) {
      return true;
    }
  }

  // =========================================================================
  // PRODUCT CUSTOMIZATION MODAL
  // =========================================================================
  function openProductModal(origProd) {
    activeModalProduct = origProd;
    const prod = window.COPE_I18N ? window.COPE_I18N.getLocalizedProduct(origProd) : origProd;
    activeModalQty = 1;
    activeModalIsVeggie = false;
    activeModalHasExtraMeat = false;
    activeModalHasExtraCheddar = false;
    activeModalHasExtraBacon = false;
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

    // Extra Carne
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

    // Extra Queso Cheddar (todas las opciones de burgers y papas)
    if (prod.canAddExtraCheddar && els.modalExtraCheddarGroup) {
      els.modalExtraCheddarGroup.classList.remove('hidden');
      els.modalExtraCheddarCheckbox.checked = false;
      if (els.lblExtraCheddarText) {
        els.lblExtraCheddarText.textContent = window.COPE_I18N ? window.COPE_I18N.t('modal_extra_cheddar_text') : '🧀 Agregar Extra Queso Cheddar (+ $2.000)';
      }
    } else if (els.modalExtraCheddarGroup) {
      els.modalExtraCheddarGroup.classList.add('hidden');
      els.modalExtraCheddarCheckbox.checked = false;
    }

    // Extra Bacon (hamburguesas con bacon)
    if (prod.canAddExtraBacon && els.modalExtraBaconGroup) {
      els.modalExtraBaconGroup.classList.remove('hidden');
      els.modalExtraBaconCheckbox.checked = false;
      els.modalExtraBaconCheckbox.disabled = false;
      els.modalExtraBaconGroup.style.opacity = '1';
      els.modalExtraBaconGroup.style.pointerEvents = 'auto';
      if (els.lblExtraBaconText) {
        els.lblExtraBaconText.textContent = window.COPE_I18N ? window.COPE_I18N.t('modal_extra_bacon_text') : '🥓 Agregar Extra Bacon (+ $2.000)';
      }
    } else if (els.modalExtraBaconGroup) {
      els.modalExtraBaconGroup.classList.add('hidden');
      els.modalExtraBaconCheckbox.checked = false;
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

    if (!CFG.ENABLE_ORDERING) {
      if (els.btnModalAddCart) {
        els.btnModalAddCart.disabled = true;
        els.btnModalAddCart.style.opacity = '0.6';
        els.btnModalAddCart.style.cursor = 'not-allowed';
      }
      if (els.btnModalAddCartLabel) {
        els.btnModalAddCartLabel.textContent = window.COPE_I18N ? window.COPE_I18N.t('coming_soon_order') : 'Próximamente podrás pedir aquí';
      }
      if (els.modalAddCartPrice) {
        els.modalAddCartPrice.style.display = 'none';
      }
    } else if (origProd.isPromo && !isPromoAvailableNow(origProd)) {
      if (els.btnModalAddCart) {
        els.btnModalAddCart.disabled = true;
        els.btnModalAddCart.style.opacity = '0.6';
        els.btnModalAddCart.style.cursor = 'not-allowed';
      }
      if (els.btnModalAddCartLabel && origProd.promoSchedule) {
        els.btnModalAddCartLabel.textContent = `⏰ Solo ${origProd.promoSchedule.startHour} a ${origProd.promoSchedule.endHour} hs`;
      }
    } else {
      if (els.btnModalAddCart) {
        els.btnModalAddCart.disabled = false;
        els.btnModalAddCart.style.opacity = '1';
        els.btnModalAddCart.style.cursor = 'pointer';
      }
      if (els.btnModalAddCartLabel) {
        els.btnModalAddCartLabel.textContent = window.COPE_I18N ? window.COPE_I18N.t('modal_btn_add') : 'Agregar al pedido';
      }
      if (els.modalAddCartPrice) {
        els.modalAddCartPrice.style.display = 'inline';
      }
    }

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
    if (activeModalHasExtraCheddar && activeModalProduct.canAddExtraCheddar) {
      unitPrice += (activeModalProduct.extraCheddarPrice || 2000);
    }
    if (activeModalHasExtraBacon && activeModalProduct.canAddExtraBacon) {
      unitPrice += (activeModalProduct.extraBaconPrice || 2000);
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
    if (!CFG.ENABLE_ORDERING) {
      els.bottomCartBar.classList.remove('hidden');
      if (els.bottomCartLabel) {
        els.bottomCartLabel.textContent = window.COPE_I18N ? window.COPE_I18N.t('coming_soon_order') : 'Próximamente podrás pedir aquí';
      }
      if (els.bottomCartCount) els.bottomCartCount.style.display = 'none';
      if (els.bottomCartTotal) els.bottomCartTotal.style.display = 'none';
    } else if (count > 0) {
      if (els.bottomCartCount) els.bottomCartCount.style.display = '';
      if (els.bottomCartTotal) els.bottomCartTotal.style.display = '';
      if (els.bottomCartLabel) els.bottomCartLabel.textContent = 'Ver Pedido';
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
      if (item.hasExtraMeat) details.push('🥩 +1 Extra Medallón de Carne');
      if (item.hasExtraCheddar) details.push('🧀 +Extra Cheddar');
      if (item.hasExtraBacon) details.push('🥓 +Extra Bacon');
      if (item.isVeggie) details.push('<span class="cart-notburger-badge"><img src="img/notco-cross.svg" alt="✕" class="notco-cart-cross" /> Not Burger (Veggie)</span>');
      if (item.drinkChoice) details.push('🥤 ' + item.drinkChoice);
      if (item.notes) details.push('📝 ' + item.notes);

      const detailsHtml = details.length
        ? `<div class="cart-item-details">${details.join(' · ')}</div>`
        : '';

      const lineTotal = item.unitPrice * item.quantity;

      const origProd = PRODUCTS.find((p) => p.id === item.id);
      const lp = origProd && window.COPE_I18N ? window.COPE_I18N.getLocalizedProduct(origProd) : null;
      const displayName = lp ? lp.name : item.name;

      return `
        <div class="cart-item-row" data-cart-key="${item.key}">
          <img src="${item.image}" alt="${displayName}" class="cart-item-thumb" />
          <div class="cart-item-info">
            <div class="cart-item-name">${displayName}</div>
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
    if (!CFG.ENABLE_ORDERING) {
      showToast(window.COPE_I18N ? window.COPE_I18N.t('coming_soon_order') : 'Próximamente podrás pedir aquí');
      return;
    }
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
    // Efectivo ELIMINADO completamente
    let methods = (CFG.PAYMENT_METHODS || []).filter(m => m.id !== 'efectivo');
    if (isDeliverySelected) {
      // En envíos delivery solo se permite pago online por Mercado Pago o Transferencia Alias
      methods = methods.filter(m => m.id !== 'tarjeta');
    }

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
  let currentDeliveryEta = '25-35 min';
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
    if (!CFG.ENABLE_DELIVERY) {
      if (els.orderTypeTakeaway) els.orderTypeTakeaway.checked = true;
      if (els.orderTypeDelivery) {
        els.orderTypeDelivery.checked = false;
        els.orderTypeDelivery.disabled = true;
        const deliveryPill = els.orderTypeDelivery.closest('.time-radio-pill');
        if (deliveryPill) {
          deliveryPill.style.opacity = '0.55';
          deliveryPill.style.cursor = 'not-allowed';
          deliveryPill.title = 'Próximamente Delivery';
          const span = deliveryPill.querySelector('span');
          if (span) span.textContent = '🛵 Próximamente Delivery';
        }
      }
    }
    isDeliverySelected = Boolean(CFG.ENABLE_DELIVERY && els.orderTypeDelivery && els.orderTypeDelivery.checked);
    if (els.deliveryFieldsWrapper) {
      els.deliveryFieldsWrapper.classList.toggle('hidden', !isDeliverySelected);
    }
    if (els.pickupTimeGroup) {
      els.pickupTimeGroup.classList.toggle('hidden', isDeliverySelected);
    }
    populatePaymentMethods();
    if (isDeliverySelected) {
      fetchUberQuote();
    } else {
      currentDeliveryFee = 0;
      currentDeliveryEta = '25-35 min';
      updateDeliveryTotals();
    }
  }

  async function fetchUberQuote() {
    if (!isDeliverySelected) return;
    const address = els.deliveryAddress ? els.deliveryAddress.value.trim() : '';
    const neighborhood = els.deliveryNeighborhood ? els.deliveryNeighborhood.value : '';

    // Tarifa fija de delivery Cope ($3.000)
    const defaultZoneFee = 3000;
    let defaultZoneEta = '15 - 25 min';
    if (neighborhood === 'puerto_madero') {
      defaultZoneEta = '15 - 25 min';
    } else if (neighborhood === 'san_telmo' || neighborhood === 'monserrat') {
      defaultZoneEta = '20 - 30 min';
    } else if (neighborhood === 'retiro' || neighborhood === 'constitucion') {
      defaultZoneEta = '25 - 35 min';
    } else if (neighborhood === 'palermo') {
      defaultZoneEta = '35 - 45 min';
    } else {
      defaultZoneEta = '25 - 35 min';
    }

    currentDeliveryFee = defaultZoneFee;
    currentDeliveryEta = defaultZoneEta;
    if (els.uberQuotePrice) els.uberQuotePrice.textContent = formatMoney(currentDeliveryFee);
    if (els.uberQuoteEta) els.uberQuoteEta.textContent = `⏱️ Tiempo estimado: ~${defaultZoneEta}`;
    updateDeliveryTotals();

    if (address.length >= 4) {
      try {
        const res = await fetch(`/api/quote-uber?dropoff_address=${encodeURIComponent(address)}&neighborhood=${encodeURIComponent(neighborhood)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.eta) {
            currentDeliveryEta = data.eta;
            if (els.uberQuoteEta) els.uberQuoteEta.textContent = `⏱️ Tiempo estimado: ~${currentDeliveryEta}`;
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
      const origProd = PRODUCTS.find((p) => p.id === i.id);
      const lp = origProd && window.COPE_I18N ? window.COPE_I18N.getLocalizedProduct(origProd) : null;
      const displayName = lp ? lp.name : i.name;

      const extras = [];
      if (i.variantLabel) extras.push(i.variantLabel.split(' ')[0]);
      if (i.isVeggie) extras.push('🌱 Not Burger');
      if (i.hasExtraMeat) extras.push('+Extra Carne');
      if (i.hasExtraCheddar) extras.push('+Extra Cheddar');
      if (i.hasExtraBacon) extras.push('+Extra Bacon');
      if (i.drinkChoice) extras.push(`🥤 ${i.drinkChoice}`);
      const extraText = extras.length ? ` (${extras.join(', ')})` : '';

      return `
        <div class="checkout-item-line">
          <span>${i.quantity}x ${displayName}${extraText}</span>
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
  // SUBMIT ORDER (WEB-A-WEB)
  // =========================================================================
  function handleSubmitOrder(e) {
    if (e && e.preventDefault) e.preventDefault();

    try {
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
        pickupTimeStr = `Envío en Moto (~25-35 min)`;
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
        ? `🛵 *NUEVO PEDIDO DELIVERY — COPE PUERTO MADERO* 🛵\n`
        : `🍔 *NUEVO PEDIDO TAKE AWAY — COPE PUERTO MADERO* 🍔\n`;
      msg += `------------------------------------------\n`;
      msg += `👤 *Cliente:* ${name}\n`;
      msg += `📱 *Teléfono:* ${phone}\n`;

      if (isDelivery) {
        msg += `📍 *Dirección de Entrega:* ${deliveryAddress}\n`;
        if (deliveryApartment) {
          msg += `🏢 *Piso / Depto:* ${deliveryApartment}\n`;
        }
        msg += `🛵 *Modalidad:* Pedir Moto / Delivery\n`;
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
          msg += `   ↳ 🥩 Extra: +1 Medallón de Carne (+$4.000)\n`;
        }
        if (item.hasExtraCheddar) {
          msg += `   ↳ 🧀 Extra: +Extra Queso Cheddar (+$2.000)\n`;
        }
        if (item.hasExtraBacon) {
          msg += `   ↳ 🥓 Extra: +Extra Bacon (+$2.000)\n`;
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
        msg += `🛵 *Costo Envío en Moto:* ${formatMoney(shippingFee)}\n`;
      }

      msg += `------------------------------------------\n`;
      msg += `💰 *TOTAL A PAGAR: ${formatMoney(finalTotal)}*\n`;
      msg += `------------------------------------------\n`;

      if (notes) {
        msg += `💬 *Notas adicionales:* ${notes}\n`;
      }

      msg += `\n_Pedido generado desde la web de Cope Burgers Puerto Madero_`;

      const orderId = `COPE-${Math.floor(1000 + Math.random() * 9000)}`;

      const orderPayload = {
        orderId,
        created_at: new Date().toISOString(),
        customer: { name, phone },
        order_type: isDelivery ? 'delivery' : 'takeaway',
        pickup_time: pickupTimeStr,
        delivery: isDelivery ? {
          isDelivery: true,
          address: deliveryAddress,
          apartment: deliveryApartment,
          fee: shippingFee,
          eta: currentDeliveryEta || '25-35 min'
        } : null,
        items: items.map((i) => ({
          id: i.id || i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          variantLabel: i.variantLabel || null,
          isVeggie: Boolean(i.isVeggie),
          hasExtraMeat: Boolean(i.hasExtraMeat),
          hasExtraCheddar: Boolean(i.hasExtraCheddar),
          hasExtraBacon: Boolean(i.hasExtraBacon),
          drinkChoice: i.drinkChoice || null,
          notes: i.notes || ''
        })),
        subtotal,
        delivery_fee: shippingFee,
        total: finalTotal,
        payment_method: payMethodId,
        payment_status: payMethodId === 'mp_online' ? 'pendiente_mp' : 'pendiente_transferencia',
        kitchen_status: 'recibido',
        notes
      };

      // 1. Guardar comanda en el servidor en tiempo real (web a web)
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      }).catch((e) => console.warn('Error al enviar comanda al servidor:', e));

      if (payMethodId === 'mp_online') {
        const span = els.btnSubmitOrder.querySelector('span');
        if (span) span.textContent = 'Generando cobro seguro en Mercado Pago...';
        else els.btnSubmitOrder.textContent = 'Generando cobro seguro en Mercado Pago...';
        els.btnSubmitOrder.disabled = true;

        try {
          localStorage.setItem('cope_pending_order', JSON.stringify({ orderId, orderPayload }));
        } catch (e) {}

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
            showToast('✓ Redirigiendo a Mercado Pago para abonar...');
            closeCheckoutModal();
            window.location.href = data.init_point;
          } else {
            showToast('Aviso: MP Online requiere configuración. Podés abonar por Transferencia.');
            if (span) span.textContent = 'Confirmar y Enviar Pedido →';
            els.btnSubmitOrder.disabled = false;
            finishWebOrder(orderPayload, msg);
          }
        })
        .catch((err) => {
          console.error('Error al conectar con Mercado Pago:', err);
          showToast('Mostrando datos para abonar por Transferencia...');
          const span = els.btnSubmitOrder.querySelector('span');
          if (span) span.textContent = 'Confirmar y Enviar Pedido →';
          els.btnSubmitOrder.disabled = false;
          finishWebOrder(orderPayload, msg);
        });
        return;
      }

      finishWebOrder(orderPayload, msg);
    } catch (submitErr) {
      console.error('Error al confirmar pedido:', submitErr);
      showToast('Ocurrió un error al procesar el pedido. Por favor intentá nuevamente.');
    }
  }

  function finishWebOrder(order, msg) {
    Cart.clearCart();
    closeCheckoutModal();

    if (els.successOrderBadge) {
      els.successOrderBadge.textContent = `#${order.orderId}`;
    }
    if (els.successCustomerName) {
      els.successCustomerName.textContent = order.customer.name;
    }
    if (els.successDeliveryType) {
      els.successDeliveryType.textContent = order.order_type === 'delivery'
        ? '🛵 Pedir Moto / Delivery'
        : '🛍️ Take Away (Retiro en local)';
    }
    if (els.successPickupTime) {
      els.successPickupTime.textContent = order.pickup_time;
    }
    if (els.successLocationText) {
      if (order.order_type === 'delivery' && order.delivery) {
        const addr = order.delivery.address || '';
        const apt = order.delivery.apartment ? ` (${order.delivery.apartment})` : '';
        els.successLocationText.textContent = `${addr}${apt}`.trim() || 'Dirección ingresada';
      } else {
        els.successLocationText.textContent = 'Macacha Güemes 260, Puerto Madero';
      }
    }
    if (els.successTotalText) {
      els.successTotalText.textContent = formatMoney(order.total);
    }

    if (els.successTransferBox) {
      els.successTransferBox.style.display = order.payment_method === 'transferencia' ? 'block' : 'none';
      if (els.successAliasText) {
        els.successAliasText.textContent = CFG.ALIAS_MP || 'copemadero.mp';
      }
    }

    if (els.btnReopenWhatsApp) {
      lastGeneratedWaUrl = `https://wa.me/${CFG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
      els.btnReopenWhatsApp.style.display = 'block';
    }

    els.successModalBackdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');
    showToast(`✓ ¡Pedido #${order.orderId} confirmado en cocina!`);
  }

  function finishWhatsappOrder(name, pickupTimeStr, total, msg) {
    const waUrl = `https://wa.me/${CFG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    lastGeneratedWaUrl = waUrl;

    els.successCustomerName.textContent = name;
    els.successPickupTime.textContent = pickupTimeStr;
    els.successTotalText.textContent = formatMoney(total);

    Cart.clearCart();
    closeCheckoutModal();

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
    // Selector de idiomas con Banderas (ES / EN / PT)
    document.querySelectorAll('.flag-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        applyLanguage(lang);
      });
    });

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

    if (els.modalExtraCheddarCheckbox) {
      els.modalExtraCheddarCheckbox.addEventListener('change', (e) => {
        activeModalHasExtraCheddar = e.target.checked;
        updateModalAddPrice();
      });
    }

    if (els.modalExtraBaconCheckbox) {
      els.modalExtraBaconCheckbox.addEventListener('change', (e) => {
        activeModalHasExtraBacon = e.target.checked;
        if (activeModalHasExtraBacon && activeModalIsVeggie) {
          activeModalIsVeggie = false;
          els.modalVeggieCheckbox.checked = false;
        }
        updateModalAddPrice();
      });
    }

    els.modalVeggieCheckbox.addEventListener('change', (e) => {
      activeModalIsVeggie = e.target.checked;
      if (activeModalIsVeggie) {
        activeModalHasExtraMeat = false;
        els.modalExtraMeatCheckbox.checked = false;
        els.modalExtraMeatCheckbox.disabled = true;
        els.modalExtraMeatGroup.style.opacity = '0.4';
        els.modalExtraMeatGroup.style.pointerEvents = 'none';

        // Veggie is incompatible with extra bacon
        activeModalHasExtraBacon = false;
        if (els.modalExtraBaconCheckbox) {
          els.modalExtraBaconCheckbox.checked = false;
          els.modalExtraBaconCheckbox.disabled = true;
          if (els.modalExtraBaconGroup) {
            els.modalExtraBaconGroup.style.opacity = '0.4';
            els.modalExtraBaconGroup.style.pointerEvents = 'none';
          }
        }
      } else {
        els.modalExtraMeatCheckbox.disabled = false;
        els.modalExtraMeatGroup.style.opacity = '1';
        els.modalExtraMeatGroup.style.pointerEvents = 'auto';

        if (els.modalExtraBaconCheckbox) {
          els.modalExtraBaconCheckbox.disabled = false;
          if (els.modalExtraBaconGroup) {
            els.modalExtraBaconGroup.style.opacity = '1';
            els.modalExtraBaconGroup.style.pointerEvents = 'auto';
          }
        }
      }
      updateModalAddPrice();
    });

    els.modalDrinkSelect.addEventListener('change', (e) => {
      activeModalDrink = e.target.value;
    });

    els.btnModalAddCart.addEventListener('click', () => {
      if (!CFG.ENABLE_ORDERING) {
        showToast(window.COPE_I18N ? window.COPE_I18N.t('coming_soon_order') : 'Próximamente podrás pedir aquí');
        return;
      }
      if (!activeModalProduct) return;
      Cart.addItem(activeModalProduct, {
        variantId: activeModalVariantId,
        isVeggie: activeModalIsVeggie,
        hasExtraMeat: activeModalHasExtraMeat,
        hasExtraCheddar: activeModalHasExtraCheddar,
        hasExtraBacon: activeModalHasExtraBacon,
        drinkChoice: activeModalDrink,
        notes: els.modalNotesInput.value.trim(),
        quantity: activeModalQty
      });
      showToast(`✓ Agregado: ${activeModalProduct.name} (${activeModalQty})`);
      closeProductModal();
    });

    if (els.btnCopyAlias) {
      els.btnCopyAlias.addEventListener('click', () => {
        const alias = (els.successAliasText && els.successAliasText.textContent) || 'copemadero.mp';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(alias).then(() => {
            els.btnCopyAlias.textContent = '✓ Copiado';
            showToast('✓ Alias copiado al portapapeles');
            setTimeout(() => { if (els.btnCopyAlias) els.btnCopyAlias.textContent = '📋 Copiar'; }, 2000);
          }).catch(() => {});
        } else {
          showToast(`Alias: ${alias}`);
        }
      });
    }

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

    // Acceso rápido público a abrir modal de producto desde banners destacados
    window.copeQuickOpenProduct = function(productId) {
      const prod = PRODUCTS.find((x) => x.id === productId);
      if (prod) openProductModal(prod);
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
