# SupplyIQ Architecture & System Design

SupplyIQ is an enterprise AI Supply Chain Intelligence & Predictive Replenishment Control Tower designed for high-throughput retail demand forecasting, dynamic safety stock optimization, and automated multi-echelon procurement workflows.

---

## 1. End-to-End System Architecture

The system utilizes a modern decoupled full-stack architecture with React 19 on the presentation layer, FastAPI on the high-concurrency asynchronous API layer, and Neon Serverless PostgreSQL with connection pooling as the primary persistent data store.

```mermaid
flowchart TB
    subgraph ClientLayer [Presentation Layer - React 19 + Vite]
        UI[SupplyIQ Dashboard SPA]
        Router[View Router & State Manager]
        AuthCtx[JWT Auth & RBAC Context]
        Charts[Recharts & Lucide UI]
    end

    subgraph APILayer [API Gateway & Backend - FastAPI]
        FastAPI[FastAPI Asynchronous Gateway]
        CORS[CORS Middleware & Security Headers]
        AuthMW[JWT Bearer & Role Guards]
        
        subgraph Subservices [Domain Core Services]
            DashService[Dashboard Analytics Engine]
            RestockEngine[Restock Decision Engine]
            POService[Atomic PO State Machine]
            AlertService[Rule-Based Alert Processor]
            SimService[What-If Scenario Simulator]
        end
    end

    subgraph MLLayer [Machine Learning Forecasting Subsystem]
        LGBM[LightGBM Regressor Model]
        FeatEng[Feature Engineering Pipeline]
        SafetyCalc[Statistical Safety Stock Optimizer]
    end

    subgraph DataLayer [Persistent Data Storage - Neon PostgreSQL]
        NeonPool[Neon Connection Pooler]
        NeonDB[(Neon PostgreSQL Serverless)]
        
        subgraph Schemas [Core Tables (3,000,888+ Records)]
            SalesTab[(sales_transactions)]
            InvTab[(inventory)]
            LedgerTab[(inventory_transactions)]
            POTab[(purchase_orders)]
            AlertTab[(stock_alerts)]
            AuditTab[(audit_logs)]
            ForecastTab[(forecasts)]
        end
    end

    UI --> Router
    Router --> AuthCtx
    AuthCtx --> Charts
    Charts -->|HTTP/REST with JWT| FastAPI

    FastAPI --> CORS
    CORS --> AuthMW
    AuthMW --> Subservices

    RestockEngine --> LGBM
    RestockEngine --> SafetyCalc
    LGBM --> FeatEng

    Subservices --> NeonPool
    NeonPool --> NeonDB
    NeonDB --- Schemas
```

---

## 2. Machine Learning Demand Forecasting Pipeline

The forecasting pipeline processes multi-year transaction data (over 3,000,000 sales records), aggregates at the Store-SKU-Day level, extracts temporal, lag, and exogenous macroeconomic signals, and produces multi-horizon demand forecasts evaluated on WAPE, MAE, and RMSE.

```mermaid
flowchart LR
    subgraph Ingestion [1. Historical Sales Ingestion]
        RawSales[3,000,888 Sales Records]
        OilData[Ecuadorian Oil Prices]
        HolidayData[National & Regional Holidays]
    end

    subgraph Preprocessing [2. Feature Engineering]
        Agg[Daily Store-SKU Aggregation]
        Lags[Lagged Sales (t-7, t-14, t-30)]
        Rolling[Rolling Means & Volatility (7d, 28d)]
        Calendar[DayOfWeek, Month, IsHoliday, Promo Flag]
    end

    subgraph Modeling [3. LightGBM Training & Inference]
        Train[Temporal Split Validation]
        LGBMModel[LightGBM Gradient Boosting Regressor]
        Inference[Multi-Step Point & Horizon Forecasts]
    end

    subgraph Evaluation [4. Model Performance Verification]
        WAPE[WAPE: 7.86%]
        MAE[MAE: 14.32]
        RMSE[RMSE: 21.84]
    end

    RawSales --> Agg
    OilData --> Preprocessing
    HolidayData --> Preprocessing
    Agg --> Lags
    Agg --> Rolling
    Agg --> Calendar

    Lags --> Train
    Rolling --> Train
    Calendar --> Train
    Train --> LGBMModel
    LGBMModel --> Inference

    Inference --> Evaluation
```

---

## 3. Database Entity-Relationship Model (ERD)

The relational schema ensures ACID compliance, referential integrity via strict foreign keys, and complete traceability across inventory movements and governance logs.

