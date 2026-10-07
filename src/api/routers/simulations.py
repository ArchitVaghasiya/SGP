from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.db.models import Inventory, Product, Store

router = APIRouter(prefix="/simulations", tags=["What-If Scenario Simulator"])

class SimulationRequest(BaseModel):
    store_id: int = 1
    product_id: int = 1
    demand_multiplier: float = Field(1.0, ge=0.1, le=5.0, description="Demand stress multiplier (e.g. 1.2 = +20% spike)")
    lead_time_days: int = Field(7, ge=1, le=60, description="Supplier lead time in days")
    current_stock_override: Optional[float] = Field(None, ge=0)
    service_level: float = Field(0.95, ge=0.80, le=0.999)
    supplier_delay_days: int = Field(0, ge=0, le=30, description="Simulated supplier shipment disruption delay")

@router.post("/run")
def run_simulation(payload: SimulationRequest, db: Session = Depends(get_db)):
    """
    Executes an in-memory forward-looking simulation without altering any production database records.
    Projects daily stock trajectory across 21 days under simulated demand shocks and supplier delays.
    """
    prod = db.query(Product).filter_by(product_id=payload.product_id).first()
    store = db.query(Store).filter_by(store_id=payload.store_id).first()
    if not prod or not store:
        raise HTTPException(status_code=404, detail="Store or Product not found")

    inv = db.query(Inventory).filter_by(store_id=payload.store_id, product_id=payload.product_id).first()
    
    current_stock = payload.current_stock_override if payload.current_stock_override is not None else (float(inv.current_stock) if inv else 150.0)
    baseline_safety = float(inv.safety_buffer) if inv else 40.0
    
    # Baseline daily demand estimated from safety buffer or category defaults
    base_daily_demand = max(5.0, baseline_safety / (1.645 * 2.645))
    simulated_daily_demand = base_daily_demand * payload.demand_multiplier
    effective_lead_time = payload.lead_time_days + payload.supplier_delay_days

    # Statistical safety stock recomputation under new parameters
    z_score = 1.645 if payload.service_level <= 0.95 else 2.05 if payload.service_level <= 0.98 else 2.33
    simulated_safety_buffer = round(z_score * (simulated_daily_demand * 0.35) * (effective_lead_time ** 0.5), 1)

    reorder_point = round((simulated_daily_demand * effective_lead_time) + simulated_safety_buffer, 1)
    shortfall = max(0.0, reorder_point - current_stock)
    recommended_order = round(max(50.0, shortfall), 0) if shortfall > 0 else 0.0

    # 21-day Stock Burn-down projection
    projection_series = []
    running_stock = current_stock
    stockout_day = None
    today = datetime.now().date()

    for day in range(1, 22):
        date_str = (today + timedelta(days=day)).isoformat()
        daily_burn = simulated_daily_demand * (1.0 + ((day * 7) % 11 - 5) / 100.0)
        running_stock = max(0.0, running_stock - daily_burn)

        if running_stock <= 0.0 and stockout_day is None:
            stockout_day = day

        projection_series.append({
            "day": day,
            "date": date_str,
            "projected_stock": round(running_stock, 1),
            "safety_threshold": simulated_safety_buffer,
            "daily_demand": round(daily_burn, 1),
            "is_stockout": running_stock <= 0.0
        })

    days_remaining = round(current_stock / max(0.1, simulated_daily_demand), 1)

    if days_remaining <= 2.0 or (stockout_day and stockout_day <= 3):
        risk_level = "CRITICAL"
    elif days_remaining <= 5.0 or (stockout_day and stockout_day <= 7):
        risk_level = "HIGH"
    elif days_remaining <= 10.0:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    return {
        "simulation_mode": "ACTIVE (In-Memory Only)",
        "store_id": payload.store_id,
        "store_name": f"Store {store.store_id} ({store.city})",
        "product_id": payload.product_id,
        "product_name": prod.family,
        "parameters": {
            "demand_multiplier": payload.demand_multiplier,
            "demand_increase_pct": round((payload.demand_multiplier - 1.0) * 100, 1),
            "base_lead_time": payload.lead_time_days,
            "supplier_delay": payload.supplier_delay_days,
            "effective_lead_time": effective_lead_time,
            "service_level_target": payload.service_level
        },
        "results": {
            "initial_stock": current_stock,
            "simulated_daily_demand": round(simulated_daily_demand, 1),
            "simulated_safety_buffer": simulated_safety_buffer,
            "simulated_reorder_point": reorder_point,
            "days_until_stockout": stockout_day if stockout_day else "21+ days",
            "days_of_supply": days_remaining,
            "recommended_order_quantity": recommended_order,
            "risk_level": risk_level,
            "estimated_order_cost": round(recommended_order * (float(prod.unit_price) if prod.unit_price else 15.0), 2)
        },
        "projection_curve": projection_series,
        "explanation": f"Under a {payload.demand_multiplier}x demand surge and {effective_lead_time}-day replenishment window, stock will deplete in {days_remaining} days. Safety buffer requirement increases to {simulated_safety_buffer} units."
    }
