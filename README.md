# Cope Burgers Puerto Madero — Web App de Pedidos Take Away 🍔

Aplicación web móvil y de escritorio optimizada para que los clientes de **Cope Burgers Puerto Madero** puedan ver la carta completa con fotos reales, armar su pedido para llevar (Take Away), elegir su horario estimado de retiro en el local y enviar el pedido formateado directamente al WhatsApp de la hamburguesería.

---

## 🌟 Características Principales

1. **Carta Oficial de Cope Puerto Madero:**
   - **Smash Burgers:** Cheese Burger, Cheese & Bacon, Clásica, Gran Cope.
   - **Variantes:** Elección de Simple (1 medallón 110g) o Doble (2 medallones 220g) con cambio dinámico de foto y precio.
   - **Opción Veggie:** Botón para convertir cualquier hamburguesa en 100% vegetariana con medallón NotCo.
   - **Papas Fritas:** Porción crujiente clásica estilo americano.
   - **Sampler Cope (Para compartir):** Combo con 3 burgers + papas + elección de bebida sin alcohol.
   - **Bebidas:** Gaseosas (Pepsi, Pepsi Black, 7up), Aguas (Pureza Vital sin gas, Eco de los Andes con gas) y Cerveza Quilmes Tirada 330cc.
   - **Fotos reales:** Cada producto cuenta con su foto oficial optimizada.

2. **Horario de Retiro (Take Away):**
   - Opción **"Lo antes posible (~20 min)"** con cálculo dinámico de hora aproximada.
   - Opción **"Programar horario hoy"** con desplegable inteligente cada 15 minutos (ej: 13:00, 13:15, 13:30 hs) adaptado al horario de atención del local.

3. **Formas de Pago y Aclaraciones:**
   - Mercado Pago / Transferencia bancaria (con Alias `cope.madero.mp` visible).
   - Efectivo al retirar en el local.
   - Tarjeta de Débito / Crédito al retirar.
   - Campo para notas y aclaraciones de cocina (ej: "sin cebolla", "salsa aparte", "pago con billete de $20.000").

4. **Integración Directa con WhatsApp:**
   - Genera un mensaje formateado con negritas, viñetas, emojis y subtotales claros.
   - Abre `wa.me/5491173558077` automáticamente tanto en teléfonos (app de WhatsApp) como en computadoras (WhatsApp Web).
   - Pantalla de confirmación con botón de respaldo para volver a abrir WhatsApp si se cerró por error.

5. **Experiencia de Usuario (UX/UI):**
   - Diseño moderno con la paleta de marca **Cope Blue** (`#0b3c6d`) y estilo americano de smash burger.
   - Barra flotante de carrito sticky abajo con contador de ítems y total en pesos argentinos.
   - Recordatorio automático de los datos del cliente (`localStorage`) para que no tenga que reescribir su nombre y teléfono en próximos pedidos.
   - Listo para instalar como PWA en celulares (Agregar a Pantalla de Inicio).

---

## 📁 Estructura del Proyecto

```text
2026/cope madero/pedidos take away/
├── index.html          # Interfaz principal (menú, modales, carrito y checkout)
├── manifest.json       # Configuración PWA (Acceso directo en smartphone)
├── vercel.json         # Configuración de despliegue en Vercel
├── README.md           # Este documento
├── css/
│   └── styles.css      # Estilos modernos, responsivos y animaciones
├── js/
│   ├── config.js       # Configuración del local (WhatsApp, horarios, alias)
│   ├── products.js     # Menú completo con precios, variantes y descripciones
│   ├── cart.js         # Lógica reactiva del carrito y persistencia local
│   └── app.js          # Orquestador de vistas, horarios y enlace de WhatsApp
└── img/                # Fotos oficiales de productos y logo Cope
    ├── logo.jpg
    ├── cheeseburger.jpeg
    ├── cheeseburger-doble.jpeg
    ├── cheesebacon-simple.jpeg
    ├── cheesebacon-doble.jpeg
    ├── clasica-simple.jpeg
    ├── clasica-doble.jpeg
    ├── grancope-simple.jpeg
    ├── grancope-doble.jpeg
    ├── notburger-clasica.jpeg
    ├── papas-fritas.jpeg
    ├── sampler-cope.jpeg
    ├── pepsi-lata.jpg
    ├── pepsi-black.png
    ├── 7up.webp
    ├── agua-mineral.jpg
    ├── agua-con-gas.webp
    ├── quilmes-tirada.png
    └── bolsa-takeaway.jpeg
```

---

## ⚙️ Cómo Modificar Configuraciones y Precios

### 1. Cambiar el número de WhatsApp o Datos del Local:
Abrí [`js/config.js`](file:///g:/Mi%20unidad/2026/Cope%20Madero/pedidos%20take%20away/js/config.js):
```javascript
window.COPE_CONFIG = {
  // Número de WhatsApp sin el signo + (Ej: +54 9 11 7355-8077 -> 5491173558077)
  WHATSAPP_NUMBER: '5491173558077',
  WHATSAPP_DISPLAY: '11 7355-8077',
  
  // Alias de Mercado Pago para transferencias
  ALIAS_MP: 'cope.madero.mp',
  ...
};
```

### 2. Modificar Precios o Agregar Nuevos Productos:
Abrí [`js/products.js`](file:///g:/Mi%20unidad/2026/Cope%20Madero/pedidos%20take%20away/js/products.js):
- Cada hamburguesa tiene su sección `variants` con los precios de `simple` y `doble`.
- Para cambiar el precio de una hamburguesa simple o doble, solo modificá el número en `price: 9500`.

---

## 🚀 Despliegue en la Web (Hosting Gratuito)

Este proyecto está compuesto de HTML, CSS y JavaScript puros (sin dependencias ni frameworks pesados). Podés alojarlo en cualquier plataforma en menos de 2 minutos:

### Opción A: Vercel (Recomendada)
1. Creá un repositorio en tu GitHub (ej: `cope-madero-takeaway`).
2. Subí esta carpeta con `git init`, `git add .`, `git commit` y `git push`.
3. En [Vercel](https://vercel.com), dale a **Add New Project** e importá el repositorio.
4. Listo: te dará una URL inmediata como `https://copemadero.vercel.app` para compartir en Instagram y Google Maps.

### Opción B: Probar localmente
Simplemente hacé doble clic en [`index.html`](file:///g:/Mi%20unidad/2026/Cope%20Madero/pedidos%20take%20away/index.html) para abrirlo en cualquier navegador (Chrome, Edge, Safari).
