/**
 * Configuración de Cope Burgers — Sucursal Puerto Madero
 * Pedidos Take Away por WhatsApp
 */
window.COPE_CONFIG = {
  STORE_NAME: 'Cope Burgers',
  BRANCH_NAME: 'Puerto Madero',
  SLOGAN: 'El Auténtico Estilo Americano',
  ADDRESS: 'Boulevard Macacha Güemes 260',
  CITY: 'Puerto Madero, CABA',
  MAPS_URL: 'https://maps.google.com/?q=Boulevard+Macacha+G%C3%BCemes+260,+Puerto+Madero,+Buenos+Aires',

  // Número de WhatsApp al que llegan los pedidos (formato internacional sin +)
  // Cope Burgers Puerto Madero: +54 9 11 7355-8077
  WHATSAPP_NUMBER: '5491173558077',
  WHATSAPP_DISPLAY: '11 7355-8077',

  // Horarios de atención para Take Away
  SCHEDULE: {
    openHour: 12,
    openMinute: 0,
    closeHour: 23,
    closeMinute: 59,
    display: 'Martes a Domingos: 12:00 a 00:00 hs · Lunes desde las 18:00 hs'
  },

  // Tiempo estimado de preparación base
  PREP_MINUTES: 20,

  // Métodos de pago disponibles
  PAYMENT_METHODS: [
    { id: 'transferencia', label: 'Mercado Pago / Transferencia (Alias)', icon: '📱' },
    { id: 'efectivo', label: 'Efectivo al retirar en el local', icon: '💵' },
    { id: 'tarjeta', label: 'Tarjeta Débito / Crédito al retirar', icon: '💳' }
  ],

  // Alias Mercado Pago del local para mostrar al cliente
  ALIAS_MP: 'cope.madero.mp',

  // Símbolo de moneda
  CURRENCY: '$'
};
