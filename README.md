# Automated Supply Chain Restock & Stockout Prevention Engine

A production-grade, end-to-end AI supply chain system built with **FastAPI**, **LightGBM**, **PostgreSQL**, and **React (Vite)**. Designed for retail store operations to forecast 7-day cumulative item demand, dynamically calculate statistical safety stock buffers, automatically generate purchase orders, and prevent stockouts across retail store networks.

---

## Architecture & Technology Stack

- **ML & Forecasting Engine**: LightGBM Regressor (`model_v1.pkl`), engineered with lag features ($t-1, t-7, t-14$), rolling 7-day and 28-day sales statistics, calendar attributes, holiday event joins, and crude oil price dynamics trained over **3,000,888 real sales records**.
- **Restock Decision Service**: Decoupled domain module evaluating inventory threshold rules:
  $$\text{Restock Triggered} \iff (\text{current\_stock} - \text{predicted\_demand\_7d} < \text{safety\_buffer})$$
  $$\text{Order Quantity} = \text{safety\_buffer} + \text{predicted\_demand\_7d} - \text{current\_stock}$$
- **Database & Persistence**: PostgreSQL 15 running in Docker with high-speed streaming bulk ingestion (`copy_expert`).
- **REST API**: FastAPI with Pydantic v2 data validation, OpenAPI/Swagger documentation, and structured error handling.
- **Frontend Dashboard**: Modern React 19 + Vite single page application with dynamic glassmorphism UI, real-time demand curve visualizers (Recharts), inventory matrix tables, autonomous purchase order queue managers, and stock adjustment modals (**Add Stock**, **Remove Stock**, **Set Explicit Count**).
- **Containerization**: Multi-container Docker & Docker Compose setup (`supply_chain_api`, `supply_chain_postgres`).

---

## Project Directory Structure

```text
SGP/
├── artifacts/                  # Model artifacts and serialized weights
│   └── model/
│       └── model_v1.pkl        # LightGBM trained model booster
├── data/                       # Kaggle raw dataset & ingestion scripts
│   └── README.md
├── frontend/                   # React 19 + Vite Frontend Application
│   ├── public/                 # Static assets & SVG icons
│   ├── src/
│   │   ├── components/         # React dashboard UI components
│   │   │   ├── ForecastVisualizer.jsx
│   │   │   ├── InventoryMatrix.jsx
│   │   │   ├── KPIDashboard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── PurchaseOrdersManager.jsx
│   │   │   ├── RestockEvaluationModal.jsx
│   │   │   └── StockAdjustmentModal.jsx
│   │   ├── api.js              # REST API integration layer
│   │   ├── App.jsx             # Main dashboard workspace
│   │   └── index.css           # Glassmorphism design tokens & styles
│   ├── package.json
│   └── vite.config.js
├── src/                        # Backend Python Codebase
│   ├── api/                    # FastAPI Web Layer
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── schemas.py          # Request / response Pydantic models
│   │   └── routers/            # Route controllers (/forecast, /restock, /inventory)
│   ├── db/                     # Database ORM & Session
│   │   ├── ddl.sql             # SQL DDL database creation script
│   │   ├── models.py           # SQLAlchemy database schemas
│   │   └── session.py          # DB engine & session dependency
│   ├── etl/                    # Data Pipeline
│   │   ├── ingest.py           # High-speed Kaggle CSV ingestion pipeline
│   │   └── feature_engineering.py # Time-series feature matrix builder
│   ├── ml/                     # Machine Learning Pipeline
│   │   ├── train.py            # Out-of-time LightGBM training & validation
│   │   └── predict.py          # Real-time single-row demand predictor
│   └── services/               # Core Business Logic
│       ├── restock.py          # Inventory evaluation & PO generator
│       └── safety_buffer.py    # Statistical safety stock buffer calculator
├── tests/                      # Automated Test Suite
│   ├── test_api_endpoints.py   # FastAPI HTTP endpoint tests
│   ├── test_restock_service.py # Restock decision logic unit tests
│   └── test_safety_buffer.py   # Safety stock statistical unit tests
├── Dockerfile                  # API container Dockerfile
├── docker-compose.yml          # Services orchestration manifest
├── requirements.txt            # Python dependencies
└── README.md                   # Comprehensive System Documentation
```

---

## Quickstart & Local Setup

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed & running
- Node.js v18+ (for running the frontend dev server)
- Python 3.11+ (optional for local non-Docker development)

---

### 2. Start Backend API & PostgreSQL Database
Clone the repository and start the Docker containers:

```bash
git clone https://github.com/ArchitVaghasiya/SGP.git
cd SGP

# Build and launch PostgreSQL and FastAPI containers
docker-compose up -d --build
```

Verify backend services are active:
- API Health Check: `http://localhost:8000/`
- Interactive API Documentation (Swagger UI): `http://localhost:8000/docs`

---

### 3. Start Frontend Web Application

```bash
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:5173/`** to view the live dashboard.

---

## Running Automated Tests

Run the full unit and integration test suite inside the API container:

```bash
docker exec supply_chain_api pytest
```

---

## API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Service health status check |
| `GET` | `/forecast/{store_id}/{product_id}` | Returns 7-day predicted demand and daily breakdown |
| `GET` | `/restock/evaluate?store_id=X` | Evaluates all SKUs in Store X, generates purchase orders |
| `GET` | `/restock/orders?store_id=X` | Lists purchase orders for Store X |
| `POST` | `/inventory/update` | Adjusts stock levels (`+ Add`, `- Remove`, or `Set Count`) |

---

## Model Metrics & Evaluation

The LightGBM demand forecasting model was trained using an **out-of-time validation split** on the final 60 days of sales history:
- **Global Weighted Absolute Percentage Error (WAPE)**: **7.86%**
- **Overall Accuracy**: **92.14%**
- **MAE**: 261.80
- **RMSE**: 901.30

---

## License

Distributed under the MIT License. See `LICENSE` for details.
