# SupplyIQ Technical Placement Interview Guide

This guide prepares engineers to defend every architectural, algorithmic, and database decision in SupplyIQ during technical system design and coding interviews.

---

## 1. System Architecture & Tech Stack Choices

### Q1: Why FastAPI over Django or Flask?
**Answer**:
- **Asynchronous Concurrency**: FastAPI is built on Starlette and ASGI, providing native `async`/`await` support for non-blocking I/O operations, which is critical when communicating with serverless database connection poolers.
- **Pydantic Validation**: Automatic request/response serialization and strict runtime schema validation prevent bad data payloads from corrupting downstream database state.
- **Auto-Generated OpenAPI**: Instant interactive Swagger/ReDoc documentation speeds up frontend-backend integration.
- **Performance**: Near-NodeJS/Go speed benchmarks while retaining the rich Python ecosystem for LightGBM and NumPy.

### Q2: Why React 19 + Vite over Next.js or Server-Side Rendering?
**Answer**:
- **Internal SaaS Profile**: SupplyIQ is an enterprise internal control tower application protected behind authentication, where Single Page Application (SPA) statefulness, instant client-side client tab switching, and rich interactive dashboards (Recharts, Canvas) are prioritized over public Search Engine Optimization (SEO).
- **Vite Rolldown Speed**: Sub-second Hot Module Replacement (HMR) and 880ms production bundling drastically accelerate developer and CI/CD turnaround.

### Q3: Why PostgreSQL & Neon Serverless?
**Answer**:
- **Relational Integrity (ACID)**: Supply chains require strict transactional guarantees for inventory mutations, purchase order approvals, and financial ledger balance checks. NoSQL systems risk eventual consistency anomalies (e.g., duplicate allocations or phantom stock).
- **Neon Serverless Benefits**: Compute-storage separation allows automatic scale-to-zero during off-hours, instant copy-on-write branching for zero-downtime migration testing, and automated continuous Write-Ahead Log (WAL) streaming for Point-in-Time Recovery (PITR).

---

## 2. Machine Learning & Forecasting Engineering

### Q4: Why LightGBM instead of ARIMA, Prophet, Random Forest, or XGBoost?
**Answer**:
- **Tree Leaf-Wise (Best-First) Growth**: LightGBM builds trees leaf-wise with depth limits rather than level-wise, achieving significantly higher accuracy with lower loss on tabular time-series features.
- **Histogram-based Binning**: Discrete binning of continuous features reduces memory usage by up to 80% and accelerates training speed 10-15x compared to standard XGBoost or Random Forests on 3+ million rows.
- **Native Categorical & Multi-Series Handling**: Unlike classical ARIMA/Prophet which must fit separate univariate models for each of the 1,782 store-SKU series, LightGBM trains a unified global multi-series model that learns cross-store and cross-category cross-elasticity and hierarchy.

### Q5: How was WAPE calculated and why WAPE over MAPE?
**Answer**:
$$\text{WAPE} = \frac{\sum |y_i - \hat{y}_i|}{\sum y_i} \times 100\%$$
- **The MAPE Zero-Division Problem**: Mean Absolute Percentage Error ($\text{MAPE} = \frac{1}{n}\sum \frac{|y_i - \hat{y}_i|}{y_i}$) divides by actual sales $y_i$. In retail datasets with intermittent or zero sales days, MAPE causes mathematical division-by-zero errors or artificially inflates error to infinity.
- **Volume Weighting**: WAPE (Weighted Absolute Percentage Error) weights errors proportional to volume, meaning errors on high-velocity items impact the metric appropriately while zero-demand days are handled smoothly without numeric instability. SupplyIQ achieves $\text{WAPE} \approx 7.86\%$.

### Q6: How did you prevent data leakage during time-series feature engineering?
**Answer**:
- **Strict Temporal Split**: We never used random K-Fold cross-validation. Data was partitioned chronologically (train on past dates, validate on strictly future dates).
- **Lag Shifting**: All rolling averages (7-day, 28-day) and lag features ($t-7, t-14, t-30$) were computed using `.shift(1)` or strictly preceding time horizons, ensuring information from day $t$ was never accessible when forecasting day $t$.

---

## 3. Inventory Mathematics & Restock Logic

### Q7: How is Safety Stock ($SS$) and Reorder Point ($ROP$) calculated?
**Answer**:
- **Safety Stock**:
  $$SS = Z \times \sigma_{\text{lead}} \times \sqrt{L}$$
  Where $Z$ is the inverse normal distribution CDF for the desired service level (e.g., $Z=1.65$ for 95% service level, $Z=2.33$ for 99%), $\sigma_{\text{lead}}$ is the standard deviation of daily demand forecast errors, and $L$ is supplier lead time in days.
- **Reorder Point**:
  $$ROP = (\bar{d} \times L) + SS$$
  Where $\bar{d}$ is the expected daily demand during lead time.
- **Net Inventory**:
  $$\text{Net Inventory} = \text{On-Hand Stock} + \text{In-Transit POs} - \text{Backorders}$$
- **Recommended Order Quantity (ROQ)**:
  $$ROQ = \max(0, ROP - \text{Net Inventory})$$

---

## 4. Concurrency, Atomicity & Database Design

### Q8: How is Purchase Order Receiving guaranteed to be atomic?
**Answer**:
When receiving a purchase order containing multiple line items:
1. A database transaction begins (`db.begin()`).
2. The PO row is locked with `with_for_update()` to prevent concurrent double-receipt race conditions.
3. For each item in `purchase_order_items`:
   - The corresponding `inventory` row is locked and updated (`current_stock = current_stock + item.quantity`).
   - A double-entry record is inserted into `inventory_transactions` capturing `previous_quantity`, `quantity_change`, and `resulting_quantity`.
4. Related active alerts for that SKU are set to `RESOLVED`.
5. An audit log entry is inserted into `audit_logs`.
6. The entire transaction commits atomically. If any error occurs (e.g., network failure, validation failure), the session rolls back entirely (`db.rollback()`), guaranteeing zero ledger skew.

### Q9: How does the application maintain sub-50ms latency across 3M+ records?
**Answer**:
1. **Targeted Composite Indexing**: Primary queries utilize composite indexes such as `(store_id, product_id, date)`.
2. **Server-Side Aggregations & Pagination**: API endpoints never stream unbounded datasets to the client; all list endpoints enforce `limit` and `offset` pagination and use indexed SQL `GROUP BY` rollups.
3. **Connection Pooling**: Neon connection pooler reuses open database TCP connections, eliminating the 100ms SSL/TLS handshake per request.

### Q10: How would you scale this system from 3M to 100M+ transactions?
**Answer**:
1. **PostgreSQL Table Partitioning**: Partition `sales_transactions` and `inventory_transactions` by `date` (e.g., monthly range partitions). Queries targeting recent time windows prune 95% of table partitions.
2. **Redis Caching Layer**: Cache static master data (stores, products, suppliers) and aggregated dashboard KPI cards with short TTLs (e.g., 60 seconds).
3. **Async Event-Driven PO Processing**: Offload batch ML inference and Restock evaluation runs to asynchronous Celery/Redis or temporal workers, decoupling analytical computations from the HTTP API thread pool.
4. **Read/Write Replica Splitting**: Route analytical reporting queries to Neon read-replicas while keeping writes on the primary node.
