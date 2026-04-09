# TCG Store - Tienda Online de Cartas Coleccionables

E-commerce de Trading Card Games (TCG) para comprar cartas coleccionables, productos sellados y accesorios de múltiples juegos.

## Estado del Proyecto

✅ **Producción**: Desplegado en Vercel y Render
- Frontend: https://tcg-frontend-one.vercel.app
- Backend: https://tcg-backend-0fmt.onrender.com

## Juegos TCG Soportados

| Juego | Color | ID |
|-------|-------|-----|
| Pokemon TCG | #ef4444 | `pokemon` |
| Yu-Gi-Oh! | #f59e0b | `yugioh` |
| Magic: The Gathering | #3b82f6 | `magic` |
| Digimon | #8b5cf6 | `digimon` |
| One Piece | #dc2626 | `onepiece` |
| Dragon Ball | #f97316 | `dragonball` |
| Lorcana | #ec4899 | `lorcana` |

## Stack Tecnológico

### Frontend
- **React** 19.2.0
- **React Router DOM** 7.13.1
- **Vite** 7.3.1
- **Lucide React** - Iconos
- **Leaflet** + **React Leaflet** - Mapas
- **Stripe** - Pagos con tarjeta
- **SweetAlert2** - Alertas

### Backend
- **Node.js** + **Express**
- **Prisma** + **PostgreSQL** (Supabase)
- **JWT** - Autenticación
- **Stripe** - Pagos

### Despliegue
- **Frontend**: Vercel
- **Backend**: Render

## Estructura del Proyecto

```
tcg-frontend/                 # Frontend React
├── src/
│   ├── components/            # Componentes reutilizables
│   ├── context/               # Estado global (User, Cart, Wishlist, etc.)
│   ├── pages/                 # Páginas/rutas
│   ├── services/              # Servicios API, Stripe, Google Auth
│   ├── App.jsx               # Componente principal
│   └── index.css             # Estilos globales
├── .env.production           # Variables de producción
└── vite.config.js

tcg-backend/                  # Backend Express
├── src/
│   ├── routes/               # Rutas API
│   │   ├── auth.routes.js    # Login, registro, Google OAuth
│   │   ├── user.routes.js    # Gestión usuarios
│   │   ├── product.routes.js # Productos
│   │   ├── card.routes.js    # Cartas sueltas
│   │   ├── order.routes.js   # Pedidos
│   │   ├── stripe.routes.js  # Pagos Stripe
│   │   └── ...
│   ├── index.js              # Servidor principal
│   └── prisma/               # Schema de base de datos
├── .env                      # Variables de producción
└── package.json
```

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Home con carousel, categorías, ofertas |
| `/catalogo/:game` | Catálogo de cartas por juego |
| `/productos` | Productos sellados |
| `/producto/:id` | Detalle de producto |
| `/carrito` | Carrito de compras |
| `/checkout` | Checkout con Stripe/PayPal |
| `/login` | Iniciar sesión (email + Google) |
| `/registro` | Registro de usuario |
| `/mi-cuenta` | Mi cuenta y pedidos |
| `/mis-pedidos/:orderId` | Seguimiento de pedido |
| `/mis-deseos` | Lista de favoritos |
| `/admin` | Panel de administración |
| `/contacto` | Página de contacto |

## Instalación Local

```bash
# Frontend
cd tcg-frontend
npm install
npm run dev

# Backend
cd tcg-backend
npm install
npm run dev
```

## Variables de Entorno

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
VITE_PAYPAL_CLIENT_ID=tu-paypal-client-id
```

### Backend
```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_CLIENT_ID=tu-google-client-id
```

## Autenticación

- **Email/Password**: Registro y login tradicional
- **Google OAuth**: Login con cuenta Google
- **JWT**: Tokens en localStorage

## Panel de Administración

Acceso: `/admin`

El panel incluye:
- Dashboard con estadísticas
- CRUD de productos y cartas
- Gestión de pedidos
- Mensajes de contacto
- Configuración del sitio (SEO, redes sociales)

## Características

- Carrito de compras persistente
- Wishlist por usuario
- Pasarela de pago Stripe
- Login con Google
- Filtros por juego, búsqueda
- Seguimiento de pedidos
- Admin para gestión de inventario

## Licencia

Privado - Todos los derechos reservados