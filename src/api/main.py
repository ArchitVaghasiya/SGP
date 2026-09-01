import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.db.session import init_db, SessionLocal
from src.etl.ingest import run_etl
from src.api.routers import forecast, restock, inventory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("API-Main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup and shutdown lifecycle management."""
    logger.info("Initializing Database schema...")
    init_db()
    
    # Auto-seed database if empty
    db = SessionLocal()
    try:
        from src.db.models import Store
        if db.query(Store).count() == 0:
            logger.info("Database is empty. Executing ETL ingestion seed script...")
            run_etl()
    except Exception as e:
        logger.warning(f"Auto-seed check encountered an issue: {e}")
    finally:
        db.close()

    yield
    logger.info("Shutting down API server...")

app = FastAPI(
    title="Automated Supply Chain Restock & Stockout Prevention System",
    description="Production-grade decision support REST API powered by PostgreSQL and LightGBM Demand Forecasting.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(forecast.router)
app.include_router(restock.router)
app.include_router(inventory.router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Supply Chain Restock Backend",
        "version": "1.0.0"
    }
