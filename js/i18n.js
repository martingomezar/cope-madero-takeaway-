/**
 * js/i18n.js — Sistema Multilenguaje Oficial Cope Burgers Puerto Madero
 * Idiomas: Español (ES 🇦🇷), English (EN 🇺🇸), Português (PT 🇧🇷)
 */

window.COPE_I18N = (function () {
  const STORAGE_KEY = 'cope_lang';

  const TRANSLATIONS = {
    es: {
      // Header y Metas
      badge_takeaway: 'Take Away & Delivery',
      slogan: 'El Auténtico Estilo Americano',
      status_open: 'Abierto · Retiro en 20 min',
      status_closed: 'Cerrado ahora',
      schedule_label: 'Lunes a Domingos de 12:00 a 23:00 hs',
      
      // Búsqueda y Navegación
      search_placeholder: 'Buscar en el menú...',
      no_results_title: 'No encontramos resultados',
      no_results_desc: 'Probá buscando con otro nombre o seleccioná una categoría arriba.',

      // Categorías
      cat_todas: 'Todo el Menú',
      cat_promos: 'Promociones 🔥',
      cat_simples: 'Burgers Simples',
      cat_dobles: 'Burgers Dobles',
      cat_combos: 'Combos con Bebida',
      cat_veggie: 'Not Burger 🌱',
      cat_acompanamientos: 'Papas Fritas',
      cat_bebidas: 'Bebidas',

      // Tarjetas de Producto
      btn_customize: 'Personalizar',
      btn_add: 'Agregar',
      coming_soon_order: 'Próximamente podrás pedir aquí',
      wa_order_btn: 'WhatsApp',
      wa_order_msg: '¡Hola Cope Burgers Puerto Madero! Quiero hacer un pedido:',
      veggie_badge: 'Opción NotBurger Veggie 🌱',

      // Modal de Producto
      modal_size_title: 'Elegí el tamaño:',
      modal_size_simple: 'Simple (1 Medallón 110g)',
      modal_size_doble: 'Doble (2 Medallones 220g)',
      modal_veggie_title: 'Opción Vegetariana (NotBurger)',
      modal_veggie_desc: 'Reemplazá el medallón por carne vegetal NotBurger y pan 100% vegano.',
      modal_extra_meat_title: '¿Querés agregar carne extra?',
      modal_extra_meat_desc: '+1 Medallón de carne vacuna (+110g)',
      modal_extra_cheddar_text: '🧀 Agregar Extra Queso Cheddar (+ $2.000)',
      modal_extra_bacon_text: '🥓 Agregar Extra Bacon (+ $2.000)',
      modal_drink_title: 'Elegí tu bebida incluida:',
      modal_notes_label: 'Aclaraciones para la cocina (opcional):',
      modal_notes_placeholder: 'Ej: sin cebolla, pan bien tostado, aderezos aparte...',
      modal_btn_add: 'Agregar al pedido',

      // Carrito Drawer
      cart_title: 'Tu Pedido',
      cart_empty_title: 'Tu pedido está vacío',
      cart_empty_desc: 'Elegí tus burgers favoritas del menú para comenzar.',
      cart_subtotal: 'Subtotal:',
      cart_total: 'Total:',
      cart_btn_clear: 'Vaciar Carrito',
      cart_btn_checkout: 'Continuar con el Pedido →',

      // Modal de Checkout
      checkout_title: 'Confirmar Pedido',
      checkout_how_receive: '¿Cómo querés recibir tu pedido? *',
      opt_takeaway: '🛍️ Retiro en Local (Take Away)',
      opt_delivery: '🛵 Pedir Moto / Delivery',
      
      delivery_box_title: 'Envío en Moto / Delivery',
      delivery_box_origin: 'Punto de retiro: Macacha Güemes 260, Puerto Madero',
      delivery_addr_label: 'Dirección de entrega (Calle y Número) *',
      delivery_addr_placeholder: 'Ej: Juana Manso 1200, Alicia Moreau de Justo 800...',
      delivery_apt_label: 'Piso / Depto / Timbre',
      delivery_apt_placeholder: 'Ej: 4° B, Torre 2',
      delivery_zone_label: 'Barrio / Zona CABA',
      delivery_fee_title: 'Tarifa de Envío en Moto:',
      delivery_eta_prefix: '⏱️ Tiempo estimado:',

      field_name_label: 'Nombre y Apellido *',
      field_name_placeholder: 'Tu nombre para preparar el pedido',
      field_phone_label: 'Teléfono de contacto (WhatsApp) *',
      field_phone_placeholder: 'Ej: 11 2345-6789',
      
      pickup_time_label: '¿Cuándo querés retirar tu pedido? *',
      pickup_time_asap: '🔥 Lo antes posible (~20 min)',
      pickup_time_sched: '⏰ Programar horario hoy',
      pickup_time_select: 'Seleccioná la hora exacta de retiro:',

      payment_method_label: 'Forma de pago *',
      checkout_notes_label: 'Notas adicionales para el local (opcional):',
      checkout_notes_placeholder: 'Ej: dejar en recepción con vigilancia, pedir servilletas extra...',
      
      recap_title: 'Resumen de tu pedido:',
      recap_shipping_label: '🛵 Envío en Moto (Delivery):',
      recap_total_label: 'Total a pagar:',
      btn_submit_order: '💬 Confirmar y Enviar Pedido →',
      btn_submit_mp_loading: 'Generando cobro seguro en Mercado Pago...',

      // Pantalla de Éxito
      success_title: '¡Pedido Registrado con Éxito!',
      success_subtitle: 'Ya estamos preparando tus burgers.',
      success_btn_wa: 'Reabrir WhatsApp',
      success_btn_new: 'Hacer Otro Pedido',

      // Zonas de CABA
      zone_puerto_madero: 'Puerto Madero',
      zone_san_telmo: 'San Telmo / Microcentro',
      zone_monserrat: 'Monserrat / San Nicolás',
      zone_retiro: 'Retiro / Recoleta',
      zone_constitucion: 'Constitución / Barracas',
      zone_palermo: 'Palermo / Almagro / Caballito',
      zone_otro: 'Otro barrio en CABA'
    },

    en: {
      // Header & Meta
      badge_takeaway: 'Take Away & Delivery',
      slogan: 'The Authentic American Style',
      status_open: 'Open · Ready in 20 min',
      status_closed: 'Closed now',
      schedule_label: 'Monday to Sunday from 12:00 PM to 11:00 PM',

      // Search & Nav
      search_placeholder: 'Search the menu...',
      no_results_title: 'No results found',
      no_results_desc: 'Try searching with a different keyword or choose a category above.',

      // Categories
      cat_todas: 'All Menu',
      cat_promos: 'Special Deals 🔥',
      cat_simples: 'Single Burgers',
      cat_dobles: 'Double Burgers',
      cat_combos: 'Combos with Drink',
      cat_veggie: 'Not Burger 🌱',
      cat_acompanamientos: 'French Fries',
      cat_bebidas: 'Drinks',

      // Product Cards
      btn_customize: 'Customize',
      btn_add: 'Add',
      coming_soon_order: 'Online ordering coming soon here',
      wa_order_btn: 'WhatsApp',
      wa_order_msg: 'Hello Cope Burgers Puerto Madero! I would like to place an order:',
      veggie_badge: 'NotBurger Veggie Option 🌱',

      // Product Modal
      modal_size_title: 'Choose size:',
      modal_size_simple: 'Single (1 Patty 110g)',
      modal_size_doble: 'Double (2 Patties 220g)',
      modal_veggie_title: 'Vegetarian Option (NotBurger)',
      modal_veggie_desc: 'Swap beef patty for 100% plant-based NotBurger patty and vegan bun.',
      modal_extra_meat_title: 'Want extra beef patty?',
      modal_extra_meat_desc: '+1 Beef patty (+110g)',
      modal_extra_cheddar_text: '🧀 Add Extra Cheddar Cheese (+ $2,000)',
      modal_extra_bacon_text: '🥓 Add Extra Bacon (+ $2,000)',
      modal_drink_title: 'Choose your included beverage:',
      modal_notes_label: 'Kitchen notes (optional):',
      modal_notes_placeholder: 'E.g.: no onions, well-toasted bun, sauce on side...',
      modal_btn_add: 'Add to order',

      // Cart Drawer
      cart_title: 'Your Order',
      cart_empty_title: 'Your cart is empty',
      cart_empty_desc: 'Pick your favorite burgers from the menu to start.',
      cart_subtotal: 'Subtotal:',
      cart_total: 'Total:',
      cart_btn_clear: 'Clear Cart',
      cart_btn_checkout: 'Proceed to Checkout →',

      // Checkout Modal
      checkout_title: 'Confirm Order',
      checkout_how_receive: 'How do you want to receive your order? *',
      opt_takeaway: '🛍️ Store Pickup (Take Away)',
      opt_delivery: '🛵 Delivery (Motorcycle)',

      delivery_box_title: 'Delivery by Motorcycle',
      delivery_box_origin: 'Pickup location: Macacha Güemes 260, Puerto Madero',
      delivery_addr_label: 'Delivery Address (Street & Number) *',
      delivery_addr_placeholder: 'E.g.: Juana Manso 1200, Alicia Moreau de Justo 800...',
      delivery_apt_label: 'Floor / Apartment / Buzzer',
      delivery_apt_placeholder: 'E.g.: 4th floor B, Tower 2',
      delivery_zone_label: 'Neighborhood / Area in CABA',
      delivery_fee_title: 'Delivery Fee:',
      delivery_eta_prefix: '⏱️ Estimated time:',

      field_name_label: 'Full Name *',
      field_name_placeholder: 'Your name for the order',
      field_phone_label: 'Contact Phone (WhatsApp) *',
      field_phone_placeholder: 'E.g.: +54 9 11 2345-6789',

      pickup_time_label: 'When do you want to pick up your order? *',
      pickup_time_asap: '🔥 As soon as possible (~20 min)',
      pickup_time_sched: '⏰ Schedule pickup time today',
      pickup_time_select: 'Select exact pickup hour:',

      payment_method_label: 'Payment Method *',
      checkout_notes_label: 'Additional notes for the store (optional):',
      checkout_notes_placeholder: 'E.g.: leave at front desk / reception, extra napkins...',

      recap_title: 'Order Summary:',
      recap_shipping_label: '🛵 Delivery (Motorcycle):',
      recap_total_label: 'Total to pay:',
      btn_submit_order: '💬 Confirm & Send Order →',
      btn_submit_mp_loading: 'Creating secure Mercado Pago checkout...',

      // Success Modal
      success_title: 'Order Successfully Placed!',
      success_subtitle: 'We are already preparing your burgers.',
      success_btn_wa: 'Reopen WhatsApp',
      success_btn_new: 'Place Another Order',

      // Zones
      zone_puerto_madero: 'Puerto Madero',
      zone_san_telmo: 'San Telmo / Downtown',
      zone_monserrat: 'Monserrat / San Nicolás',
      zone_retiro: 'Retiro / Recoleta',
      zone_constitucion: 'Constitución / Barracas',
      zone_palermo: 'Palermo / Almagro / Caballito',
      zone_otro: 'Other CABA neighborhood'
    },

    pt: {
      // Header & Meta
      badge_takeaway: 'Take Away & Delivery',
      slogan: 'O Autêntico Estilo Americano',
      status_open: 'Aberto · Pronto em 20 min',
      status_closed: 'Fechado agora',
      schedule_label: 'Segunda a Domingo das 12:00 às 23:00 hs',

      // Search & Nav
      search_placeholder: 'Buscar no cardápio...',
      no_results_title: 'Nenhum resultado encontrado',
      no_results_desc: 'Tente buscar por outro termo ou escolha uma categoria acima.',

      // Categories
      cat_todas: 'Todo o Cardápio',
      cat_promos: 'Promoções 🔥',
      cat_simples: 'Hambúrgueres Simples',
      cat_dobles: 'Hambúrgueres Duplos',
      cat_combos: 'Combos com Bebida',
      cat_veggie: 'Not Burger 🌱',
      cat_acompanamientos: 'Batatas Fritas',
      cat_bebidas: 'Bebidas',

      // Product Cards
      btn_customize: 'Personalizar',
      btn_add: 'Adicionar',
      coming_soon_order: 'Em breve você poderá pedir aqui',
      wa_order_btn: 'WhatsApp',
      wa_order_msg: 'Olá Cope Burgers Puerto Madero! Gostaria de fazer um pedido:',
      veggie_badge: 'Opção NotBurger Veggie 🌱',

      // Product Modal
      modal_size_title: 'Escolha o tamanho:',
      modal_size_simple: 'Simples (1 Hambúrguer 110g)',
      modal_size_doble: 'Duplo (2 Hambúrgueres 220g)',
      modal_veggie_title: 'Opção Vegetariana (NotBurger)',
      modal_veggie_desc: 'Substitua a carne por hambúrguer vegetal NotBurger e pão 100% vegano.',
      modal_extra_meat_title: 'Deseja adicionar carne extra?',
      modal_extra_meat_desc: '+1 Medalhão de carne bovina (+110g)',
      modal_extra_cheddar_text: '🧀 Adicionar Extra Queijo Cheddar (+ $2.000)',
      modal_extra_bacon_text: '🥓 Adicionar Extra Bacon (+ $2.000)',
      modal_drink_title: 'Escolha a bebida inclusa:',
      modal_notes_label: 'Observações para a cozinha (opcional):',
      modal_notes_placeholder: 'Ex: sem cebola, pão bem tostado, molho à parte...',
      modal_btn_add: 'Adicionar ao pedido',

      // Cart Drawer
      cart_title: 'Seu Pedido',
      cart_empty_title: 'Seu carrinho está vazio',
      cart_empty_desc: 'Escolha seus hambúrgueres favoritos no cardápio para começar.',
      cart_subtotal: 'Subtotal:',
      cart_total: 'Total:',
      cart_btn_clear: 'Esvaziar Carrinho',
      cart_btn_checkout: 'Continuar com o Pedido →',

      // Checkout Modal
      checkout_title: 'Confirmar Pedido',
      checkout_how_receive: 'Como deseja receber seu pedido? *',
      opt_takeaway: '🛍️ Retirar no Local (Take Away)',
      opt_delivery: '🛵 Pedir Moto / Delivery',

      delivery_box_title: 'Entrega em Domicílio (Moto / Delivery)',
      delivery_box_origin: 'Ponto de retirada: Macacha Güemes 260, Puerto Madero',
      delivery_addr_label: 'Endereço de entrega (Rua e Número) *',
      delivery_addr_placeholder: 'Ex: Juana Manso 1200, Alicia Moreau de Justo 800...',
      delivery_apt_label: 'Andar / Apartamento / Interfone',
      delivery_apt_placeholder: 'Ex: 4° B, Torre 2',
      delivery_zone_label: 'Bairro / Região em CABA',
      delivery_fee_title: 'Tarifa de Entrega (Moto):',
      delivery_eta_prefix: '⏱️ Tempo estimado:',

      field_name_label: 'Nome e Sobrenome *',
      field_name_placeholder: 'Seu nome para preparar o pedido',
      field_phone_label: 'Telefone de contato (WhatsApp) *',
      field_phone_placeholder: 'Ex: +54 9 11 2345-6789',

      pickup_time_label: 'Quando deseja retirar seu pedido? *',
      pickup_time_asap: '🔥 O mais rápido possível (~20 min)',
      pickup_time_sched: '⏰ Agendar horário hoje',
      pickup_time_select: 'Selecione o horário exato de retirada:',

      payment_method_label: 'Forma de Pagamento *',
      checkout_notes_label: 'Observações adicionais para o local (opcional):',
      checkout_notes_placeholder: 'Ex: deixar na portaria com vigilância, guardanapos extras...',

      recap_title: 'Resumo do seu pedido:',
      recap_shipping_label: '🛵 Entrega em Moto (Delivery):',
      recap_total_label: 'Total a pagar:',
      btn_submit_order: '💬 Confirmar e Enviar Pedido →',
      btn_submit_mp_loading: 'Gerando pagamento seguro no Mercado Pago...',

      // Success Modal
      success_title: 'Pedido Realizado com Sucesso!',
      success_subtitle: 'Já estamos preparando seus hambúrgueres.',
      success_btn_wa: 'Reabrir WhatsApp',
      success_btn_new: 'Fazer Outro Pedido',

      // Zones
      zone_puerto_madero: 'Puerto Madero',
      zone_san_telmo: 'San Telmo / Centro',
      zone_monserrat: 'Monserrat / San Nicolás',
      zone_retiro: 'Retiro / Recoleta',
      zone_constitucion: 'Constitución / Barracas',
      zone_palermo: 'Palermo / Almagro / Caballito',
      zone_otro: 'Outro bairro em CABA'
    }
  };

  // Traducción de Productos
  const PRODUCT_TRANSLATIONS = {
    'promo-almuerzo-cheeseburger-papas': {
      en: {
        name: 'Lunch Promo: Cheeseburger + Fries',
        description: 'Single Cheese Burger (110g beef) with melted American cheddar on potato bun + generous portion of golden crispy Cope fries. Dine-in or Take Away only (Mon to Fri 12:00 to 18:00).',
        badge: '⚡ Lunch Deal · Mon-Fri 12-18h · Dine-in / Take Away · $10,900'
      },
      pt: {
        name: 'Promo Almoço: Cheeseburger + Batatas',
        description: 'Cheese Burger Simples (110g) com cheddar americano derretido no pão de batata + porção de batatas fritas crocantes Cope. Exclusivo para consumo no local ou Take Away (Seg a Sex das 12h às 18h).',
        badge: '⚡ Promo Almoço · Seg-Sex 12-18h · Local / Take Away · $10.900'
      }
    },
    'promo-after-office-cervezas-papas': {
      en: {
        name: 'After Office Promo: 2 Beers + Fries',
        description: '2 Chilled Quilmes beers + generous portion of golden crispy Cope fries for sharing. Dine-in or Take Away only (Mon to Fri 18:00 to 20:00).',
        badge: '🍻 After Office · Mon-Fri 18-20h · Dine-in / Take Away · $10,000'
      },
      pt: {
        name: 'Promo After Office: 2 Cervejas + Batatas',
        description: '2 Cervejas Quilmes geladas + porção de batatas fritas crocantes Cope para compartilhar. Exclusivo para consumo no local ou Take Away (Seg a Sex das 18h às 20h).',
        badge: '🍻 After Office · Seg-Sex 18-20h · Local / Take Away · $10.000'
      }
    },
    'simple-cheese-burger': {
      en: {
        name: 'Single Cheese Burger',
        description: 'Beef patty (110g), melted American cheddar, and house mayo on a butter-toasted potato bun.',
        badge: '1 Patty'
      },
      pt: {
        name: 'Cheese Burger Simples',
        description: 'Carne bovina (110g), queijo cheddar americano derretido e maionese da casa em pão de batata tostado na manteiga.',
        badge: '1 Hambúrguer'
      }
    },
    'simple-cheese-bacon': {
      en: {
        name: 'Single Cheese & Bacon',
        description: 'Beef patty (110g), American cheddar, crispy smoked bacon, and crispy onions on a potato bun.',
        badge: '1 Patty · Favorite 🔥'
      },
      pt: {
        name: 'Cheese & Bacon Simples',
        description: 'Carne bovina (110g), cheddar americano, bacon crocante defumado e cebola crispy no pão de batata.',
        badge: '1 Hambúrguer · Favorita 🔥'
      }
    },
    'simple-clasica': {
      en: {
        name: 'Single Classic',
        description: 'Beef patty (110g), cheddar, fresh tomato slices, crisp lettuce, and signature Cope Sauce.',
        badge: '1 Patty · Fresh'
      },
      pt: {
        name: 'Clássica Simples',
        description: 'Carne bovina (110g), cheddar, fatias de tomate fresco, alface crocante e o autêntico Molho Cope.',
        badge: '1 Hambúrguer · Fresca'
      }
    },
    'simple-gran-cope': {
      en: {
        name: 'Single Grand Cope',
        description: 'Beef patty (110g), American cheddar, minced onion, lettuce, sweet pickles, and Thousand Island sauce.',
        badge: '1 Patty · Epic 👑'
      },
      pt: {
        name: 'Gran Cope Simples',
        description: 'Carne bovina (110g), cheddar americano, cebola picada, alface, picles agridoce e molho Thousand Island.',
        badge: '1 Hambúrguer · Épica 👑'
      }
    },
    'doble-cheese-burger': {
      en: {
        name: 'Double Cheese Burger',
        description: 'Double beef patties (220g), double melted American cheddar, and house mayo on a potato bun.',
        badge: '2 Patties (220g)'
      },
      pt: {
        name: 'Cheese Burger Dupla',
        description: 'Dupla carne bovina (220g), duplo cheddar americano derretido e maionese da casa no pão de batata.',
        badge: '2 Hambúrgueres (220g)'
      }
    },
    'doble-cheese-bacon': {
      en: {
        name: 'Double Cheese & Bacon',
        description: 'Double beef patties (220g), double cheddar, plenty of crispy smoked bacon, and crispy onions.',
        badge: 'Best Seller 🥓'
      },
      pt: {
        name: 'Cheese & Bacon Dupla',
        description: 'Dupla carne bovina (220g), duplo cheddar, muito bacon crocante defumado e cebola crispy.',
        badge: 'Mais Vendida 🥓'
      }
    },
    'doble-clasica': {
      en: {
        name: 'Double Classic',
        description: 'Double beef patties (220g), double cheddar, fresh tomato slices, crisp lettuce, and signature Cope Sauce.',
        badge: '2 Patties (220g)'
      },
      pt: {
        name: 'Clássica Dupla',
        description: 'Dupla carne bovina (220g), duplo cheddar, fatias de tomate fresco, alface crocante e Molho Cope.',
        badge: '2 Hambúrgueres (220g)'
      }
    },
    'doble-gran-cope': {
      en: {
        name: 'Double Grand Cope',
        description: 'Double beef patties (220g), double cheddar, minced onion, lettuce, pickles, and Thousand Island sauce.',
        badge: 'Chef Choice ⭐'
      },
      pt: {
        name: 'Gran Cope Dupla',
        description: 'Dupla carne bovina (220g), duplo cheddar, cebola picada, alface, picles e molho Thousand Island.',
        badge: 'Especial do Chef ⭐'
      }
    },
    'combo-cheese-burger': {
      en: {
        name: 'Cheese Burger Combo',
        description: 'Single Cheese Burger (110g) + French Fries + Choice of soft drink (Pepsi, 7up or Water). Extra patty available.',
        badge: 'Burger + Fries + Drink'
      },
      pt: {
        name: 'Combo Cheese Burger',
        description: 'Cheese Burger Simples (110g) + Porção de Batatas Fritas Cope + Bebida à escolha (Pepsi, 7up ou Água).',
        badge: 'Burger + Batata + Bebida'
      }
    },
    'combo-cheese-bacon': {
      en: {
        name: 'Cheese & Bacon Combo',
        description: 'Single Cheese & Bacon (110g) + French Fries + Soft drink of your choice. Extra patty available.',
        badge: 'Combo Favorite 🔥'
      },
      pt: {
        name: 'Combo Cheese & Bacon',
        description: 'Cheese & Bacon Simples (110g) + Batatas Fritas Cope + Bebida à escolha. Carne extra disponível.',
        badge: 'Combo Favorito 🔥'
      }
    },
    'combo-clasica': {
      en: {
        name: 'Classic Burger Combo',
        description: 'Single Classic (110g) + French Fries + Soft drink of your choice. Extra patty available.',
        badge: 'Fresh Combo'
      },
      pt: {
        name: 'Combo Clássica',
        description: 'Clássica Simples (110g) + Batatas Fritas Cope + Bebida à escolha. Carne extra disponível.',
        badge: 'Combo Fresco'
      }
    },
    'combo-gran-cope': {
      en: {
        name: 'Grand Cope Combo',
        description: 'Single Grand Cope (110g) + French Fries + Soft drink of your choice. Extra patty available.',
        badge: 'Special Combo 👑'
      },
      pt: {
        name: 'Combo Gran Cope',
        description: 'Gran Cope Simples (110g) + Batatas Fritas Cope + Bebida à escolha. Carne extra disponível.',
        badge: 'Combo Especial 👑'
      }
    },
    'sampler-cope': {
      en: {
        name: 'Cope Sampler Box (3 Burgers + Fries + Drink)',
        description: '1 Cheese Burger + 1 Cheese & Bacon + 1 Classic + 1 Large French Fries + 1 Soft drink of your choice.',
        badge: 'To Share 👥'
      },
      pt: {
        name: 'Sampler Cope Box (3 Burgers + Batata + Bebida)',
        description: '1 Cheese Burger + 1 Cheese & Bacon + 1 Clássica + 1 Porção de Batatas Fritas + 1 Bebida à escolha.',
        badge: 'Para Compartilhar 👥'
      }
    },
    'papas-fritas': {
      en: {
        name: 'Cope Crispy French Fries',
        description: 'Generous serving of crispy golden fries, cooked American style with sea salt.',
        badge: 'Side'
      },
      pt: {
        name: 'Batatas Fritas Cope',
        description: 'Porção generosa de batatas fritas crocantes, douradas ao estilo americano com sal marinho.',
        badge: 'Acompanhamento'
      }
    },
    'pepsi-lata': {
      en: {
        name: 'Pepsi Can 354ml',
        description: 'Chilled 354ml cola soda.'
      },
      pt: {
        name: 'Pepsi Lata 354ml',
        description: 'Refrigerante cola em lata de 354ml, bem gelado.'
      }
    },
    'pepsi-black-lata': {
      en: {
        name: 'Pepsi Black Zero Sugar 354ml',
        description: 'Zero sugar cola soda, maximum flavor, chilled 354ml can.'
      },
      pt: {
        name: 'Pepsi Black Sem Açúcar 354ml',
        description: 'Refrigerante cola zero açúcar, lata de 354ml bem gelada.'
      }
    },
    '7up-lata': {
      en: {
        name: '7up Can 354ml',
        description: 'Crisp lemon-lime soda in chilled 354ml can.'
      },
      pt: {
        name: '7up Lata 354ml',
        description: 'Refrigerante limão em lata de 354ml, refrescante e bem gelado.'
      }
    },
    'agua-mineral': {
      en: {
        name: 'Natural Mineral Water 500ml',
        description: 'Still mineral water in 500ml bottle.'
      },
      pt: {
        name: 'Água Mineral Natural 500ml',
        description: 'Água mineral sem gás em garrafa de 500ml.'
      }
    },
    'agua-con-gas': {
      en: {
        name: 'Sparkling Mineral Water 500ml',
        description: 'Carbonated sparkling mineral water in 500ml bottle.'
      },
      pt: {
        name: 'Água Mineral com Gás 500ml',
        description: 'Água mineral com gás em garrafa de 500ml.'
      }
    }
  };

  let currentLang = 'es';

  function init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'es' || saved === 'en' || saved === 'pt')) {
        currentLang = saved;
      }
    } catch (e) {}
    return currentLang;
  }

  function getLang() {
    return currentLang;
  }

  function setLang(lang) {
    if (lang !== 'es' && lang !== 'en' && lang !== 'pt') return;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  function t(key) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
    return dict[key] || TRANSLATIONS.es[key] || key;
  }

  function getLocalizedProduct(p) {
    if (!p) return p;
    if (currentLang === 'es') return p;
    const trans = PRODUCT_TRANSLATIONS[p.id] && PRODUCT_TRANSLATIONS[p.id][currentLang];
    if (!trans) return p;
    return {
      ...p,
      name: trans.name || p.name,
      description: trans.description || p.description,
      badge: trans.badge || p.badge
    };
  }

  function getLocalizedCategory(c) {
    if (!c) return c;
    const key = 'cat_' + c.id;
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
    const localizedLabel = dict[key];
    return {
      ...c,
      label: localizedLabel || c.label
    };
  }

  return {
    init,
    getLang,
    setLang,
    t,
    getLocalizedProduct,
    getLocalizedCategory
  };
})();
