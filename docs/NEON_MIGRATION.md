# Neon PostgreSQL Migration & Operations Guide
**Project:** Automated Supply Chain Restock & Stockout Prevention Engine  

---

## 1. Neon PostgreSQL Setup

1. Sign up / log in to [Neon Console](https://console.neon.tech).
2. Create a new project (e.g., `supply-chain-engine`).
3. Under the **Connection Details** pane, select:
   * **Database**: `neondb`
   * **Connection pooling**: `Enabled` (uses the `-pooler` endpoint for scalable FastAPI connections).
4. Copy the connection string.

---

## 2. Environment Configuration

Create a `.env` file in the project root:

```env
# Neon PostgreSQL Connection String (uses -pooler endpoint and sslmode=require)
DATABASE_URL=postgresql://neondb_owner:<PASSWORD>@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# ML Artifacts
MODEL_PATH=artifacts/model_v1.pkl

# Defaults
DEFAULT_SERVICE_LEVEL=0.95
DEFAULT_LEAD_TIME_DAYS=7
```

> **Security Rule**: Never commit `.env` to Git. `.gitignore` is configured to exclude all `.env` and SQLite `.db` files.

---

## 3. Database Migration Workflow (Alembic)

The application uses **Alembic** to manage database schema evolutions.

### Check Current Migration Status
```bash
alembic current
```

### Apply All Pending Migrations to Head
```bash
alembic upgrade head
```

### Roll Back to Previous Revision
```bash
alembic downgrade -1
```

### Generate a New Migration Revision
```bash
alembic revision --autogenerate -m "add_new_feature_table"
```

---

## 4. Connection Pooling & Serverless Optimization

Neon PostgreSQL provides serverless compute scaling. To prevent dropped connections or timeouts during idle periods, SQLAlchemy is configured with:
* `pool_size = 10`
* `max_overflow = 20`
* `pool_recycle = 300` (Recycles connections every 5 minutes)
* `pool_pre_ping = True` (Tests liveness before handing connections to queries)

---

## 5. Health Verification

Verify backend and database connectivity via the health endpoint:

```bash
curl http://localhost:8000/health
```

Expected Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "Supply Chain Restock Backend",
  "version": "1.0.0"
}
```

---

## 6. Troubleshooting & FAQ

* **Issue**: `psycopg2.OperationalError: SSL connection has been closed unexpectedly`
  * **Solution**: Ensure your connection string includes `?sslmode=require`. SQLAlchemy `pool_pre_ping=True` automatically handles transparent reconnection.
* **Issue**: Migration reports schema drift
  * **Solution**: Run `alembic current` and verify against `Base.metadata`. Avoid manual `ALTER TABLE` in Neon console outside Alembic migrations.
