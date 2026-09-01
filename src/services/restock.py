import logging
from datetime import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from src.db.models import Inventory, Store, Product, PurchaseOrder, Forecast
from src.ml.predict import DemandPredictor
from src.services.safety_buffer import compute_safety_buffer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Restock-Service")

def evaluate_restock_threshold(
    current_stock: float,
    predicted_demand_7d: float,
    safety_buffer: float
) -> Tuple[bool, float, float]:
    """
    Core restock decision logic function (decoupled & unit-testable).
    
    Rule: Restock is triggered if current_stock < (predicted_demand_7d + safety_buffer).
    Required Order Quantity = (predicted_demand_7d + safety_buffer) - current_stock.
    
    Returns:
        (restock_needed: bool, order_quantity: float, shortfall: float)
    """
    required_stock = predicted_demand_7d + safety_buffer
    if current_stock < required_stock:
        shortfall = required_stock - current_stock
        order_quantity = round(shortfall, 2)
        return True, order_quantity, round(shortfall, 2)
    return False, 0.0, 0.0

def evaluate_store_restock(
    db: Session,
    store_id: int,
    predictor: DemandPredictor,
    strategy_type: str = "statistical"
) -> Dict[str, Any]:
    """
    Evaluates all products for a given store, runs ML demand prediction,
    checks safety buffer shortfall, and auto-inserts purchase orders.
    """
    store = db.query(Store).filter_by(store_id=store_id).first()
    if not store:
        raise ValueError(f"Store with id {store_id} not found")

    inventory_items = db.query(Inventory).filter_by(store_id=store_id).all()
    evaluations = []
    generated_orders = []

    today = datetime.now().date()

    for inv in inventory_items:
        product_id = inv.product_id

        # 1. Run Demand Predictor (7-day demand)
        forecast_res = predictor.predict_next_7_days(db, store_id, product_id)
        pred_demand_7d = forecast_res['predicted_demand_7d']

        # 2. Log raw forecast into forecasts table
        for f_item in forecast_res['daily_forecast']:
            forecast_row = Forecast(
                forecast_date=today,
                target_date=datetime.strptime(f_item['date'], "%Y-%m-%d").date(),
                store_id=store_id,
                product_id=product_id,
                predicted_demand=f_item['predicted_sales'],
                model_version=forecast_res['model_version']
            )
            db.add(forecast_row)

        # 3. Calculate Safety Buffer dynamically
        std_dev_estimate = max(5.0, pred_demand_7d * 0.15)
        calculated_buffer = compute_safety_buffer(
            strategy_type=strategy_type,
            lead_time_days=inv.lead_time_days,
            service_level=float(inv.service_level),
            daily_demand_std=std_dev_estimate,
            avg_daily_demand=pred_demand_7d / 7.0,
            static_constant=float(inv.safety_buffer)
        )

        # Update inventory table safety buffer record
        inv.safety_buffer = calculated_buffer

        # 4. Evaluate Restock Threshold
        current_stock = float(inv.current_stock)
        restock_needed, order_qty, shortfall = evaluate_restock_threshold(
            current_stock=current_stock,
            predicted_demand_7d=pred_demand_7d,
            safety_buffer=calculated_buffer
        )

        eval_item = {
            'product_id': product_id,
            'current_stock': current_stock,
            'predicted_demand_7d': pred_demand_7d,
            'safety_buffer': calculated_buffer,
            'shortfall': shortfall,
            'restock_needed': restock_needed,
            'order_quantity': order_qty
        }
        evaluations.append(eval_item)

        # 5. Autonomous Purchase Order Creation
        if restock_needed:
            # Check if there is already a PENDING purchase order today to avoid duplicate spam
            existing_po = (
                db.query(PurchaseOrder)
                .filter_by(store_id=store_id, product_id=product_id, status='PENDING')
                .first()
            )
            if not existing_po:
                po = PurchaseOrder(
                    store_id=store_id,
                    product_id=product_id,
                    order_quantity=order_qty,
                    predicted_demand_7d=pred_demand_7d,
                    current_stock=current_stock,
                    safety_buffer=calculated_buffer,
                    shortfall=shortfall,
                    status='PENDING'
                )
                db.add(po)
                db.flush()
                generated_orders.append({
                    'po_id': po.po_id,
                    'store_id': store_id,
                    'product_id': product_id,
                    'order_quantity': order_qty,
                    'status': po.status,
                    'created_at': po.created_at.isoformat() if po.created_at else None
                })
            else:
                logger.info(f"Pending PO already exists for store {store_id}, product {product_id}. Skipping new order.")

    db.commit()

    return {
        'store_id': store_id,
        'evaluated_products_count': len(evaluations),
        'restock_orders_generated_count': len(generated_orders),
        'generated_purchase_orders': generated_orders,
        'evaluations': evaluations
    }
