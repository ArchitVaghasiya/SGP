# SupplyIQ Application Screenshots & Visual Tour

This document catalogues the key visual interfaces, interactive dashboards, and decision workflows of SupplyIQ.

---

## 1. Executive Control Tower Dashboard
- **Route**: `/` (Dashboard View)
- **Key Visual Elements**:
  - High-level metric cards: Total Inventory Valuation ($), Active Stockout Risk Alerts, 15-Day Projected Demand, Supplier On-Time In-Full (OTIF) Fill Rate.
  - Store-by-Store Filter dropdown with instant client-side updates.
  - Urgency Breakdown Donut/Bar charts comparing `CRITICAL`, `LOW STOCK`, and `HEALTHY` counts across all 54 retail locations.
  - Quick action shortcuts to Restock Engine, Purchase Orders, and Global Search.

---

## 2. Real-Time Inventory & SKU Intelligence
- **Route**: `/inventory` & `/inventory/sku/{store_id}/{product_id}`
- **Key Visual Elements**:
  - Tabular inventory overview with search, category filtering (`GROCERY`, `BEVERAGES`, `PRODUCE`, etc.), and stock level status badges.
  - Detailed SKU Drawer / View:
    - Current On-Hand Stock vs. Calculated Safety Buffer.
    - Historical sales velocity graph (actual vs. rolling average).
    - Supplier assignment, unit cost, and total holding valuation.
    - Direct "Adjust Stock" and "Reorder SKU" triggers.

---

## 3. LightGBM Demand Forecast Intelligence
- **Route**: `/forecast` & `/forecast/sku/{store_id}/{product_id}`
- **Key Visual Elements**:
  - 15-day forward demand prediction curve plotted against recent historical sales.
  - Confidence interval shading (Upper Bound $Q_{95}$ & Lower Bound $Q_{05}$).
  - Model evaluation badge summary: WAPE (7.86%), MAE (14.32), RMSE (21.84).
  - Categorical accuracy breakdown table showing model precision across perishable and non-perishable product classes.

---

## 4. Smart Restock Decision Engine
- **Route**: `/restock`
- **Key Visual Elements**:
  - Service Level Slider ($90\% \rightarrow 99\%$, dynamically shifting $Z$-score from 1.28 to 2.33).
  - Safety Buffer Method toggle (`Statistical (Dynamic Z-Score)` vs. `Static Lead Time Buffer`).
  - Restock table with automated calculation of Lead Time Demand, Safety Buffer, Net Shortfall, and Recommended Order Quantity (ROQ).
  - One-click "Generate Purchase Order" button pre-populating order line items.

---

## 5. End-to-End Purchase Order Lifecycle
- **Route**: `/purchase-orders` & `/purchase-orders/{id}`
- **Key Visual Elements**:
  - Status pipeline pills: `DRAFT` $\rightarrow$ `PENDING_APPROVAL` $\rightarrow$ `APPROVED` $\rightarrow$ `SENT` $\rightarrow$ `RECEIVED`.
  - Multi-item order detail showing line items, unit costs, supplier lead time, and total order sum.
  - Role-guarded action buttons (**Approve Order**, **Dispatch to Supplier**, **Receive Inbound Shipment**).
  - Toast confirmation upon atomic goods receipt and inventory update.

---

## 6. ABC/XYZ Inventory Analytics Matrix
- **Route**: `/analytics`
- **Key Visual Elements**:
  - 3x3 interactive matrix:
    - **ABC Analysis**: Cumulative Revenue contribution (A = Top 80%, B = Next 15%, C = Bottom 5%).
    - **XYZ Analysis**: Demand Volatility by Coefficient of Variation ($CV \le 0.5 \rightarrow X$, $0.5 < CV \le 1.0 \rightarrow Y$, $CV > 1.0 \rightarrow Z$).
  - Actionable inventory quadrant insights (e.g., *AX items: High Value, Stable Demand — Automate JIT Replenishment*).

---

## 7. What-If Scenario Stress-Test Simulator
- **Route**: `/simulations`
- **Key Visual Elements**:
  - Interactive parameter controls: Demand Surge ($0\% \rightarrow +100\%$), Supplier Lead Time Delay ($0 \rightarrow +14\text{ days}$), Holding Cost Factor.
  - Real-time impact simulation: Projected Stockout Risk %, Working Capital Impact ($), and Recommended Buffer Adjustment.
  - Comparative before/after stock trajectory graph.

---

## 8. Immutable Inventory Ledger & Governance Audit Trail
- **Route**: `/transactions` & `/audit`
- **Key Visual Elements**:
  - Double-entry inventory transaction log displaying `Timestamp`, `Store`, `SKU`, `Type` (`RECEIPT`, `SALE`, `ADJUSTMENT`), `Previous Qty`, `Change (+/-)`, and `Resulting Qty`.
  - Audit Trail displaying authenticated user identity, role, IP address, action performed, and JSON before/after state diffs.
