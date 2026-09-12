from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.db.models import PurchaseOrder, Store
from src.ml.predict import predictor
from src.services.restock import evaluate_store_restock
from src.api.schemas import RestockEvaluationResponse, PurchaseOrderSchema, POStatusUpdateRequest

router = APIRouter(prefix="/restock", tags=["Restock & Orders"])

@router.get("/evaluate", response_model=RestockEvaluationResponse)
def evaluate_restock(
    store_id: int = Query(..., description="Target Store ID to evaluate for restock"),
    strategy: str = Query("statistical", description="Safety buffer calculation strategy ('statistical' or 'static')"),
    db: Session = Depends(get_db)
):
    """
    Evaluates current inventory and projected 7-day demand for all products in a store.
    If projected available stock falls below safety buffer, inserts a purchase_order automatically.
    """
    try:
        res = evaluate_store_restock(
            db=db,
            store_id=store_id,
            predictor=predictor,
            strategy_type=strategy
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restock evaluation failed: {str(e)}")

@router.get("/orders", response_model=List[PurchaseOrderSchema])
def list_purchase_orders(
    store_id: Optional[int] = Query(None, description="Filter purchase orders by store_id"),
    status: Optional[str] = Query(None, description="Filter by status (PENDING, APPROVED, FULFILLED, CANCELLED)"),
    db: Session = Depends(get_db)
):
    """Lists generated purchase orders with optional filtering by store_id and status."""
    query = db.query(PurchaseOrder)
    if store_id is not None:
        query = query.filter_by(store_id=store_id)
    if status is not None:
        query = query.filter_by(status=status.upper())

    orders = query.order_by(PurchaseOrder.created_at.desc()).all()

    result = []
    for o in orders:
        result.append(PurchaseOrderSchema(
            po_id=o.po_id,
            store_id=o.store_id,
            product_id=o.product_id,
            order_quantity=float(o.order_quantity),
            status=o.status,
            created_at=o.created_at.isoformat() if o.created_at else None
        ))
    return result

@router.put("/orders/{po_id}/status", response_model=PurchaseOrderSchema)
def update_po_status(
    po_id: int,
    payload: POStatusUpdateRequest,
    db: Session = Depends(get_db)
):
    """Updates the status of a purchase order and handles inventory receiving if fulfilled."""
    from src.db.models import Inventory
    po = db.query(PurchaseOrder).filter_by(po_id=po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    new_status = payload.status.upper()
    valid_statuses = {"PENDING", "APPROVED", "FULFILLED", "CANCELLED"}
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    if new_status == "FULFILLED" and po.status != "FULFILLED":
        inv = db.query(Inventory).filter_by(store_id=po.store_id, product_id=po.product_id).first()
        if inv:
            inv.current_stock = float(inv.current_stock) + float(po.order_quantity)
            
    po.status = new_status
    db.commit()
    db.refresh(po)
    
    return PurchaseOrderSchema(
        po_id=po.po_id,
        store_id=po.store_id,
        product_id=po.product_id,
        order_quantity=float(po.order_quantity),
        status=po.status,
        created_at=po.created_at.isoformat() if po.created_at else None
    )

