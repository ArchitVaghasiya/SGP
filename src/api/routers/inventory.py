from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.db.models import Inventory
from src.api.schemas import InventoryUpdateRequest, InventoryUpdateResponse

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

@router.post("/update", response_model=InventoryUpdateResponse)
def update_inventory_stock(
    payload: InventoryUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates inventory stock receipts or adjustments.
    Pass `override_stock` to explicitly set absolute stock, or `stock_change` to increment/decrement.
    """
    inv = db.query(Inventory).filter_by(
        store_id=payload.store_id,
        product_id=payload.product_id
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail=f"Inventory record for store {payload.store_id}, product {payload.product_id} not found")

    prev_stock = float(inv.current_stock)

    if payload.override_stock is not None:
        new_stock = max(0.0, float(payload.override_stock))
        msg = f"Stock explicitly overridden from {prev_stock} to {new_stock}"
    else:
        new_stock = max(0.0, prev_stock + float(payload.stock_change))
        msg = f"Stock adjusted by {payload.stock_change:+g} from {prev_stock} to {new_stock}"

    inv.current_stock = new_stock
    inv.last_updated = datetime.now(timezone.utc)
    db.commit()

    return InventoryUpdateResponse(
        store_id=payload.store_id,
        product_id=payload.product_id,
        previous_stock=prev_stock,
        new_stock=new_stock,
        message=msg
    )
