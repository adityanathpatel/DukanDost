# AGENTS.md --- Dukaan Dost Development Instructions

## Mission

Build **Dukaan Dost**, an offline-first, mobile-first inventory and
reorder PWA for small Indian shops. The primary user may have one free
hand, seconds between customers, limited software experience, and
unreliable internet.

The central product rule is: **recording a sale must be faster and
easier than writing it in a notebook.**

## Product boundaries

### Must build first (P0)

-   Add/edit/archive/search products.
-   Record sales and reduce stock immediately.
-   Receive stock and make stock adjustments.
-   Low-stock and out-of-stock action lists.
-   Slow-moving products with last-sale information.
-   Transparent reorder recommendations.
-   IndexedDB local persistence.
-   Hindi and English interface.
-   Decimal quantities and configurable units.
-   Installable PWA and offline core flows.

### Do not build in the MVP

-   Billing/POS, GST invoices, payments or customer accounts.
-   Cloud authentication or mandatory server.
-   Multi-device synchronization.
-   Complex charts or a large analytics dashboard.
-   AI chatbot or unsupported predictive claims.

Barcode scanning, WhatsApp sharing, expiry tracking and multi-branch
support are later enhancements unless explicitly requested.

## Engineering principles

1.  **Offline-first by architecture:** local IndexedDB is the source of
    truth. Core product, sale, stock and reorder operations must not
    depend on a server.
2.  **Mobile-first:** design for narrow Android screens before desktop.
3.  **Fast flows:** keep primary actions thumb-reachable; use large
    buttons, minimal typing and short forms.
4.  **Plain language:** avoid unexplained technical terms such as SKU.
    Use Hindi/English labels and familiar units.
5.  **Data integrity:** every stock change must have a corresponding
    movement record. Prevent duplicate sale submissions.
6.  **Transparent recommendations:** explain why an item is suggested
    for reorder. Do not fabricate sales history or confidence.
7.  **No fake functionality:** do not ship buttons that do nothing or
    show success when an operation fails.
8.  **Privacy by default:** do not add analytics, tracking, remote APIs
    or external data transmission without a clear requirement.
9.  **Accessible UI:** readable type, good contrast, visible focus,
    accessible labels and sufficiently large touch targets.
10. **Small, maintainable changes:** reuse components, keep business
    logic separate from UI, and avoid unnecessary dependencies.

## Suggested stack

-   React, TypeScript and Vite.
-   IndexedDB with `idb` or Dexie.
-   PWA manifest and a service worker, such as via `vite-plugin-pwa`.
-   A test runner such as Vitest and React Testing Library.

Follow the repository's existing stack if it is already established. Do
not replace working architecture without a clear reason.

## Architecture expectations

Keep responsibilities separated: - `domain/`: types, unit handling,
stock calculations and reorder logic. - `data/`: IndexedDB schema,
migrations and repositories. - `features/products/`: product
management. - `features/sales/`: record sale. - `features/stock/`:
receive stock and adjustments. - `features/reorder/`: low-stock and
reorder lists. - `i18n/`: Hindi and English strings. - `components/`:
reusable UI components. - `tests/`: domain and workflow tests.

This is a suggested structure, not a reason to reorganize an existing
project unnecessarily.

## Data integrity rules

-   Use stable IDs for products, sales and stock movements.
-   Store quantity as decimal values; do not force all quantities to
    integers.
-   Show the unit anywhere a quantity appears.
-   Choose and document one stock-movement direction convention.
-   Do not mutate stock in multiple independent places in the UI.
-   Centralize stock-changing operations in a domain/service layer.
-   Make stock update and movement creation as atomic as the chosen
    IndexedDB approach permits.
-   Use unique operation IDs or equivalent protection against duplicate
    submission.
-   Validate all quantities before writing.
-   Archive products rather than deleting historical records.
-   Keep timestamps and preserve movement history.
-   Handle missing products and corrupted/invalid imported data safely.

## Reorder rules

