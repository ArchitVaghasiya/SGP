from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

# Forecast Schemas
class DailyForecastItem(BaseModel):
    date: str
    predicted_sales: float

class ForecastResponse(BaseModel):
    store_id: int
    product_id: int
    predicted_demand_7d: float
    daily_forecast: List[DailyForecastItem]
    model_version: str

# Restock Evaluation Schemas
class ProductEvaluationItem(BaseModel):
    product_id: int
    current_stock: float
    predicted_demand_7d: float
    safety_buffer: float
    shortfall: float
    restock_needed: bool
    order_quantity: float

class PurchaseOrderSchema(BaseModel):
    po_id: int
    store_id: int
    product_id: int
    order_quantity: float
    status: str
    created_at: Optional[str] = None

class RestockEvaluationResponse(BaseModel):
    store_id: int
    evaluated_products_count: int
    restock_orders_generated_count: int
    generated_purchase_orders: List[PurchaseOrderSchema]
    evaluations: List[ProductEvaluationItem]

# Inventory Update Schema
class InventoryUpdateRequest(BaseModel):
    store_id: int = Field(..., json_schema_extra={"example": 1})
    product_id: int = Field(..., json_schema_extra={"example": 1})
    stock_change: Optional[float] = Field(None, json_schema_extra={"example": 50.0}, description="Positive for stock receipt, negative for sales adjustment")
    override_stock: Optional[float] = Field(None, json_schema_extra={"example": 150.0}, description="Directly set absolute stock quantity if provided")


class InventoryUpdateResponse(BaseModel):
    store_id: int
    product_id: int
    previous_stock: float
    new_stock: float
    message: str
