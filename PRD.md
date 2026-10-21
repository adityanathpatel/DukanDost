# Dukaan Dost --- Product Requirements Document (PRD)

**Version:** 1.0\
**Product type:** Offline-first Progressive Web App (PWA)\
**Primary users:** Small Indian kirana shops, chemists, hardware stores,
and stationery shops\
**Primary device:** Android smartphone\
**Status:** MVP specification

## 1. Executive Summary

Dukaan Dost is a simple, mobile-first stock and reorder assistant for
small shops that currently track inventory in notebooks or from memory.
It helps shopkeepers record sales quickly, maintain stock quantities,
identify low-stock and slow-moving products, and prepare practical
reorder lists.

The MVP is an inventory and reorder tool---not a billing/POS system. Its
core operations must work without internet, with data stored locally on
the device.

## 2. Problem Statement

Small neighbourhood shops lose money in two opposing ways: - **Dead
stock:** products remain unsold for months, tying up working capital. -
**Stockouts:** fast-moving products run out unexpectedly, potentially
losing repeat customers.

Existing billing software may assume a computer, counter, trained
operator, stable internet, or recurring fee. The shopkeeper may have
only a phone, one free hand, and seconds between customers. Inventory
software fails if recording a sale is slower than writing it in a
notebook.

## 3. Product Vision and Goals

**Vision:** Make stock decisions simple enough for a busy shopkeeper to
use every day.

### Goals

1.  Record a normal sale in a few taps.
2.  Keep stock quantities accurate and immediately updated.
3.  Make low-stock and slow-moving items visible as actionable lists.
4.  Work offline after initial app installation/loading.
5.  Support Hindi and English, familiar terminology, and fractional
    quantities.
6.  Avoid unnecessary setup, complexity, and mandatory accounts.

### Non-goals for MVP

-   GST invoices, billing, POS, payments, or customer loyalty.
-   Accounting, profit-and-loss reporting, or tax filing.
-   Cloud accounts and multi-device synchronization.
-   AI chatbots or opaque demand forecasts.
-   Complex dashboards, charts, or enterprise permissions.

## 4. Target Users and Context

### Primary persona

A small-shop owner who: - Uses an Android phone as their primary digital
device. - Tracks products in a notebook or memory. - Has limited time
and may operate one-handed. - May have unreliable or no internet at the
shop. - Uses local units such as pieces, packets, bottles, dozens,
kilograms, half-kilograms, and loose quantities.

### Design principles

-   Thumb-reachable primary actions and large touch targets.
-   Minimal typing; search, recent items, and quick quantity controls.
-   Plain language instead of unexplained terms such as "SKU."
-   No scrolling required to reach the main save/confirm action on
    common flows.
-   Clear feedback for every stock change.
-   The app remains useful without an account or network connection.

## 5. Scope and Priorities

Priority definitions: P0 = required for MVP; P1 = next iteration; P2 =
future.

  ID      Requirement                                            Priority
  ------- ------------------------------------------------------ ----------
  FR-01   Add, edit, archive and search products                 P0
  FR-02   Record a sale and deduct stock immediately             P0
  FR-03   Record stock received and manual adjustments           P0
  FR-04   Show low-stock and out-of-stock products               P0
  FR-05   Show slow-moving items and last-sale date              P0
  FR-06   Generate a transparent reorder list                    P0
  FR-07   Persist core data locally                              P0
  FR-08   Support offline operation after caching/installation   P0
  FR-09   Provide Hindi and English UI                           P0
  FR-10   Support decimal quantities and configurable units      P0
  FR-11   Export and restore a local backup                      P1
  FR-12   Scan product barcodes using phone camera               P1
  FR-13   Share/copy reorder list for WhatsApp                   P1
  FR-14   Track expiry dates for chemists                        P1
  FR-15   Support multiple branches                              P2
  FR-16   Sync data across devices                               P2

## 6. Core User Stories

-   As a shopkeeper, I can add a product and opening quantity so I can
    begin tracking stock.
-   As a shopkeeper, I can record a sale quickly so the stock count
    remains current.
