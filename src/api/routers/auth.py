from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.db.models import User
from src.api.auth import verify_password, hash_password, create_access_token, require_auth

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "VIEWER"

class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: str
    last_login: Optional[str] = None

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact your system administrator."
        )

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token({"sub": user.email, "role": user.role, "name": user.full_name})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    )

@router.post("/register", response_model=UserProfileResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter_by(email=payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    role = payload.role.upper()
    if role not in ["ADMIN", "MANAGER", "INVENTORY_MANAGER", "ANALYST", "VIEWER"]:
        role = "VIEWER"

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
        last_login=None
    )

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(require_auth)):
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat() if current_user.created_at else "",
        last_login=current_user.last_login.isoformat() if current_user.last_login else None
    )

@router.get("/demo-users")
def get_demo_users():
    """Returns available predefined demo accounts for quick one-click evaluator login."""
    return [
        {"role": "ADMIN", "email": "admin@supplyiq.io", "name": "Admin Director", "desc": "Full system permissions, user control & settings"},
        {"role": "MANAGER", "email": "manager@supplyiq.io", "name": "Supply Chain Manager", "desc": "PO approvals, inventory oversight & suppliers"},
        {"role": "INVENTORY_MANAGER", "email": "inventory@supplyiq.io", "name": "Inventory Specialist", "desc": "Stock adjustments, restock runs & receiving"},
        {"role": "ANALYST", "email": "analyst@supplyiq.io", "name": "Data Scientist / Analyst", "desc": "Forecast analytics, simulation studio & ABC/XYZ"},
        {"role": "VIEWER", "email": "viewer@supplyiq.io", "name": "Executive Viewer", "desc": "Read-only access to Control Tower dashboards"},
    ]
