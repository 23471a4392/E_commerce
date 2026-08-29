# Enterprise E-Commerce Platform ("Oppenheimer Store")

A fullstack enterprise-grade E-Commerce Web Platform featuring modern React frontend architecture, Express REST API backend, data persistence DAL, full catalog faceted search, slide-over drawer cart, multi-step checkout with mock payment gateways, user profile portal, admin dashboard with analytics & stock management, seed generator, and test coverage.

---

## 🌟 Key Platform Features

### 🛒 Storefront & Customer Features
- **Hero & Curated Collections**: Flash sale timers, dynamic promotion cards, category grids.
- **Product Catalog**: Multi-facet filter (category, price range, brand checkboxes, customer rating, stock availability), full-text search, grid & list view toggling, sorting (price, featured, newest, rating).
- **Product Details Page (PDP)**: Image gallery with thumbnail switcher and zoom lightbox, variant options (size, color), stock alert badges, real-time quantity stepper, review rating bars, verified customer reviews submission.
- **Shopping Cart & Checkout**: Slide-over drawer cart, free shipping progress bar, promo code validation engine (`WELCOME10`, `FLASH20`, `SUMMER50`), multi-step checkout (address, delivery options, payment provider simulation), order placement & receipt generator.
- **Account & Wishlist**: Order history with status tags, saved shipping address book, wishlist manager.

### 🛡️ Admin Portal & Business Operations
- **Executive Analytics**: KPI metric cards (Total Revenue, Total Orders, Average Order Value, Customer Count) with trend percentages.
- **Sales Charts & Metrics**: Monthly revenue performance visualization, revenue breakdown by product category, top selling SKUs.
- **Product Inventory Manager**: CRUD operations for catalog products, batch stock updates, add new product drawer form.
- **Order & Fulfillment Workflow**: Filter orders by status (Pending, Processing, Shipped, Delivered, Cancelled), update shipping tracking numbers and carrier details.
- **Customer Directory**: Registered user profiles, RBAC security roles.

---

## 🛠️ Tech Stack & Monorepo Architecture

```
nifty-oppenheimer/
├── client/                     # Single Page Application (React + TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Modular Layout, Product, Cart, and Admin UI components
│   │   ├── context/            # Global AuthContext, CartContext, WishlistContext
│   │   ├── pages/              # Storefront pages & Admin Dashboard views
│   │   ├── services/           # API Client service layer
│   │   └── main.tsx            # Vite entry point
├── server/                     # Backend API Service (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Config variables & defaults
│   │   ├── controllers/        # REST Controllers (Auth, Product, Cart, Order, Admin, Review)
│   │   ├── db/                 # Data Access Layer (DAL) & Enterprise Seed Script
│   │   ├── middleware/         # JWT Auth & Error Handler middlewares
│   │   ├── routes/             # Express API routes (/api/v1)
│   │   └── server.ts           # Server bootstrap
├── shared/                     # Shared TypeScript Domain Contracts & Interfaces
│   └── types/                  # Domain Types (Product, Cart, Order, User, Analytics)
└── tests/                      # Automated Unit & Integration Tests (Vitest)
```

---

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Running Tests
```bash
npm test
```

### Running Seed Script
```bash
npm run seed
```

### Development Server
```bash
# Start Client Development Server (http://localhost:3000)
npm run dev

# Start Backend API Watcher (http://localhost:5000)
npm run dev:server
```

---

## 📡 API Endpoint Overview (`/api/v1`)

| Method | Endpoint | Description | Auth Guard |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new customer profile | Public |
| `POST` | `/auth/login` | Sign in & receive JWT token | Public |
| `GET` | `/auth/me` | Fetch authenticated profile | Bearer JWT |
| `GET` | `/products` | Query paginated catalog with filters | Public |
| `GET` | `/products/:slug` | Get product details by slug | Public |
| `POST` | `/products` | Create new product SKU | Admin Only |
| `DELETE` | `/products/:id` | Remove SKU from catalog | Admin Only |
| `POST` | `/cart/validate-coupon` | Validate promo code & compute discount | Public |
| `POST` | `/orders` | Place new order & process checkout | Public/Customer |
| `GET` | `/orders/my-orders` | Fetch customer order history | Bearer JWT |
| `GET` | `/admin/analytics` | Fetch dashboard KPI metrics & sales charts | Admin Only |
| `GET` | `/admin/orders` | List all system orders | Admin Only |
| `PUT` | `/admin/orders/:id/status` | Update order fulfillment status | Admin Only |

---

## 🔒 Test Accounts Seeded

- **Admin Account**: `admin@oppenheimer.com` / `password123`
- **Customer Account**: `alex@example.com` / `password123`
- **Demo Coupons**: `WELCOME10` (10% OFF), `FLASH20` ($20 OFF), `SUMMER50` (15% OFF)