Use explainable rules: - If enough sales history exists, calculate
average daily sales. - Target stock = average daily sales × supplier
lead time + safety stock. - Reorder quantity = max(0, target stock −
current stock). - Round to the configured purchase increment/pack
size. - If sales history is insufficient, use the configured
minimum-stock threshold and label the basis. - If there is no reliable
basis, request configuration or show "Not enough data." - Slow-moving
logic must consider product age and last-sale history; newly added
products must not be mislabeled as dead stock.

## UX rules

-   Home screen is an actionable list, not a chart dashboard.
-   Primary actions: **Record Sale** and **Add Stock**.
-   No scrolling should be required to reach the main confirmation
    button in common flows on a typical phone.
-   Use large, high-contrast touch targets and inline validation.
-   Make quantity adjustments easy with plus/minus controls and numeric
    entry.
-   Show available stock before confirming a sale.
-   Show immediate, honest saved/offline status.
-   Do not use "SKU" without an explanation; prefer "Product code" if
    needed.
-   Support Hindi and English for all user-visible strings. Avoid
    hard-coded strings inside components.
-   Provide empty states and recovery guidance.
-   Avoid excessive confirmation dialogs; use them only for destructive
    or risky actions.

## Offline/PWA rules

-   Cache the app shell and required static assets.
-   All core inventory operations must work offline after initial
    load/installation.
-   Do not assume service-worker caching alone makes data persistent;
    use IndexedDB.
-   Display offline state honestly.
-   Version service-worker caches and test app updates.
-   Do not imply that local data is backed up remotely.
-   Warn users that clearing browser/site data can erase local data.
-   Provide backup export/import when implementing that feature;
    validate schema/version before import.

## Security and privacy

-   Do not include secrets or credentials in source code.
-   Do not add analytics or third-party trackers by default.
-   Avoid transmitting product or sales data over the network.
-   Validate imported files and reject malformed or unsupported formats
    without overwriting current data.
-   Never log sensitive shop data unnecessarily.

## Testing requirements

Write automated tests for: - Adding a product and opening stock. - Sale
reduces stock by the exact decimal quantity. - Receiving stock increases
stock correctly. - Invalid, zero, negative and excessive quantities. -
Duplicate submission prevention. - Low-stock threshold behaviour. -
Reorder calculation with adequate history. - Minimum-stock fallback when
history is insufficient. - Fractional quantities and pack-size
rounding. - Persistence across reload/reopen where testable. -
Hindi/English core labels. - Offline core flows and service-worker cache
behaviour.

Before declaring a task complete: 1. Run the project's
lint/type-check/test/build scripts when available. 2. Fix errors
introduced by the change. 3. State what was implemented and what remains
incomplete. 4. Never claim a test passed unless it was actually run.

## Working process for coding agents

1.  Inspect the repository and existing scripts before editing.
2.  Summarize the current structure and identify the smallest
    implementation plan.
3.  Implement the P0 path end-to-end before optional features.
4.  Keep domain logic independent of presentation where practical.
5.  Add tests alongside business logic, not only at the end.
6.  Verify on a narrow mobile viewport.
7.  Test airplane mode and app restart; do not rely only on simulated
    UI.
8.  Update README/setup instructions when commands or configuration
    change.
9.  Avoid broad rewrites and unnecessary packages.
10. If a requirement is ambiguous, choose the simplest safe behaviour
    and document the assumption.

## Completion checklist

-   [ ] Product CRUD and search work.
-   [ ] Sale and stock receipt update quantity and movement history
    correctly.
-   [ ] Decimal quantities work.
-   [ ] Low-stock and reorder lists update immediately.
-   [ ] Hindi and English work across core screens.
-   [ ] Data persists after refresh/restart.
-   [ ] Core operations work offline after caching.
-   [ ] Duplicate submissions are guarded.
-   [ ] Automated tests, type-check and build pass where configured.
-   [ ] README describes setup, offline limitations and backup
    implications.
