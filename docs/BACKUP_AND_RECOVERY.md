# SupplyIQ Database Backup, Disaster Recovery & Migration Runbook

This document details the database backup procedures, Point-in-Time Recovery (PITR) strategy, schema migration rollback protocols, and disaster recovery plans for SupplyIQ.

---

## 1. Neon PostgreSQL Serverless Architecture & Backup Strategy

SupplyIQ relies on **Neon PostgreSQL**, a serverless architecture that decouples compute and storage into a multi-tenant page-server system.

### Automated Continuous Backups (Point-in-Time Recovery)
- **Continuous Write-Ahead Log (WAL) Streaming**: Neon streams WAL records directly to high-durability cloud storage (AWS S3) in real-time.
- **PITR Retention**: Continuous recovery is enabled up to the retention window (typically 7 to 30 days depending on the Neon tier).
- **Zero Compute Impact**: Backups happen at the storage layer without locking tables, impacting transaction throughput, or consuming database CPU.

### Instant Branching for Pre-Deployment Safeguards
Before running database migrations or major schema changes:
1. Create a copy-on-write branch in the Neon Console:
   ```bash
   # Using Neon CLI or Neon Console
   neon branches create --name pre-migration-backup --parent main
   ```
2. The branch is created in **< 1 second** regardless of dataset size (even across 3,000,888+ rows), consuming zero additional storage until writes occur.
3. If an issue occurs, the database can be pointed instantly to the snapshot branch.

---

## 2. Alembic Migration Rollback Strategy

SupplyIQ uses Alembic for declarative, version-controlled schema migrations under `alembic/versions/`.

### Checking Migration State
```bash
# Verify current applied revision
alembic current

# Verify migration history
alembic history --verbose
```

### Performing Controlled Downgrades
If a newly applied migration needs to be rolled back safely:
```bash
# Roll back exactly 1 revision
alembic downgrade -1

# Roll back to a specific known stable revision (e.g., base foundation)
alembic downgrade 3f0d7fc504e5
```

### Schema Invariants & Protections
- **No Destructive Table Drops**: Schema updates never drop `sales_transactions` or `inventory_transactions` without an explicit data archiving migration.
- **Foreign Key Constraints**: All child tables (`purchase_order_items`, `stock_alerts`, `inventory_transactions`) enforce `ON DELETE RESTRICT` or `ON DELETE CASCADE` to prevent orphaned records.

---

## 3. Logical Dump & Recovery Protocol

For independent off-cloud backups or cross-region archives, use standard PostgreSQL client tools with the pooled Neon connection string.

### Creating Logical Compressed Dump
```bash
# Export schema + data (compressed custom format)
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file=backup_supplyiq_$(date +%Y%m%d_%H%M%S).dump

# Export schema only
pg_dump "$DATABASE_URL" \
  --schema-only \
  --file=backup_schema_only.sql
```

### Restoring to a Target Database
```bash
# Restore custom format dump into target PostgreSQL instance
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --dbname="$TARGET_DATABASE_URL" \
  backup_supplyiq_20261006_220000.dump
```

---

## 4. Disaster Recovery & Emergency Procedures

### Scenario A: Accidental Data Mutation / Corrupted PO Receiving
1. **Locate Incident Timestamp**: Query `audit_logs` table for the exact timestamp and user identity:
   ```sql
   SELECT * FROM audit_logs WHERE action = 'RECEIVE_PO' ORDER BY timestamp DESC LIMIT 5;
   ```
2. **Neon PITR Restore**: In the Neon Console, restore the database to 1 minute prior to the incident timestamp.
3. **Verify Ledger Invariant**: Run `scripts/verify_inventory_integrity.py` to confirm zero double-entry discrepancies.

### Scenario B: Database Connection Exhaustion
1. Verify application is utilizing Neon's **Pooled Endpoint** (`-pooler` subdomain in hostname, e.g., `ep-*-pooler.c-4.ap-southeast-1.aws.neon.tech`).
2. Verify connection pool recycle settings in `src/config.py`:
   - `DB_POOL_SIZE`: 10
   - `DB_MAX_OVERFLOW`: 20
   - `DB_POOL_RECYCLE`: 300 seconds

### Scenario C: Environment Key / Credential Compromise
1. Immediately rotate the password in the Neon Console.
2. Update the `DATABASE_URL` secret in cloud hosting environment variables.
3. Rotate `SECRET_KEY` to invalidate all active JWT user tokens.
4. Restart application container instances to purge stale connection pools.
