// background.js — Service worker para Cope Agent (Caja, Uber & Fudo)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // --- GESTIÓN DE UBER ---
  if (message.type === 'COPE_PREPARE_UBER_DISPATCH') {
    const dataWithTimestamp = {
      ...message.payload,
      timestamp: Date.now()
    };
    chrome.storage.local.set({ activeCopeDispatch: dataWithTimestamp }, () => {
      sendResponse({ status: 'STORED', data: dataWithTimestamp });
    });
    return true;
  }

  if (message.type === 'COPE_GET_ACTIVE_DISPATCH') {
    chrome.storage.local.get(['activeCopeDispatch'], (res) => {
      sendResponse({ data: res.activeCopeDispatch || null });
    });
    return true;
  }

  if (message.type === 'COPE_CLEAR_UBER_DISPATCH') {
    chrome.storage.local.remove('activeCopeDispatch', () => {
      sendResponse({ status: 'CLEARED' });
    });
    return true;
  }

  // --- GESTIÓN DE FUDO POS ---
  if (message.type === 'COPE_PREPARE_FUDO_ORDER') {
    const dataWithTimestamp = {
      ...message.payload,
      timestamp: Date.now()
    };
    chrome.storage.local.set({ activeCopeFudoOrder: dataWithTimestamp }, () => {
      // Buscar si ya hay una pestaña de Fudo abierta para activarla
      chrome.tabs.query({ url: ['https://*.fu.do/*', 'https://app.fu.do/*'] }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { active: true });
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'COPE_NEW_FUDO_ORDER_ALERT',
            data: dataWithTimestamp
          });
        }
      });
      sendResponse({ status: 'STORED', data: dataWithTimestamp });
    });
    return true;
  }

  if (message.type === 'COPE_GET_FUDO_ORDER') {
    chrome.storage.local.get(['activeCopeFudoOrder'], (res) => {
      sendResponse({ data: res.activeCopeFudoOrder || null });
    });
    return true;
  }

  if (message.type === 'COPE_CLEAR_FUDO_ORDER') {
    chrome.storage.local.remove('activeCopeFudoOrder', () => {
      sendResponse({ status: 'CLEARED' });
    });
    return true;
  }
});
