# Contributing to Dukaan Dost (दुकान दोस्त)

Thank you for your interest in contributing to **Dukaan Dost**! Small neighbourhood retailers (kirana stores, chemists, hardware shops, stationery stores) are the backbone of community commerce in India. Our mission is simple and focused:

> **Recording a sale must be faster and easier than writing it in a notebook.**

---

## 📜 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Product Principles & Boundaries](#product-principles--boundaries)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Development Workflow](#development-workflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Architecture & Coding Standards](#architecture--coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

---

## 🤝 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful, constructive, and open to feedback.

---

## 🎯 Product Principles & Boundaries

### Core Design Rules

1. **Offline-First by Architecture:** Local IndexedDB is the single source of truth. Core product CRUD, sale recording, stock receipt, and reorder calculations must function 100% without an active internet connection.
2. **Mobile-First & One-Handed:** Design for small Android smartphone viewports first. Primary action triggers must be thumb-reachable without scrolling.
3. **Decimal Precision & Units:** Store all quantities as decimals (e.g. `0.5 kg`, `1.5 L`). Always display the appropriate unit beside every quantity.
4. **Audit Ledger & Data Integrity:** Every stock change must create an atomic `StockMovement` entry with `quantityDelta`, `stockBefore`, `stockAfter`, and a unique `operationId` to prevent duplicate submissions.
5. **Bilingual by Default:** Every user-facing UI label, button, and validation message must support both **Hindi (हिन्दी)** and **English**. Never hardcode English strings inside components.
6. **No Fake Functionality:** Never render non-functional buttons or fabricate reorder demand confidence. If history is insufficient, display transparent fallback calculations.

### What NOT to Build (Out of Scope for MVP)

- Complex GST invoices, POS billing printers, or payment gateways.
- Customer khata/credit accounts or ledger tracking.
- Mandatory server logins or cloud-only databases.
- Intrusive analytics, trackers, or telemetry.

---

## 💻 Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: Version `18.x`, `20.x`, or `>= 22.x` ([Download Node.js](https://nodejs.org/))
- **npm**: Version `9.x` or later (bundled with Node.js)
- **Git**: Installed and configured with your name and email

Check your versions:
```bash
node -v
npm -v
git --version
```

---

## 🚀 Local Development Setup

### 1. Fork and Clone the Repository

```bash
# Clone the repository
git clone https://github.com/adityanathpatel/DukanDost.git

# Move into the project directory
cd DukanDost
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.example` to `.env`:

```bash
# On Linux/macOS
cp .env.example .env

# On Windows PowerShell
Copy-Item .env.example .env
```

> **Note:** The app works **100% out-of-the-box** using local IndexedDB without configuring Firebase. Adding Firebase credentials is only needed if you are testing Cloud Firestore sync or Firebase Auth.

### 4. Start the Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:5173`. 

To test on your mobile phone on the same Wi-Fi network, use the network URL displayed by Vite in your terminal (e.g. `http://192.168.x.x:5173`).

---

## 🔄 Development Workflow

1. **Create a topic branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
2. **Keep changes focused and small**: Avoid mixing unrelated refactors with feature work.
3. **Run tests while developing**:
   ```bash
   npm run test:watch
   ```
4. **Ensure code passes all quality checks**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

---

## 📝 Commit Message Guidelines

We enforce the **Conventional Commits** specification to keep commit history clean and understandable:

```
<type>(<scope>): <short description in imperative mood>
```

### Common Types

- **`feat`**: A new feature (e.g., `feat(sales): add barcode scanner quick select`)
- **`fix`**: A bug fix (e.g., `fix(units): prevent negative decimal conversion in grams`)
- **`docs`**: Documentation only changes (e.g., `docs: update setup steps in README`)
- **`test`**: Adding or correcting tests (e.g., `test(reorder): verify pack size rounding`)
- **`refactor`**: Code change that neither fixes a bug nor adds a feature
- **`chore`**: Maintenance tasks, dependencies, tooling (e.g., `chore: update dependencies`)

### Good Commit Examples

- `feat(auth): implement Firebase authentication context and bilingual modal`
- `feat(sync): add Cloud Firestore synchronization for products and stock movements`
- `fix(stock): guard against duplicate sale submission using operationId`
- `docs: add local development and contributing guide`

---

## 🏛️ Architecture & Coding Standards

Maintain strict separation of responsibilities:

```
src/
├── domain/                    # Pure TypeScript business rules & calculations (NO React / NO DB)
│   ├── types.ts               # Domain contracts & interfaces
│   ├── units.ts               # Unit conversion, decimal validation, precision rounding
│   ├── stock.ts               # Pure stock delta operations & slow-moving logic
│   └── reorder.ts             # Transparent reorder math
├── data/                      # Persistence layer
│   ├── db.ts                  # Dexie / IndexedDB schema
│   ├── productRepository.ts   # Atomic transactions & ledger repository
│   └── firebaseSync.ts        # Optional Cloud Firestore sync
├── features/                  # UI features by domain
│   ├── auth/                  # Authentication context & modal
│   ├── home/                  # Dashboard & quick actions
│   ├── inventory/             # Product list, filters, add/edit modals
│   ├── sales/                 # Quick sale modal
│   ├── stock/                 # Inward stock & audit modal
│   ├── reports/               # Reorder list & velocity reports
│   └── profile/               # Store settings & sync controls
├── components/                # Reusable UI components (Header, Nav, Modal)
└── lib/                       # Utility functions & Firebase client initialization
```

### Key Coding Guidelines

- **TypeScript Strict Mode:** Do not use `any`. Define strong types in `src/domain/types.ts`.
- **Pure Domain Logic:** Keep business calculations (reorder formulas, decimal conversions) inside `src/domain/` so they can be unit-tested without React.
- **Atomic Operations:** Always use `this.db.transaction('rw', ...)` when updating products and recording stock movements to prevent desync.
- **Bilingual Strings:** Always provide text in both Hindi and English based on the active language state.

---

## 🧪 Testing Guidelines

Every business logic addition or repository modification must include automated tests:

- **Domain Tests:** `src/domain/domain.test.ts`
- **Repository Tests:** `src/data/productRepository.test.ts`

Run tests using:
```bash
# Run all tests once
npm test

# Run tests in watch mode during development
npm run test:watch
```

Ensure all tests pass with zero failures before submitting your PR.

---

## 🚀 Pull Request Process

1. Push your branch to GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch.
3. Fill out the PR description template:
   - **Summary of Changes**: What does this PR do?
   - **Motivation**: Why is this change necessary?
   - **Testing Done**: List the commands run and manual test steps performed.
   - **Screenshots / Recordings**: If UI changes were made (especially for mobile viewports).
4. Address review feedback promptly. Once approved and CI checks pass, your code will be merged!

Thank you for helping Indian shopkeepers make smarter decisions with **Dukaan Dost**!