```mermaid
erDiagram
    USERS ||--o{ PURCHASE_ORDERS : "approves / creates"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    USERS ||--o{ STOCK_ALERTS : "acknowledges"

    STORES ||--o{ INVENTORY : "holds"
    STORES ||--o{ SALES_TRANSACTIONS : "records"
    STORES ||--o{ FORECASTS : "has"
    STORES ||--o{ PURCHASE_ORDERS : "orders for"
    STORES ||--o{ STOCK_ALERTS : "generates"
    STORES ||--o{ INVENTORY_TRANSACTIONS : "tracks"

    PRODUCTS ||--o{ INVENTORY : "stocked in"
    PRODUCTS ||--o{ SALES_TRANSACTIONS : "sold as"
    PRODUCTS ||--o{ FORECASTS : "predicted for"
    PRODUCTS ||--o{ PURCHASE_ORDER_ITEMS : "included in"
    PRODUCTS ||--o{ INVENTORY_TRANSACTIONS : "logged in"

    SUPPLIERS ||--o{ PURCHASE_ORDERS : "fulfills"

    PURCHASE_ORDERS ||--|{ PURCHASE_ORDER_ITEMS : "contains"
    PURCHASE_ORDERS ||--o{ INVENTORY_TRANSACTIONS : "triggers receipt"

    INVENTORY ||--o{ INVENTORY_TRANSACTIONS : "mutates"

    USERS {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string role "ADMIN | MANAGER | INVENTORY_MANAGER | ANALYST | VIEWER"
        boolean is_active
        datetime created_at
    }

    STORES {
        int store_id PK
        string city
        string state
        string store_type
        int cluster
    }

    PRODUCTS {
        int product_id PK
        string family
        int class_id
        boolean perishable
    }

    INVENTORY {
        int id PK
        int store_id FK
        int product_id FK
        float current_stock
        float safety_buffer
        float unit_cost
        datetime last_updated
    }

    SALES_TRANSACTIONS {
        int id PK
        date date
        int store_id FK
        int product_id FK
        float unit_sales
        boolean onpromotion
    }

    FORECASTS {
        int id PK
        int store_id FK
        int product_id FK
        date forecast_date
        float predicted_demand
        float lower_bound
        float upper_bound
        datetime created_at
    }

    SUPPLIERS {
        int supplier_id PK
        string name
        string contact_email
        int lead_time_days
        float on_time_rate
        float quality_score
    }

    PURCHASE_ORDERS {
        int po_id PK
        string po_number UK
        int store_id FK
        int supplier_id FK
        string status "DRAFT | PENDING_APPROVAL | APPROVED | SENT | RECEIVED | CANCELLED"
        float total_amount
        int created_by FK
        int approved_by FK
        datetime created_at
        datetime expected_delivery_date
    }

    PURCHASE_ORDER_ITEMS {
        int item_id PK
        int po_id FK
        int product_id FK
        float quantity
        float unit_price
        float total_price
    }

    INVENTORY_TRANSACTIONS {
        int id PK
        int store_id FK
        int product_id FK
        string transaction_type "RECEIPT | SALE | ADJUSTMENT | AUDIT_COUNT"
        float quantity_change
        float previous_quantity
        float resulting_quantity
        string reference_id
        datetime timestamp
    }

    STOCK_ALERTS {
        int alert_id PK
        int store_id FK
        int product_id FK
        string alert_type "STOCKOUT_RISK | LOW_STOCK | OVERSTOCK | SURGE_DEMAND"
        string severity "CRITICAL | WARNING | INFO"
        string status "ACTIVE | ACKNOWLEDGED | RESOLVED"
        string message
        datetime created_at
    }

    AUDIT_LOGS {
        int log_id PK
        int user_id FK
        string action
        string entity_type
        string entity_id
        json old_values
        json new_values
        string ip_address
        datetime timestamp
    }
```

---

## 4. Predictive Restock Decision Engine

SupplyIQ calculates the dynamic Reorder Point ($ROP$) and Recommended Order Quantity ($ROQ$) based on lead-time demand distribution and configurable service levels ($Z$-factor).

$$SS = Z \times \sigma_{\text{lead}} \times \sqrt{L}$$
$$ROP = (\bar{d} \times L) + SS$$
$$\text{Net Inventory} = \text{Current Stock} + \text{In-Transit Stock}$$
$$ROQ = \max(0, ROP - \text{Net Inventory})$$

```mermaid
flowchart TD
    Start([SKU Evaluation Triggered]) --> FetchData[Fetch Store-SKU Current Stock, Lead Time & In-Transit POs]
    FetchData --> FetchForecast[Extract LightGBM Predicted Demand for Lead Horizon L]
    FetchForecast --> CalcVariance[Compute Demand StdDev sigma and Z-factor for Target Service Level]
    CalcVariance --> CalcSS[Calculate Safety Stock SS = Z * sigma * sqrt(L)]
    CalcSS --> CalcROP[Calculate Reorder Point ROP = LeadDemand + SS]
    CalcROP --> CalcNet[Compute Net Inventory = Current Stock + In-Transit]
    CalcNet --> CheckThreshold{Net Inventory < ROP ?}

    CheckThreshold -- Yes --> RecommendPO[Generate Recommended Order Qty = ROP - Net Inventory]
    RecommendPO --> DetermineUrgency{Net Inventory <= SS ?}
    DetermineUrgency -- Yes --> CriticalUrgency[Set Urgency = CRITICAL & Trigger Stockout Alert]
    DetermineUrgency -- No --> NormalUrgency[Set Urgency = RECOMMENDED]
    
    CheckThreshold -- No --> SafeStatus[Status = HEALTHY, Recommended Qty = 0]

    CriticalUrgency --> Output([Restock Proposal Formed])
    NormalUrgency --> Output
    SafeStatus --> Output
```

---

## 5. Purchase Order Lifecycle & State Machine

Purchase orders follow strict enterprise state transitions with role guards, audit logging, and atomic database execution upon receiving.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Created by Inventory Manager / Auto-Engine
    DRAFT --> PENDING_APPROVAL : Submitted for Review
    PENDING_APPROVAL --> APPROVED : Approved by Manager / Admin (Role-Guarded)
    PENDING_APPROVAL --> CANCELLED : Rejected
    APPROVED --> SENT : Dispatched to Supplier
    SENT --> RECEIVED : Goods Receipt Confirmed (Atomic Inventory Ledger Write)
    SENT --> CANCELLED : Supplier Cancelled
    RECEIVED --> [*]
    CANCELLED --> [*]

    note right of RECEIVED
        Upon receipt:
        1. Lock inventory row
        2. current_stock += qty
        3. Insert double-entry ledger row
        4. Invalidate related stock alerts
        5. Write immutable audit log
    end note
```
