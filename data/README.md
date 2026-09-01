# Raw Data Directory

This directory contains the Kaggle Corporación Favorita Grocery Sales Forecasting raw CSV datasets used for database ingestion:

- `train.csv`: 3,000,888 item sales transaction records ($2013\text{--}2017$)
- `stores.csv`: Metadata for all 54 retail stores across Ecuador
- `items.csv` / `products`: Product family classifications and perishable flags
- `oil.csv`: Daily crude oil prices ($2013\text{--}2017$)
- `holidays_events.csv`: National and regional holiday events and transfer flags

> **Note**: Raw CSV files in `data/raw/` are automatically ingested into PostgreSQL via `python -m src.etl.ingest`.
