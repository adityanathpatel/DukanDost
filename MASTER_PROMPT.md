# Master AI Coding Prompt --- Dukaan Dost

Act as a senior product engineer, mobile-first UX designer, and
test-focused frontend architect. Build a complete, usable MVP called
**Dukaan Dost --- Smart Stock & Reorder**, based on the requirements
below.

## Product objective

Help small Indian kirana shops, chemists, hardware shops and stationery
stores manage inventory without relying on a computer, trained operator,
recurring service or internet connection. The key test is that recording
a sale must be faster than writing it in a notebook.

## Required stack

Use React + TypeScript + Vite, IndexedDB (through `idb` or Dexie), and a
PWA manifest/service worker. Reuse an existing repository's stack if one
is already established. Keep core business logic separate from UI and
add automated tests.

## Build these P0 features

1.  Product management: add, edit, archive, search; product name,
    optional Hindi name, category, unit, opening/current stock, minimum
    stock, optional cost/selling price, optional barcode.
2.  Record sale: select/search product, show available stock, enter
    decimal quantity, confirm quickly, deduct stock immediately and
    create a sale/movement record.
3.  Receive stock and stock adjustment: increase or adjust stock with an
    optional note and movement history.
4.  Action-oriented home screen: prominent Record Sale and Add Stock
    actions; plain lists for low stock, out of stock and slow-moving
    products.
5.  Reorder list: current stock, suggested quantity and human-readable
    reason.
6.  Hindi and English language toggle, with every core UI string
    translated.
7.  Offline-first storage: IndexedDB is the source of truth. Product,
    sale, stock and reorder workflows must work offline after the app
    shell has been cached/installed.
8.  PWA installation support and clear offline/saved status.
9.  Decimal quantities and familiar units such as piece, packet, bottle,
    dozen, kg and half-kg.
10. Input validation, empty states, loading/error feedback and
    protection against duplicate sale submissions.

## Reorder calculation

When sufficient sales history exists: - Average daily sales = quantity
sold over a chosen historical window divided by the number of days in
that window. - Target stock = average daily sales × supplier lead time +
safety stock. - Reorder quantity = max(0, target stock − current
stock). - Round up to the configured purchase increment/pack size.

If sales history is insufficient, use the configured minimum stock and
label the basis. If there is no reliable basis, show "Not enough data"
or ask the user to configure a minimum. Never fabricate predictions.
Slow-moving lists should use product age and last-sale history so newly
added products are not wrongly flagged.

## UX direction

Create a polished, practical interface for a real small Indian
shop---not a generic admin dashboard: - Mobile-first layout designed for
narrow Android screens. - Warm off-white background, deep ink text and
restrained green accents. - High contrast, large thumb-friendly buttons
and comfortable spacing. - Common actions visible without unnecessary
scrolling. - Simple lists instead of charts as the default. - Clear
Hindi/English labels and visible units beside every quantity. - Quick
plus/minus controls plus numeric entry. - A lightweight, friendly visual
identity; no excessive gradients, glassmorphism or decorative
animation. - Responsive desktop layout as a secondary enhancement.

The design should feel trustworthy and practical. Do not use stock
photography as a substitute for working UI.

## Data integrity

Define Product, Sale, StockMovement, ReorderState and Settings types.
Use stable IDs, timestamps and decimal quantities. Keep movement history
instead of only overwriting stock. Centralize stock-changing logic.
Prevent duplicate operations from applying a stock change twice. Use an
IndexedDB transaction strategy where practical to keep stock and
movement history consistent. Archive products instead of deleting
historical records.

## Offline and privacy

No server or login is required for the MVP. Do not add analytics,
trackers or remote data transfer. Cache the app shell with a versioned
service worker. Clearly state that local data is on this device and can
be lost if browser/site data is cleared; do not pretend it is
cloud-backed up. Include a clear path to implement versioned
export/import backup as a P1 feature.

## Do not build in MVP

Do not build billing/POS, GST invoices, payments, customer accounts,
cloud sync, multi-branch management, complex analytics, or an AI
chatbot. Barcode scanning, WhatsApp sharing and expiry tracking are
future enhancements unless the P0 app is complete.

## Required workflow

1.  Inspect the repository and its scripts before changing files.
2.  Present a short implementation plan.
3.  Implement the core domain types and tested inventory/reorder
    functions first.
4.  Implement IndexedDB persistence.
5.  Build product management and record-sale/receive-stock flows.
6.  Build actionable low-stock, slow-moving and reorder lists.
7.  Add complete Hindi/English localization.
8.  Add PWA/service-worker support and verify offline behaviour.
9.  Add automated tests and run available lint, type-check, test and
    build commands.
10. Fix issues introduced by your work and document how to run the app.

Do not stop after producing a mockup. Build functional forms and real
local persistence. Do not leave dead buttons, fake data presented as
real, or success messages for failed operations. If you use sample/demo
data, label it clearly and provide a way to reset it.

## Acceptance checklist

-   A user can add a product and opening quantity.
-   A sale decreases stock by the exact entered decimal amount.
-   Receiving stock increases inventory correctly.
-   Invalid, zero, negative and excessive quantities are handled safely.
-   Stock and movement history remain consistent.
-   Duplicate taps cannot create duplicate deductions.
-   Refresh/restart preserves local data.
-   Core flows work in airplane mode after caching/installation.
-   Low-stock and reorder suggestions update after stock changes.
-   Reorder recommendations explain their calculation basis.
-   Hindi and English work throughout core flows.
-   The layout is usable on a narrow Android screen.
-   Tests and production build pass, or any failures are explicitly
    reported.

## Final response after implementation

Summarize: - Features implemented. - Important files and architecture. -
Commands to install/run/test/build. - Tests actually run and their
results. - How to test offline on a phone. - Known limitations and next
steps.

Read and follow `AGENTS.md` in the repository before implementing. Treat
it as persistent project guidance.
