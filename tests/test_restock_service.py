import pytest
from src.services.restock import evaluate_restock_threshold

def test_evaluate_restock_threshold_shortfall_triggered():
    # Current stock = 50, 7d demand = 100, safety buffer = 20
    # Required = 120 -> Shortfall = 70
    needed, qty, shortfall = evaluate_restock_threshold(
        current_stock=50.0,
        predicted_demand_7d=100.0,
        safety_buffer=20.0
    )
    assert needed is True
    assert qty == 70.0
    assert shortfall == 70.0

def test_evaluate_restock_threshold_sufficient_stock():
    # Current stock = 150, 7d demand = 100, safety buffer = 20
    # Required = 120 -> Sufficient stock
    needed, qty, shortfall = evaluate_restock_threshold(
        current_stock=150.0,
        predicted_demand_7d=100.0,
        safety_buffer=20.0
    )
    assert needed is False
    assert qty == 0.0
    assert shortfall == 0.0

def test_evaluate_restock_threshold_exact_boundary():
    # Current stock = 120, 7d demand = 100, safety buffer = 20
    needed, qty, shortfall = evaluate_restock_threshold(
        current_stock=120.0,
        predicted_demand_7d=100.0,
        safety_buffer=20.0
    )
    assert needed is False
    assert qty == 0.0
    assert shortfall == 0.0
