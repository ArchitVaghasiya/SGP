import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.db.session import get_db, SessionLocal
from src.api.routers import (
    auth,
    dashboard,
    forecast,
    restock,
    inventory,
    purchase_orders,
    suppliers,
    stores,
    alerts,
    analytics,
    simulations,
    audit,
    search
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SupplyIQ-Main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup and shutdown lifecycle management."""
    logger.info("Verifying Neon PostgreSQL database connectivity...")
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1;"))
        # Sync sequences to prevent unique constraint conflicts on inserts
        tables_sequences = [
            ("purchase_orders", "po_id", "purchase_orders_po_id_seq"),
            ("audit_logs", "id", "audit_logs_id_seq"),
            ("inventory_transactions", "id", "inventory_transactions_id_seq"),
            ("stock_alerts", "id", "stock_alerts_id_seq"),
            ("users", "id", "users_id_seq"),
            ("suppliers", "id", "suppliers_id_seq"),
            ("products", "product_id", "products_product_id_seq"),
            ("forecasts", "id", "forecasts_id_seq"),
            ("sales_history", "id", "sales_history_id_seq"),
        ]
        for tbl, col, seq in tables_sequences:
            try:
                res = db.execute(text(f"SELECT COALESCE(MAX({col}), 0) FROM {tbl}")).scalar()
                if res is not None:
                    db.execute(text(f"SELECT setval('{seq}', {res + 1}, false)"))
            except Exception:
                db.rollback()
        db.commit()
        db.close()
        logger.info("Neon PostgreSQL connection pool & sequences verified.")
    except Exception as e:
        logger.error(f"Database connection check warning: {e}")

    yield
    logger.info("Shutting down SupplyIQ API server...")

app = FastAPI(
    title="SupplyIQ — AI Supply Chain Control Tower API",
    description="Enterprise-grade decision support & predictive replenishment REST API powered by Neon PostgreSQL and LightGBM Demand Forecasting.",
    version="2.0.0",
    lifespan=lifespan
)

from src.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Register All API Routers with prefix /api/v1
api_v1_prefix = "/api/v1"

# Legacy & Direct mounts for backwards compatibility
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(dashboard.router, prefix=api_v1_prefix)
app.include_router(forecast.router, prefix=api_v1_prefix)
app.include_router(restock.router, prefix=api_v1_prefix)
app.include_router(inventory.router, prefix=api_v1_prefix)
app.include_router(purchase_orders.router, prefix=api_v1_prefix)
app.include_router(suppliers.router, prefix=api_v1_prefix)
app.include_router(stores.router, prefix=api_v1_prefix)
app.include_router(alerts.router, prefix=api_v1_prefix)
app.include_router(analytics.router, prefix=api_v1_prefix)
app.include_router(simulations.router, prefix=api_v1_prefix)
app.include_router(audit.router, prefix=api_v1_prefix)
app.include_router(search.router, prefix=api_v1_prefix)

# Also mount at root for un-prefixed backward compatibility
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(forecast.router)
app.include_router(restock.router)
app.include_router(inventory.router)
app.include_router(purchase_orders.router)
app.include_router(suppliers.router)
app.include_router(stores.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(simulations.router)
app.include_router(audit.router)
app.include_router(search.router)

@app.get("/health", tags=["Health"])
def health_check(response: Response, db: Session = Depends(get_db)):
    """
    Health check verifying API operational status and live database connectivity.
    Returns 200 when healthy, 503 when degraded.
    """
    try:
        db.execute(text("SELECT 1;"))
        db_status = "connected"
        app_status = "healthy"
    except Exception:
        db_status = "disconnected"
        app_status = "degraded"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": app_status,
        "database": db_status,
        "service": "SupplyIQ AI Control Tower Backend",
        "version": "2.0.0"
    }

@app.get("/", tags=["Health"])
def root_status(response: Response, db: Session = Depends(get_db)):
    return health_check(response=response, db=db)
