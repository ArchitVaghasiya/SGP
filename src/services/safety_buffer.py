from abc import ABC, abstractmethod
import math
from typing import Dict, Any

class SafetyBufferStrategy(ABC):
    """Abstract Strategy interface for calculating safety buffer."""

    @abstractmethod
    def calculate_buffer(self, lead_time_days: int, service_level: float, daily_demand_std: float, avg_daily_demand: float) -> float:
        pass

class StaticSafetyBuffer(SafetyBufferStrategy):
    """Static constant safety buffer calculation."""

    def __init__(self, constant_buffer: float = 30.0):
        self.constant_buffer = constant_buffer

    def calculate_buffer(self, lead_time_days: int, service_level: float, daily_demand_std: float, avg_daily_demand: float) -> float:
        return max(0.0, round(self.constant_buffer, 2))

class StatisticalSafetyBuffer(SafetyBufferStrategy):
    """
    Statistical Safety Buffer strategy:
    Safety Buffer = Z_score(service_level) * std_dev_daily_demand * sqrt(lead_time_days)
    """

    # Approximate inverse normal CDF Z-scores for standard target service levels
    Z_SCORES = {
        0.80: 0.841,
        0.85: 1.036,
        0.90: 1.282,
        0.95: 1.645,
        0.98: 2.054,
        0.99: 2.326
    }

    @classmethod
    def get_z_score(cls, service_level: float) -> float:
        # Match closest service level or use fallback formula
        for level, z in sorted(cls.Z_SCORES.items()):
            if service_level <= level:
                return z
        return 2.326  # default for >99%

    def calculate_buffer(self, lead_time_days: int, service_level: float, daily_demand_std: float, avg_daily_demand: float) -> float:
        if lead_time_days <= 0:
            return 0.0
        
        z = self.get_z_score(service_level)
        # Standard safety stock formula: Z * sigma_d * sqrt(LeadTime)
        buffer = z * daily_demand_std * math.sqrt(lead_time_days)
        return max(0.0, round(buffer, 2))

def compute_safety_buffer(
    strategy_type: str = "statistical",
    lead_time_days: int = 7,
    service_level: float = 0.95,
    daily_demand_std: float = 5.0,
    avg_daily_demand: float = 20.0,
    static_constant: float = 30.0
) -> float:
    """Helper function to execute swappable safety buffer strategy."""
    if strategy_type.lower() == "static":
        strategy = StaticSafetyBuffer(constant_buffer=static_constant)
    else:
        strategy = StatisticalSafetyBuffer()

    return strategy.calculate_buffer(
        lead_time_days=lead_time_days,
        service_level=service_level,
        daily_demand_std=daily_demand_std,
        avg_daily_demand=avg_daily_demand
    )
