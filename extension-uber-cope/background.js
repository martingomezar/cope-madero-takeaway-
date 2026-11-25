// background.js — Service worker para Cope Delivery Agent

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
});