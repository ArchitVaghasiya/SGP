import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from src.api.main import app
from src.db.session import get_db, Base
from src.db.models import Store, Product, SalesHistory, Inventory

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_test_data(db):
    s1 = Store(store_id=1, city="Quito", state="Pichincha", store_type="A", cluster=1)
    s2 = Store(store_id=2, city="Guayaquil", state="Guayas", store_type="B", cluster=2)
    p1 = Product(product_id=1, family="AUTOMOTIVE", class_id=100, perishable=False)
    p2 = Product(product_id=2, family="GROCERY I", class_id=100, perishable=False)
    db.add_all([s1, s2, p1, p2])
    db.commit()

    inv1 = Inventory(store_id=1, product_id=1, current_stock=50.0, safety_buffer=20.0, lead_time_days=7, service_level=0.95)
    inv2 = Inventory(store_id=1, product_id=2, current_stock=200.0, safety_buffer=30.0, lead_time_days=7, service_level=0.95)
    db.add_all([inv1, inv2])
    db.commit()

    start_date = datetime.now().date() - timedelta(days=30)
    for d in range(30):
        dt = start_date + timedelta(days=d)
        sh1 = SalesHistory(date=dt, store_id=1, product_id=1, sales=10.0, onpromotion=0)
        sh2 = SalesHistory(date=dt, store_id=1, product_id=2, sales=20.0, onpromotion=0)
        db.add_all([sh1, sh2])
    db.commit()

Base.metadata.create_all(bind=engine)
db = TestingSessionLocal()
seed_test_data(db)
db.close()

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_raw_forecast():
    response = client.get("/forecast/1/1")
    assert response.status_code == 200
    data = response.json()
    assert data["store_id"] == 1
    assert data["product_id"] == 1
    assert "predicted_demand_7d" in data
    assert len(data["daily_forecast"]) == 7

def test_evaluate_restock():
    response = client.get("/restock/evaluate?store_id=1")
    assert response.status_code == 200
    data = response.json()
    assert data["store_id"] == 1
    assert "evaluated_products_count" in data
    assert "evaluations" in data

def test_list_purchase_orders():
    client.get("/restock/evaluate?store_id=1")
    response = client.get("/restock/orders?store_id=1")
    assert response.status_code == 200
    orders = response.json()
    assert isinstance(orders, list)
