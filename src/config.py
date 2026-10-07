import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Primary Shared Neon Serverless PostgreSQL Database URL
    DATABASE_URL: str = "postgresql://neondb_owner:npg_0ht7usPYekxb@ep-billowing-firefly-b3899ok9-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    
    # DB Pool Configurations for Neon Serverless
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 300  # 5 minutes to prevent stale dropped connections

    # ML & Forecasting Configuration
    MODEL_PATH: str = "artifacts/model/model_v1.pkl"
    DEFAULT_SERVICE_LEVEL: float = 0.95
    DEFAULT_LEAD_TIME_DAYS: int = 7

    # CORS Configuration
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000"

    # Environment
    ENVIRONMENT: str = "production"
    SECRET_KEY: str = "supplyiq-enterprise-secure-jwt-secret-key-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_sanitized_db_url(self) -> str:
        """Returns safe masked database URL without sensitive password credentials."""
        if not self.DATABASE_URL:
            return ""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(self.DATABASE_URL)
            if parsed.password:
                netloc = f"{parsed.username}:***@{parsed.hostname}"
                if parsed.port:
                    netloc += f":{parsed.port}"
                return parsed._replace(netloc=netloc).geturl()
        except Exception:
            pass
        return "postgresql://***:***@neon.tech/***"

settings = Settings()
