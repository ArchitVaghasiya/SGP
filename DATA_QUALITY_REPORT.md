# SupplyIQ — Database Data Quality Report
**Generated**: 2026-10-06 23:25:45 UTC
**Target Database**: Neon PostgreSQL Serverless (Production)

---

## 1. Summary of Database Entities & Record Counts

| Entity / Table | Record Count | Quality Status | Verified Invariant |
| :--- | :--- | :--- | :--- |
| `sales_history` | **3,000,888** | `HEALTHY` | Zero negative sales; Dates: 2013-01-01 to 2017-08-15 |
| `stores` | **54** | `HEALTHY` | 54 retail store locations across 17 clusters |
| `products` | **33** | `HEALTHY` | All 33 product families linked to suppliers |
| `inventory` | **1,782** | `HEALTHY` | 54 stores x 33 products = 1,782 records (zero negative stock) |
| `forecasts` | **8,547** | `HEALTHY` | LightGBM inference outputs indexed |
| `purchase_orders` | **46** | `HEALTHY` | Formatted PO numbers with supplier linkages |
| `suppliers` | **8** | `HEALTHY` | 8 Regional vendor entities with scorecards |
| `stock_alerts` | **9** | `HEALTHY` | Operational severity-tagged alerts |
| `audit_logs` | **3** | `HEALTHY` | System state mutation audit records |

---

## 2. Foreign Key & Relational Consistency

- **Inventory $\rightarrow$ Store**: 100% matched (Zero orphan inventory rows)
- **Inventory $\rightarrow$ Product**: 100% matched (Zero orphan inventory rows)
- **Sales $\rightarrow$ Store & Product**: 100% referential consistency across 3,000,888 records
- **Purchase Orders $\rightarrow$ Store & Product & Supplier**: 100% referential integrity

---

## 3. Data Invariants & Quality Validation

- **Zero Negative Inventory**: PASSED (0 negative stock records)
- **Zero Negative Sales Transactions**: PASSED (0 negative sales)
- **Double-Entry Ledger Delta Equality**: PASSED (previous_qty + delta == resulting_qty)
- **Alembic Database Version**: At HEAD (`3f0d7fc504e5`)

---

## 4. Overall Database Health

**Verdict**: **100% PRODUCTION READY & CERTIFIED**