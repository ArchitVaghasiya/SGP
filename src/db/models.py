from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Numeric, Boolean, Date, 
    DateTime, ForeignKey, Index, CheckConstraint, Text
)
from sqlalchemy.orm import relationship
from src.db.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), nullable=False, default="VIEWER")  # ADMIN, MANAGER, INVENTORY_MANAGER, ANALYST, VIEWER
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    contact_name = Column(String(150), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    category = Column(String(100), nullable=True)
    lead_time_days = Column(Integer, nullable=False, default=7)
    min_order_qty = Column(Numeric(12, 2), nullable=False, default=50.0)
    reliability_score = Column(Numeric(4, 2), nullable=False, default=95.0)  # Percentage 0..100
    on_time_pct = Column(Numeric(4, 2), nullable=False, default=92.0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

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
    transactions = relationship("InventoryTransaction", back_populates="store", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, autoincrement=True)
    family = Column(String(100), unique=True, nullable=False)
    class_id = Column(Integer, default=0)
    perishable = Column(Boolean, default=False)
    unit_price = Column(Numeric(10, 2), default=15.00)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)

    sales_records = relationship("SalesHistory", back_populates="product", cascade="all, delete-orphan")
    inventory_items = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="product", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="product", cascade="all, delete-orphan")
    transactions = relationship("InventoryTransaction", back_populates="product", cascade="all, delete-orphan")

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

    __table_args__ = (
        Index("idx_inventory_store_product", "store_id", "product_id"),
    )

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
        Index("idx_sales_history_date", "date"),
        Index("idx_sales_history_store_date", "store_id", "date"),
        Index("idx_sales_history_prod_date", "product_id", "date"),
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
        Index("idx_forecasts_target_date", "target_date"),
    )

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    po_id = Column(Integer, primary_key=True, autoincrement=True)
    po_number = Column(String(50), unique=True, nullable=True)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    order_date = Column(DateTime(timezone=True), default=utc_now)
    order_quantity = Column(Numeric(12, 2), nullable=False)
    unit_cost = Column(Numeric(10, 2), default=12.00)
    total_cost = Column(Numeric(12, 2), default=0.00)
    predicted_demand_7d = Column(Numeric(12, 2), nullable=False)
    current_stock = Column(Numeric(12, 2), nullable=False)
    safety_buffer = Column(Numeric(12, 2), nullable=False)
    shortfall = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")  # DRAFT, PENDING, APPROVED, SENT, RECEIVED, CANCELLED
    expected_delivery_date = Column(Date, nullable=True)
    created_by = Column(String(100), default="AI Restock Engine")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    store = relationship("Store", back_populates="purchase_orders")
    product = relationship("Product", back_populates="purchase_orders")

    __table_args__ = (
        CheckConstraint("status IN ('PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED', 'DRAFT', 'SENT', 'RECEIVED')", name="check_po_status"),
        Index("idx_purchase_orders_store", "store_id", "product_id", "created_at"),
        Index("idx_purchase_orders_status", "status"),
    )

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    transaction_type = Column(String(50), nullable=False)  # ADJUSTMENT, RECEIPT, SALE, RESTOCK, DAMAGE, RETURN
    quantity_change = Column(Numeric(12, 2), nullable=False)
    previous_quantity = Column(Numeric(12, 2), nullable=False)
    resulting_quantity = Column(Numeric(12, 2), nullable=False)
    reference_type = Column(String(50), nullable=True)     # PURCHASE_ORDER, MANUAL_ADJUSTMENT, API_SYNC
    reference_id = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(100), default="System")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    store = relationship("Store", back_populates="transactions")
    product = relationship("Product", back_populates="transactions")

    __table_args__ = (
        Index("idx_inv_tx_store_product", "store_id", "product_id", "created_at"),
        Index("idx_inv_tx_type", "transaction_type"),
    )

class StockAlert(Base):
    __tablename__ = "stock_alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_type = Column(String(50), nullable=False)  # CRITICAL_STOCK, STOCKOUT, OVERSTOCK, DEAD_STOCK, FORECAST_ANOMALY, SUPPLIER_DELAY, PO_APPROVAL
    severity = Column(String(20), nullable=False, default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="UNREAD")  # UNREAD, ACKNOWLEDGED, RESOLVED
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_alerts_store_prod", "store_id", "product_id", "status"),
        Index("idx_alerts_severity", "severity"),
        Index("idx_alerts_status", "status"),
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(255), nullable=False, default="system@supplyiq.internal")
    action = Column(String(100), nullable=False)  # STOCK_UPDATE, PO_APPROVAL, PO_RECEIPT, SUPPLIER_EDIT, USER_ROLE_CHANGE
    entity = Column(String(50), nullable=False)   # INVENTORY, PURCHASE_ORDER, SUPPLIER, USER
    entity_id = Column(String(100), nullable=True)
    previous_state = Column(Text, nullable=True)
    new_state = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        Index("idx_audit_logs_entity", "entity", "entity_id"),
        Index("idx_audit_logs_created", "created_at"),
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

    __table_args__ = (
        Index("idx_holidays_events_date", "date"),
    )

class OilPrice(Base):
    __tablename__ = "oil_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False)
    dcoilwtico = Column(Numeric(10, 4), nullable=True)

    __table_args__ = (
        Index("idx_oil_prices_date", "date"),
    )
