# Comprehensive Codebase Audit Report
**Project:** Automated Supply Chain Restock & Stockout Prevention Engine  
**Date:** October 2026  
**Auditor:** Senior Staff Full-Stack & ML Systems Architect  

---

## 1. Executive Summary

An exhaustive technical audit of the **Automated Supply Chain Restock & Stockout Prevention Engine** was conducted across the backend (FastAPI), database architecture, machine learning pipeline (LightGBM), frontend dashboard (React 19 + Vite), test suite, and infrastructure.

The core data science foundations (LightGBM model trained on 3M Kaggle Corporación Favorita records with out-of-time validation) and statistical safety stock logic are solid. However, the application currently operates as a prototype rather than an enterprise-grade SaaS platform. Significant technical debt, architectural bottlenecks, missing security mechanisms (RBAC/Auth), and database schema normalization gaps were identified.

---

## 2. Current Architecture & Data Flow

```text
Raw Sales Data (Kaggle CSVs)
       │
       ▼
   ETL Pipeline (ingest.py / fast_pg_copy)
       │
       ▼
PostgreSQL / Neon DB (stores, products, sales_history, inventory, oil, holidays)
       │
       ▼
Feature Engineering (feature_engineering.py - lag t-1, t-7, t-14, rolling 7d/28d, calendar, oil)
       │
       ▼
ML Model Inference (predict.py - LightGBM Regressor model_v1.pkl)
       │
       ├──► 7-Day Cumulative Demand Forecast
       │
       ▼
Statistical Safety Stock Engine (safety_buffer.py - Z * σ * √L)
       │
       ▼
Restock Decision Engine (restock.py - Threshold & Shortfall evaluation)
       │
       ├──► Purchase Orders Generation (purchase_orders table)
       │
       ▼
FastAPI REST API Layer (/forecast, /restock, /inventory)
       │
       ▼
React 19 + Vite Frontend (Navbar, KPIDashboard, InventoryMatrix, ForecastVisualizer, PO Manager)
```

---

## 3. Component Deep Dive & Findings

### 3.1 Database & Schema Layer (`src/db/`)
* **Current State**: Uses SQLAlchemy ORM models (`Store`, `Product`, `Inventory`, `SalesHistory`, `Forecast`, `PurchaseOrder`, `HolidayEvent`, `OilPrice`).
* **Strengths**: 
  - Schema captures primary retail entities.
  - Foreign keys with `CASCADE` rules on major tables.
  - Efficient indexes on composite keys `(store_id, product_id, date)`.
* **Gaps & Critical Issues**:
  - **No Alembic Migration System**: Schema changes previously relied on raw DDL drops/creates.
  - **Missing Core Entities**: No `users`, `roles`, `suppliers`, `supplier_products`, `inventory_transactions`, `stock_alerts`, `audit_logs`, `forecast_runs`.
  - **Destructive Stock Mutations**: Stock levels in `inventory.current_stock` are overwritten without transaction ledgers or audit history.
  - **Missing Timestamp Columns**: `stores`, `products`, `sales_history` lack `created_at` / `updated_at`.
  - **Purchase Order Workflow Gap**: POs only have statuses (`PENDING`, `APPROVED`, `FULFILLED`, `CANCELLED`) without multi-item line support, cost tracking, supplier linkage, or receiving transactions.

---

### 3.2 Machine Learning & Forecasting (`src/ml/` & `src/etl/`)
* **Current State**: LightGBM regressor predicting cumulative 7-day future sales with lag features ($t-1, t-7, t-14$), rolling windows ($7d, 28d$), calendar/weekend indicators, holiday joins, and oil prices.
* **Strengths**:
  - Strict out-of-time validation (final 60 days).
  - High performance ($WAPE = 7.86\%$, $RMSE = 901.30$, $MAE = 261.80$).
  - Clean feature alignment between `train.py` and `predict.py`.