-   As a shopkeeper, I can receive stock so inventory increases
    correctly.
-   As a shopkeeper, I can see low-stock items so I can reorder before
    running out.
-   As a shopkeeper, I can see products with no recent sales so I can
    investigate dead stock.
-   As a shopkeeper, I can use Hindi or English labels that I
    understand.
-   As a shopkeeper, I can enter fractional quantities such as 0.5 kg.
-   As a shopkeeper, I can continue recording sales with no internet.
-   As a shopkeeper, I can export a backup so I can recover my data if
    the device is lost or storage is cleared.

## 7. Information Architecture and Screens

### A. Home / Action List

Show: - Prominent **Record Sale** and **Add Stock** actions. - Low-stock
and out-of-stock items. - Slow-moving items with last-sale date. -
Offline/saved status. - Search and navigation to products and reorder
list.

Do not make a chart dashboard the default screen.

### B. Product List and Product Form

Fields: - Product name (required), optional Hindi name, category,
unit. - Current/opening stock, minimum stock. - Optional cost and
selling price. - Optional barcode and supplier. - Archive status.

Support editing, searching, and archiving. Archiving must not delete
historical sales.

### C. Record Sale

-   Search/select a product.
-   Display available stock and unit.
-   Enter quantity using large plus/minus controls or numeric input.
-   Confirm with a prominent action.
-   Immediately update stock and movement history.
-   Show clear success/error feedback.
-   Prevent accidental duplicate submissions and invalid quantities.

A normal sale should require no more than three taps after the product
is readily accessible. Target under five seconds in a simple usability
test.

### D. Add Stock / Adjustment

-   Select product.
-   Enter received or adjusted quantity.
-   Add optional note.
-   Save stock movement and update stock consistently.

### E. Reorder List

Show a plain actionable list, not a dashboard: - Product name. - Current
stock. - Suggested quantity. - Reason for recommendation. - Optional
supplier details. - Mark as ordered/received. - Copy/share list as text
when possible; copying should still work offline.

### F. Settings

-   Language: Hindi / English.
-   Shop name (optional).
-   Units and reorder defaults.
-   Export backup / restore backup.
-   About and data-storage explanation.

## 8. Reorder Logic

Start with transparent, rule-based calculations. Do not claim AI
prediction without sufficient evidence.

Let: - `v` = average quantity sold per day over a chosen historical
window. - `L` = expected supplier lead time in days. - `B` = safety
stock. - `S` = current stock. - `T` = target stock level.

`T = (v × L) + B`

`reorderQty = max(0, T - S)`

Round up to a valid purchase increment or pack size. Preserve fractional
units where relevant.

Fallback behaviour: 1. If there is sufficient sales history, use average
daily sales and configured lead time/safety stock. 2. If sales history
is insufficient, use the configured minimum-stock threshold. 3. If there
is no reliable history or threshold, ask the user to configure a minimum
or label the suggestion as unavailable; do not invent demand. 4. Explain
the basis, for example "Below minimum stock" or "Estimated from recent
sales." 5. For slow-moving items, show last sale date and days since
last recorded sale. Do not label newly created products as dead stock.

## 9. Data Model

Use IndexedDB as the local source of truth.

### Product

-   `id`: stable unique ID
-   `name`, `nameHi`
-   `category`
-   `unit`
-   `stockQty`: decimal number
-   `minStock`: decimal number, optional
-   `costPrice`, `sellingPrice`: optional numeric values
-   `barcode`: optional
-   `supplierId`: optional
-   `archived`: boolean
-   `createdAt`, `updatedAt`

### Sale

-   `id`
-   `productId`
-   `quantity`: positive decimal
-   `unit`
-   `timestamp`
-   `deviceId` or local operation ID
-   optional note

### StockMovement

-   `id`
-   `productId`
-   `type`: `sale`, `received`, `adjustment`, `return`
-   `quantity`: signed or clearly documented direction convention
-   `timestamp`
-   `note`
-   `operationId` for duplicate protection

### Supplier (optional in MVP)

-   `id`, `name`, `phone`, `notes`

