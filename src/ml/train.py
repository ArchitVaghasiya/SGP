import os
import pickle
import logging
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.metrics import mean_absolute_error, mean_squared_error
from src.etl.feature_engineering import extract_sales_dataframe, build_time_series_features

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ML-Train")

ARTIFACT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "artifacts", "model")

def calculate_wape(y_true, y_pred) -> float:
    """Calculates Weighted Absolute Percentage Error (WAPE)."""
    total_actual = np.sum(np.abs(y_true))
    if total_actual == 0:
        return 0.0
    return float(np.sum(np.abs(y_true - y_pred)) / total_actual)

def train_and_evaluate(val_days: int = 60):
    """
    Trains LightGBM demand forecasting model to predict 7-day cumulative sales using a strict time-based split.
    Evaluates with MAE, RMSE, and WAPE per store for all 54 stores.
    Saves model artifact with version tag to artifacts/model/model_v1.pkl.
    """
    # 1. Load data and engineer features
    raw_df = extract_sales_dataframe()
    df = build_time_series_features(raw_df)

    # 2. Categorical Encodings
    df['family_cat'] = df['family'].astype('category')
    df['store_type_cat'] = df['store_type'].astype('category')
    df['city_cat'] = df['city'].astype('category')
    df['state_cat'] = df['state'].astype('category')

    feature_cols = [
        'store_id', 'product_id', 'is_promo', 'is_holiday', 'oil_price',
        'cluster', 'perishable', 'family_cat', 'store_type_cat', 'city_cat', 'state_cat',
        'sales_lag_1', 'sales_lag_7', 'sales_lag_14',
        'sales_roll_mean_7', 'sales_roll_std_7', 'sales_roll_mean_28',
        'day_of_week', 'day_of_month', 'month', 'is_weekend'
    ]
    target_col = 'target_sales_7d'

    # 3. Time-based Split (~60 days validation)
    max_date = df['date'].max()
    split_date = max_date - pd.Timedelta(days=val_days)

    train_df = df[df['date'] <= split_date].copy()
    val_df = df[df['date'] > split_date].copy()

    logger.info(f"Train period: {train_df['date'].min().date()} to {train_df['date'].max().date()} ({len(train_df):,} rows)")
    logger.info(f"Val period:   {val_df['date'].min().date()} to {val_df['date'].max().date()} ({len(val_df):,} rows)")

    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_val, y_val = val_df[feature_cols], val_df[target_col]

    # 4. Train LightGBM Model
    params = {
        'objective': 'regression',
        'metric': 'rmse',
        'boosting_type': 'gbdt',
        'n_estimators': 400,
        'learning_rate': 0.05,
        'num_leaves': 31,
        'random_state': 42,
        'verbose': -1
    }

    model = lgb.LGBMRegressor(**params)
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        callbacks=[lgb.early_stopping(50, verbose=False)]
    )

    # 5. Evaluate Predictions
    val_df['pred_sales_7d'] = model.predict(X_val)
    val_df['pred_sales_7d'] = val_df['pred_sales_7d'].clip(lower=0.0)

    overall_mae = mean_absolute_error(val_df[target_col], val_df['pred_sales_7d'])
    overall_rmse = np.sqrt(mean_squared_error(val_df[target_col], val_df['pred_sales_7d']))
    overall_wape = calculate_wape(val_df[target_col].values, val_df['pred_sales_7d'].values)

    logger.info("================ OVERALL VALIDATION METRICS ================")
    logger.info(f"Overall MAE:  {overall_mae:.4f}")
    logger.info(f"Overall RMSE: {overall_rmse:.4f}")
    logger.info(f"Overall WAPE: {overall_wape * 100:.2f}%")

    # Store-by-Store Metrics Table
    store_metrics = []
    logger.info("\n" + "=" * 60)
    logger.info(f"{'Store ID':<10} | {'MAE':<10} | {'RMSE':<10} | {'WAPE (%)':<10} | {'Val Rows':<10}")
    logger.info("-" * 60)
    
    for store_id, s_df in sorted(val_df.groupby('store_id')):
        s_mae = mean_absolute_error(s_df[target_col], s_df['pred_sales_7d'])
        s_rmse = np.sqrt(mean_squared_error(s_df[target_col], s_df['pred_sales_7d']))
        s_wape = calculate_wape(s_df[target_col].values, s_df['pred_sales_7d'].values)
        
        store_metrics.append({
            'store_id': store_id,
            'mae': s_mae,
            'rmse': s_rmse,
            'wape': s_wape * 100,
            'rows': len(s_df)
        })
        logger.info(f"{store_id:<10} | {s_mae:<10.2f} | {s_rmse:<10.2f} | {s_wape * 100:<10.2f}% | {len(s_df):<10}")
    
    logger.info("=" * 60 + "\n")

    # Top Feature Importances
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values(by='importance', ascending=False)
    
    logger.info("--- Top Feature Importances ---")
    for _, row in importance_df.head(10).iterrows():
        logger.info(f"  {row['feature']:<20}: {row['importance']}")

    # 6. Save Model Artifact
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    artifact_path = os.path.join(ARTIFACT_DIR, "model_v1.pkl")
    
    artifact_data = {
        'model': model,
        'feature_cols': feature_cols,
        'version': 'v1.0.0',
        'val_days': val_days,
        'metrics': {
            'overall_mae': overall_mae,
            'overall_rmse': overall_rmse,
            'overall_wape': overall_wape,
            'store_metrics': store_metrics
        }
    }
    
    with open(artifact_path, 'wb') as f:
        pickle.dump(artifact_data, f)
        
    # Also save to root artifacts directory for backwards compatibility
    root_artifact_path = os.path.join(os.path.dirname(ARTIFACT_DIR), "model_v1.pkl")
    with open(root_artifact_path, 'wb') as f:
        pickle.dump(artifact_data, f)

    logger.info(f"Model successfully saved to {artifact_path} and {root_artifact_path}")
    return artifact_path, store_metrics, overall_mae, overall_rmse, overall_wape

if __name__ == "__main__":
    train_and_evaluate()
