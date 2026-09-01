import logging
import pandas as pd
import numpy as np
from sqlalchemy import text
from src.db.session import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Feature-Engineering")

def extract_sales_dataframe(db_session=None) -> pd.DataFrame:
    """
    Extracts sales history records joined with stores, products, holidays_events, and oil_prices.
    """
    session_created = False
    if db_session is None:
        db_session = SessionLocal()
        session_created = True

    try:
        query = text("""
            SELECT 
                s.date,
                s.store_id,
                s.product_id,
                st.city,
                st.state,
                st.store_type,
                st.cluster,
                p.family,
                p.perishable,
                s.sales,
                s.onpromotion AS is_promo,
                COALESCE(h.is_holiday, 0) AS is_holiday,
                o.dcoilwtico AS oil_price
            FROM sales_history s
            JOIN stores st ON s.store_id = st.store_id
            JOIN products p ON s.product_id = p.product_id
            LEFT JOIN (
                SELECT DISTINCT date, 1 AS is_holiday 
                FROM holidays_events 
                WHERE transferred = FALSE
            ) h ON s.date = h.date
            LEFT JOIN oil_prices o ON s.date = o.date
            ORDER BY s.store_id, s.product_id, s.date ASC
        """)
        logger.info("Extracting raw sales dataset from PostgreSQL with joins...")
        df = pd.read_sql(query, con=db_session.bind)
        df['date'] = pd.to_datetime(df['date'])
        
        # Forward fill missing oil prices (market closed on weekends/holidays)
        df['oil_price'] = df['oil_price'].ffill().bfill().fillna(0.0)
        return df
    finally:
        if session_created:
            db_session.close()

def build_time_series_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineers time-series features without data leakage.
    Features on date T use data available <= T-1.
    Target (target_sales_7d) predicts cumulative demand over next 7 days (T+1 to T+7).
    """
    logger.info("Computing time-series features (lags, rolling means, calendar, holidays, oil, 7d future target)...")
    
    # Sort strictly by series key and date
    df = df.sort_values(by=['store_id', 'product_id', 'date']).reset_index(drop=True)

    grouped = df.groupby(['store_id', 'product_id'])['sales']

    # 1. Lag Features (t-1, t-7, t-14)
    df['sales_lag_1'] = grouped.shift(1)
    df['sales_lag_7'] = grouped.shift(7)
    df['sales_lag_14'] = grouped.shift(14)

    # 2. Rolling Window Features
    df['sales_roll_mean_7'] = grouped.transform(lambda x: x.shift(1).rolling(window=7, min_periods=1).mean())
    df['sales_roll_std_7'] = grouped.transform(lambda x: x.shift(1).rolling(window=7, min_periods=1).std()).fillna(0.0)
    df['sales_roll_mean_28'] = grouped.transform(lambda x: x.shift(1).rolling(window=28, min_periods=1).mean())

    # 3. Calendar & Categorical Features
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    df['month'] = df['date'].dt.month
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

    # 4. Future Target: 7-day cumulative sales sum (t+1 through t+7)
    df['target_sales_7d'] = grouped.transform(lambda x: x.iloc[::-1].shift(1).rolling(7, min_periods=7).sum().iloc[::-1])

    # Drop NaNs resulting from max lag (14 days) and 7 day target future boundary
    clean_df = df.dropna(subset=['sales_lag_14', 'sales_roll_mean_28', 'target_sales_7d']).reset_index(drop=True)
    logger.info(f"Feature matrix constructed successfully. Valid rows: {len(clean_df):,}")
    return clean_df

if __name__ == "__main__":
    raw_sales = extract_sales_dataframe()
    features = build_time_series_features(raw_sales)
    print(features.head())
