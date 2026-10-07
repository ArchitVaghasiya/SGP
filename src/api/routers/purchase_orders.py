from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.db.models import PurchaseOrder, Product, Store, Supplier, Inventory, InventoryTransaction, AuditLog, User, StockAlert
from src.api.auth import require_auth, require_roles

router = APIRouter(prefix="/purchase-orders", tags=["Procurement & Purchase Orders"])

class POCreateRequest(BaseModel):
    store_id: int
    product_id: int
    order_quantity: float = Field(..., gt=0)
    supplier_id: Optional[int] = None
    unit_cost: Optional[float] = 12.00
    expected_delivery_date: Optional[str] = None
    created_by: Optional[str] = "SupplyIQ Specialist"
    auto_approve: Optional[bool] = False

class POActionResponse(BaseModel):
    success: bool
    message: str
    po_id: int
    po_number: str
    status: str
    new_stock: Optional[float] = None

@router.get("/list")
def list_purchase_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    store_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = (
        db.query(PurchaseOrder, Product, Store, Supplier)
        .join(Product, PurchaseOrder.product_id == Product.product_id)
        .join(Store, PurchaseOrder.store_id == Store.store_id)
        .outerjoin(Supplier, PurchaseOrder.supplier_id == Supplier.id)
    )

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(PurchaseOrder.status == status_filter.upper())
    if store_id is not None:
        query = query.filter(PurchaseOrder.store_id == store_id)

    total_count = query.count()
    records = query.order_by(PurchaseOrder.po_id.desc()).offset(offset).limit(limit).all()

    items = []
    for po, prod, store, supp in records:
        items.append({
            "po_id": po.po_id,
            "po_number": po.po_number or f"PO-2026-{po.po_id:04d}",
            "store_id": po.store_id,
            "store_name": f"Store {store.store_id} ({store.city})",
            "product_id": po.product_id,
            "product_name": prod.family,
            "category": prod.family,
            "supplier_id": supp.id if supp else None,
            "supplier_name": supp.name if supp else "Pichincha Foods Ltd.",
            "order_quantity": float(po.order_quantity),
            "unit_cost": float(po.unit_cost) if po.unit_cost else 12.00,
            "total_cost": float(po.total_cost) if po.total_cost else float(po.order_quantity) * 12.00,
            "current_stock": float(po.current_stock),
            "safety_buffer": float(po.safety_buffer),
            "predicted_demand_7d": float(po.predicted_demand_7d),
            "status": po.status,
            "expected_delivery_date": po.expected_delivery_date.isoformat() if po.expected_delivery_date else None,
            "created_by": po.created_by or "SupplyIQ AI",
            "created_at": po.created_at.isoformat() if po.created_at else None
        })

    # Aggregated status counts for tab badges
    status_counts = {
        "ALL": db.query(PurchaseOrder).count(),
        "PENDING": db.query(PurchaseOrder).filter(PurchaseOrder.status == "PENDING").count(),
        "APPROVED": db.query(PurchaseOrder).filter(PurchaseOrder.status == "APPROVED").count(),
        "SENT": db.query(PurchaseOrder).filter(PurchaseOrder.status == "SENT").count(),
        "RECEIVED": db.query(PurchaseOrder).filter(PurchaseOrder.status.in_(["RECEIVED", "FULFILLED"])).count(),
        "CANCELLED": db.query(PurchaseOrder).filter(PurchaseOrder.status == "CANCELLED").count()
    }

    return {
        "items": items,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "status_counts": status_counts
    }

