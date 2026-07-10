# Lesh Kaffe & Pasalubong — Mobile App (FoodApp)

> A React Native / Expo mobile food ordering app for **Lesh Kaffe & Pasalubong** coffee shop. Built with Expo SDK 54, Expo Router, TypeScript, and an offline-first SQLite architecture.

---

## 📋 Project Overview

| Field | Value |
|-------|-------|
| **Name** | Lesh Kaffe |
| **Package ID** | `com.kennethgimpao22.LeshKeffe` |
| **Platform** | Android (primary), iOS (planned) |
| **Runtime** | Expo SDK 54 / React Native 0.81.5 |
| **Router** | Expo Router v6 (file-based routing) |
| **Language** | TypeScript 5.9 |
| **Package Manager** | pnpm |
| **API Server** | `http://s1102464823.onlinehome.us/api` (LeshServer) |

---

## 🏗️ Architecture

### Offline-First with SQLite

The app follows an **offline-first** pattern:
1. On launch, data is loaded instantly from a local **SQLite** database (`leshkaffe.db`)
2. A background API sync fetches fresh data from the server
3. Dirty (locally-modified) records are synced to the server when connectivity returns
4. Server data is written back to SQLite for the next offline session

### Authentication

- **No token-based auth** — the app uses a custom `X-User-Id` header
- User session is stored in SQLite (`is_logged_in` flag on the `users` table)
- The `IdentifyUser` middleware on the server reads `X-User-Id` and calls `Auth::setUser()`

### Data Flow

```
[API Server] ←→ [services/*.ts] ←→ [useAppData.tsx (Context)] ←→ [Views/Components]
                                         ↕
                              [lib/database.ts (SQLite)]
```

---

## 📁 Folder Structure

```
FoodApp/
├── app/                      # Expo Router pages (file-based routing)
│   ├── _layout.tsx           # Root layout (fonts, notifications, providers)
│   ├── index.tsx             # Welcome/splash screen with capybara video
│   ├── validations/          # (Reserved — empty)
│   └── views/                # App screens (route groups)
│       ├── Cart/
│       ├── Checkout/
│       ├── Home/
│       ├── Lesh-Wallet/
│       ├── Login/
│       ├── Notification/
│       ├── Orders/
│       ├── Profile/
│       ├── Register/
│       └── StampCard/
├── components/               # Reusable UI components
│   ├── Login/                # Login form (Index.tsx, LoginServices.ts)
│   ├── Register/             # Multi-step registration (StepName, StepContact, StepOtp)
│   └── UI/                   # Design system primitives
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Colors.ts         # Color tokens (design system)
│       ├── LoginRequiredModal.tsx
│       └── index.ts          # Barrel export
├── lib/                      # Core libraries & hooks
│   ├── authSession.ts        # SQLite-based login/logout/session check
│   ├── axios.ts              # Axios instance with X-User-Id interceptor
│   ├── database.ts           # SQLite schema + insert/read helpers (21+ tables)
│   ├── dataProvider.ts       # (Legacy data fetching)
│   ├── dataRepository.ts     # SQLite read layer (getData, hasData, getUser)
│   ├── notifications.ts      # Push notification registration (FCM)
│   ├── prefetch.ts           # Prefetch public data (products, categories, promos)
│   ├── syncService.ts        # Background API → SQLite sync functions
│   ├── useAppData.tsx        # Main data context provider (offline-first)
│   └── useAuth.ts            # Auth hook
├── services/                 # API service layer (one per domain)
│   ├── authService.ts
│   ├── categoriesService.ts
│   ├── loyaltyService.ts
│   ├── notificationsService.ts
│   ├── ordersService.ts
│   ├── paymentService.ts
│   ├── productsService.ts
│   ├── promosService.ts
│   ├── ratingsService.ts
│   ├── stampsService.ts
│   ├── storeService.ts
│   ├── subscriptionsService.ts
│   ├── userService.ts
│   ├── vouchersService.ts
│   └── walletService.ts
├── assets/                   # Static images, icons, videos
├── android/                  # Native Android project
├── app.json                  # Expo config
├── package.json
├── tsconfig.json
├── eas.json                  # EAS Build config
└── google-services.json      # Firebase config (FCM push notifications)
```

---

## 🎨 Design System (Colors)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary.default` | `#4A3525` | Rich Espresso Coffee Brown (main brand) |
| `primary.pressed` | `#38281C` | Pressed state |
| `secondary.default` | `#B36534` | Warm Teak / Terracotta accent |
| `secondary.pressed` | `#965228` | Pressed accent |
| `info.default` | `#2A9D8F` | Informational teal |
| `danger.default` | `#E63946` | Error / destructive red |
| `warning.default` | `#F4A261` | Warning orange |
| `feedback.success` | `#2B9348` | Success green |

**Font**: Poppins (Regular, SemiBold, Bold) via `@expo-google-fonts/poppins`

---

## 📱 Key Features

