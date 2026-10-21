# 🛒 Dukaan Dost (मेरी दुकान) — Smart Stock & Reorder Assistant

> **Offline-first, mobile-first inventory and reorder web application for small Indian kirana stores, chemists, hardware, and stationery shops.**
> *(छोटी दुकान. समझदार फैसले.)*

[![Vitest Tests](https://img.shields.io/badge/Vitest-45%2F45%20Passing-emerald?style=flat-square)](https://vitest.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Type%20Check-blue?style=flat-square)](https://www.typescriptlang.org)
[![IndexedDB](https://img.shields.io/badge/Storage-Dexie%20%2F%20IndexedDB-orange?style=flat-square)](https://dexie.org)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?style=flat-square)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Cloud-Firebase%20Auth%20%26%20Firestore-yellow?style=flat-square)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 📖 Table of Contents

- [The Kirana Problem](#-the-kirana-problem)
- [Key Features](#-key-features)
- [How to Run Locally (Localhost Quickstart)](#-how-to-run-locally-localhost-quickstart)
- [Available Scripts](#-available-scripts)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Firebase Cloud Auth & Firestore Sync](#-firebase-cloud-auth--firestore-sync)
- [Stock Movement Ledger Convention](#-stock-movement-ledger-convention)
- [Automated Testing](#-automated-testing)
- [Offline Safety & Privacy](#-offline-safety--privacy)
- [Contributing](#-contributing)

---

## 🎯 The Kirana Problem

Small Indian neighbourhood retailers face two weekly financial drains:

1. **Stockouts:** Fast-moving essentials (salt, flour, oil, noodles) run out during peak customer rush hours, forcing loyal buyers to visit competitor shops.
2. **Dead Stock:** Slow-moving products sit on shelves for months, locking up critical working capital.

Traditional billing and POS systems require desktop computers, dedicated billing operators, continuous internet, and complex GST workflows. Dukaan Dost is built around a single golden rule:

> **Recording a sale must be faster and easier than writing it in a notebook.**

---

## 🚀 Key Features

- **⚡ Fast Sale (< 3 seconds):** Search products by name (English or हिन्दी) or barcode, adjust quantities with quick +/- buttons, and confirm with one thumb. Stock is immediately deducted.
- **📦 Atomic Stock Movement Ledger:** Every sale, supplier delivery, and recount adjustment is recorded in an atomic IndexedDB transaction with an immutable movement record (`quantityDelta`, `stockBefore`, `stockAfter`, `operationId`).
- **🔒 100% Offline-First:** Zero cloud or network dependencies. Local IndexedDB is the primary source of truth; core retail workflows operate flawlessly in Airplane Mode.
- **⚖️ Decimal & Loose Unit Arithmetic:** Full support for `kg`, `half_kg` (0.5 kg), `g`, `liter`, `ml`, `packet`, `piece`, `bottle`, and `dozen`. Incompatible unit additions are strictly validated.
- **🧠 Transparent Reorder Intelligence:**
  $$\text{Target Stock } (T) = (\bar{v} \times L) + B$$
  $$\text{Reorder Quantity} = \max(0, T - S - \text{Incoming})$$
  - Rounds up to supplier wholesale pack sizes (e.g. cartons of 10 or 12).
  - Falls back honestly to configured `minStock` when sales velocity is insufficient—never fabricating false demand.
- **🌐 1-Tap Bilingual UI:** Complete native Hindi (हिन्दी) and English interface. Zero unexplained technical jargon like "SKU".
- **💬 1-Click WhatsApp Distributor Order:** Generates clean formatted purchase order text ready to paste directly into distributor chats.
- **☁️ Optional Firebase Cloud Backup:** Sign in to sync your catalog and movement ledger with Cloud Firestore across devices.

---

## 💻 How to Run Locally (Localhost Quickstart)

Follow these step-by-step instructions to get Dukaan Dost running on your local machine in under 2 minutes:

### 1. Prerequisites

Ensure you have the following installed:
- **Node.js**: Version `18.x`, `20.x`, or `>= 22.x` ([Download Node.js](https://nodejs.org/))
- **npm**: Version `9.x` or later (bundled with Node.js)
- **Git**: ([Download Git](https://git-scm.com/))

### 2. Clone the Repository

```bash
git clone https://github.com/adityanathpatel/DukanDost.git
cd DukanDost
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Environment Variables

Copy the example environment file:

```bash
# On Linux / macOS
cp .env.example .env

# On Windows PowerShell
Copy-Item .env.example .env
```

> **Note:** Firebase configuration is **completely optional**. If you do not configure Firebase credentials, the application will automatically run in **100% Offline / Local IndexedDB Mode** without errors!

### 5. Start the Localhost Development Server

```bash
npm run dev
```

You will see output similar to:
```text
  VITE v5.4.10  ready in 420 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.15:5173/
  ➜  press h + enter to show help
```

- Open **`http://localhost:5173`** in your web browser.
- **Testing on Mobile:** To test on a smartphone on the same Wi-Fi network, open the `http://<your-network-ip>:5173` URL shown in your terminal.

### 6. First-Time Setup (Load Demo Kirana Data)

When the app opens for the first time with an empty database:
1. You will see an empty state card: **"दुकान की इन्वेंट्री खाली है / Store Inventory is Empty"**.
2. Click the **"डेमो डेटा लोड करें (Load Demo Kirana Products)"** button.
3. Realistic Indian neighbourhood store products (Tata Salt, Fortune Oil, Maggi 2-Minute Noodles, Parle-G, Aashirvaad Atta, etc.) will be seeded into local IndexedDB along with initial stock movement logs.
4. You can immediately test recording a sale, receiving stock, viewing reorder recommendations, and switching languages!

---

## 📋 Available Scripts

In the project directory, you can run:

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite dev server with `--host` enabled for local network testing |
| `npm test` | Runs the full Vitest automated test suite (45 tests) |
| `npm run test:watch` | Runs Vitest in interactive watch mode for active development |
| `npm run build` | Compiles TypeScript and builds the production bundle into `dist/` |
| `npm run preview` | Serves the production build locally to test production performance |
| `npm run lint` | Runs ESLint across all TypeScript and React files |

---

## 🛠️ Technology Stack

- **Frontend Framework:** React 18 with TypeScript
- **Bundler & Dev Server:** Vite 5 with Fast Refresh
- **Local Persistence:** Dexie.js (IndexedDB wrapper with ACID transaction support)
- **Styling:** Tailwind CSS with custom warm Kirana pastel color tokens
- **Icons:** Lucide React
- **Authentication & Cloud Database:** Firebase Auth & Cloud Firestore
- **Testing Framework:** Vitest + `fake-indexeddb` for in-memory database tests
- **Code Quality:** ESLint Flat Config + Strict TypeScript checking

---

## 📂 Project Architecture

The project follows a clean separation of concerns:

```
src/
├── domain/                    # Pure, testable business logic (zero UI/DB dependencies)
│   ├── types.ts               # Domain contracts (Product, StockMovement, Units)
│   ├── units.ts               # Decimal arithmetic, safe precision, unit conversion
│   ├── stock.ts               # Pure stock deduction, inward calculation, slow-moving status
│   ├── reorder.ts             # Transparent reorder math and fallback rules
│   └── domain.test.ts         # 31 unit tests covering calculations & edge cases
│
├── data/                      # Persistence layer
│   ├── db.ts                  # Dexie database schema and indexes
│   ├── productRepository.ts   # Atomic transactions, duplicate guards, audit ledger
│   ├── productRepository.test.ts # 14 tests verifying IndexedDB persistence & rollback
│   ├── sampleProducts.ts      # Realistic Kirana starter pack (Tata Salt, Maggi, Fortune Oil)
│   └── firebaseSync.ts        # Cloud Firestore synchronization engine
│
├── features/                  # UI Feature Modules
│   ├── auth/                  # Firebase AuthContext and bilingual AuthModal
│   ├── home/HomeScreen.tsx    # Dashboard with hero card, status cards, priority sheet
│   ├── inventory/             # Search, filter chips, Add Product, Product Detail modal
│   ├── sales/RecordSaleModal.tsx # Interactive sale deduction modal
│   ├── stock/AddStockModal.tsx   # Interactive inward receipt modal
│   ├── reports/ReportsScreen.tsx # Detailed reorder calculations & slow-moving analysis
│   └── profile/ProfileScreen.tsx # Store settings, cloud sync controls, demo reset
│
├── components/                # Reusable UI Components (Header, Navigation, Button, Card, Badge)
├── lib/                       # Utilities and Firebase client initialization
└── App.tsx                    # Root application controller & reactive state orchestration
```

---

## 🔥 Firebase Cloud Auth & Firestore Sync

While Dukaan Dost is architected offline-first using local IndexedDB, it seamlessly integrates with **Firebase** for cloud backup and multi-device access:

- **🔐 Firebase Auth:** Shopkeepers can sign in or register with email/password. A dedicated bilingual Auth modal supports seamless login, registration, and guest mode.
- **☁️ Cloud Firestore Database:** Stores synced products and stock movements under isolated user paths (`users/{uid}/products` and `users/{uid}/movements`).
- **🔄 Resilient Sync Engine:** 
  - Every sale, stock receipt, and product update automatically syncs to Firestore in the background when online.
  - Core retail sales and stock changes never block or fail when offline.
  - 1-tap "Sync Now" button in the Store Profile tab to backup the entire catalog and ledger on demand.

---

## 📜 Stock Movement Ledger Convention

Every single inventory change logs an immutable `StockMovement` entry:

- **`quantity`**: Always positive (magnitude of movement).
- **`quantityDelta`**: Signed directional delta:
  - `+quantity` for stock additions (`received`, `opening_stock`).
  - `-quantity` for stock reductions (`sale`).
- Snapshot integrity: $\text{stockAfter} = \text{stockBefore} + \text{quantityDelta}$.
- **`operationId`**: Unique client-side token preventing duplicate deductions from rapid tapping or double-clicks.

---

## 🧪 Automated Testing

The project includes **45 automated tests** across domain math and persistence:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

Test coverage includes:
- Decimal arithmetic (e.g., `0.5 kg` loose sugar sales).
- Incompatible unit safety (e.g., preventing subtraction of `liter` from `piece`).
- Oversell guards and duplicate submission prevention (`operationId`).
- Reorder quantity calculations with wholesale pack-size rounding.
- Minimum-stock threshold fallback when sales history is insufficient.
- Atomic IndexedDB transaction rollbacks on simulated disk errors.

---

## 📱 Offline Safety & Privacy

- All product, sale, and stock ledger records are stored locally on the shopkeeper's device inside browser IndexedDB.
- Offline guest mode works 100% without an internet connection.
- Signing into Firebase enables automatic cloud backups and data preservation across device resets.
- Clearing browser/site data in guest mode will erase local data; shopkeepers are encouraged to sign in to protect their business records.

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are warmly welcomed! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on setting up your development environment, coding standards, and submitting pull requests.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