### ReorderState

-   `productId`, `status`, `suggestedQty`, `updatedAt`

### Settings

-   `language`, `shopName`, `defaultUnits`, `backupMetadata`

Keep movement history; do not rely only on overwriting stock totals.
Define one consistent transaction strategy so stock and movement history
cannot diverge. Prevent duplicate operation IDs from applying a stock
change twice.

## 10. Technical Requirements

Suggested stack: - React + TypeScript + Vite. - IndexedDB, using a small
wrapper such as `idb` or Dexie. - PWA manifest and service worker
(e.g. `vite-plugin-pwa`). - Lightweight client-side routing if needed. -
Automated tests for inventory logic and key workflows.

Requirements: - The app shell and core assets must be cached for offline
use. - All core reads/writes must use local storage and must not require
a network request. - Handle storage errors and quota failures
gracefully. - Never show "cloud synced" when data is only on the
device. - No mandatory login, analytics, or remote data transfer for
core use. - Backup export/import must validate file format and version
before applying. - Camera barcode scanning is P1 and must degrade
gracefully when unsupported.

## 11. Non-Functional Requirements

-   **Usability:** one-handed use, big touch targets, clear labels,
    minimal typing.
-   **Performance:** product search and local stock updates feel
    immediate on a modest Android phone.
-   **Reliability:** persist after refresh/restart; handle invalid
    inputs, rapid taps and storage errors.
-   **Offline:** install/cache app shell and operate core flows in
    airplane mode.
-   **Accessibility:** readable type, high contrast, focus states,
    accessible labels and keyboard support.
-   **Privacy:** keep data local by default; explain that clearing
    browser/site data can remove local data unless backed up.
-   **Localization:** all user-facing strings externalized; no
    mixed-language hard-coded labels.
-   **Data integrity:** stock movements are consistent and duplicate
    operations are guarded.

## 12. Acceptance Criteria

1.  User can add a product with opening stock.
2.  A sale reduces stock by exactly the entered decimal quantity.
3.  Invalid, zero, negative, or excessive quantities are handled
    according to clear validation rules and do not corrupt stock.
4.  Product, sale and movement data survive refresh and app restart.
5.  Core flows work in airplane mode after the app has been
    installed/cached.
6.  Low-stock/reorder lists update after stock movements.
7.  Hindi and English are available across all core screens.
8.  Fractional quantities such as `0.5 kg` work correctly.
9.  Reorder suggestions explain the basis and do not pretend to predict
    demand without data.
10. The app can export and validate a backup in the P1 release.
11. Duplicate taps do not create duplicate sale deductions.
12. No billing/POS workflow or elaborate dashboard blocks the MVP.

## 13. Risks and Mitigations

-   **Device loss / browser data cleared:** provide export/import backup
    and clear warnings.
-   **Incorrect stock due to duplicate taps:** operation IDs, disabled
    pending actions, atomic local transaction strategy.
-   **Poor sales history:** use minimum-stock fallback and label it
    clearly.
-   **Unit confusion:** configurable units and visible unit labels on
    every quantity.
-   **Offline testing overlooked:** include airplane-mode acceptance
    tests from the start.
-   **Service-worker caching bugs:** version caches and test
    update/reload behaviour.
-   **Feature creep:** keep barcode, expiry, multi-branch and sync out
    of P0.

## 14. Delivery Plan

1.  Define product/movement types and inventory calculation tests.
2.  Implement IndexedDB repository and seed/demo data.
3.  Build mobile-first product list and product form.
4.  Build record-sale and receive-stock flows.
5.  Add low-stock, slow-moving and reorder logic.
6.  Add Hindi/English localization.
7.  Add manifest, service worker and offline tests.
8.  Add backup/export and optional enhancements after MVP validation.
9.  Test on a real Android phone, including airplane mode and app
    restart.

## 15. Definition of Done

The MVP is done when all P0 acceptance criteria pass, core operations
work offline, data survives restart, key inventory logic has automated
tests, and the interface has been tested on a real or emulated
narrow-screen Android device.
