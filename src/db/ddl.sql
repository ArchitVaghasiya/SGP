-- Database DDL for Supply Chain Restock & Stockout Prevention System

-- 1. STORES TABLE
CREATE TABLE IF NOT EXISTS stores (
    store_id INT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    store_type VARCHAR(10) NOT NULL,
    cluster INT NOT NULL
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    family VARCHAR(100) UNIQUE NOT NULL,
    class_id INT DEFAULT 0,
    perishable BOOLEAN DEFAULT FALSE
);

-- 3. INVENTORY TABLE (Current Stock & Replenishment Parameters per Store/Product)
CREATE TABLE IF NOT EXISTS inventory (
    store_id INT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    safety_buffer NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    lead_time_days INT NOT NULL DEFAULT 7,
    service_level NUMERIC(4, 3) NOT NULL DEFAULT 0.95,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id, product_id)
);

-- 4. SALES HISTORY TABLE (Normalized Kaggle Train Data)
CREATE TABLE IF NOT EXISTS sales_history (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    store_id INT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    sales NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    onpromotion INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sales_history_lookup 
ON sales_history (store_id, product_id, date DESC);

-- 5. FORECASTS TABLE (Logged ML Predictions)
CREATE TABLE IF NOT EXISTS forecasts (
    id BIGSERIAL PRIMARY KEY,
    forecast_date DATE NOT NULL,              -- Date forecast was calculated
    target_date DATE NOT NULL,                -- Target future date predicted
    store_id INT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    predicted_demand NUMERIC(12, 2) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forecasts_lookup 
ON forecasts (store_id, product_id, target_date, forecast_date DESC);

-- 6. PURCHASE ORDERS TABLE (Autonomous Restock Order Execution)
CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id BIGSERIAL PRIMARY KEY,
    store_id INT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    order_quantity NUMERIC(12, 2) NOT NULL,
    predicted_demand_7d NUMERIC(12, 2) NOT NULL,
    current_stock NUMERIC(12, 2) NOT NULL,
    safety_buffer NUMERIC(12, 2) NOT NULL,
    shortfall NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_store 
ON purchase_orders (store_id, product_id, created_at DESC);

-- 7. HOLIDAYS EVENTS TABLE
CREATE TABLE IF NOT EXISTS holidays_events (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    locale VARCHAR(50) NOT NULL,
    locale_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    transferred BOOLEAN DEFAULT FALSE
);

-- 8. OIL PRICES TABLE
CREATE TABLE IF NOT EXISTS oil_prices (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    dcoilwtico NUMERIC(10, 4)
);

