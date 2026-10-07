from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.db.session import get_db
from src.db.models import Inventory, Store, Product, InventoryTransaction, Supplier, SalesHistory, PurchaseOrder
from src.api.schemas import InventoryUpdateRequest, InventoryUpdateResponse
from src.ml.predict import predictor

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

@router.get("/list")
def list_inventory(
    store_id: Optional[int] = Query(None, description="Filter by Store ID"),
    category: Optional[str] = Query(None, description="Filter by Product Category"),
    status: Optional[str] = Query(None, description="Filter by Health Status (HEALTHY, LOW_STOCK, CRITICAL, STOCKOUT, OVERSTOCK)"),
    search: Optional[str] = Query(None, description="Search by SKU or Product name"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Returns paginated inventory matrix with real-time stock levels, safety buffers,
    days of supply remaining, and inventory valuation.
    """
    query = db.query(Inventory, Product, Store).join(Product, Inventory.product_id == Product.product_id).join(Store, Inventory.store_id == Store.store_id)

    if store_id is not None:
        query = query.filter(Inventory.store_id == store_id)
    if category:
        query = query.filter(Product.family.ilike(f"%{category}%"))
    if search:
        query = query.filter(Product.family.ilike(f"%{search}%"))

    all_results = query.all()
    
    # Process health states and metrics
    items = []
    for inv, prod, st in all_results:
        current_stock = float(inv.current_stock)
        safety_buffer = float(inv.safety_buffer)
        unit_price = float(prod.unit_price) if prod.unit_price else 15.0
        
        # Estimate daily demand
        est_daily = max(2.0, safety_buffer / (1.645 * 2.645))
        pred_7d = round(est_daily * 7.0, 1)
        days_rem = round(current_stock / max(0.1, est_daily), 1)

        if current_stock <= 0:
            item_status = "STOCKOUT"
        elif current_stock < safety_buffer:
            item_status = "CRITICAL"
        elif current_stock < (safety_buffer * 1.5):
            item_status = "LOW_STOCK"
        elif current_stock > (safety_buffer * 5.0) and current_stock > 500:
            item_status = "OVERSTOCK"
        else:
            item_status = "HEALTHY"

        if status and status.upper() != "ALL" and item_status != status.upper():
            continue

        items.append({
            "store_id": inv.store_id,
            "store_city": st.city,
            "product_id": prod.product_id,
            "sku": f"SKU-{prod.product_id:03d}",
            "product_name": prod.family,
            "category": prod.family,
            "perishable": prod.perishable,
            "current_stock": current_stock,
            "safety_buffer": safety_buffer,
            "lead_time_days": inv.lead_time_days,
            "service_level": float(inv.service_level),
            "predicted_demand_7d": pred_7d,
            "days_remaining": days_rem,
            "unit_price": unit_price,
            "inventory_value": round(current_stock * unit_price, 2),
            "status": item_status,
            "risk_level": item_status,
            "last_updated": inv.last_updated.isoformat() if inv.last_updated else None
        })

    # Pagination
    total = len(items)
    start = (page - 1) * limit
    paged_items = items[start:start + limit]

    return {
        "items": paged_items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

@router.get("/sku/{store_id}/{product_id}")
def get_sku_intelligence_detail(
    store_id: int,
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns deep SKU intelligence: 30-day historical demand, 7-day forecast curve,
    safety buffer parameters, supplier data, recent transactions, and explainable AI decision.
    """
    store = db.query(Store).filter_by(store_id=store_id).first()
    prod = db.query(Product).filter_by(product_id=product_id).first()
    inv = db.query(Inventory).filter_by(store_id=store_id, product_id=product_id).first()

    if not store or not prod:
        raise HTTPException(status_code=404, detail="Store or Product not found")

    current_stock = float(inv.current_stock) if inv else 100.0
    safety_buffer = float(inv.safety_buffer) if inv else 30.0
    unit_price = float(prod.unit_price) if prod.unit_price else 15.0
    lead_time = inv.lead_time_days if inv else 7

    # Run ML Predictor for 7-day future
    forecast_data = predictor.predict_next_7_days(db, store_id=store_id, product_id=product_id)
    pred_7d = forecast_data["predicted_demand_7d"]
    daily_demand = pred_7d / 7.0

    # Historical 30-day sales
    recent_sales = (
        db.query(SalesHistory)
        .filter_by(store_id=store_id, product_id=product_id)
        .order_by(SalesHistory.date.desc())
        .limit(30)
        .all()
    )
    history_points = [
        {"date": s.date.strftime("%b %d"), "sales": float(s.sales)}
        for s in reversed(recent_sales)
    ]

    # Supplier info
    supplier = db.query(Supplier).filter_by(id=prod.supplier_id).first()
    supplier_info = {
        "name": supplier.name if supplier else "Andes Agro Logistics",
        "code": supplier.code if supplier else "SUP-101",
        "lead_time_days": supplier.lead_time_days if supplier else lead_time,
        "reliability_score": float(supplier.reliability_score) if supplier else 96.5,
        "on_time_pct": float(supplier.on_time_pct) if supplier else 95.0,
        "min_order_qty": float(supplier.min_order_qty) if supplier else 50.0
    }

    # Recent Transactions
    txs = (
        db.query(InventoryTransaction)
        .filter_by(store_id=store_id, product_id=product_id)
        .order_by(InventoryTransaction.created_at.desc())
        .limit(10)
        .all()
    )
    tx_list = [
        {
            "id": t.id,
            "type": t.transaction_type,
            "change": float(t.quantity_change),
            "resulting_stock": float(t.resulting_quantity),
            "notes": t.notes,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for t in txs
    ]

    # Explainable Restock Decision Calculation
    reorder_point = round(safety_buffer + (daily_demand * lead_time), 1)
    shortfall = max(0.0, reorder_point - current_stock)
    recommended_order = round(max(float(supplier_info["min_order_qty"]), shortfall), 0) if current_stock < reorder_point else 0.0
    days_rem = round(current_stock / max(0.1, daily_demand), 1)

    if current_stock <= 0:
        calculated_risk = "STOCKOUT"
    elif current_stock < safety_buffer:
        calculated_risk = "CRITICAL"
    elif current_stock < (safety_buffer * 1.5):
        calculated_risk = "LOW_STOCK"
    elif current_stock > (safety_buffer * 5.0) and current_stock > 500:
        calculated_risk = "OVERSTOCK"
    else:
        calculated_risk = "HEALTHY"

    return {
        "sku": f"SKU-{prod.product_id:03d}",
        "product_id": prod.product_id,
        "product_name": prod.family,
        "category": prod.family,
        "store_id": store_id,
        "store_city": store.city,
        "store_name": f"Store #{store.store_id} ({store.city})",
        "current_stock": current_stock,
        "safety_buffer": safety_buffer,
        "lead_time_days": lead_time,
        "service_level": float(inv.service_level) if inv else 0.95,
        "unit_price": unit_price,
        "inventory_value": round(current_stock * unit_price, 2),
        "days_remaining": days_rem,
        "predicted_demand_7d": round(pred_7d, 2),
        "reorder_point": reorder_point,
        "recommended_order": recommended_order,
        "is_reorder_recommended": recommended_order > 0,
        "risk_level": calculated_risk,
        "status": calculated_risk,
        "decision_explanation": {
            "current_stock": current_stock,
            "demand_during_lead_time": round(daily_demand * lead_time, 1),
            "safety_buffer": safety_buffer,
            "reorder_threshold": reorder_point,
            "shortfall": round(shortfall, 1),
            "supplier_moq": supplier_info["min_order_qty"],
            "rationale": f"Order {recommended_order:g} units because predicted demand during the {lead_time}-day lead time is {daily_demand * lead_time:.1f} units with a {safety_buffer:.1f} safety buffer, leaving a net shortfall of {shortfall:.1f} units against current stock ({current_stock:.1f} units)."
        },
        "forecast": forecast_data,
        "sales_history": history_points,
        "supplier": supplier_info,
        "transactions": tx_list
    }

@router.get("/transactions")
def get_inventory_transactions(
    store_id: Optional[int] = Query(None),
    product_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Returns paginated immutable inventory transaction ledger entries."""
    q = db.query(InventoryTransaction, Product, Store).join(Product, InventoryTransaction.product_id == Product.product_id).join(Store, InventoryTransaction.store_id == Store.store_id)
    if store_id:
        q = q.filter(InventoryTransaction.store_id == store_id)
    if product_id:
        q = q.filter(InventoryTransaction.product_id == product_id)

    total = q.count()
    records = q.order_by(InventoryTransaction.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for tx, prod, st in records:
        items.append({
            "id": tx.id,
            "store_id": tx.store_id,
            "store_city": st.city,
            "product_id": tx.product_id,
            "sku": f"SKU-{prod.product_id:03d}",
            "product_name": prod.family,
            "transaction_type": tx.transaction_type,
            "quantity_change": float(tx.quantity_change),
            "previous_quantity": float(tx.previous_quantity),
            "resulting_quantity": float(tx.resulting_quantity),
            "reference_type": tx.reference_type,
            "notes": tx.notes,
            "created_by": tx.created_by,
            "created_at": tx.created_at.isoformat() if tx.created_at else None
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

@router.post("/update", response_model=InventoryUpdateResponse)
def update_inventory_stock(
    payload: InventoryUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates inventory stock receipts, manual additions, deductions, or direct cycle counts.
    Atomically updates current stock and creates an immutable InventoryTransaction ledger record.
    """
    store = db.query(Store).filter_by(store_id=payload.store_id).first()
    if not store:
        store = Store(store_id=payload.store_id, city="Quito", state="Pichincha", store_type="D", cluster=13)
        db.add(store)
        db.flush()

    product = db.query(Product).filter_by(product_id=payload.product_id).first()
    if not product:
        product = Product(product_id=payload.product_id, family=f"SKU_{payload.product_id}", class_id=100, perishable=False)
        db.add(product)
        db.flush()

    inv = db.query(Inventory).filter_by(store_id=payload.store_id, product_id=payload.product_id).first()
    if not inv:
        inv = Inventory(store_id=payload.store_id, product_id=payload.product_id, current_stock=0.0, safety_buffer=20.0, lead_time_days=7, service_level=0.95)
        db.add(inv)
        db.flush()

    prev_stock = float(inv.current_stock)
    tx_type = payload.reason or "ADJUSTMENT"

    target_override = payload.new_stock if payload.new_stock is not None else payload.override_stock

    if target_override is not None:
        new_stock = max(0.0, float(target_override))
        qty_change = round(new_stock - prev_stock, 2)
        if not payload.reason:
            tx_type = "RECEIPT" if qty_change > 0 else "ADJUSTMENT"
        msg = payload.notes or f"Stock updated from {prev_stock} to {new_stock} ({qty_change:+g})"
    elif payload.stock_change is not None:
        qty_change = round(float(payload.stock_change), 2)
        new_stock = max(0.0, round(prev_stock + qty_change, 2))
        if not payload.reason:
            tx_type = "RECEIPT" if qty_change > 0 else ("DAMAGE" if qty_change < 0 else "ADJUSTMENT")
        msg = payload.notes or f"Stock adjusted by {qty_change:+g} ({prev_stock} -> {new_stock})"
    else:
        new_stock = prev_stock
        qty_change = 0.0
        msg = "No change"

    inv.current_stock = new_stock
    inv.last_updated = datetime.now(timezone.utc)

    if qty_change != 0.0 or target_override is not None:
        tx = InventoryTransaction(
            store_id=payload.store_id,
            product_id=payload.product_id,
            transaction_type=tx_type,
            quantity_change=qty_change,
            previous_quantity=prev_stock,
            resulting_quantity=new_stock,
            reference_type=payload.reason or "MANUAL_ADJUSTMENT",
            notes=msg,
            created_by=payload.updated_by or "operator@supplyiq.io"
        )
        db.add(tx)

    db.commit()

    return InventoryUpdateResponse(
        store_id=payload.store_id,
        product_id=payload.product_id,
        previous_stock=prev_stock,
        new_stock=new_stock,
        message=msg
    )
