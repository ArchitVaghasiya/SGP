import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from src.config import settings

logger = logging.getLogger("DB-Session")

def get_engine():
    db_url = settings.DATABASE_URL
    masked_url = settings.get_sanitized_db_url()
    
    # Configure production-ready PostgreSQL pool
    if db_url.startswith("postgresql"):
        try:
            logger.info(f"Connecting to primary database: {masked_url}")
            eng = create_engine(
                db_url,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                pool_timeout=settings.DB_POOL_TIMEOUT,
                pool_recycle=settings.DB_POOL_RECYCLE,
                pool_pre_ping=True,
                echo=False
            )
            # Verify connectivity
            with eng.connect() as conn:
                conn.execute(text("SELECT 1;"))
            logger.info("Database connection established successfully.")
            return eng
        except Exception as e:
            logger.error(f"Failed to connect to primary database ({masked_url}): {e}")
            raise

    # Local fallback for isolated unit tests
    logger.info("Using SQLite database configuration.")
    return create_engine(
        db_url if db_url.startswith("sqlite") else "sqlite:///./supply_chain.db",
        connect_args={"check_same_thread": False},
        echo=False
    )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI database session dependency with strict transaction cleanup and rollback on exception."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    """Ensures models are registered with Base metadata."""
    from src.db import models  # noqa
    Base.metadata.create_all(bind=engine)
