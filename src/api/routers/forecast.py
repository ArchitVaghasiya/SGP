from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.ml.predict import predictor
from src.api.schemas import ForecastResponse

router = APIRouter(prefix="/forecast", tags=["Forecast"])

@router.get("/{store_id}/{product_id}", response_model=ForecastResponse)
def get_raw_forecast(
    store_id: int,
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns raw 7-day demand forecast output for a specific (store_id, product_id) pair.
    Pure read operation with model inference — no DB side effects.
    """
    try:
        forecast_data = predictor.predict_next_7_days(db, store_id=store_id, product_id=product_id)
        return forecast_data
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")