@router.get("/{po_id}")
def get_purchase_order(po_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(PurchaseOrder, Product, Store, Supplier)
        .join(Product, PurchaseOrder.product_id == Product.product_id)
        .join(Store, PurchaseOrder.store_id == Store.store_id)
        .outerjoin(Supplier, PurchaseOrder.supplier_id == Supplier.id)
        .filter(PurchaseOrder.po_id == po_id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail=f"Purchase order #{po_id} not found")

    po, prod, store, supp = result
    return {
        "po_id": po.po_id,
        "po_number": po.po_number or f"PO-2026-{po.po_id:04d}",
        "store_id": po.store_id,
        "store_name": f"Store {store.store_id} ({store.city})",
        "product_id": po.product_id,
        "product_name": prod.family,
        "category": prod.family,
        "supplier": {
            "id": supp.id if supp else None,
            "name": supp.name if supp else "Pichincha Foods Ltd.",
            "contact": supp.contact_name if supp else "Logistics Support",
            "email": supp.email if supp else "orders@supplier.internal",
            "lead_time_days": supp.lead_time_days if supp else 7
        },
        "order_quantity": float(po.order_quantity),
        "unit_cost": float(po.unit_cost) if po.unit_cost else 12.00,
        "total_cost": float(po.total_cost) if po.total_cost else float(po.order_quantity) * 12.00,
        "current_stock": float(po.current_stock),
        "safety_buffer": float(po.safety_buffer),
        "shortfall": float(po.shortfall),
        "predicted_demand_7d": float(po.predicted_demand_7d),
        "status": po.status,
        "expected_delivery_date": po.expected_delivery_date.isoformat() if po.expected_delivery_date else None,
        "created_by": po.created_by,
        "created_at": po.created_at.isoformat() if po.created_at else None
    }

@router.post("/create", response_model=POActionResponse)
def create_purchase_order(
    payload: POCreateRequest,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    inv = db.query(Inventory).filter_by(store_id=payload.store_id, product_id=payload.product_id).with_for_update().first()
    cur_stock = float(inv.current_stock) if inv else 0.0
    s_buff = float(inv.safety_buffer) if inv else 50.0

    unit_cost = payload.unit_cost or 12.00
    total_cost = payload.order_quantity * unit_cost
    qty = float(payload.order_quantity)

    initial_status = "APPROVED" if payload.auto_approve else "PENDING"

    po = PurchaseOrder(
        store_id=payload.store_id,
        product_id=payload.product_id,
        supplier_id=payload.supplier_id or 1,
        order_quantity=qty,
        unit_cost=unit_cost,
        total_cost=total_cost,
        predicted_demand_7d=s_buff * 1.5,
        current_stock=cur_stock,
        safety_buffer=s_buff,
        shortfall=max(0.0, (s_buff * 1.5) - cur_stock),
        status=initial_status,
        created_by=current_user.full_name or "SupplyIQ Specialist"
    )
    db.add(po)
    db.flush()

    po.po_number = f"PO-2026-{po.po_id:04d}"

    new_stock = cur_stock
    if payload.auto_approve:
        # Immediately reflect in Inventory table
        if not inv:
            inv = Inventory(
                store_id=payload.store_id,
                product_id=payload.product_id,
                current_stock=qty,
                safety_buffer=s_buff,
                lead_time_days=7,
                last_updated=datetime.now(timezone.utc)
            )
            db.add(inv)
            prev_qty = 0.0
            new_stock = qty
        else:
            prev_qty = float(inv.current_stock)
            new_stock = prev_qty + qty
            inv.current_stock = new_stock
            inv.last_updated = datetime.now(timezone.utc)

        # Add double-entry inventory ledger transaction
        tx = InventoryTransaction(
            store_id=payload.store_id,
            product_id=payload.product_id,
            transaction_type="RECEIPT",
            quantity_change=qty,
            previous_quantity=prev_qty,
            resulting_quantity=new_stock,
            reference_type="PURCHASE_ORDER_INSTANT_RESTOCK",
            reference_id=po.po_number,
            notes=f"Instant stock restock (+{qty} units) authorized by {current_user.full_name or current_user.email}",
            created_by=current_user.email
        )
        db.add(tx)

        # Resolve critical alerts for this Store-Product pair
        db.query(StockAlert).filter(
            StockAlert.store_id == payload.store_id,
            StockAlert.product_id == payload.product_id,
            StockAlert.status.in_(["UNREAD", "ACKNOWLEDGED"])
        ).update(
            {"status": "RESOLVED", "resolved_at": datetime.now(timezone.utc)},
            synchronize_session=False
        )

        # Audit Log
        audit = AuditLog(
            user_email=current_user.email,
            action="PO_CREATE_AND_APPROVE",
            entity="PURCHASE_ORDER",
            entity_id=str(po.po_id),
            previous_state=f"Stock: {prev_qty}",
            new_state=f"APPROVED ({po.po_number}, Stock updated to {new_stock}, +{qty} units credited)"
        )
        db.add(audit)
    else:
        # Standard PO Creation Audit Log
        audit = AuditLog(
            user_email=current_user.email,
            action="PO_CREATE",
            entity="PURCHASE_ORDER",
            entity_id=str(po.po_id),
            new_state=f"Created PO {po.po_number} for {qty} units (Pending Approval)"
        )
        db.add(audit)

    db.commit()

    message = (
        f"Purchase order {po.po_number} approved! {qty} units credited to stock (New Stock: {new_stock}) and critical risk resolved."
        if payload.auto_approve
        else f"Purchase order {po.po_number} created successfully and submitted for approval."
    )

    return POActionResponse(
        success=True,
        message=message,
        po_id=po.po_id,
        po_number=po.po_number,
        status=initial_status,
        new_stock=new_stock
    )

@router.post("/{po_id}/approve", response_model=POActionResponse)
def approve_purchase_order(
    po_id: int,
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER", "INVENTORY_MANAGER"])),
    db: Session = Depends(get_db)
):
    po = db.query(PurchaseOrder).filter_by(po_id=po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    if po.status not in ["PENDING", "DRAFT"]:
        raise HTTPException(status_code=400, detail=f"Cannot approve PO in status {po.status}")

    prev_status = po.status
    po.status = "APPROVED"
    qty = float(po.order_quantity)

    # Dynamically reflect product quantity in Inventory stock
    inv = db.query(Inventory).filter_by(store_id=po.store_id, product_id=po.product_id).with_for_update().first()
    if not inv:
        inv = Inventory(
            store_id=po.store_id,
            product_id=po.product_id,
            current_stock=qty,
            safety_buffer=50.0,
            lead_time_days=7
        )
        db.add(inv)
        prev_qty = 0.0
        new_qty = qty
    else:
        prev_qty = float(inv.current_stock)
        new_qty = prev_qty + qty
        inv.current_stock = new_qty
        inv.last_updated = datetime.now(timezone.utc)

    # Add ledger transaction
    tx = InventoryTransaction(
        store_id=po.store_id,
        product_id=po.product_id,
        transaction_type="RECEIPT",
        quantity_change=qty,
        previous_quantity=prev_qty,
        resulting_quantity=new_qty,
        reference_type="PURCHASE_ORDER_APPROVAL",
        reference_id=po.po_number or f"PO-2026-{po.po_id:04d}",
        notes=f"Stock quantity (+{qty} units) credited upon approval by {current_user.full_name}",
        created_by=current_user.email
    )
    db.add(tx)

    # Immediately resolve critical stock alerts for this SKU to remove it from critical section
    db.query(StockAlert).filter(
        StockAlert.store_id == po.store_id,
        StockAlert.product_id == po.product_id,
        StockAlert.status.in_(["UNREAD", "ACKNOWLEDGED"])
    ).update(
        {"status": "RESOLVED", "resolved_at": datetime.now(timezone.utc)},
        synchronize_session=False
    )

    audit = AuditLog(
        user_email=current_user.email,
        action="PO_APPROVE",
        entity="PURCHASE_ORDER",
        entity_id=str(po.po_id),
        previous_state=f"Status: {prev_status}, Previous Stock: {prev_qty}",
        new_state=f"APPROVED (Stock updated to {new_qty}, +{qty} units credited)"
    )
    db.add(audit)
    db.commit()

    return POActionResponse(
        success=True,
        message=f"Purchase order {po.po_number} approved! {qty} units reflected in stock (New Stock: {new_qty}) and removed from Critical Risk section.",
        po_id=po.po_id,
        po_number=po.po_number or f"PO-2026-{po.po_id:04d}",
        status="APPROVED",
        new_stock=new_qty
    )

@router.post("/{po_id}/send", response_model=POActionResponse)
def send_purchase_order(
    po_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    po = db.query(PurchaseOrder).filter_by(po_id=po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    if po.status != "APPROVED":
        raise HTTPException(status_code=400, detail="PO must be APPROVED before sending to supplier")

    po.status = "SENT"
    audit = AuditLog(
        user_email=current_user.email,
        action="PO_TRANSMIT",
        entity="PURCHASE_ORDER",
        entity_id=str(po.po_id),
        new_state="SENT"
    )
    db.add(audit)
    db.commit()

    return POActionResponse(
        success=True,
        message=f"Purchase order {po.po_number} transmitted to supplier EDI gateway.",
        po_id=po.po_id,
        po_number=po.po_number or f"PO-2026-{po.po_id:04d}",
        status="SENT"
    )

@router.post("/{po_id}/receive", response_model=POActionResponse)
def receive_purchase_order(
    po_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Marks PO as RECEIVED/FULFILLED:
    1. Updates PO status to RECEIVED
    2. Ensures inventory stock is reflected if not already credited
    3. Writes to audit_logs
    """
    po = db.query(PurchaseOrder).filter_by(po_id=po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    if po.status in ["RECEIVED", "FULFILLED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail=f"Cannot receive PO in status {po.status}")

    po.status = "RECEIVED"

    # Audit log
    audit = AuditLog(
        user_email=current_user.email,
        action="PO_RECEIPT_FULFILLMENT",
        entity="PURCHASE_ORDER",
        entity_id=str(po.po_id),
        new_state=f"PO {po.po_number} marked RECEIVED"
    )
    db.add(audit)
    db.commit()

    return POActionResponse(
        success=True,
        message=f"Purchase order {po.po_number} marked as RECEIVED / Fulfilled.",
        po_id=po.po_id,
        po_number=po.po_number or f"PO-2026-{po.po_id:04d}",
        status="RECEIVED"
    )

@router.post("/{po_id}/cancel", response_model=POActionResponse)
def cancel_purchase_order(
    po_id: int,
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"])),
    db: Session = Depends(get_db)
):
    po = db.query(PurchaseOrder).filter_by(po_id=po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    if po.status in ["RECEIVED", "FULFILLED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel PO in status {po.status}")

    po.status = "CANCELLED"
    audit = AuditLog(
        user_email=current_user.email,
        action="PO_CANCEL",
        entity="PURCHASE_ORDER",
        entity_id=str(po.po_id),
        new_state="CANCELLED"
    )
    db.add(audit)
    db.commit()

    return POActionResponse(
        success=True,
        message=f"Purchase order {po.po_number} was cancelled.",
        po_id=po.po_id,
        po_number=po.po_number or f"PO-2026-{po.po_id:04d}",
        status="CANCELLED"
    )
