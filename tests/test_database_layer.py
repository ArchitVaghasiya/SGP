import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from src.api.main import app
from src.db.session import get_db, Base
from src.db.models import Store, Product, Inventory, InventoryTransaction
from src.config import settings

TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestSession()
    s = Store(store_id=99, city="Test City", state="Test State", store_type="A", cluster=1)
    p = Product(product_id=99, family="TEST_FAMILY", class_id=1, perishable=False)
    inv = Inventory(store_id=99, product_id=99, current_stock=100.0, safety_buffer=25.0)
    db.add_all([s, p, inv])
    db.commit()
    db.close()

    def override_db_dependency():
        db = TestSession()
        try:
            yield db
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db_dependency
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_health_endpoint_healthy(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_sanitized_db_url():
    masked = settings.get_sanitized_db_url()
    assert "***" in masked
    from urllib.parse import urlparse
    parsed = urlparse(settings.DATABASE_URL)
    if parsed.password:
        assert parsed.password not in masked

def test_inventory_atomic_transaction_ledger(client):
    # Execute stock update
    payload = {
        "store_id": 99,
        "product_id": 99,
        "stock_change": 50.0
    }
    res = client.post("/inventory/update", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["previous_stock"] == 100.0
    assert data["new_stock"] == 150.0

    # Verify atomic transaction in ledger
    db = TestSession()
    tx = db.query(InventoryTransaction).filter_by(store_id=99, product_id=99).order_by(InventoryTransaction.id.desc()).first()
    assert tx is not None
    assert float(tx.previous_quantity) == 100.0
    assert float(tx.resulting_quantity) == 150.0
    assert float(tx.quantity_change) == 50.0
    assert tx.transaction_type == "RECEIPT"
    db.close()

def test_database_session_rollback_on_error():
    db = TestSession()
    try:
        # Intentionally cause duplicate PK error
        dup_store = Store(store_id=99, city="Dup", state="Dup", store_type="B", cluster=2)
        db.add(dup_store)
        db.commit()
    except Exception:
        db.rollback()
    
    # Verify session is still healthy after rollback
    count = db.query(Store).count()
    assert count >= 1
    db.close()
