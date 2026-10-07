# SupplyIQ — 5-Minute Executive Demonstration Script

This presentation script is structured for college final evaluations, technical recruiters, hiring managers, and supply chain executives.

---

## Timeline Overview

| Time | Stage | Focus Area |
| :--- | :--- | :--- |
| **0:00 - 0:30** | Authentication & RBAC | Multi-role access control, secure JWT, demo persona selector |
| **0:30 - 1:00** | Executive Control Tower | 3M+ transaction scale, macro KPI cards, critical stockout alerts |
| **1:00 - 1:30** | Inventory & SKU Detail | Store-SKU deep dive, safety stock buffer, reorder points |
| **1:30 - 2:00** | ML Forecast Intelligence | LightGBM demand curves, WAPE 7.86%, confidence intervals |
| **2:00 - 2:30** | Smart Restock Engine | Automated Reorder Quantity (ROQ), statistical Z-factor buffer |
| **2:30 - 3:30** | PO Lifecycle & Ledger | End-to-end PO approval, atomic goods receipt, double-entry ledger |
| **3:30 - 4:15** | ABC/XYZ & Simulations | Revenue Pareto matrix, lead-time & demand spike stress test |
| **4:15 - 5:00** | Architecture & Wrap-Up | Decoupled stack, Neon PostgreSQL serverless, production resilience |

---

## Step-by-Step Script & Talking Points

### [0:00 - 0:30] Introduction & Enterprise Authentication
- **Action**: Open `http://localhost:5173`. Show the Login Screen with the 5 predefined persona pills (`ADMIN`, `MANAGER`, `INVENTORY_MANAGER`, `ANALYST`, `VIEWER`). Click `Admin` to prefill `admin@supplyiq.io` and click **Sign In**.
- **Talking Point**:
  > *"Welcome to SupplyIQ, an enterprise AI Supply Chain Control Tower. SupplyIQ solves retail stockouts and working capital lockup using LightGBM demand forecasting and automated replenishment. We begin with enterprise role-based security — every request is guarded by JSON Web Tokens with strict authorization across 5 operational tiers."*

---

### [0:30 - 1:00] Executive Control Tower Overview
- **Action**: Arrive on the Control Tower dashboard. Highlight the top KPI bar: Total SKU Inventory Value, Active Stockout Alerts, 15-day Demand Forecast, and Supplier Fill Rate.
- **Talking Point**:
  > *"This dashboard is aggregating live operational metrics across 54 retail stores and 33 product categories backed by over 3 million real retail transactions in Neon PostgreSQL. Right away, the system flags critical stockout risks in red and overstock risks in amber, allowing procurement managers to triage inventory by urgency."*

---

### [1:00 - 1:30] Inventory Management & Critical SKU Triage
- **Action**: Navigate to **Inventory** in the sidebar. Filter status by `CRITICAL`. Click on a critical SKU (e.g., Store 1 — GROCERY I).
- **Talking Point**:
  > *"In the Inventory Ledger, we see real-time on-hand stock alongside the dynamically computed Safety Buffer and Reorder Point. SupplyIQ continuously compares net inventory (on-hand plus inbound purchase orders) against lead-time demand distribution to prevent stockouts before they happen."*

---

### [1:30 - 2:00] ML Forecast Intelligence & Model Benchmarks
- **Action**: Navigate to **Forecast Intelligence** or click **View Forecast** on the SKU. Show the 15-day predicted demand curve with upper and lower bounds.
- **Talking Point**:
  > *"Our forecasting engine is powered by a gradient-boosted LightGBM regressor trained on multi-year daily sales, macroeconomic oil price trends, regional holidays, and promotional lag signals. On test holdouts, it achieves a WAPE of 7.86%, an MAE of 14.32, and an RMSE of 21.84 — delivering high predictive fidelity across volatile retail categories."*

---

### [2:00 - 2:30] Explainable Smart Restock Engine
- **Action**: Navigate to **Restock Engine**. Select Store 1 and set Service Level to `95% (Z=1.65)`. Click **Evaluate Store Restock**. Show the generated recommendation table with urgency badges (`CRITICAL`, `RECOMMENDED`, `OPTIMAL`).
- **Talking Point**:
  > *"Instead of relying on static reorder rules, the Restock Engine computes safety stock as $Z \times \sigma_{\text{lead}} \times \sqrt{L}$. For every SKU, it provides a transparent calculation of exact lead-time demand, buffer requirements, and net shortfall. Procurement managers can click 'Create PO' directly from any recommendation."*

---

### [2:30 - 3:30] Purchase Order Workflow & Atomic Inventory Ledger
- **Action**:
  1. Navigate to **Purchase Orders**. Show the filtered PO list (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT`, `RECEIVED`).
  2. Click on an `APPROVED` or `SENT` PO.
  3. Click **Mark as Received**. Notice the success notification and the status change to `RECEIVED`.
  4. Navigate to **Transaction Ledger** to show the newly inserted `RECEIPT` row with exact previous stock, delta (+), and resulting stock.
  5. Navigate to **Audit Logs** to show the immutable governance log with timestamp, user email, IP, and state change payload.
- **Talking Point**:
  > *"Here is our closed-loop procurement lifecycle. When an approved PO is received, the backend executes an atomic database transaction: it increments on-hand inventory, records an immutable entry in the double-entry transaction ledger ($prev + delta \equiv result$), resolves related stockout alerts, and registers an audit trail for SOX-style compliance. Zero discrepancies, zero race conditions."*

---

### [3:30 - 4:15] ABC/XYZ Matrix & What-If Scenario Simulation
- **Action**:
  1. Navigate to **Analytics** -> show the 3x3 ABC/XYZ matrix classifying products by revenue contribution (Pareto A/B/C) and demand volatility (Coefficient of Variation X/Y/Z).
  2. Navigate to **What-If Simulator**. Select `+25% Demand Surge` and `+3 Days Supplier Lead Time Delay`. Click **Run Scenario Simulation**. Show projected stockout risk and additional safety buffer cost.
- **Talking Point**:
  > *"For strategic supply chain planning, SupplyIQ provides ABC/XYZ classification to identify high-value predictable items versus volatile long-tail SKUs. Furthermore, our What-If Simulator lets executives stress-test supply chains against port delays, supplier lead-time shocks, and promotional spikes before committing capital."*

---

### [4:15 - 5:00] Architecture Summary & Engineering Conclusion
- **Action**: Press `Ctrl+K` to open the Global Command Palette. Type `Store 1` or `Grocery` and instantly jump to that entity.
- **Talking Point**:
  > *"To summarize: SupplyIQ combines modern high-performance React 19, an asynchronous FastAPI backend, serverless Neon PostgreSQL with automated point-in-time recovery, and LightGBM machine learning. It delivers sub-50ms API response times across millions of records and transforms supply chain operations from reactive firefighting into proactive, AI-guided execution. Thank you!"*
