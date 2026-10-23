# 🛒 Dukaan Dost (मेरी दुकान) — Smart Kirana Inventory & Hustle AI Copilot

> **Offline-first, mobile-first inventory, reorder, and business copilot web application for small Indian kirana stores, chemists, hardware, and retail shops.**  
> *(छोटी दुकान. समझदार फैसले. तेज़ तरक्की.)*

[![Vitest Tests](https://img.shields.io/badge/Vitest-72%2F72%20Passing-emerald?style=flat-square&logo=vitest)](https://vitest.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Type%20Check-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![IndexedDB](https://img.shields.io/badge/Storage-Dexie%20%2F%20IndexedDB%20v2-orange?style=flat-square)](https://dexie.org)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Cloud-Firebase%20Auth%20%26%20Firestore-yellow?style=flat-square&logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 📖 Table of Contents

- [The Kirana Problem](#-the-kirana-problem)
- [Key Features](#-key-features)
  - [1. Rapid Inventory & Sales Management](#1-rapid-inventory--sales-management)
  - [2. ⚡ Hustle AI Retail Copilot & Invoice Studio](#2--hustle-ai-retail-copilot--invoice-studio)
  - [3. Embedded AI Engines (OCR & Voice)](#3-embedded-ai-engines-ocr--voice)
  - [4. Transparent Reorder Intelligence](#4-transparent-reorder-intelligence)
- [How to Run Locally (Localhost Quickstart)](#-how-to-run-locally-localhost-quickstart)
- [Dual GitHub Repositories & Sync](#-dual-github-repositories--sync)
- [Available Scripts](#-available-scripts)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Firebase Cloud Auth & Firestore Sync](#-firebase-cloud-auth--firestore-sync)
- [Stock Movement Ledger Convention](#-stock-movement-ledger-convention)
- [Automated Testing](#-automated-testing)
- [Offline Safety & Privacy](#-offline-safety--privacy)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 The Kirana Problem

Small Indian neighbourhood retailers face persistent daily drains:

1. **Peak-Hour Stockouts:** Fast-moving essentials (salt, flour, oil, spices, milk, snacks) run out during morning or evening customer rush, forcing regular buyers to competitor shops.
2. **Trapped Capital in Dead Stock:** Slow-moving products sit on shelves for months, freezing cash flow.
3. **Cumbersome Notebook Accounting:** Traditional billing and POS terminals require bulky desktop hardware, high upfront costs, constant internet, and complex multi-page forms.

Dukaan Dost is engineered around a central golden rule:

> **Recording a sale must be faster and easier than writing it in a notebook.**

---

## 🚀 Key Features

### 1. Rapid Inventory & Sales Management
- **⚡ Fast Sale (< 3 seconds):** Search products by name (English or हिन्दी) or barcode, adjust quantities with 1-tap numeric/stepper controls, and confirm. Stock immediately updates in IndexedDB.
- **📦 Atomic Stock Movement Ledger:** Every sale, inward delivery, and stock adjustment executes in an atomic IndexedDB transaction with an immutable audit log (`quantityDelta`, `stockBefore`, `stockAfter`, `operationId`).
- **⚖️ Decimal & Fractional Arithmetic:** Native support for fractional loose units: `kg`, `half_kg` (0.5 kg), `g`, `liter`, `ml`, `packet`, `piece`, `bottle`, and `dozen`. Incompatible unit additions are strictly rejected.
- **🎨 Executive Fitted Header & Responsive Dashboard:** Deep slate glass header with a 4-tab segmented navbar (**Dashboard**, **Inventory**, **⚡ Hustle AI**, **Reports**), live Inventory Health Gauge, elevated status cards, and balanced store action bento cards.
- **🌐 Dynamic Bilingual UI (Hindi & English):** Instant 1-tap language switch that dynamically adapts labels, badges, avatar initials, and statuses without layout clipping or horizontal overflow.

### 2. ⚡ Hustle AI Retail Copilot & Invoice Studio
- **🧾 Deterministic Invoice Studio:**
  - Create professional GST and Non-GST bills with live math (subtotal, percentage discounts, packaging/delivery charges, SGST/CGST breakdown).
  - Product autocomplete with real-time stock balance display.
  - Automatic inventory stock deduction option upon bill creation.
  - Clean vector printable invoices, PDF downloads, and 1-click WhatsApp customer delivery.
- **📢 Marketing & Promotional Copywriter:**
  - Generate high-converting bilingual promotional broadcasts for Diwali, Holi, Eid, New Year, weekend flash sales, and new arrivals.
  - 1-click direct WhatsApp broadcast button.
- **💬 Customer Payment Reminders & Quotations:**
  - Gentle, firm, and final bilingual credit (*udhaar*) payment reminders.
  - Formal wholesale quotations with terms and validity dates.
- **📝 Smart Listing Writer:**
  - SEO-optimized title, description, and bullet points for WhatsApp catalogs, ONDC, and e-commerce listings.
- **🗄️ Saved Projects & Reprints:**
  - IndexedDB storage for drafts, quotation archives, and reprinting past invoices.

### 3. Embedded AI Engines (OCR & Voice)
- **📷 OCR Paper Bill Scanner:** Scan or upload paper distributor receipts; auto-extracts item names, quantities, and cost prices for 1-click inward stock additions.
- **🎤 Hinglish Voice Assistant:** Web Speech API integration that understands natural voice commands like *"2 packet Maggi becha"* or *"Aashirvaad Atta ka stock kitna hai"*.

### 4. Transparent Reorder Intelligence
- Calculates verifiable, explainable reorder requirements:
  $$\text{Target Stock } (T) = (\bar{v} \times L) + B$$
  $$\text{Reorder Quantity} = \max(0, T - S - \text{Incoming})$$
- Rounds up to supplier wholesale pack sizes (e.g., cartons of 10 or 12).
- Falls back honestly to configured minimum thresholds (`minStock`) when historical sales velocity is insufficient—never fabricating speculative demand.
- **1-Click WhatsApp Distributor Order:** Generates formatted purchase order text ready to send directly to distributors.

---

## 💻 How to Run Locally (Localhost Quickstart)

### 1. Prerequisites
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

### 4. Environment Variables (Optional)
Copy the example environment configuration:
```bash
# On Linux / macOS
cp .env.example .env

# On Windows PowerShell
Copy-Item .env.example .env
```
> **Note:** Firebase credentials are **optional**. If omitted, Dukaan Dost operates in **100% Offline IndexedDB Mode** with full functionality!

### 5. Launch the Local Development Server
```bash
npm run dev
```

Output:
```text
  VITE v5.4.21  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.15:5173/
```
- Open **`http://localhost:5173`** in your browser.
- **Mobile Testing:** Open the network IP address (e.g. `http://192.168.1.15:5173`) on your smartphone connected to the same Wi-Fi.

### 6. First-Time Setup (Seed Demo Kirana Inventory)
1. If your database is empty, click **"डेमो डेटा लोड करें (Load Demo Kirana Products)"**.
2. Realistic Indian products (Tata Salt, Fortune Oil, Maggi 2-Minute Noodles, Parle-G, Aashirvaad Atta, etc.) will be seeded into local IndexedDB with complete stock movement ledger entries.

---

## 🔄 Dual GitHub Repositories & Sync

This project is actively maintained across two synchronized repositories:

1. **`origin`**: [`https://github.com/adityanathpatel/DukanDost`](https://github.com/adityanathpatel/DukanDost)
2. **`meri-dukan`**: [`https://github.com/saumy-chaurasia/Meri-Dukan`](https://github.com/saumy-chaurasia/Meri-Dukan)

To push changes to both repositories simultaneously, run the included PowerShell utility:
```powershell
.\push-both.ps1
```

---

## 📋 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite dev server with `--host` enabled for local network testing |
| `npm test` | Runs the full Vitest automated test suite (**72 tests across 5 suites**) |
| `npm run test:watch` | Runs Vitest in interactive watch mode for active TDD development |
| `npm run build` | Compiles TypeScript and bundles production assets into `dist/` |
| `npm run preview` | Locally serves the production build to preview production performance |
| `npm run lint` | Runs ESLint across all TypeScript and React source files |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, TypeScript (Strict Mode) |
| **Build Tool & Bundler** | Vite 5 with Fast Refresh |
| **Local Offline Storage** | Dexie.js (IndexedDB v2 with ACID transactions) |
| **Styling & Design System** | Tailwind CSS with warm Kirana palette tokens & glassmorphism |
| **Icons** | Lucide React |
| **Cloud Sync & Auth** | Firebase Authentication & Cloud Firestore (Optional background sync) |
| **AI & Utilities** | Tesseract.js (OCR), Web Speech API (Voice), HTML Canvas / Print PDF |
| **Testing** | Vitest + `fake-indexeddb` (72 automated tests) |

---

## 📂 Project Architecture

```
src/
├── domain/                         # Pure business logic (zero UI or database coupling)
│   ├── types.ts                    # Product, StockMovement, Unit, Reorder interfaces
│   ├── units.ts                    # Safe decimal arithmetic & unit conversions
│   ├── stock.ts                    # Out-of-stock, low-stock, slow-moving status math
│   ├── reorder.ts                  # Transparent reorder math & fallback logic
│   ├── whatsapp.ts                 # WhatsApp message formatting & URL triggers
│   └── domain.test.ts              # 31 unit tests covering math & rules
│
├── data/                           # Persistence & database layer
│   ├── db.ts                       # Dexie IndexedDB schema v2
│   ├── productRepository.ts        # Atomic sales, inward receipts, movement ledger
│   ├── sampleProducts.ts           # Realistic Kirana inventory starter dataset
│   ├── firebaseSync.ts             # Cloud Firestore background sync service
│   └── productRepository.test.ts    # 14 tests verifying IndexedDB persistence & atomic guards
│
├── features/                       # Modular UI feature screens
│   ├── home/HomeScreen.tsx         # Dashboard with health meter, metrics & bento actions
│   ├── inventory/                  # Search, filter chips, Add Product, Product Detail modal
│   ├── sales/RecordSaleModal.tsx   # Fast 3-tap sale deduction modal
│   ├── stock/AddStockModal.tsx     # Inward distributor stock delivery modal
│   ├── reports/ReportsScreen.tsx   # Reorder priority sheet & supplier orders
│   ├── profile/ProfileScreen.tsx   # Store settings, backup, demo data controls
│   ├── auth/                       # Firebase AuthContext and bilingual AuthModal
│   └── hustle/                     # ⚡ Hustle AI copilot studio
│       ├── HustleAiScreen.tsx      # Main Hustle AI studio hub
│       ├── types.ts                # Invoice, marketing, and reminder contracts
│       ├── services/hustleEngine.ts# Deterministic invoice math & bilingual copy engine
│       ├── data/hustleRepository.ts# IndexedDB repository for invoices & saved projects
│       ├── components/             # InvoiceStudio, MarketingCopyWriter, ReceiptScanner, etc.
│       └── hustle.test.ts          # 11 unit tests for math, PDF, and persistence
│
├── ai/                             # Embedded AI services
│   ├── ocr/                        # OCR bill scanner engine & product matcher
│   ├── voice/                      # Speech recognition & Hinglish command parser
│   ├── forecasting/                # Demand velocity & seasonality forecaster
│   └── ai.test.ts                  # 11 tests for OCR & voice command parsers
│
├── components/                     # Shared UI components (Header, Navigation, Button, Card, Badge)
├── lib/                            # Shared utilities (`cn`) and Firebase client
├── App.tsx                         # Root app orchestrator & modal controllers
├── main.tsx                        # React DOM mounting with AuthProvider
└── index.css                       # Tailwind CSS utility definitions
```

---

## 📜 Stock Movement Ledger Convention

Every single inventory change logs an immutable `StockMovement` entry:

- **`quantity`**: Positive decimal magnitude of the operation.
- **`quantityDelta`**: Signed directional delta:
  - `+quantity` for stock additions (`received`, `opening_stock`).
  - `-quantity` for stock reductions (`sale`).
- **Mathematical Invariant**: $\text{stockAfter} = \text{stockBefore} + \text{quantityDelta}$.
- **`operationId`**: Unique client-side token preventing duplicate deductions from rapid tapping or double-clicks.

---

## 🧪 Automated Testing

The project includes **72 automated tests** across 5 test suites:

```bash
npm test
```

Test coverage includes:
- **`domain.test.ts` (31 tests):** Decimal arithmetic, incompatible unit safety, oversell protection, reorder calculations, pack-size rounding, threshold fallbacks.
- **`productRepository.test.ts` (14 tests):** Atomic IndexedDB transactions, duplicate submission protection, movement ledger recording, rollback on simulated failure.
- **`hustle.test.ts` (11 tests):** Deterministic invoice calculations, tax and discount math, marketing copy templates, udhaar reminder text, project persistence.
- **`ai.test.ts` (11 tests):** OCR text extraction, product matching confidence, Hinglish voice command parsing.
- **`whatsapp.test.ts` (5 tests):** Purchase order formatting and WhatsApp URL generation.

---

## 📱 Offline Safety & Privacy

- **Local IndexedDB Source of Truth:** All catalog, sale, and stock ledger records are stored locally in the browser's IndexedDB.
- **Zero Mandatory Network Calls:** Core retail operations never fail or hang due to network connectivity issues.
- **Privacy by Default:** Zero tracking scripts, ads, or external telemetry.
- **Data Persistence Advice:** Clearing browser cache/site data in guest mode will erase local records; shopkeepers can sign in with Firebase to enable cloud backups across device resets.

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are warmly welcomed! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards, architecture expectations, and pull request workflows.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
