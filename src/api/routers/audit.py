from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.db.models import AuditLog

router = APIRouter(prefix="/audit", tags=["Governance & Audit Logs"])

@router.get("/logs")
def list_audit_logs(
    entity: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if entity and entity.upper() != "ALL":
        query = query.filter(AuditLog.entity == entity.upper())

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for log in logs:
        items.append({
            "id": log.id,
            "user_email": log.user_email,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "previous_state": log.previous_state,
            "new_state": log.new_state,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }
