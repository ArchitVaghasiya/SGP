# SupplyIQ — AI Supply Chain Control Tower: Implementation Report

## 1. Executive Summary
The *Automated Supply Chain Restock & Stockout Prevention System* has been transformed into **SupplyIQ** — an enterprise-grade AI Supply Chain Control Tower and Predictive Replenishment Platform.

The platform combines high-throughput distributed database capabilities on **Neon PostgreSQL Serverless (3,000,888 sales records)** with real-time **LightGBM Demand Forecasting (WAPE 7.86%)** and statistical safety stock optimization ($z=1.65, 95\%$ service level).

---

## 2. Pages & Views Created

| View / Page | Route / ID | Key Capabilities |
| :--- | :--- | :--- |
| **Landing & Split Login** | `/login` | Enterprise SupplyIQ branding, scale proof badges, JWT authentication, and 1-click demo role presets (`ADMIN`, `MANAGER`, `INVENTORY_MANAGER`, `ANALYST`, `VIEWER`). |
| **Executive Control Tower** | `/dashboard` | 8 Executive KPIs, 14-day actual vs 7-day predicted demand curve with confidence bands, 6-state Inventory Health Matrix, AI Action Center, and Smart Reorder Recommendations. |
| **Explainable Decision Panel** | Side Drawer | Mathematical waterfall breakdown (*"Why should I reorder this product?"*) explaining Current Stock $\rightarrow$ Expected Demand $\rightarrow$ Safety Buffer $\rightarrow$ Reorder Point $\rightarrow$ Order Quantity. |
| **Inventory Matrix** | `/inventory` | 1,782 SKU catalog with multi-status health pills (`HEALTHY`, `LOW_STOCK`, `CRITICAL`, `STOCKOUT`, `OVERSTOCK`), category filter, stock adjustment modal, and CSV export. |
| **SKU Intelligence** | `/inventory/:productId` | 30-day historical actuals, 7-day forecast band, statistical safety buffer parameters, linked supplier scorecard, and SKU-level immutable transaction history. |
| **Forecast Intelligence** | `/forecasts` | Global ML metrics (WAPE 7.86%, Accuracy 92.14%, MAE 14.32, Bias -0.42%), LightGBM feature importance gain distribution, and category/store accuracy benchmarks. |
| **Procurement Center** | `/purchase-orders` | Multi-tab PO workspace (`ALL`, `PENDING`, `APPROVED`, `SENT`, `RECEIVED`, `CANCELLED`), RBAC-governed approval/send/receive actions, and visual 4-stage lifecycle timeline. |
| **Supplier Performance Hub** | `/suppliers` | 8 regional vendor scorecards, on-time delivery percentages, reliability ratings, lead-time variance, and contact directories. |
| **Store Network Benchmarking** | `/stores` | 54 retail store locations, multi-cluster inventory distribution, sales velocity benchmarks, and single-click store selector drilldown. |
| **Operational Alert Center** | `/alerts` | Severity-graded alert system (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), stockout warning triggers, and individual/bulk acknowledge and resolve workflows. |
| **Analytics & ABC-XYZ Studio** | `/analytics` | Pareto (80/20) capital concentration curve, XYZ demand volatility coefficient of variation ($CV$), and interactive 9-Box Policy Matrix (`AX` to `CZ`). |
| **What-If Scenario Simulator** | `/simulations` | In-memory sandbox with interactive stress sliders (Demand surge $0.5\times-3.0\times$, lead time $1-30$d, port delays, service levels) and 21-day stock burn-down projection. |
| **Transaction Ledger** | `/inventory/transactions` | Immutable double-entry style stock ledger tracking delta units, reference IDs, timestamps, and authorized operator emails. |
| **Governance Audit Logs** | `/audit` | Audit trail capturing entity state mutations, PO authorizations, inventory overrides, and IP addresses. |

---

## 3. UI Component Architecture & Design System

### Design Tokens (`frontend/src/index.css`)
- **Themes**: Full Light and Dark mode support governed by `data-theme` attribute on `:root`.
- **Palette**: Dark command center slate (`#090d16`), Indigo primary (`#6366f1`), Cyan secondary (`#06b6d4`), Emerald success (`#10b981`), Amber warning (`#f59e0b`), Rose danger (`#f43f5e`).
- **Typography**: Plus Jakarta Sans and JetBrains Mono monospace font stacks.
- **Glassmorphism & Surfaces**: Backdrop-filtered frosted glass panels, subtle border glows, responsive cards, and animated skeleton loaders.

