import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from src.config import settings

logger = logging.getLogger("DB-Session")

def get_engine():
    try:
        eng = create_engine(settings.DATABASE_URL, pool_pre_ping=True, echo=False)
        # Test connection
        with eng.connect() as conn:
            pass
        return eng
    except Exception as e:
        logger.warning(f"PostgreSQL connection refused: {e}. Falling back to SQLite local database.")
        return create_engine(
            "sqlite:///./supply_chain.db",
            connect_args={"check_same_thread": False},
            echo=False
        )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from src.db import models  # ensure models are registered
    Base.metadata.create_all(bind=engine)
