// content-caja.js — Conector entre Caja Cope, Uber y Fudo POS

console.log('🍔 [Cope POS & Delivery Agent] Extensión de Caja lista y activa.');

// Marcar en la interfaz de caja que la extensión está instalada
window.addEventListener('DOMContentLoaded', injectAgentStatus);
window.addEventListener('load', injectAgentStatus);

function injectAgentStatus() {
  if (document.getElementById('cope-agent-status-badge')) return;
  const badge = document.createElement('div');
  badge.id = 'cope-agent-status-badge';
  badge.innerHTML = `
    <div style="position:fixed; bottom:14px; left:14px; z-index:999999; background:rgba(15,23,42,0.92); backdrop-filter:blur(6px); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:6px 14px; border-radius:30px; font-size:11.5px; font-weight:800; display:flex; align-items:center; gap:8px; box-shadow:0 8px 24px rgba(0,0,0,0.4); font-family:system-ui,-apple-system,sans-serif; letter-spacing:0.3px;">
      <span style="width:8px; height:8px; border-radius:50%; background:#4ade80; box-shadow:0 0 8px #4ade80; display:inline-block;"></span>
      <span>Cope Agent Activo (Fudo 🧾 + Uber 🛵)</span>
    </div>
  `;
  document.body.appendChild(badge);
}

function notifyNeedReload() {
  if (document.getElementById('cope-reload-warning')) return;
  const div = document.createElement('div');
  div.id = 'cope-reload-warning';
  div.innerHTML = `
    <div style="position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:9999999; background:#0284c7; color:#ffffff; padding:10px 20px; border-radius:30px; font-weight:800; font-size:13px; box-shadow:0 8px 30px rgba(0,0,0,0.5); display:flex; align-items:center; gap:10px; font-family:system-ui,sans-serif;">
      <span>🔄</span>
      <span>Extensión actualizada en Chrome. <b>Presioná F5</b> para reconectar.</span>
      <button type="button" onclick="window.location.reload()" style="background:#ffffff; color:#0284c7; border:none; padding:4px 12px; border-radius:20px; font-weight:900; cursor:pointer;">Refrescar F5</button>
    </div>
  `;
  document.body.appendChild(div);
}

function safeSendMessage(payload, callback) {
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      notifyNeedReload();
      return;
    }
    chrome.runtime.sendMessage(payload, (res) => {
      if (chrome.runtime.lastError) {
        console.warn('🍔 [Cope Agent] Mensaje notice:', chrome.runtime.lastError.message);
      }
      if (callback) callback(res);
    });
  } catch (err) {
    if (err && err.message && err.message.includes('Extension context invalidated')) {
      notifyNeedReload();
    } else {
      console.warn('🍔 [Cope Agent] SendMessage error:', err);
    }
  }
}

// Escuchar eventos de despacho y comanda originados en caja.html
window.addEventListener('message', (event) => {
  if (!event.data) return;

  // 1. Despacho a Uber
  if (event.data.type === 'COPE_DISPATCH_TO_UBER_EXT') {
    safeSendMessage({
      type: 'COPE_PREPARE_UBER_DISPATCH',
      payload: event.data.payload
    }, (res) => {
      console.log('🍔 [Cope Agent] Pedido guardado para Uber:', res);
    });
  }

  // 2. Comanda a Fudo POS
  if (event.data.type === 'COPE_DISPATCH_TO_FUDO_EXT') {
    safeSendMessage({
      type: 'COPE_PREPARE_FUDO_ORDER',
      payload: event.data.payload
    }, (res) => {
      console.log('🍔 [Cope Agent] Pedido enviado a Fudo POS:', res);
    });
  }
});
