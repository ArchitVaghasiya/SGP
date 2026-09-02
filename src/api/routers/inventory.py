from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.db.models import Inventory, Store, Product
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
    Auto-creates store, product, and inventory record if missing.
    """
    # Auto-create Store if missing
    store = db.query(Store).filter_by(store_id=payload.store_id).first()
    if not store:
        store = Store(
            store_id=payload.store_id,
            city="Quito",
            state="Pichincha",
            store_type="D",
            cluster=13
        )
        db.add(store)
        db.commit()

    # Auto-create Product if missing
    product = db.query(Product).filter_by(product_id=payload.product_id).first()
    if not product:
        product = Product(
            product_id=payload.product_id,
            family=f"SKU_{payload.product_id}",
            class_id=100,
            perishable=False
        )
        db.add(product)
        db.commit()

    inv = db.query(Inventory).filter_by(
        store_id=payload.store_id,
        product_id=payload.product_id
    ).first()

    if not inv:
        inv = Inventory(
            store_id=payload.store_id,
            product_id=payload.product_id,
            current_stock=0.0,
            safety_buffer=20.0,
            lead_time_days=7,
            service_level=0.95
        )
        db.add(inv)
        db.commit()

    prev_stock = float(inv.current_stock)

    if payload.override_stock is not None:
        new_stock = max(0.0, float(payload.override_stock))
        msg = f"Stock explicitly overridden from {prev_stock} to {new_stock}"
    elif payload.stock_change is not None:
        new_stock = max(0.0, prev_stock + float(payload.stock_change))
        msg = f"Stock adjusted by {payload.stock_change:+g} from {prev_stock} to {new_stock}"
    else:
        new_stock = prev_stock
        msg = "No stock adjustment specified"

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

