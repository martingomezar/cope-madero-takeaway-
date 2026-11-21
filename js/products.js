/**
 * Menú Oficial Cope Burgers — Puerto Madero
 * Basado en la carta oficial y recetas de la hamburguesería
 */
window.COPE_PRODUCTS = [
  // =========================================================================
  // SMASH BURGERS
  // =========================================================================
  {
    id: 'cheese-burger',
    name: 'Cheese Burger',
    category: 'burgers',
    description: 'Carne smash vacuna de corte premium, cheddar fundido y mayo de la casa en pan de papa suave y tostado con manteca.',
    badge: 'Clásica',
    image: 'img/cheeseburger.jpeg',
    imageDoble: 'img/cheeseburger-doble.jpeg',
    hasVariants: true,
    variants: [
      { id: 'simple', label: 'Simple (1 Medallón 110g)', price: 9000, isDefault: true },
      { id: 'doble', label: 'Doble (2 Medallones 220g)', price: 13000 }
    ],
    hasVeggieOption: true,
    veggieNote: 'Medallón 100% NotCo'
  },
  {
    id: 'cheese-bacon',
    name: 'Cheese & Bacon',
    category: 'burgers',
    description: 'Carne smash, cheddar americano, abundante bacon crocante ahumado y cebolla crispy en pan de papa tostado.',
    badge: 'Más Pedida 🔥',
    image: 'img/cheesebacon-doble.jpeg',
    imageSimple: 'img/cheesebacon-simple.jpeg',
    imageDoble: 'img/cheesebacon-doble.jpeg',
    hasVariants: true,
    variants: [
      { id: 'simple', label: 'Simple (1 Medallón 110g)', price: 9500 },
      { id: 'doble', label: 'Doble (2 Medallones 220g)', price: 13500, isDefault: true }
    ],
    hasVeggieOption: true,
    veggieNote: 'Medallón 100% NotCo'
  },
  {
    id: 'clasica',
    name: 'Clásica',
    category: 'burgers',
    description: 'Carne smash, cheddar americano, rodajas de tomate fresco, lechuga capuchina crujiente y la auténtica Salsa Cope.',
    badge: 'Fresca',
    image: 'img/clasica-doble.jpeg',
    imageSimple: 'img/clasica-simple.jpeg',
    imageDoble: 'img/clasica-doble.jpeg',
    hasVariants: true,
    variants: [
      { id: 'simple', label: 'Simple (1 Medallón 110g)', price: 9500 },
      { id: 'doble', label: 'Doble (2 Medallones 220g)', price: 13500, isDefault: true }
    ],
    hasVeggieOption: true,
    veggieNote: 'Medallón 100% NotCo'
  },
  {
    id: 'gran-cope',
    name: 'Gran Cope',
    category: 'burgers',
    description: 'Carne smash, doble cheddar americano, cebolla finamente picada, lechuga fresca, pepinillos agridulces y salsa Thousand Island.',
    badge: 'Especial de la Casa ⭐',
    image: 'img/grancope-doble.jpeg',
    imageSimple: 'img/grancope-simple.jpeg',
    imageDoble: 'img/grancope-doble.jpeg',
    hasVariants: true,
    variants: [
      { id: 'simple', label: 'Simple (1 Medallón 110g)', price: 9500 },
      { id: 'doble', label: 'Doble (2 Medallones 220g)', price: 13500, isDefault: true }
    ],
    hasVeggieOption: true,
    veggieNote: 'Medallón 100% NotCo'
  },

  // =========================================================================
  // ACOMPAÑAMIENTOS
  // =========================================================================
  {
    id: 'papas-fritas',
    name: 'Papas Fritas Cope',
    category: 'acompanamientos',
    description: 'Porción generosa de papas fritas bastón crocantes, doradas en su punto justo al estilo americano con un toque de sal marina.',
    badge: 'Crujientes',
    image: 'img/papas-fritas.jpeg',
    price: 4000
  },

  // =========================================================================
  // SAMPLERS & COMBOS PARA COMPARTIR
  // =========================================================================
  {
    id: 'sampler-cope',
    name: 'Sampler Cope (3 Burgers + Papas + Bebida)',
    category: 'samplers',
    description: 'El combo definitivo para 2 o 3 personas: 1 Cheese Burger + 1 Cheese & Bacon + 1 Clásica + 1 Porción de Papas Fritas + 1 Bebida sin alcohol a elección.',
    badge: 'Ahorro / Para Compartir 👥',
    image: 'img/sampler-cope.jpeg',
    price: 32000,
    hasDrinkSelection: true,
    drinks: [
      { id: 'pepsi-lata', label: 'Pepsi Lata 354ml' },
      { id: 'pepsi-black-lata', label: 'Pepsi Black (Sin azúcar) 354ml' },
      { id: '7up-lata', label: '7up Lata 354ml' },
      { id: 'agua-mineral', label: 'Agua Mineral Pureza Vital 500ml' },
      { id: 'agua-con-gas', label: 'Agua Eco de los Andes con Gas 500ml' }
    ]
  },

  // =========================================================================
  // BEBIDAS
  // =========================================================================
  {
    id: 'pepsi-lata',
    name: 'Pepsi Lata 354ml',
    category: 'bebidas',
    description: 'Gaseosa cola en lata de 354ml, servida bien fría.',
    image: 'img/pepsi-lata.jpg',
    price: 3000
  },
  {
    id: 'pepsi-black-lata',
    name: 'Pepsi Black Lata 354ml',
    category: 'bebidas',
    description: 'Gaseosa cola sin azúcar, máximo sabor, lata de 354ml bien fría.',
    badge: 'Sin Azúcar',
    image: 'img/pepsi-black.png',
    price: 3000
  },
  {
    id: '7up-lata',
    name: '7up Lata 354ml',
    category: 'bebidas',
    description: 'Gaseosa lima-limón en lata de 354ml, refrescante y bien fría.',
    image: 'img/7up.webp',
    price: 3000
  },
  {
    id: 'agua-mineral',
    name: 'Agua Mineral Pureza Vital 500ml',
    category: 'bebidas',
    description: 'Agua mineral natural sin gas en botella de 500ml.',
    image: 'img/agua-mineral.jpg',
    price: 3000
  },
  {
    id: 'agua-con-gas',
    name: 'Agua Eco de los Andes con Gas 500ml',
    category: 'bebidas',
    description: 'Agua de alta montaña con gas en botella de 500ml.',
    image: 'img/agua-con-gas.webp',
    price: 3000
  }
];

window.COPE_CATEGORIES = [
  { id: 'todas', label: 'Todo el Menú', icon: '✨' },
  { id: 'burgers', label: 'Smash Burgers', icon: '🍔' },
  { id: 'samplers', label: 'Samplers & Combos', icon: '🎁' },
  { id: 'acompanamientos', label: 'Papas & Acompañamientos', icon: '🍟' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤' }
];
