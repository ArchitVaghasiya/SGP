from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.db.models import StockAlert, Store, Product, AuditLog, User
from src.api.auth import require_auth

router = APIRouter(prefix="/alerts", tags=["Operational Alerts & Anomaly Center"])

class BulkAcknowledgeRequest(BaseModel):
    alert_ids: Optional[List[int]] = None
    all_unread: Optional[bool] = False

@router.get("/summary")
def get_alerts_summary(db: Session = Depends(get_db)):
    total = db.query(StockAlert).count()
    unread = db.query(StockAlert).filter_by(status="UNREAD").count()
    critical = db.query(StockAlert).filter_by(severity="CRITICAL", status="UNREAD").count()
    high = db.query(StockAlert).filter_by(severity="HIGH", status="UNREAD").count()
    medium = db.query(StockAlert).filter_by(severity="MEDIUM", status="UNREAD").count()
    low = db.query(StockAlert).filter_by(severity="LOW", status="UNREAD").count()

    return {
        "total_alerts": total,
        "unread_alerts": unread,
        "critical_unread": critical,
        "high_unread": high,
        "medium_unread": medium,
        "low_unread": low
    }

@router.get("/list")
def list_alerts(
    severity: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    store_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = (
        db.query(StockAlert, Product, Store)
        .join(Product, StockAlert.product_id == Product.product_id)
        .join(Store, StockAlert.store_id == Store.store_id)
    )

    if severity and severity.upper() != "ALL":
        query = query.filter(StockAlert.severity == severity.upper())
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(StockAlert.status == status_filter.upper())
    if store_id is not None:
        query = query.filter(StockAlert.store_id == store_id)

    total_count = query.count()
    records = query.order_by(StockAlert.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for alert, prod, store in records:
        items.append({
            "id": alert.id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "store_id": alert.store_id,
            "store_name": f"Store {store.store_id} ({store.city})",
            "product_id": alert.product_id,
            "product_name": prod.family,
            "sku": f"SKU-{prod.product_id:03d}",
            "title": alert.title,
            "message": alert.message,
            "status": alert.status,
            "created_at": alert.created_at.isoformat() if alert.created_at else None,
            "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None
        })

    return {
        "items": items,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    alert = db.query(StockAlert).filter_by(id=alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    db.commit()

    return {"success": True, "message": f"Alert #{alert_id} acknowledged", "status": "ACKNOWLEDGED"}

@router.post("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    alert = db.query(StockAlert).filter_by(id=alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()

    return {"success": True, "message": f"Alert #{alert_id} resolved", "status": "RESOLVED"}

@router.post("/bulk-acknowledge")
def bulk_acknowledge_alerts(
    payload: BulkAcknowledgeRequest,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    if payload.all_unread:
        db.query(StockAlert).filter(StockAlert.status == "UNREAD").update({"status": "ACKNOWLEDGED"})
    elif payload.alert_ids:
        db.query(StockAlert).filter(StockAlert.id.in_(payload.alert_ids)).update({"status": "ACKNOWLEDGED"}, synchronize_session=False)
    
    db.commit()
    return {"success": True, "message": "Alerts acknowledged successfully"}
