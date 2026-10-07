from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from src.db.session import get_db
from src.db.models import Product, Store, Supplier, PurchaseOrder, StockAlert, Inventory

router = APIRouter(prefix="/search", tags=["Global Command Search"])

@router.get("")
def global_search(
    q: str = Query(..., min_length=1, description="Search query string"),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db)
):
    """
    Executes fast multi-entity search across Products, Stores, Suppliers, POs, and Alerts in Neon PostgreSQL.
    """
    term = f"%{q.strip()}%"
    results = []

    # 1. Search Products / SKUs
    prods = db.query(Product).filter(
        or_(
            Product.family.ilike(term),
            func.cast(Product.product_id, String if hasattr(Product, 'String') else str).ilike(term) if hasattr(Product, 'String') else Product.family.ilike(term)
        )
    ).limit(8).all()
    
    for p in prods:
        results.append({
            "type": "sku",
            "id": p.product_id,
            "sku": f"SKU-{p.product_id:03d}",
            "title": f"SKU-{p.product_id:03d}: {p.family}",
            "subtitle": f"Category: {p.family} • Unit Price: ${float(p.unit_price or 15.0):.2f}",
            "target_view": "inventory",
            "params": {"store_id": 1, "product_id": p.product_id}
        })

    # 2. Search Stores
    stores = db.query(Store).filter(
        or_(
            Store.city.ilike(term),
            Store.state.ilike(term)
        )
    ).limit(5).all()

    for s in stores:
        results.append({
            "type": "store",
            "id": s.store_id,
            "title": f"Store #{s.store_id} — {s.city}, {s.state}",
            "subtitle": f"Cluster {s.cluster} • Store Type {s.store_type}",
            "target_view": "stores",
            "params": {"store_id": s.store_id}
        })

    # 3. Search Suppliers
    suppliers = db.query(Supplier).filter(
        or_(
            Supplier.name.ilike(term),
            Supplier.code.ilike(term),
            Supplier.category.ilike(term)
        )
    ).limit(5).all()

    for sup in suppliers:
        results.append({
            "type": "supplier",
            "id": sup.id,
            "title": f"{sup.name} ({sup.code})",
            "subtitle": f"Category: {sup.category} • Lead Time: {sup.lead_time_days}d • Reliability: {float(sup.reliability_score)}%",
            "target_view": "suppliers",
            "params": {"supplier_id": sup.id}
        })

    # 4. Search Purchase Orders
    pos = db.query(PurchaseOrder, Product).join(Product, PurchaseOrder.product_id == Product.product_id).filter(
        or_(
            PurchaseOrder.po_number.ilike(term),
            PurchaseOrder.status.ilike(term)
        )
    ).limit(5).all()

    for po, prod in pos:
        results.append({
            "type": "purchase_order",
            "id": po.po_id,
            "title": f"{po.po_number or f'PO-2026-{po.po_id:04d}'} • {prod.family}",
            "subtitle": f"Status: {po.status} • Order Qty: {float(po.order_quantity)} units",
            "target_view": "purchase-orders",
            "params": {"po_id": po.po_id}
        })

    # 5. Search Stock Alerts
    alerts = db.query(StockAlert).filter(
        or_(
            StockAlert.title.ilike(term),
            StockAlert.message.ilike(term)
        )
    ).limit(5).all()

    for al in alerts:
        results.append({
            "type": "alert",
            "id": al.id,
            "title": f"Alert [{al.severity}]: {al.title}",
            "subtitle": al.message[:80] + "...",
            "target_view": "alerts",
            "params": {"alert_id": al.id}
        })

    return {
        "query": q,
        "total_results": len(results),
        "results": results[:limit]
    }
