# SupplyIQ — Real-Data Audit & End-to-End Integrity Matrix

## 1. Audit Scope & Objective
This audit examines all 12 platform views and their corresponding backend API endpoints, database queries, mathematical derivations, and rendering flows to ensure:
- Zero hardcoded mock arrays pretending to be live analytics.
- Real queries executed against **Neon PostgreSQL** (3,000,888 sales transactions, 8,547 forecasts, 1,782 inventory records).
- Single source of truth for ML forecasting and statistical restock equations.
- Strict error handling, empty state resilience, and pagination bounding.

---

## 2. Component & Page Data Audit Matrix

| Page / View | Component | Data Displayed | Live Neon Query / Source | Hardcoded / Mock? | Backend Endpoint | Status & Hardening Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Login** | `LoginView` | 5 Demo Roles | `db.query(User)` / `auth.py` | Demo presets intentional | `GET /api/v1/auth/demo-users` | **VERIFIED** (Live bcrypt DB auth) |
| **Control Tower** | `ControlTowerView` | Total Inventory Value, Stockouts, Overstock | `db.query(Inventory, Product)` | No (Live SQL aggregation) | `GET /api/v1/dashboard/overview` | **VERIFIED** |
| **Control Tower** | `ControlTowerView` | Demand vs Forecast Curve | `db.query(SalesHistory)` + `db.query(Forecast)` | Was synthetic loop | `GET /api/v1/dashboard/overview` | **HARDENED** (Switched to real daily sales aggregate) |
| **Control Tower** | `ControlTowerView` | 6-State Health Matrix | `Inventory.current_stock` vs `safety_buffer` | No (Live SQL computation) | `GET /api/v1/dashboard/overview` | **VERIFIED** |
| **Control Tower** | `ControlTowerView` | AI Action Center | Active alert & critical stock count | No (Live Neon count) | `GET /api/v1/dashboard/overview` | **VERIFIED** |
| **Control Tower** | `ControlTowerView` | Restock Recommendations | Evaluated shortfall on active SKUs | No (Live formula) | `GET /api/v1/dashboard/overview` | **VERIFIED** |
| **Decision Drawer**| `ExplainableDrawer`| Waterfall Math Breakdown | Step-by-step formula from live SKU | No (Live calculation) | Live state passed from rec | **VERIFIED** |
| **Inventory** | `InventoryView` | 1,782 SKU Catalog | `db.query(Inventory, Product, Store)` | No (Live SQL with pagination) | `GET /api/v1/inventory/list` | **VERIFIED** |
| **SKU Intelligence**| `SKUIntelligenceView`| 30d Sales + 7d Forecast Band| `SalesHistory` + `predict_next_7_days` | No (Live ML inference + DB) | `GET /api/v1/forecast/sku/{s}/{p}` | **VERIFIED** |
| **SKU Intelligence**| `SKUIntelligenceView`| Transaction History | `db.query(InventoryTransaction)` | No (Live immutable ledger) | `GET /api/v1/inventory/transactions` | **VERIFIED** |
| **Forecasts** | `ForecastsView` | Model WAPE, MAE, Feature Weights | Validated LightGBM parameters | No (Model metadata) | `GET /api/v1/forecast/metrics` | **VERIFIED** (WAPE = 7.86%) |
| **Forecasts** | `ForecastsView` | Category & Store Benchmarks | `Product.family` & `Store` aggregates | No (Live category/store DB) | `GET /api/v1/forecast/accuracy-by-*`| **VERIFIED** |
| **Purchase Orders**| `PurchaseOrdersView`| PO State Machine & Lifecycle | `db.query(PurchaseOrder, Product, Supplier)`| No (Live relational query) | `GET /api/v1/purchase-orders/list` | **VERIFIED** |
| **Suppliers** | `SuppliersView` | Vendor Scorecards & On-Time % | `db.query(Supplier, Product, PO)` | No (Live supplier entities) | `GET /api/v1/suppliers/list` | **VERIFIED** |
| **Stores** | `StoresView` | 54 Store Benchmarks & Stock | `db.query(Store, Inventory, Product)` | No (Live SQL aggregation) | `GET /api/v1/stores/list` | **VERIFIED** |
| **Alert Center** | `AlertsView` | Operational Warnings | `db.query(StockAlert)` | No (Live database alerts) | `GET /api/v1/alerts/list` | **VERIFIED** |
| **Analytics** | `AnalyticsView` | Pareto ABC Curve & XYZ Matrix | `STDDEV(sales)` / `AVG(sales)` | Was static map | `GET /api/v1/analytics/abc-xyz` | **HARDENED** (Real SQL $\sigma/\mu$ calculation) |
| **What-If Studio** | `SimulationView` | 21-Day Stress Projection | In-memory sandbox formula | No (Explicit simulation mode)| `POST /api/v1/simulations/run` | **VERIFIED** (Zero DB side effects) |
| **Ledger** | `TransactionsView` | Audit Stock Delta Log | `db.query(InventoryTransaction)` | No (Live immutable ledger) | `GET /api/v1/inventory/transactions` | **VERIFIED** |
| **Audit Trail** | `AuditView` | System Mutation Log | `db.query(AuditLog)` | No (Live governance records) | `GET /api/v1/audit/logs` | **VERIFIED** |
| **Command Palette**| `CommandPalette` | Global Search Ctrl+K | Real database search query | Was static frontend links | `GET /api/v1/search` | **HARDENED** (Added live DB search) |

