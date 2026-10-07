# SupplyIQ — Resume & Portfolio Project Bullet Points

Use these tailored bullet points for Software Engineering, Full-Stack Development, Machine Learning Engineering, and Data Science resumes.

---

## 1. Full-Stack / Backend Software Engineer Bullets

- **SupplyIQ — Enterprise AI Supply Chain Intelligence & Replenishment Platform** | *Python, FastAPI, React 19, Neon PostgreSQL, SQLAlchemy, Docker, Vite*
  - Engineered an enterprise supply chain control tower managing **3,000,888+ retail transactions** across **54 stores** and **33 product lines** with **< 50ms average API latency**.
  - Built high-concurrency asynchronous REST APIs with **FastAPI**, incorporating JWT authentication, Role-Based Access Control (**RBAC across 5 operational tiers**), and automated Pydantic schema validation.
  - Implemented an ACID-compliant double-entry **inventory transaction ledger** and atomic purchase order state machine with row-level database locking, preventing concurrency race conditions and ensuring 100% financial integrity.
  - Architected cloud-native database infrastructure on **Neon Serverless PostgreSQL** with connection pooling, Alembic automated migrations, and point-in-time recovery (PITR).
  - Maintained comprehensive test automation with **24 unit and integration tests** in pytest, automated inventory invariants verification scripts, and multi-stage Docker containerization.

---

## 2. Machine Learning / Data Science Engineer Bullets

- **SupplyIQ — Machine Learning Demand Forecasting & Restock Optimizer** | *LightGBM, Scikit-Learn, Pandas, NumPy, PostgreSQL*
  - Built an end-to-end multi-horizon demand forecasting engine on a **3.0M+ retail transaction dataset**, incorporating calendar temporal signals, macroeconomic oil prices, and promotional lag features.
  - Optimized a gradient-boosted **LightGBM regressor**, achieving **7.86% WAPE**, **14.32 MAE**, and **21.84 RMSE**, reducing stockout risk across volatile retail product categories.
  - Formulated a dynamic statistical safety stock and reorder point ($ROP$) engine calculating $SS = Z \times \sigma_{\text{lead}} \times \sqrt{L}$, automating replenishment proposals based on target service levels (95% - 99%).
  - Developed an **ABC/XYZ revenue Pareto & volatility matrix** and Monte Carlo **What-If simulation engine** to model supply chain resilience under supplier lead-time delays and demand surge shocks.

---

## 3. Short 3-Line Summary (For Compact Resume Templates)

- **SupplyIQ (AI Supply Chain Control Tower)**: Full-stack replenishment platform built with FastAPI, React 19, and Neon PostgreSQL over a 3,000,888-transaction dataset.
- **Predictive Restock Engine**: Trained LightGBM forecasting model achieving **7.86% WAPE**, powering dynamic statistical safety buffers and automated purchase order generation.
- **Enterprise Security & Reliability**: Engineered JWT/RBAC authorization, atomic double-entry inventory ledger, 24 pytest suites, and Docker container deployment.
