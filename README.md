# Dukaan Dost (मेरी दुकान) — Smart Stock & Reorder Assistant

> **Offline-first, mobile-first inventory and reorder web application for small Indian kirana stores, chemists, hardware, and stationery shops.**

[![Vitest Tests](https://img.shields.io/badge/Vitest-45%2F45%20Passing-emerald)](https://vitest.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Type%20Check-blue)](https://www.typescriptlang.org)
[![IndexedDB](https://img.shields.io/badge/Storage-Dexie%20%2F%20IndexedDB-orange)](https://dexie.org)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8)](https://tailwindcss.com)

---

## 🎯 The Kirana Problem

Small Indian neighbourhood retailers face two weekly financial drains:
1. **Stockouts:** Fast-moving essentials (salt, flour, oil, noodles) run out during peak rush hours, forcing loyal customers to visit competitor shops.
2. **Dead Stock:** Slow-moving products sit on shelves for months, locking up critical working capital.

Traditional billing/POS systems require computers, counters, dedicated operators, and mandatory internet. Dukaan Dost is built around a single rule: **recording a sale must be faster than writing it in a notebook.**

---

## 🚀 Key Features

- **⚡ Fast Sale (< 3 seconds):** Select an item, adjust decimal quantities, and confirm with one thumb. Stock is immediately deducted.
- **📦 Atomic Stock Ledger:** Every single sale, inward delivery, and opening stock entry is committed in an atomic IndexedDB transaction with an immutable movement record (`quantityDelta`, `stockBefore`, `stockAfter`, `operationId`).
- **🔒 100% Offline-First:** Zero cloud or network dependencies. Local IndexedDB is the single source of truth; core workflows work completely in Airplane Mode.
- **⚖️ Decimal & Loose Unit Arithmetic:** Full support for `kg`, `half_kg` (0.5 kg), `g`, `liter`, `ml`, `packet`, `piece`, `bottle`, and `dozen`. Incompatible units are strictly rejected.
- **📊 Transparent Reorder Intelligence:**
  $$\text{Target Stock } (T) = (\bar{v} \times L) + B$$
  $$\text{Reorder Quantity} = \max(0, T - S - \text{Incoming})$$
  - Includes supplier pack-size rounding (e.g., cartons of 10 or 12).
  - Falls back honestly to configured `minStock` when sales velocity is insufficient—never fabricating fake demand.
- **🌐 Bilingual UI:** Complete native Hindi and English interface toggled with one tap. Zero unexplained jargon like "SKU".
- **🎨 Reference-Inspired Design:** Warm off-white canvas, pastel lavender hero card, pastel orange/blue/pink bento cards, and responsive web/mobile navigation.
- **💬 WhatsApp Reorder Integration:** 1-tap formatted text generation ready to paste and send to distributors.

---

## 🛠️ Technology Stack

- **Framework:** React 18 + TypeScript + Vite
- **Local Persistence:** Dexie.js (IndexedDB wrapper with transaction support)
- **Styling:** Tailwind CSS with custom Kirana pastel design tokens
- **Icons:** Lucide React
- **Testing:** Vitest + `fake-indexeddb` for in-memory database testing
- **Code Quality:** ESLint Flat Config + TypeScript strict checking

---

## 📂 Project Architecture

```
src/
├── domain/                    # Pure, testable business logic (zero UI/DB dependencies)
│   ├── types.ts               # Domain contracts (Product, StockMovement, Units)
│   ├── units.ts               # Decimal arithmetic, safe precision, unit conversion
│   ├── stock.ts               # Pure stock deduction, inward calculation, slow-moving status
│   ├── reorder.ts             # Transparent reorder math and fallback rules
│   └── domain.test.ts         # 31 unit tests covering calculations & edge cases
│
├── data/                      # Local IndexedDB persistence layer
│   ├── db.ts                  # Dexie database schema and indexes
│   ├── productRepository.ts   # Atomic transactions, duplicate guards, audit ledger
│   ├── productRepository.test.ts # 14 tests verifying IndexedDB persistence & rollback
│   └── sampleProducts.ts      # Realistic Kirana starter pack (Tata Salt, Maggi, Fortune Oil)
│
├── features/                  # UI Feature Modules
│   ├── home/HomeScreen.tsx    # Dashboard with hero card, status cards, priority sheet
│   ├── inventory/             # Search, filter chips, Add Product, Product Detail modal
│   ├── sales/RecordSaleModal.tsx # Interactive sale deduction modal
│   ├── stock/AddStockModal.tsx   # Interactive inward receipt modal
│   ├── reports/ReportsScreen.tsx # Detailed reorder calculations & slow-moving analysis
│   └── profile/ProfileScreen.tsx # Store settings, offline guarantee, demo reset
│
├── components/                # Reusable UI Components (Header, Navigation, Button, Card, Badge)
└── App.tsx                    # Root application controller & reactive state orchestration
```

---

## 🧪 Automated Testing & Verification

The project includes **45 automated tests** across business logic and persistence:

```bash
# Run test suite
npm test

# Run type check & production build
npm run build

# Run linter
npm run lint

# Start dev server
npm run dev
```

---

## 🔥 Firebase Cloud Authentication & Firestore Sync

While Dukaan Dost is architected offline-first using Dexie/IndexedDB, it seamlessly integrates with **Firebase** for cloud backup and multi-device access:

- **🔐 Firebase Auth:** Shopkeepers can sign in or register with email/password. A dedicated bilingual Auth modal supports seamless login, registration, and guest mode.
- **☁️ Cloud Firestore Database:** Stores synced products and stock movements under isolated user paths (`users/{uid}/products` and `users/{uid}/movements`).
- **🔄 Resilient Sync Engine:** 
  - Every sale, stock receipt, and product update automatically syncs to Firestore in the background when online.
  - Core retail sales and stock changes never block or fail when offline.
  - 1-tap "Sync Now" button in the Store Profile tab to backup the entire catalog and ledger on demand.

### Environment Setup

Copy `.env.example` to `.env` and configure your Firebase credentials:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## 📜 Stock Movement Ledger Sign Convention

Every inventory change logs a `StockMovement` entry:
- **`quantity`**: Always positive (magnitude of movement).
- **`quantityDelta`**: Signed directional delta:
  - `+quantity` for stock additions (`received`, `opening_stock`).
  - `-quantity` for stock reductions (`sale`).
- Snapshot integrity: $\text{stockAfter} = \text{stockBefore} + \text{quantityDelta}$.
- **`operationId`**: Unique client-side token preventing duplicate deductions from rapid tapping.

---

## 📱 Offline Limitations & Privacy

- All product, sale, and stock ledger records are stored locally on the shopkeeper's device inside browser IndexedDB.
- Offline guest mode works 100% without internet connection.
- Signing into Firebase enables automatic cloud backups and data preservation across device resets.
- Clearing browser/site data in guest mode will erase local data; shopkeepers are encouraged to sign in to protect their business records.

