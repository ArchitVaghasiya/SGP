import os
import pickle
import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from src.config import settings
from src.db.models import SalesHistory, Store, Product, HolidayEvent, OilPrice

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ML-Predictor")

class DemandPredictor:
    def __init__(self, model_path: str = None):
        if model_path is None:
            model_path = settings.MODEL_PATH
        
        self.model_path = model_path
        self.model = None
        self.feature_cols = []
        self.version = "v1.0.0"
        self._load_model()

    def _load_model(self):
        candidate_paths = [
            self.model_path,
            "artifacts/model/model_v1.pkl",
            "artifacts/model_v1.pkl",
            "/app/artifacts/model/model_v1.pkl",
            "/app/artifacts/model_v1.pkl"
        ]
        
        loaded = False
        for path in candidate_paths:
            if os.path.exists(path):
                try:
                    with open(path, 'rb') as f:
                        artifact = pickle.load(f)
                        self.model = artifact['model']
                        self.feature_cols = artifact['feature_cols']
                        self.version = artifact.get('version', 'v1.0.0')
                    logger.info(f"Loaded trained LightGBM model from {path}")
                    loaded = True
                    break
                except Exception as e:
                    logger.warning(f"Failed to load model from {path}: {e}")
        
        if not loaded:
            logger.warning(f"Model file not found at candidate paths. Fallback moving-average predictor enabled.")

    def predict_next_7_days(self, db: Session, store_id: int, product_id: int) -> dict:
        """
        Forecasts 7-day cumulative demand for a given store_id and product_id.
        Returns total 7-day predicted demand, daily breakdown, and model metadata.
        """
        store = db.query(Store).filter_by(store_id=store_id).first()
        product = db.query(Product).filter_by(product_id=product_id).first()
        if not store or not product:
            raise ValueError(f"Invalid store_id ({store_id}) or product_id ({product_id})")

        recent_sales = (
            db.query(SalesHistory)
            .filter_by(store_id=store_id, product_id=product_id)
            .order_by(SalesHistory.date.desc())
            .limit(30)
            .all()
        )

        sales_series = [float(s.sales) for s in reversed(recent_sales)]
        if not sales_series:
            avg_daily = 10.0
            sales_series = [avg_daily] * 14

        target_date = datetime.now().date() + timedelta(days=1)
        
        if self.model is not None:
            # Build feature vector for target_date
            sales_lag_1 = float(sales_series[-1])
            sales_lag_7 = float(sales_series[-7]) if len(sales_series) >= 7 else float(sales_series[0])
            sales_lag_14 = float(sales_series[-14]) if len(sales_series) >= 14 else float(sales_series[0])
            
            sales_roll_mean_7 = float(np.mean(sales_series[-7:]))
            sales_roll_std_7 = float(np.std(sales_series[-7:]))
            sales_roll_mean_28 = float(np.mean(sales_series[-28:])) if len(sales_series) >= 28 else float(np.mean(sales_series))

            # Fetch recent oil price
            latest_oil = db.query(OilPrice).order_by(OilPrice.date.desc()).first()
            oil_price = float(latest_oil.dcoilwtico) if (latest_oil and latest_oil.dcoilwtico is not None) else 50.0

            # Check holiday
            is_holiday_flag = 1 if db.query(HolidayEvent).filter_by(date=target_date, transferred=False).first() else 0

            row_dict = {
                'store_id': int(store.store_id),
                'product_id': int(product.product_id),
                'is_promo': 0,
                'is_holiday': int(is_holiday_flag),
                'oil_price': float(oil_price),
                'cluster': int(store.cluster),
                'perishable': bool(product.perishable),
                'family_cat': str(product.family),
                'store_type_cat': str(store.store_type),
                'city_cat': str(store.city),
                'state_cat': str(store.state),
                'sales_lag_1': sales_lag_1,
                'sales_lag_7': sales_lag_7,
                'sales_lag_14': sales_lag_14,
                'sales_roll_mean_7': sales_roll_mean_7,
                'sales_roll_std_7': sales_roll_std_7,
                'sales_roll_mean_28': sales_roll_mean_28,
                'day_of_week': int(target_date.weekday()),
                'day_of_month': int(target_date.day),
                'month': int(target_date.month),
                'is_weekend': int(1 if target_date.weekday() in [5, 6] else 0)
            }

            input_df = pd.DataFrame([row_dict])

            if hasattr(self.model, 'booster_') and hasattr(self.model.booster_, 'pandas_categorical'):
                cats = self.model.booster_.pandas_categorical
                input_df['family_cat'] = pd.Categorical(input_df['family_cat'], categories=cats[0])
                input_df['store_type_cat'] = pd.Categorical(input_df['store_type_cat'], categories=cats[1])
                input_df['city_cat'] = pd.Categorical(input_df['city_cat'], categories=cats[2])
                input_df['state_cat'] = pd.Categorical(input_df['state_cat'], categories=cats[3])
            else:
                input_df['family_cat'] = input_df['family_cat'].astype('category')
                input_df['store_type_cat'] = input_df['store_type_cat'].astype('category')
                input_df['city_cat'] = input_df['city_cat'].astype('category')
                input_df['state_cat'] = input_df['state_cat'].astype('category')

            input_df = input_df[self.feature_cols]
            pred_7d = float(np.maximum(self.model.predict(input_df)[0], 0.0))
            pred_7d = round(pred_7d, 2)
        else:
            # Fallback 7-day forecast sum
            pred_7d = round(float(np.mean(sales_series[-7:])) * 7.0, 2)

        # Generate 7 daily breakdown items
        daily_avg = round(pred_7d / 7.0, 2)
        daily_predictions = []
        for d in range(1, 8):
            d_date = (datetime.now().date() + timedelta(days=d)).isoformat()
            daily_predictions.append({
                'date': d_date,
                'predicted_sales': daily_avg
            })

        return {
            'store_id': store_id,
            'product_id': product_id,
            'predicted_demand_7d': pred_7d,
            'daily_forecast': daily_predictions,
            'model_version': self.version
        }

# Global predictor instance
predictor = DemandPredictor()
