/**
 * Módulo de Carrito — Cope Burgers Puerto Madero
 * Persistencia en localStorage y eventos reactivos
 */
window.CopeCart = (function () {
  const STORAGE_KEY = 'cope_madero_cart_v1';
  let items = [];
  const listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) items = [];
    } catch (e) {
      items = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
    notify();
  }

  function notify() {
    listeners.forEach((fn) => {
      try {
        fn(items);
      } catch (e) {}
    });
  }

  function subscribe(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
      fn(items);
    }
  }

  function buildCartKey(productId, variantId, isVeggie, hasExtraMeat, drinkChoice, notes) {
    const pId = productId || '';
    const vId = variantId || 'base';
    const veg = isVeggie ? 'veggie' : 'carne';
    const ext = hasExtraMeat ? 'extrameat' : 'standard';
    const drk = drinkChoice || 'nodrink';
    const nts = (notes || '').trim().toLowerCase();
    return [pId, vId, veg, ext, drk, nts].join('::');
  }

  function addItem(product, opts) {
    const variantId = opts.variantId || null;
    const isVeggie = Boolean(opts.isVeggie);
    const hasExtraMeat = Boolean(opts.hasExtraMeat);
    const drinkChoice = opts.drinkChoice || null;
    const notes = (opts.notes || '').trim();
    const qty = Math.max(1, parseInt(opts.quantity || 1, 10));

    // Calcular precio unitario
    let unitPrice = 0;
    let variantLabel = '';

    if (product.hasVariants && Array.isArray(product.variants)) {
      const v = product.variants.find((x) => x.id === variantId) || product.variants[0];
      unitPrice = v.price;
      variantLabel = v.label;
    } else {
      unitPrice = product.price || 0;
    }

    if (hasExtraMeat && product.canAddExtraMeat) {
      unitPrice += (product.extraMeatPrice || 4000);
    }

    const key = buildCartKey(product.id, variantId, isVeggie, hasExtraMeat, drinkChoice, notes);
    const existing = items.find((i) => i.key === key);

    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({
        key,
        productId: product.id,
        name: product.name,
        category: product.category,
        image: (variantId === 'simple' && product.imageSimple) ? product.imageSimple : (product.imageDoble || product.image),
        unitPrice,
        variantId,
        variantLabel,
        isVeggie,
        hasExtraMeat,
        drinkChoice,
        notes,
        quantity: qty
      });
    }

    save();
    return true;
  }

  function updateQuantity(key, newQty) {
    const idx = items.findIndex((i) => i.key === key);
    if (idx === -1) return;

    if (newQty <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx].quantity = newQty;
    }
    save();
  }

  function removeItem(key) {
    items = items.filter((i) => i.key !== key);
    save();
  }

  function clearCart() {
    items = [];
    save();
  }

  function getItems() {
    return items.slice();
  }

  function getCount() {
    return items.reduce((acc, i) => acc + i.quantity, 0);
  }

  function getTotal() {
    return items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  }

  // Inicializar al cargar el archivo
  load();

  return {
    subscribe,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItems,
    getCount,
    getTotal
  };
})();
