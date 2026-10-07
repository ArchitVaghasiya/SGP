# SupplyIQ — Frontend Redesign & Information Architecture Plan
**Project:** SupplyIQ — AI-Powered Supply Chain Control Tower  
**Visual Identity:** Enterprise SaaS + AI Analytics Platform + Supply Chain Command Center  
**Tech Stack:** React 19, Vite, Recharts, Lucide Icons, Vanilla Modern CSS  

---

## 1. Current State vs Proposed Enterprise Experience

### Current State
* Single-page dashboard with tightly coupled view of Store 1.
* Hardcoded store and product fallback arrays in `api.js`.
* Missing authentication, RBAC, supplier tracking, SKU deep-dive pages, analytics studio, alert center, simulation studio, and audit trails.

### Proposed Enterprise Architecture (`SupplyIQ`)
* **Multi-Page / View Application Shell**: Collapsible left sidebar, global top bar with Ctrl+K command palette, notifications drawer, store/date filters, theme switcher (Light / Dark), and user profile.
* **13 Specialized Enterprise Views**:
  1. **Landing / Login** (`/login`) — Split branded screen with demo login presets for 5 roles (`ADMIN`, `MANAGER`, `INVENTORY_MANAGER`, `ANALYST`, `VIEWER`).
  2. **Executive Control Tower** (`/dashboard`) — High-level enterprise KPIs, Actual vs Forecast demand curves, AI Action Center, and Smart Reorder Recommendations.
  3. **Explainable Decision Drawer** — Side panel answering *"Why should I reorder this product?"* with visual waterfall breakdown from live data.
  4. **Inventory Matrix** (`/inventory`) — Full inventory table with 6 health states (`HEALTHY`, `LOW_STOCK`, `CRITICAL`, `STOCKOUT`, `OVERSTOCK`, `DEAD_STOCK`), search, sorting, pagination, and stock adjustment dialogs.
  5. **SKU Intelligence Detail** (`/inventory/:id`) — Comprehensive product view with 30-day sales history, 7-day forecast bands, safety buffer parameters, supplier info, and transaction history.
  6. **Forecast Center** (`/forecasts`) — Model accuracy metrics ($WAPE = 7.86\%$, MAE, RMSE, Bias), category accuracy, store accuracy, and error tracking.
  7. **Purchase Order Center** (`/purchase-orders`) — State machine workflow (`DRAFT` ➔ `PENDING` ➔ `APPROVED` ➔ `SENT` ➔ `RECEIVED` ➔ `CANCELLED`), order timeline, and receiving inventory.
  8. **Supplier Center** (`/suppliers`) — Supplier scorecard with reliability ratings, lead times, MOQ, on-time delivery %, and purchase volume.
  9. **Store Management** (`/stores`) — Multi-store network benchmarking and performance metrics.
  10. **Alert Center** (`/alerts`) — Real-time operational alerts with severity levels, unread counter, and acknowledge/resolve actions.
  11. **Supply Chain Analytics Studio** (`/analytics`) — ABC Pareto Analysis, XYZ Demand Variability Classification, 9-box ABC-XYZ Matrix, and turnover diagnostics.
  12. **What-If Scenario Simulator** (`/simulations`) — Interactive simulation studio modeling demand surges, lead time delays, and stockout timelines without mutating real data.
  13. **Inventory Transaction Ledger & Audit Logs** (`/transactions` & `/audit`) — Immutable ledger logs and user mutation audits.

---

## 2. Design System & Tokens

* **Theme Engine**: True dual-mode (`dark` / `light`) using CSS custom properties (`--bg-primary`, `--bg-card`, `--text-primary`, `--border-color`, `--accent-primary`, `--accent-cyan`, `--danger`, `--warning`, `--success`, `--info`).
* **Typography**: Clean modern sans-serif (`Inter`, system fonts) with strict typographic scale ($11px$ to $32px$) and tabular numbers for financial and stock figures.
* **Component Kit**:
  * `Button` (Primary, Secondary, Outline, Danger, Ghost, Small, Large)
  * `StatCard` (Metric, Delta trend, Context label, Icon badge, Click-through)
  * `Badge` (Status indicators: Critical, Warning, Healthy, Stockout, Overstock, Draft, Approved, Sent, Received)
  * `DataTable` (Search, Filter, Column sorting, Pagination, Selection, Skeletons, Empty states)
  * `ChartContainer` (Responsive Recharts wrappers with custom tooltips, legends, and time toggles)
  * `Modal` & `SideDrawer` (Accessible overlays with smooth CSS slide/fade animations)
  * `CommandPalette` (Global quick search with `Ctrl + K`)
  * `ToastContainer` (Non-intrusive alert toasts for system feedback)

---

## 3. Responsive Strategy

| Breakpoint | Layout Adaptations |
| :--- | :--- |
| **Desktop (≥1280px)** | Expanded 260px sidebar, 4-column KPI grids, dual-column analytics, full tables. |
| **Laptop / Tablet (768px - 1279px)** | Collapsible 70px icon sidebar, 2-column KPI grids, responsive scrolling charts. |
| **Mobile (<768px)** | Off-canvas drawer navigation, single-column stacked KPI cards, touch-optimized table cards. |

---

## 4. Backend API Mapping

```text
/api/v1
├── /auth               (login, register, me, refresh)
├── /dashboard          (executive KPIs, control tower charts, action center items)
├── /inventory          (list, health counts, sku detail, adjust, transactions)
├── /forecasts          (forecast metrics, store/category accuracy, sku forecast)
├── /purchase-orders    (list, create, approve, reject, send, receive, cancel)
├── /suppliers          (list, detail, performance scorecard)
├── /stores             (store network metrics, store comparison)
├── /alerts             (list, acknowledge, resolve, unread count)
├── /analytics          (ABC classification, XYZ variability, turnover, aging)
├── /simulations        (what-if scenario calculation)
└── /audit              (user mutation trail)
```
