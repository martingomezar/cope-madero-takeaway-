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

// Escuchar eventos de despacho y comanda originados en caja.html
window.addEventListener('message', (event) => {
  if (!event.data) return;

  // 1. Despacho a Uber
  if (event.data.type === 'COPE_DISPATCH_TO_UBER_EXT') {
    const payload = event.data.payload;
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'COPE_PREPARE_UBER_DISPATCH',
        payload: payload
      }, (res) => {
        console.log('🍔 [Cope Agent] Pedido guardado para Uber:', res);
      });
    }
  }

  // 2. Comanda a Fudo POS
  if (event.data.type === 'COPE_DISPATCH_TO_FUDO_EXT') {
    const payload = event.data.payload;
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'COPE_PREPARE_FUDO_ORDER',
        payload: payload
      }, (res) => {
        console.log('🍔 [Cope Agent] Pedido enviado a Fudo POS:', res);
      });
    }
  }
});
