/**
 * Configuración de Cope Burgers — Sucursal Puerto Madero
 * Pedidos Take Away por WhatsApp
 */
window.COPE_CONFIG = {
  STORE_NAME: 'Cope Burgers',
  BRANCH_NAME: 'Puerto Madero',
  LOCATION_LABEL: 'Puerto Madero · Dique 4',
  SLOGAN: 'El Auténtico Estilo Americano',
  ADDRESS: 'Macacha Güemes 260',
  CITY: 'Puerto Madero, CABA',
  // Control de pedidos online (true = habilitado, false = solo carta digital / próximamente)
  ENABLE_ORDERING: false,

  // Redes Sociales y Ubicación
  INSTAGRAM_URL: 'https://www.instagram.com/cope_burgers/',
  INSTAGRAM_HANDLE: '@cope_burgers',
  MAPS_URL: 'https://www.google.com/maps/place/Cope+Burgers+Puerto+Madero+Cerveza+y+Hamburguesas/@-34.6049331,-58.3656348,200m/data=!3m1!1e3!4m14!1m7!3m6!1s0x95a3352e601809d3:0x8fcad99007320922!2sMacacha+G%C3%BCemes+260,+C1107+Cdad.+Aut%C3%B3noma+de+Buenos+Aires!3b1!8m2!3d-34.6049993!4d-58.364602!3m5!1s0x95a335b3d6abf36d:0xd054bc12d50e6384!8m2!3d-34.6049118!4d-58.3647468!16s%2Fg%2F11p2tcj8ky?entry=ttu',

  // Número de WhatsApp al que llegan los pedidos (formato internacional sin +)
  // Cope Burgers Puerto Madero: +54 9 11 7355-8077
  WHATSAPP_NUMBER: '5491173558077',
  WHATSAPP_DISPLAY: '11 7355-8077',

  // Horarios de atención para Take Away
  SCHEDULE: {
    openHour: 11,
    openMinute: 0,
    closeHour: 23,
    closeMinute: 30,
    display: 'Lunes a Domingos de 11:00 a 23:30 hs'
  },

  // Tiempo estimado de preparación base
  PREP_MINUTES: 15,

  // Métodos de pago disponibles
  PAYMENT_METHODS: [
    {
      id: 'mp_online',
      label: 'Mercado Pago Online (Tarjetas / Dinero en cuenta · OK Automático)',
      icon: '⚡',
      badge: 'Recomendado'
    },
    {
      id: 'transferencia',
      label: 'Transferencia por Alias MP (Envío de comprobante)',
      icon: '📱'
    },
    {
      id: 'tarjeta',
      label: 'Tarjeta Débito / Crédito al retirar',
      icon: '💳'
    }
  ],

  // Alias Mercado Pago del local para mostrar al cliente
  ALIAS_MP: 'copemadero.mp',

  // Símbolo de moneda
  CURRENCY: '$'
};
