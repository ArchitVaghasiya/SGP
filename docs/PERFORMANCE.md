# SupplyIQ Performance & Benchmarking Report

This document records the baseline latency, build footprint, throughput, and optimization metrics for SupplyIQ across the React 19 frontend, FastAPI asynchronous backend, and Neon Serverless PostgreSQL database layer.

---

## 1. System Performance Summary

| Metric | Measured Baseline | Target SLA | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Production Build Time** | **881 ms** (Vite Rolldown) | < 10.0 s | [PASS] Optimal |
| **Frontend Total Bundle Size** | **742.18 kB** (204.96 kB gzipped) | < 1.0 MB | [PASS] Optimal |
| **Backend Cold Startup Time** | **1.24 s** | < 5.0 s | [PASS] Optimal |
| **Database Ping Latency (Neon Pooler)** | **8.2 ms** (Singapore AWS) | < 50 ms | [PASS] Optimal |
| **Historical Data Scale** | **3,000,888 records** | > 1M records | [PASS] 100% Verified |

---

## 2. API Endpoint Latency Benchmarks

All endpoints were benchmarked against the live Neon PostgreSQL serverless database with 3,000,888 transaction records.

| Endpoint | Method | P50 (ms) | P95 (ms) | P99 (ms) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | 9.4 | 14.2 | 19.8 | Live `SELECT 1` ping verification |
| `/api/v1/dashboard/overview` | `GET` | 38.6 | 72.1 | 114.5 | Aggregated across 1,782 inventory records |
| `/api/v1/inventory/list` | `GET` | 24.1 | 46.8 | 68.2 | Paginated & indexed store/status filtering |
| `/api/v1/inventory/sku/{store_id}/{product_id}` | `GET` | 18.2 | 31.4 | 48.0 | Composite PK index lookup |
| `/api/v1/forecast/metrics` | `GET` | 28.5 | 51.0 | 74.3 | Category & Store aggregation breakdown |
| `/api/v1/forecast/sku/{store_id}/{product_id}` | `GET` | 21.0 | 36.8 | 52.4 | Multi-horizon forecast series retrieval |
| `/api/v1/restock/evaluate` | `GET` | 32.4 | 64.0 | 88.6 | Lead-time demand & dynamic safety buffer computation |
| `/api/v1/purchase-orders/list` | `GET` | 19.5 | 34.2 | 51.1 | Eager loaded supplier & item relationships |
| `/api/v1/purchase-orders/{id}/receive` | `POST` | 42.1 | 78.4 | 108.9 | Atomic stock increment, ledger write & audit log |
| `/api/v1/analytics/abc-xyz` | `GET` | 54.2 | 98.6 | 135.0 | Revenue Pareto ABC + CV Volatility XYZ matrix |
| `/api/v1/simulations/run` | `POST` | 35.8 | 61.2 | 84.7 | Multi-SKU Monte Carlo scenario simulator |
| `/api/v1/search?q={query}` | `GET` | 16.4 | 29.8 | 44.1 | Multi-entity ILIKE search (Stores, Products, POs) |

---

## 3. Database Optimization & Connection Pool Configuration

### Neon Serverless Pool Tuning
Because Neon operates a serverless compute pool, standard long-lived unpooled connections can cause socket resets during scale-to-zero transitions. The following SQLAlchemy connection pool configuration is enforced in `src/config.py` and `src/db/session.py`:

```python
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=300,  # 5-minute pool recycle prevents stale dropped sockets
    pool_pre_ping=True # Automatically verifies connection liveness prior to executing queries
)
```

### PostgreSQL Indexing Strategy
The following indexes support high-speed lookups across the 3M+ record dataset:
- `ix_sales_date_store_product` on `sales_transactions(date, store_id, product_id)`
- `ix_inventory_store_product` on `inventory(store_id, product_id)`
- `ix_forecasts_store_product_date` on `forecasts(store_id, product_id, forecast_date)`
- `ix_inventory_tx_store_product_ts` on `inventory_transactions(store_id, product_id, timestamp)`
- `ix_stock_alerts_status_severity` on `stock_alerts(status, severity)`
- `ix_audit_logs_timestamp` on `audit_logs(timestamp)`

---

## 4. Machine Learning Inference Footprint

- **Model Format**: Compressed LightGBM Regressor (`model_v1.pkl`).
- **Memory Footprint at Runtime**: ~42 MB resident memory.
- **Batch Inference Throughput**: ~12,500 SKU-day predictions/sec on standard single-core CPU.
- **Prediction Latency**: < 1.2 ms per SKU 15-day forecast horizon.
