from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Numeric, Boolean, Date, 
    DateTime, ForeignKey, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from src.db.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class Store(Base):
    __tablename__ = "stores"

    store_id = Column(Integer, primary_key=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    store_type = Column(String(10), nullable=False)
    cluster = Column(Integer, nullable=False)

    sales_records = relationship("SalesHistory", back_populates="store", cascade="all, delete-orphan")
    inventory_items = relationship("Inventory", back_populates="store", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="store", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="store", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, autoincrement=True)
    family = Column(String(100), unique=True, nullable=False)
    class_id = Column(Integer, default=0)
    perishable = Column(Boolean, default=False)

    sales_records = relationship("SalesHistory", back_populates="product", cascade="all, delete-orphan")
    inventory_items = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="product", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="product", cascade="all, delete-orphan")

class Inventory(Base):
    __tablename__ = "inventory"

    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), primary_key=True)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), primary_key=True)
    current_stock = Column(Numeric(12, 2), nullable=False, default=0.00)
    safety_buffer = Column(Numeric(12, 2), nullable=False, default=0.00)
    lead_time_days = Column(Integer, nullable=False, default=7)
    service_level = Column(Numeric(4, 3), nullable=False, default=0.95)
    last_updated = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    store = relationship("Store", back_populates="inventory_items")
    product = relationship("Product", back_populates="inventory_items")

class SalesHistory(Base):
    __tablename__ = "sales_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    sales = Column(Numeric(12, 2), nullable=False, default=0.00)
    onpromotion = Column(Integer, nullable=False, default=0)

    store = relationship("Store", back_populates="sales_records")
    product = relationship("Product", back_populates="sales_records")

    __table_args__ = (
        Index("idx_sales_history_lookup", "store_id", "product_id", "date"),
    )

class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    forecast_date = Column(Date, nullable=False)
    target_date = Column(Date, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    predicted_demand = Column(Numeric(12, 2), nullable=False)
    model_version = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    store = relationship("Store", back_populates="forecasts")
    product = relationship("Product", back_populates="forecasts")

    __table_args__ = (
        Index("idx_forecasts_lookup", "store_id", "product_id", "target_date", "forecast_date"),
    )

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    po_id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    order_date = Column(DateTime(timezone=True), default=utc_now)
    order_quantity = Column(Numeric(12, 2), nullable=False)
    predicted_demand_7d = Column(Numeric(12, 2), nullable=False)
    current_stock = Column(Numeric(12, 2), nullable=False)
    safety_buffer = Column(Numeric(12, 2), nullable=False)
    shortfall = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    store = relationship("Store", back_populates="purchase_orders")
    product = relationship("Product", back_populates="purchase_orders")

    __table_args__ = (
        CheckConstraint("status IN ('PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED')", name="check_po_status"),
        Index("idx_purchase_orders_store", "store_id", "product_id", "created_at"),
    )

class HolidayEvent(Base):
    __tablename__ = "holidays_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False)
    type = Column(String(50), nullable=False)
    locale = Column(String(50), nullable=False)
    locale_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    transferred = Column(Boolean, default=False)

class OilPrice(Base):
    __tablename__ = "oil_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False)
    dcoilwtico = Column(Numeric(10, 4), nullable=True)

