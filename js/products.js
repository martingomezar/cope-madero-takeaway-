/**
 * Menú Oficial Cope Burgers — Puerto Madero
 * Organizado por: Simples, Dobles (con Extra Carne), Combos con Bebida, Papas y Bebidas
 */

const DRINKS_OPTIONS = [
  { id: 'pepsi-lata', label: 'Pepsi Lata 354ml' },
  { id: 'pepsi-black-lata', label: 'Pepsi Black (Sin azúcar) 354ml' },
  { id: '7up-lata', label: '7up Lata 354ml' },
  { id: 'agua-mineral', label: 'Agua Mineral Pureza Vital 500ml' },
  { id: 'agua-con-gas', label: 'Agua Eco de los Andes con Gas 500ml' }
];

window.COPE_CATEGORIES = [
  { id: 'todas', label: 'Todo el Menú', icon: '✨' },
  { id: 'simples', label: 'Burgers Simples', icon: '🍔' },
  { id: 'dobles', label: 'Burgers Dobles', icon: '🍔🍔' },
  { id: 'combos', label: 'Combos con Bebida', icon: '🍟🥤' },
  { id: 'veggie', label: 'Not Burger 🌱', icon: '🌱' },
  { id: 'acompanamientos', label: 'Papas Fritas', icon: '🍟' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤' }
];

window.COPE_PRODUCTS = [
  // =========================================================================
  // 1. HAMBURGUESAS SIMPLES (1 Medallón 110g)
  // =========================================================================
  {
    id: 'simple-cheese-burger',
    name: 'Cheese Burger Simple',
    category: 'simples',
    description: 'Carne vacuna seleccionada (110g), cheddar americano fundido y mayo de la casa en pan de papa tostado con manteca.',
    badge: '1 Medallón',
    image: 'img/cheeseburger.jpeg',
    price: 9000,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },
  {
    id: 'simple-cheese-bacon',
    name: 'Cheese & Bacon Simple',
    category: 'simples',
    description: 'Carne vacuna seleccionada (110g), cheddar americano, bacon crocante ahumado y cebolla crispy en pan de papa.',
    badge: '1 Medallón · Favorita 🔥',
    image: 'img/cheesebacon-simple.jpeg',
    price: 9500,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },
  {
    id: 'simple-clasica',
    name: 'Clásica Simple',
    category: 'simples',
    description: 'Carne vacuna seleccionada (110g), cheddar, rodajas de tomate fresco, lechuga capuchina y la auténtica Salsa Cope.',
    badge: '1 Medallón · Fresca',
    image: 'img/clasica-simple.jpeg',
    price: 9500,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },
  {
    id: 'simple-gran-cope',
    name: 'Gran Cope Simple',
    category: 'simples',
    description: 'Carne vacuna seleccionada (110g), cheddar americano, cebolla picada, lechuga, pepinillos agridulces y salsa Thousand Island.',
    badge: '1 Medallón · Especial ⭐',
    image: 'img/grancope-simple.jpeg',
    price: 9500,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },

  // =========================================================================
  // 2. HAMBURGUESAS DOBLES (2 Medallones 220g) — Permiten Extra Carne
  // =========================================================================
  {
    id: 'doble-cheese-burger',
    name: 'Cheese Burger Doble',
    category: 'dobles',
    description: 'Doble carne vacuna seleccionada (220g), doble cheddar americano fundido y mayo de la casa en pan de papa.',
    badge: '2 Medallones',
    image: 'img/cheeseburger-doble.jpeg',
    price: 13000,
    canAddExtraMeat: true,
    extraMeatPrice: 4000,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },
  {
    id: 'doble-cheese-bacon',
    name: 'Cheese & Bacon Doble',
    category: 'dobles',
    description: 'Doble carne vacuna seleccionada (220g), doble cheddar americano, abundante bacon crocante ahumado y cebolla crispy.',
    badge: '2 Medallones · Más Pedida 🔥',
    image: 'img/cheesebacon-doble.jpeg',
    price: 13500,
    canAddExtraMeat: true,
    extraMeatPrice: 4000,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },
  {
    id: 'doble-clasica',
    name: 'Clásica Doble',
    category: 'dobles',
    description: 'Doble carne vacuna seleccionada (220g), doble cheddar, rodajas de tomate fresco, lechuga crujiente y Salsa Cope.',
    badge: '2 Medallones · Fresca',
    image: 'img/clasica-doble.jpeg',
    price: 13500,
    canAddExtraMeat: true,
    extraMeatPrice: 4000,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },
  {
    id: 'doble-gran-cope',
    name: 'Gran Cope Doble',
    category: 'dobles',
    description: 'Doble carne vacuna seleccionada (220g), doble cheddar, cebolla picada, lechuga, pepinillos encurtidos y Thousand Island.',
    badge: '2 Medallones · Especial de la Casa ⭐',
    image: 'img/grancope-doble.jpeg',
    price: 13500,
    canAddExtraMeat: true,
    extraMeatPrice: 4000,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },

  // =========================================================================
  // 3. COMBOS (Burger Simple + Papas Fritas + Bebida a elección)
  // =========================================================================
  {
    id: 'combo-cheese-burger',
    name: 'Combo Cheese Burger',
    category: 'combos',
    description: 'Cheese Burger Simple (110g) + Porción de Papas Fritas Cope + Bebida sin alcohol a elección (Pepsi, 7up o Agua). Podés sumar Extra Carne.',
    badge: 'Combo Simple 🍟🥤',
    image: 'img/cheeseburger.jpeg',
    price: 15000,
    canAddExtraMeat: true,
    extraMeatPrice: 4000,
    hasDrinkSelection: true,
    drinks: DRINKS_OPTIONS,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },
  {
    id: 'combo-cheese-bacon',
    name: 'Combo Cheese & Bacon',
    category: 'combos',
    description: 'Cheese & Bacon Simple (110g) + Porción de Papas Fritas Cope + Bebida sin alcohol a elección. Podés sumar Extra Carne.',
    badge: 'Combo Favorito 🔥🍟',
    image: 'img/cheesebacon-simple.jpeg',
    price: 15500,
    canAddExtraMeat: true,
    extraMeatPrice: 4000,
    hasDrinkSelection: true,
    drinks: DRINKS_OPTIONS,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },
  {
    id: 'combo-clasica',
    name: 'Combo Clásica',
    category: 'combos',
    description: 'Clásica Simple (110g) + Porción de Papas Fritas Cope + Bebida sin alcohol a elección. Podés sumar Extra Carne.',
    badge: 'Combo Fresco 🍟🥤',
    image: 'img/clasica-simple.jpeg',
    price: 15500,
    canAddExtraMeat: true,
    extraMeatPrice: 4000,
    hasDrinkSelection: true,
    drinks: DRINKS_OPTIONS,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },
  {
    id: 'combo-gran-cope',
    name: 'Combo Gran Cope',
    category: 'combos',
    description: 'Gran Cope Simple (110g) + Porción de Papas Fritas Cope + Bebida a elección. Podés sumar Extra Carne.',
    badge: 'Combo Especial ⭐🍟',
    image: 'img/grancope-simple.jpeg',
    price: 15500,
    canAddExtraMeat: true,
    extraMeatPrice: 4000,
    hasDrinkSelection: true,
    drinks: DRINKS_OPTIONS,
    hasVeggieOption: true,
    veggieNote: 'Opción con Not Burger y pan 100% vegano'
  },
  {
    id: 'sampler-cope',
    name: 'Sampler Cope (3 Burgers + Papas + Bebida)',
    category: 'combos',
    description: '1 Cheese Burger + 1 Cheese & Bacon + 1 Clásica + 1 Porción de Papas Fritas + 1 Bebida sin alcohol a elección.',
    badge: 'Para Compartir (3 Burgers) 👥',
    image: 'img/sampler-cope.jpeg',
    price: 32000,
    hasDrinkSelection: true,
    drinks: DRINKS_OPTIONS
  },

  // =========================================================================
  // 4. ACOMPAÑAMIENTOS
  // =========================================================================
  {
    id: 'papas-fritas',
    name: 'Papas Fritas Cope',
    category: 'acompanamientos',
    description: 'Porción generosa de papas fritas bastón crujientes, doradas en su punto justo al estilo americano con sal marina.',
    badge: 'Crujientes 🍟',
    image: 'img/papas-fritas.jpeg',
    price: 4000
  },

  // =========================================================================
  // 5. BEBIDAS SIN ALCOHOL
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
