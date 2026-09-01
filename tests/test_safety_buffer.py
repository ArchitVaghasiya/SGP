import pytest
from src.services.safety_buffer import StaticSafetyBuffer, StatisticalSafetyBuffer, compute_safety_buffer

def test_static_safety_buffer():
    strategy = StaticSafetyBuffer(constant_buffer=45.0)
    buffer_val = strategy.calculate_buffer(
        lead_time_days=7,
        service_level=0.95,
        daily_demand_std=5.0,
        avg_daily_demand=20.0
    )
    assert buffer_val == 45.0

def test_statistical_safety_buffer_95_percent():
    # Formula: Z(0.95) * std_dev * sqrt(lead_time)
    # Z(0.95) = 1.645, std_dev = 10, lead_time = 4 -> 1.645 * 10 * 2 = 32.9
    strategy = StatisticalSafetyBuffer()
    buffer_val = strategy.calculate_buffer(
        lead_time_days=4,
        service_level=0.95,
        daily_demand_std=10.0,
        avg_daily_demand=30.0
    )
    assert buffer_val == 32.9

def test_compute_safety_buffer_helper():
    static_val = compute_safety_buffer(strategy_type="static", static_constant=50.0)
    assert static_val == 50.0

    stat_val = compute_safety_buffer(
        strategy_type="statistical",
        lead_time_days=9,
        service_level=0.99,
        daily_demand_std=5.0
    )
    # Z(0.99) = 2.326 * 5.0 * sqrt(9) = 2.326 * 5 * 3 = 34.89
    assert stat_val == 34.89
