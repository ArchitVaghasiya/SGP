# Neon PostgreSQL Database Baseline & Schema Documentation
**Environment:** Neon Serverless PostgreSQL  
**Active Migration Revision:** `dd83841f8382` (head)  
**Date Established:** October 2026  

---

## 1. Overview & Architecture

The database serves as the persistent core for the AI-Powered Supply Chain Restock and Stockout Prevention Engine. It is hosted on Neon Serverless PostgreSQL with connection pooling (`-pooler`), SSL encryption (`sslmode=require`), and version-controlled migrations via Alembic.

---

## 2. Table Specifications & Relationships

### `stores`
Primary store attributes across the retail network.
* **Columns**:
  * `store_id` (INTEGER, Primary Key)
  * `city` (VARCHAR(100), NOT NULL)
  * `state` (VARCHAR(100), NOT NULL)
  * `store_type` (VARCHAR(10), NOT NULL)
  * `cluster` (INTEGER, NOT NULL)
* **Relationships**: Has many `inventory`, `sales_history`, `forecasts`, `purchase_orders`, `inventory_transactions`.

---

### `products`
Product hierarchy, classifications, and perishability flags.
* **Columns**:
  * `product_id` (INTEGER, Primary Key, Auto-increment)
  * `family` (VARCHAR(100), UNIQUE, NOT NULL)
  * `class_id` (INTEGER, DEFAULT 0)
  * `perishable` (BOOLEAN, DEFAULT FALSE)
* **Relationships**: Has many `inventory`, `sales_history`, `forecasts`, `purchase_orders`, `inventory_transactions`.

---

### `inventory`
Store-level stock counts, statistical safety stock buffers, and service levels.
* **Columns**:
  * `store_id` (INTEGER, FK -> `stores.store_id`, Primary Key Component)
  * `product_id` (INTEGER, FK -> `products.product_id`, Primary Key Component)
  * `current_stock` (NUMERIC(12, 2), NOT NULL, DEFAULT 0.00)
  * `safety_buffer` (NUMERIC(12, 2), NOT NULL, DEFAULT 0.00)
  * `lead_time_days` (INTEGER, NOT NULL, DEFAULT 7)
  * `service_level` (NUMERIC(4, 3), NOT NULL, DEFAULT 0.950)
  * `last_updated` (TIMESTAMP WITH TIME ZONE)
* **Indexes**:
  * `idx_inventory_store_product` on `(store_id, product_id)`

---

### `sales_history`
Granular historical daily sales transactions (3M+ records).
* **Columns**:
  * `id` (INTEGER, Primary Key, Auto-increment)
  * `date` (DATE, NOT NULL)
  * `store_id` (INTEGER, FK -> `stores.store_id`, NOT NULL)
  * `product_id` (INTEGER, FK -> `products.product_id`, NOT NULL)
  * `sales` (NUMERIC(12, 2), NOT NULL, DEFAULT 0.00)
  * `onpromotion` (INTEGER, NOT NULL, DEFAULT 0)
* **Indexes**:
  * `idx_sales_history_lookup` on `(store_id, product_id, date)`
  * `idx_sales_history_date` on `(date)`
  * `idx_sales_history_store_date` on `(store_id, date)`
  * `idx_sales_history_prod_date` on `(product_id, date)`

---

### `forecasts`
Machine learning demand forecast outputs and daily projections.
* **Columns**:
  * `id` (INTEGER, Primary Key, Auto-increment)
  * `forecast_date` (DATE, NOT NULL)
  * `target_date` (DATE, NOT NULL)
  * `store_id` (INTEGER, FK -> `stores.store_id`, NOT NULL)
  * `product_id` (INTEGER, FK -> `products.product_id`, NOT NULL)
  * `predicted_demand` (NUMERIC(12, 2), NOT NULL)
  * `model_version` (VARCHAR(50), NOT NULL)
  * `created_at` (TIMESTAMP WITH TIME ZONE)
* **Indexes**:
  * `idx_forecasts_lookup` on `(store_id, product_id, target_date, forecast_date)`
  * `idx_forecasts_target_date` on `(target_date)`

---

### `purchase_orders`
Automated purchase orders generated upon inventory shortfall triggers.
* **Columns**:
  * `po_id` (INTEGER, Primary Key, Auto-increment)
  * `store_id` (INTEGER, FK -> `stores.store_id`, NOT NULL)
  * `product_id` (INTEGER, FK -> `products.product_id`, NOT NULL)
  * `order_date` (TIMESTAMP WITH TIME ZONE)
  * `order_quantity` (NUMERIC(12, 2), NOT NULL)
  * `predicted_demand_7d` (NUMERIC(12, 2), NOT NULL)
  * `current_stock` (NUMERIC(12, 2), NOT NULL)
  * `safety_buffer` (NUMERIC(12, 2), NOT NULL)
  * `shortfall` (NUMERIC(12, 2), NOT NULL)
  * `status` (VARCHAR(20), NOT NULL, DEFAULT 'PENDING')
  * `created_at` (TIMESTAMP WITH TIME ZONE)
* **Constraints**:
  * `check_po_status`: `status IN ('PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED', 'DRAFT', 'SENT', 'RECEIVED')`
* **Indexes**:
  * `idx_purchase_orders_store` on `(store_id, product_id, created_at)`
  * `idx_purchase_orders_status` on `(status)`

---

### `inventory_transactions`
Immutable ledger capturing every stock adjustment, receipt, and restock event.
* **Columns**:
  * `id` (INTEGER, Primary Key, Auto-increment)
  * `store_id` (INTEGER, FK -> `stores.store_id`, NOT NULL)
  * `product_id` (INTEGER, FK -> `products.product_id`, NOT NULL)
  * `transaction_type` (VARCHAR(50), NOT NULL)
  * `quantity_change` (NUMERIC(12, 2), NOT NULL)
  * `previous_quantity` (NUMERIC(12, 2), NOT NULL)
  * `resulting_quantity` (NUMERIC(12, 2), NOT NULL)
  * `reference_type` (VARCHAR(50))
  * `reference_id` (VARCHAR(100))
  * `notes` (TEXT)
  * `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)
* **Indexes**:
  * `idx_inv_tx_store_product` on `(store_id, product_id, created_at)`
  * `idx_inv_tx_type` on `(transaction_type)`

---

### `holidays_events` & `oil_prices`
Exogenous macroeconomic and calendar series used for ML feature engineering.
* **`holidays_events`**: `id`, `date`, `type`, `locale`, `locale_name`, `description`, `transferred`. Index on `(date)`.
* **`oil_prices`**: `id`, `date`, `dcoilwtico`. Index on `(date)`.

---

## 3. Verified Baseline Row Counts

| Table | Approximate Live Rows |
| :--- | :--- |
| `stores` | 54 |
| `products` | 33 |
| `inventory` | 1,782 |
| `forecasts` | 8,547 |
| `purchase_orders` | 46 |
| `holidays_events` | 350 |
| `oil_prices` | 1,218 |
| `sales_history` | 3,000,888 |
| `inventory_transactions` | Active Ledger |
| `alembic_version` | Current revision: `dd83841f8382` |

---

## 4. Alembic Migration Workflow
1. To inspect migration status:
   ```bash
   alembic current
   ```
2. To create a new revision:
   ```bash
   alembic revision --autogenerate -m "description_of_change"
   ```
3. To upgrade database to head:
   ```bash
   alembic upgrade head
   ```