---

## 3. End-to-End API Inventory & Security Matrix

| Method | Endpoint | Auth Required | Roles Permitted | Request Schema | Response Model | Primary Database Entities |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | No | Public | `LoginRequest` (email, pw) | `LoginResponse` (JWT, user) | `users` |
| `POST` | `/api/v1/auth/register` | No | Public | `RegisterRequest` | `UserProfileResponse` | `users` |
| `GET` | `/api/v1/auth/me` | Bearer JWT | All authenticated | None | `UserProfileResponse` | `users` |
| `GET` | `/api/v1/auth/demo-users`| No | Public | None | List of Demo Users | `users` |
| `GET` | `/api/v1/dashboard/overview` | Optional | All | Query: `store_id` | KPIs, Health, Trend, Action | `inventory`, `products`, `sales_history`, `purchase_orders` |
| `GET` | `/api/v1/inventory/list` | Optional | All | Query: `store_id`, `status`, `search` | Paginated SKU List | `inventory`, `products`, `stores` |
| `GET` | `/api/v1/inventory/sku/{s}/{p}` | Optional | All | Path: `store_id`, `product_id` | Full SKU Detail | `inventory`, `products`, `stores`, `suppliers` |
| `POST` | `/api/v1/inventory/update` | Bearer JWT | `ADMIN`, `MANAGER`, `INVENTORY_MANAGER` | `StockAdjustmentRequest` | Transaction Confirmation | `inventory`, `inventory_transactions`, `audit_logs` (Atomic) |
| `GET` | `/api/v1/inventory/transactions` | Optional | All | Query: `store_id`, `type`, `limit` | Paginated Transactions | `inventory_transactions`, `products` |
| `GET` | `/api/v1/forecast/metrics` | Optional | All | None | ML Model Performance | `forecasts` |
| `GET` | `/api/v1/forecast/sku/{s}/{p}` | Optional | All | Path: `store_id`, `product_id` | Time Series (30d + 7d) | `sales_history`, LightGBM Inference |
| `GET` | `/api/v1/purchase-orders/list` | Optional | All | Query: `status`, `store_id` | Paginated POs & Counts | `purchase_orders`, `products`, `stores`, `suppliers` |
| `POST` | `/api/v1/purchase-orders/create` | Bearer JWT | `ADMIN`, `MANAGER`, `INVENTORY_MANAGER` | `POCreateRequest` | `POActionResponse` | `purchase_orders`, `audit_logs` |
| `POST` | `/api/v1/purchase-orders/{id}/approve` | Bearer JWT | `ADMIN`, `MANAGER` | None | `POActionResponse` | `purchase_orders`, `audit_logs` |
| `POST` | `/api/v1/purchase-orders/{id}/send` | Bearer JWT | `ADMIN`, `MANAGER`, `INVENTORY_MANAGER` | None | `POActionResponse` | `purchase_orders`, `audit_logs` |
| `POST` | `/api/v1/purchase-orders/{id}/receive` | Bearer JWT | `ADMIN`, `MANAGER`, `INVENTORY_MANAGER` | None | `POActionResponse` | `purchase_orders`, `inventory`, `inventory_transactions` (Atomic) |
| `POST` | `/api/v1/purchase-orders/{id}/cancel` | Bearer JWT | `ADMIN`, `MANAGER` | None | `POActionResponse` | `purchase_orders`, `audit_logs` |
| `GET` | `/api/v1/suppliers/list` | Optional | All | None | Supplier Summaries | `suppliers`, `products`, `purchase_orders` |
| `GET` | `/api/v1/suppliers/{id}/scorecard` | Optional | All | Path: `supplier_id` | Vendor Scorecard | `suppliers`, `purchase_orders` |
| `GET` | `/api/v1/stores/list` | Optional | All | None | 54 Store Summaries | `stores`, `inventory`, `products` |
| `GET` | `/api/v1/stores/compare` | Optional | All | None | Benchmark Series | `stores`, `inventory` |
| `GET` | `/api/v1/alerts/list` | Optional | All | Query: `severity`, `status` | Paginated Alerts | `stock_alerts`, `products`, `stores` |
| `POST` | `/api/v1/alerts/{id}/acknowledge` | Bearer JWT | All authenticated | None | Status Confirmation | `stock_alerts` |
| `POST` | `/api/v1/alerts/{id}/resolve` | Bearer JWT | All authenticated | None | Status Confirmation | `stock_alerts` |
| `GET` | `/api/v1/analytics/abc-xyz` | Optional | All | None | 9-Box Matrix & Pareto | `products`, `inventory`, `sales_history` |
| `POST` | `/api/v1/simulations/run` | Optional | All | `SimulationRequest` | Stress Outcome Projection | In-Memory Computation (Zero DB Side Effects) |
| `GET` | `/api/v1/audit/logs` | Bearer JWT | `ADMIN`, `MANAGER` | Query: `entity`, `limit` | Paginated Audit Logs | `audit_logs` |
| `GET` | `/api/v1/search` | Optional | All | Query: `q` | Multi-Entity Search | `products`, `stores`, `suppliers`, `purchase_orders`, `stock_alerts` |
