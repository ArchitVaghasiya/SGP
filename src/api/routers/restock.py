from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.db.models import PurchaseOrder, Store
from src.ml.predict import predictor
from src.services.restock import evaluate_store_restock
from src.api.schemas import RestockEvaluationResponse, PurchaseOrderSchema

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