* **Gaps & Critical Issues**:
  - **No Confidence Intervals**: Only point forecasts returned; lacks prediction uncertainty bands ($P_{10}, P_{50}, P_{90}$).
  - **Hardcoded Fallbacks**: When history is short (<14 days), fallback defaults to a flat 10.0 units without trend awareness.
  - **No Model Tracking / Evaluation Endpoint**: Validation metrics exist only in training logs; no API endpoint serves model accuracy or feature importance to the UI.

---

### 3.3 Backend API & Business Logic (`src/api/` & `src/services/`)
* **Current State**: FastAPI application with endpoints for health, 7-day forecast, restock evaluation, and inventory updates.
* **Strengths**:
  - Pydantic v2 schemas for request/response serialization.
  - Decoupled `services/restock.py` and `services/safety_buffer.py` allowing pure unit testing.
* **Gaps & Critical Issues**:
  - **Zero Authentication / RBAC**: All endpoints are public; anyone can modify stock or trigger purchase orders.
  - **Wildcard CORS**: `allow_origins=["*"]` without origin protection.
  - **Side-effect on GET**: `/restock/evaluate` is a `GET` request that mutates the database by inserting purchase orders and updating safety buffer columns (violates HTTP idempotency).
  - **Limited Endpoints**: No endpoints for suppliers, stock alerts, SKU analytics, audit logs, store comparison, or what-if simulations.

---

### 3.4 Frontend Dashboard (`frontend/src/`)
* **Current State**: Single-page React 19 app with dark glassmorphism styling, KPI cards, inventory matrix table, Recharts visualizer, and PO list.
* **Strengths**:
  - Responsive design tokens, clear color hierarchy.
  - Interactive Recharts demand curve and stock depletion curve.
  - Modals for stock adjustment and restock evaluation summary.
* **Gaps & Critical Issues**:
  - **Hardcoded Mock Fallbacks in `api.js`**: `STORES` and `PRODUCTS` arrays are hardcoded in client code instead of fetched dynamically from backend APIs.
  - **Single Page Monolith**: Lacks dedicated views for SKU Detail, Supplier Management, Executive Control Tower, Forecast Accuracy, Analytics, and Simulation.
  - **Missing Enterprise Features**: No authentication/login, user profile, role-based action gating, toast notification system, or server-side pagination/filtering.

---

### 3.5 Infrastructure & DevOps
* **Current State**: Dockerfile and docker-compose orchestration.
* **Strengths**:
  - Containerized FastAPI setup with Python 3.11.
* **Gaps & Critical Issues**:
  - `docker-compose.yml` still references local PostgreSQL container while Neon PostgreSQL is the designated target.
  - Missing healthcheck endpoint with live DB ping (`/health`).
  - Missing automated migration runner on container startup.

---

## 4. Technical Debt & Risk Matrix

| Risk Area | Severity | Impact | Resolution Priority |
| :--- | :--- | :--- | :--- |
| **No Authentication / Authorization** | Critical | Unauthorized stock changes & order creation | **P0** |
| **Alembic Migrations Absent** | High | Uncontrolled schema drift in production DB | **P0** |
| **GET Request Mutates DB (`/restock/evaluate`)** | High | Idempotency violation, unintentional PO creation | **P0** |
| **Hardcoded Frontend Store/Product Lists** | Medium | Out of sync with database additions | **P0** |
| **No Inventory Transaction Ledger** | High | Untraceable inventory discrepancies | **P0** |
| **Missing Supplier Management** | Medium | POs cannot track vendors, lead times, or costs | **P1** |
| **No Alert & Anomaly Engine** | Medium | Delayed operational response to stockouts | **P1** |
| **No What-If Simulator** | Low | Cannot model supply chain shocks | **P1** |

---

## 5. Summary Recommendation

Preserve the battle-tested **LightGBM model and feature pipeline**, and systematically upgrade the database schema, security layer (JWT + RBAC), enterprise services (Suppliers, Inventory Transactions, Alerts, Audit), and frontend UI (Modular Multi-Tab Control Tower with SKU Detail, Analytics, Simulation, and AI Explanations) in strict phases.
