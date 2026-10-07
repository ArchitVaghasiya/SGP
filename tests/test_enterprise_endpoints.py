import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from src.api.main import app
from src.db.session import get_db, Base
from src.db.models import Store, Product, SalesHistory, Inventory, PurchaseOrder, User, Supplier, StockAlert, InventoryTransaction
from src.api.auth import hash_password, create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_enterprise_test_data(db):
    s1 = Store(store_id=1, city="Quito", state="Pichincha", store_type="A", cluster=1)
    s2 = Store(store_id=2, city="Guayaquil", state="Guayas", store_type="B", cluster=2)
    p1 = Product(product_id=1, family="AUTOMOTIVE", class_id=100, perishable=False, unit_price=45.0)
    p2 = Product(product_id=2, family="GROCERY I", class_id=100, perishable=False, unit_price=8.0)
    
    supp = Supplier(id=1, name="Pacific Dairy Co.", code="SUP-102", lead_time_days=3, reliability_score=98.0, on_time_pct=97.0)
    admin = User(
        email="admin@supplyiq.io",
        hashed_password=hash_password("password123"),
        full_name="Admin Director",
        role="ADMIN",
        is_active=True
    )
    viewer = User(
        email="viewer@supplyiq.io",
        hashed_password=hash_password("password123"),
        full_name="Executive Viewer",
        role="VIEWER",
        is_active=True
    )
    db.add_all([s1, s2, p1, p2, supp, admin, viewer])
    db.commit()

    inv1 = Inventory(store_id=1, product_id=1, current_stock=50.0, safety_buffer=20.0, lead_time_days=7, service_level=0.95)
    inv2 = Inventory(store_id=1, product_id=2, current_stock=10.0, safety_buffer=30.0, lead_time_days=7, service_level=0.95)
    po1 = PurchaseOrder(
        po_id=1,
        po_number="PO-2026-01-0001",
        store_id=1,
        product_id=1,
        supplier_id=1,
        order_quantity=100.0,
        unit_cost=12.0,
        total_cost=1200.0,
        predicted_demand_7d=80.0,
        current_stock=50.0,
        safety_buffer=20.0,
        shortfall=50.0,
        status="PENDING"
    )
    alert1 = StockAlert(
        id=1,
        alert_type="CRITICAL_STOCK",
        severity="CRITICAL",
        store_id=1,
        product_id=2,
        title="Critical Stock Warning",
        message="Stock is low",
        status="UNREAD"
    )
    db.add_all([inv1, inv2, po1, alert1])
    db.commit()

    start_date = datetime.now().date() - timedelta(days=30)
    for d in range(30):
        dt = start_date + timedelta(days=d)
        sh1 = SalesHistory(date=dt, store_id=1, product_id=1, sales=10.0, onpromotion=0)
        sh2 = SalesHistory(date=dt, store_id=1, product_id=2, sales=20.0, onpromotion=0)
        db.add_all([sh1, sh2])
    db.commit()

@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_enterprise_test_data(db)
    db.close()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_auth_login_and_demo_users(client):
    res = client.get("/api/v1/auth/demo-users")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 5
    assert any(u["role"] == "ADMIN" for u in data)

    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@supplyiq.io",
        "password": "password123"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["user"]["role"] == "ADMIN"

def test_dashboard_overview(client):
    res = client.get("/api/v1/dashboard/overview")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert "inventory_health" in data
    assert "demand_trend" in data
    assert "action_center" in data
    assert "recommendations" in data
    assert data["kpis"]["forecast_accuracy_pct"] > 90.0

def test_forecast_metrics_and_accuracy(client):
    res = client.get("/api/v1/forecast/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["wape_pct"] == 7.86
    assert "feature_importance" in data
    assert len(data["feature_importance"]) > 0

    cat_res = client.get("/api/v1/forecast/accuracy-by-category")
    assert cat_res.status_code == 200
    assert len(cat_res.json()) > 0

def test_purchase_orders_list_and_filters(client):
    res = client.get("/api/v1/purchase-orders/list")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "status_counts" in data
    assert len(data["items"]) > 0

def test_analytics_abc_xyz(client):
    res = client.get("/api/v1/analytics/abc-xyz")
    assert res.status_code == 200
    data = res.json()
    assert "matrix_9box" in data
    assert "items" in data
    assert len(data["items"]) > 0
    assert "AX" in data["matrix_9box"]

def test_simulation_run(client):
    for mult in [0.5, 1.0, 1.5, 2.0, 3.0]:
        sim_payload = {
            "store_id": 1,
            "product_id": 1,
            "demand_multiplier": mult,
            "lead_time_days": 7,
            "supplier_delay_days": 2,
            "service_level": 0.95
        }
        res = client.post("/api/v1/simulations/run", json=sim_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["parameters"]["demand_multiplier"] == mult
        assert "projection_curve" in data
        assert len(data["projection_curve"]) == 21
        assert "risk_level" in data["results"]

def test_suppliers_and_stores(client):
    supp_res = client.get("/api/v1/suppliers/list")
    assert supp_res.status_code == 200
    assert len(supp_res.json()) > 0

    store_res = client.get("/api/v1/stores/list")
    assert store_res.status_code == 200
    assert len(store_res.json()) > 0

def test_global_search(client):
    res = client.get("/api/v1/search?q=Auto")
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert len(data["results"]) > 0
    assert any("AUTOMOTIVE" in r["title"] for r in data["results"])

def test_rbac_authorization_rejection(client):
    # Viewer token
    viewer_token = create_access_token({"sub": "viewer@supplyiq.io", "role": "VIEWER", "name": "Viewer"})
    headers = {"Authorization": f"Bearer {viewer_token}"}

    # Attempt to approve PO with VIEWER role -> Must return 403 Forbidden
    res = client.post("/api/v1/purchase-orders/1/approve", headers=headers)
    assert res.status_code == 403

def test_purchase_order_full_lifecycle(client):
    admin_token = create_access_token({"sub": "admin@supplyiq.io", "role": "ADMIN", "name": "Admin Director"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create PO
    create_res = client.post("/api/v1/purchase-orders/create", json={
        "store_id": 1,
        "product_id": 2,
        "order_quantity": 80.0,
        "unit_cost": 8.0
    }, headers=headers)
    assert create_res.status_code == 200
    po_id = create_res.json()["po_id"]

    # 2. Approve PO
    approve_res = client.post(f"/api/v1/purchase-orders/{po_id}/approve", headers=headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"

    # 3. Send PO
    send_res = client.post(f"/api/v1/purchase-orders/{po_id}/send", headers=headers)
    assert send_res.status_code == 200
    assert send_res.json()["status"] == "SENT"

    # 4. Receive PO (atomically increases inventory and writes to ledger)
    receive_res = client.post(f"/api/v1/purchase-orders/{po_id}/receive", headers=headers)
    assert receive_res.status_code == 200
    assert receive_res.json()["status"] == "RECEIVED"

    # Verify inventory was updated
    inv_res = client.get("/api/v1/inventory/sku/1/2")
    assert inv_res.status_code == 200
    # Initial stock was 10.0 + 80.0 received = 90.0
    assert inv_res.json()["current_stock"] == 90.0
