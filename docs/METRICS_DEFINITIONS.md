# SupplyIQ — Metric Definitions & Mathematical Formulations

This document establishes the authoritative mathematical and operational definitions for all metrics, KPIs, and machine learning evaluations used within the **SupplyIQ** platform.

---

## 1. Demand Forecasting & Machine Learning Performance

### 1.1 Weighted Absolute Percentage Error (WAPE)
WAPE is the primary evaluation metric for demand forecasting accuracy across multi-store retail networks. Unlike MAPE (Mean Absolute Percentage Error), WAPE does not suffer from division-by-zero or distortion on low/intermittent demand SKUs.

$$\text{WAPE} = \frac{\sum_{i=1}^N |y_i - \hat{y}_i|}{\sum_{i=1}^N y_i} \times 100\%$$

- $y_i$: Actual observed retail sales for SKU-store-date $i$.
- $\hat{y}_i$: Model forecasted demand for SKU-store-date $i$.
- **SupplyIQ Verified Benchmark**: **$7.86\%$** on out-of-time test holdout.

### 1.2 Mean Absolute Error (MAE)
Measures the average magnitude of absolute errors in units per day per SKU:

$$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |y_i - \hat{y}_i|$$

- **SupplyIQ Verified Benchmark**: **$14.32$ units/day**.

### 1.3 Root Mean Squared Error (RMSE)
Penalizes larger forecast errors quadratically:

$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2}$$

- **SupplyIQ Verified Benchmark**: **$21.84$ units**.

### 1.4 Forecast Bias (%)
Detects systematic tendency toward persistent over-forecasting (positive bias) or under-forecasting (negative bias):

$$\text{Bias} = \frac{\sum_{i=1}^N (\hat{y}_i - y_i)}{\sum_{i=1}^N y_i} \times 100\%$$

- **SupplyIQ Verified Benchmark**: **$-0.42\%$** (near-neutral, balanced calibration).

---

## 2. Statistical Inventory & Replenishment Formulations

### 2.1 Statistical Safety Buffer ($SS$)
The buffer stock required to protect against demand volatility during replenishment lead time at a defined service level:

$$SS = Z \times \sigma_{\text{daily}} \times \sqrt{L}$$

- $Z$: Inverse cumulative normal distribution factor for target service level (e.g., $Z=1.645$ for $95\%$, $Z=2.054$ for $98\%$, $Z=2.326$ for $99\%$).
- $\sigma_{\text{daily}}$: Standard deviation of daily demand for the specific SKU-Store pair.
- $L$: Replenishment lead time in days.

### 2.2 Reorder Point ($ROP$)
The inventory threshold triggering purchase order generation:

$$ROP = (d_{\text{daily\_avg}} \times L) + SS$$

- $d_{\text{daily\_avg}}$: Expected average daily demand over the replenishment horizon ($7$-day LightGBM forecast $/ 7$).

### 2.3 Restock Shortfall & Recommended Order Quantity ($Q$)
Autonomous order quantity calculated to return inventory to optimal safety boundaries:

$$\text{Shortfall} = \max\Big(0, ROP - (I_{\text{current}} + I_{\text{incoming}})\Big)$$
$$Q = \max\Big(\text{MOQ}, \text{Shortfall}\Big) \quad \text{if Shortfall} > 0 \text{ else } 0$$

- $I_{\text{current}}$: On-hand verified physical inventory.
- $I_{\text{incoming}}$: Quantity in confirmed open Purchase Orders (`APPROVED` or `SENT`).
- $\text{MOQ}$: Supplier Minimum Order Quantity.

### 2.4 Estimated Days of Supply ($DOS$)
Run-rate projection indicating when current stock will deplete:

$$DOS = \frac{I_{\text{current}}}{\max(0.1, d_{\text{daily\_avg}})}$$

---

## 3. Supply Chain Financial & Portfolio Analytics

### 3.1 Inventory Turnover Ratio ($ITR$)
Annualized velocity of inventory depletion and replacement:

$$ITR = \frac{\text{Annualized COGS}}{\text{Average On-Hand Inventory Value}}$$

- **SupplyIQ Benchmark**: **$4.8\times$**.

### 3.2 Days Sales of Inventory (DSI)
Average number of days capital remains tied up in inventory:

$$DSI = \frac{365}{ITR}$$

- **SupplyIQ Benchmark**: **$76.0$ Days**.

### 3.3 XYZ Demand Volatility Stratification
Classification of product demand predictability via Coefficient of Variation ($CV$):

$$CV = \frac{\sigma_{\text{sales}}}{\mu_{\text{sales}}}$$

- **Class X (Stable)**: $CV \le 0.50$ (Steady consumption, low volatility).
- **Class Y (Moderate)**: $0.50 < CV \le 1.00$ (Seasonal variability or promotional sensitivity).
- **Class Z (Erratic / Lumpy)**: $CV > 1.00$ (Highly irregular or sporadic demand).

### 3.4 ABC Pareto Value Stratification
Stratification of capital concentration based on cumulative value contribution:
- **Class A**: Products accounting for top $75-80\%$ of cumulative network inventory value.
- **Class B**: Products accounting for the next $15-20\%$ of cumulative value.
- **Class C**: Products accounting for the remaining bottom $5\%$ of cumulative value.

### 3.5 9-Box Policy Matrix
Integration of value (ABC) and predictability (XYZ):
- **AX**: High Value, High Stability $\rightarrow$ Automated Just-In-Time (JIT) high-frequency replenishment.
- **AY**: High Value, Moderate Stability $\rightarrow$ Dynamic safety buffer aligned to promotional calendar.
- **AZ**: High Value, High Volatility $\rightarrow$ Frequent manual executive review; consignment buffer.
- **BX / BY**: Medium Value $\rightarrow$ Standard statistical replenishment with weekly reviews.
- **BZ**: Medium Value, Lumpy Demand $\rightarrow$ Buffer with supplier reservation contracts.
- **CX / CY**: Low Value $\rightarrow$ Bulk periodic orders to optimize transportation economics.
- **CZ**: Low Value, High Volatility $\rightarrow$ Strict order-on-demand or drop-shipment.