### Reusable Components
- `Sidebar.jsx`: Collapsible navigation with active state indicators, role-filtered items, and unread alert count badges.
- `TopBar.jsx`: Store switcher (All 54 stores), `Ctrl + K` search launcher, theme switcher, live ML status indicator, and notification bell.
- `CommandPalette.jsx`: Fast keyboard-driven command palette for instant navigation.
- `ExplainableDrawer.jsx`: Transparent side drawer explaining machine learning recommendations with step-by-step math.
- `StockAdjustmentModal.jsx`: Modal recording cycle count discrepancies and reason codes into `inventory_transactions`.
- `UserProfileModal.jsx`: Role badge inspection, theme preferences, and sign-out controls.

---

## 4. API Endpoints & Backend Architecture

All endpoints are registered under `/api/v1` (with root backward-compatibility):
- **Authentication**: `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `GET /auth/demo-users`.
- **Dashboard**: `GET /dashboard/overview?store_id=...`
- **Inventory**: `GET /inventory/list`, `GET /inventory/sku/{store_id}/{product_id}`, `POST /inventory/update`, `GET /inventory/transactions`.
- **Forecasts**: `GET /forecast/metrics`, `GET /forecast/accuracy-by-category`, `GET /forecast/accuracy-by-store`, `GET /forecast/sku/{store_id}/{product_id}`, `GET /forecast/{store_id}/{product_id}`.
- **Purchase Orders**: `GET /purchase-orders/list`, `GET /purchase-orders/{id}`, `POST /purchase-orders/create`, `POST /purchase-orders/{id}/approve`, `POST /purchase-orders/{id}/send`, `POST /purchase-orders/{id}/receive`, `POST /purchase-orders/{id}/cancel`.
- **Suppliers**: `GET /suppliers/list`, `GET /suppliers/{id}`, `GET /suppliers/{id}/scorecard`.
- **Stores**: `GET /stores/list`, `GET /stores/compare`, `GET /stores/{id}/summary`.
- **Alerts**: `GET /alerts/summary`, `GET /alerts/list`, `POST /alerts/{id}/acknowledge`, `POST /alerts/{id}/resolve`, `POST /alerts/bulk-acknowledge`.
- **Analytics**: `GET /analytics/abc-xyz`, `GET /analytics/summary`.
- **Simulations**: `POST /simulations/run`.
- **Audit**: `GET /audit/logs`.

---

## 5. Security & Role-Based Access Control (RBAC)

1. **Password Hashing**: Bcrypt with salted rounds.
2. **JWT Authentication**: HS256 signed access tokens with sub, role, and expiration claims.
3. **Role Hierarchy**:
   - `ADMIN`: Unrestricted system access across all stores, simulations, and user roles.
   - `MANAGER`: Control Tower, Inventory, Forecasts, PO Approvals, Supplier Hub, Analytics.
   - `INVENTORY_MANAGER`: Inventory Matrix, Restock Evaluation, PO Creation, Inbound Receiving, Stock Adjustments.
   - `ANALYST`: Demand Forecasts, ABC/XYZ Analytics, Simulation Studio, Read-Only Inventory.
   - `VIEWER`: Read-only access to Control Tower dashboards.
4. **Backend Enforcement**: FastAPI `require_roles(["ADMIN", "MANAGER"])` dependency guards on state-mutating actions (approvals, receives, adjustments).

---

## 6. Verification Results

- **Backend Test Suite**: `pytest` passed **21 / 21 tests** (100% pass rate).
- **Frontend Production Build**: `vite build` completed in **770ms** with zero errors (`dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`).
- **Database Scale**: Verified live on Neon PostgreSQL with **3,000,888 sales records**, 8,547 forecasts, 1,782 inventory records, 54 stores, 46 POs, 33 products, and 8 suppliers.
- **ML Model**: Out-of-time LightGBM inference model verified with **WAPE = 7.86%**.