| Feature | Description |
|---------|-------------|
| **Product Catalog** | Browse products by category, view details, customization options |
| **Cart & Checkout** | Add items to cart (stored in SQLite), place orders |
| **Lesh Wallet** | Digital wallet with top-up (via BUX.ph) and debit |
| **Loyalty Points** | Earn/redeem points on purchases |
| **Stamp Cards** | Collect stamps per category, earn rewards |
| **Vouchers** | Claim and use discount vouchers |
| **Subscriptions** | Coffee subscription plans |
| **Promos** | Promotional campaigns with voucher codes |
| **Order Tracking** | View active and past orders |
| **Push Notifications** | FCM-based notifications (order updates, promos) |
| **Store Info** | Shop details, hours, spotlight customer |
| **Ratings** | Rate products and orders |
| **Offline Support** | Full offline-first with dirty record syncing |

---

## 🗃️ Local Database Schema (SQLite)

The app maintains **21+ tables** locally:

| Table | Purpose |
|-------|---------|
| `users` | User profile (with `is_logged_in`, `is_dirty` flags) |
| `user_addresses` | Saved delivery addresses |
| `categories` | Product categories |
| `products` | Product catalog |
| `product_customizations` | Customization options JSON per product |
| `orders` | Order history |
| `order_items` | Line items per order |
| `notifications` | In-app notifications |
| `stamp_achievements` | Stamp card progress |
| `stamp_histories` | Individual stamp entries |
| `user_vouchers` | Claimed vouchers |
| `vouchers` | Available voucher codes |
| `wallet` | Wallet balance |
| `wallet_transactions` | Wallet transaction history |
| `loyalty_transactions` | Points earn/redeem history |
| `subscriptions` | Available subscription plans |
| `promos` | Active promotions |
| `delivery_tracking` | Rider tracking data |
| `store` | Store info & spotlight customer |
| `cart_items` | Shopping cart (local only) |

---

## 🔌 API Integration

The app communicates with **LeshServer** via Axios. Authentication is header-based:

```typescript
// lib/axios.ts
headers: { 'X-User-Id': user.id }
```

### API Base URL
```
http://s1102464823.onlinehome.us/api
```

### Key Endpoints Used

| Method | Endpoint | Service File |
|--------|----------|--------------|
| POST | `/auth/login` | authService.ts |
| POST | `/auth/register` | authService.ts |
| GET | `/products` | productsService.ts |
| GET | `/categories` | categoriesService.ts |
| GET/POST | `/orders` | ordersService.ts |
| GET | `/wallet` | walletService.ts |
| POST | `/wallet/topup` | walletService.ts |
| GET | `/loyalty/points` | loyaltyService.ts |
| POST | `/loyalty/earn` | loyaltyService.ts |
| GET | `/notifications` | notificationsService.ts |
| GET | `/stamps` | stampsService.ts |
| GET | `/promos` | promosService.ts |
| GET | `/subscriptions` | subscriptionsService.ts |
| GET | `/store` | storeService.ts |
| GET | `/vouchers` | vouchersService.ts |
| POST | `/payments/checkout` | paymentService.ts |
| POST | `/ratings` | ratingsService.ts |
| GET/PUT | `/user/profile` | userService.ts |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Expo CLI (`npx expo`)
- Android Studio (for emulator) or physical Android device

### Install & Run

```bash
pnpm install
npx expo start          # Start dev server
npx expo run:android    # Run on Android
```

### Build (EAS)

```bash
eas build --platform android
```

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~54.0.34 | Expo framework |
| `expo-router` | ~6.0.23 | File-based routing |
| `expo-sqlite` | ~16.0.10 | Local SQLite database |
| `expo-notifications` | ~0.32.17 | Push notifications (FCM) |
| `expo-location` | ~19.0.8 | Geolocation |
| `react-native-maps` | 1.20.1 | Maps (delivery tracking) |
| `react-native-reanimated` | ~4.1.1 | Animations |
| `react-native-qrcode-svg` | ^6.3.21 | QR code generation |
| `expo-video` | ~3.0.16 | Video playback (welcome screen) |
| `expo-image` | ~3.0.11 | Optimized image loading |
| `axios` | ^1.18.1 | HTTP client |
| `expo-linear-gradient` | ~15.0.8 | Gradient backgrounds |

---

## ⚙️ Expo Config Highlights

- **New Architecture**: Enabled (`newArchEnabled: true`)
- **Typed Routes**: Enabled (`experiments.typedRoutes: true`)
- **React Compiler**: Enabled (`experiments.reactCompiler: true`)
- **Deep Linking Scheme**: `leshkaffe://`
- **Edge-to-Edge**: Android enabled
- **EAS Project ID**: `7ba814fa-9dd0-475c-865b-6d146c3f1bf1`

---

## 🔔 Push Notifications

- Firebase Cloud Messaging (FCM) via `expo-notifications`
- Token registered on app launch
- Notification tap handlers route to relevant screens (orders, wallet)
- Gracefully degrades in Expo Go (no-op)

---

## 📝 Notes

- The `app/validations/` folder is currently empty (reserved for form validation logic)
- The welcome screen features an animated capybara video (`bara-landscape-video.mp4`)
- Status bar color: `#B36534` (warm terracotta)
- Background sync interval polls the API periodically when the app is foregrounded
