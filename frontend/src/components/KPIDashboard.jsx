import React from 'react';
import { PackageCheck, AlertTriangle, TrendingUp, ShoppingBag, ShieldCheck } from 'lucide-react';

export function KPIDashboard({ inventory, purchaseOrders }) {
  const totalStock = inventory.reduce((sum, item) => sum + item.current_stock, 0);
  const criticalCount = inventory.filter(item => item.status === 'CRITICAL').length;
  const total7dForecast = inventory.reduce((sum, item) => sum + item.predicted_demand_7d, 0);
  const activePOsCount = purchaseOrders.filter(po => po.status === 'PENDING' || po.status === 'APPROVED').length;
  const totalSafetyBuffer = inventory.reduce((sum, item) => sum + item.safety_buffer, 0);

  const kpis = [
    {
      label: "Total Stock On-Hand",
      value: Math.round(totalStock).toLocaleString() + " units",
      subtext: `Across ${inventory.length} tracked product families`,
      icon: PackageCheck,
      color: "var(--accent-cyan)",
      bg: "rgba(56, 189, 248, 0.15)"
    },
    {
      label: "Stockout Warning Alerts",
      value: criticalCount,
      subtext: criticalCount > 0 ? `${criticalCount} SKUs below safety stock buffer` : "All inventory healthy",
      icon: AlertTriangle,
      color: criticalCount > 0 ? "var(--accent-rose)" : "var(--accent-emerald)",
      bg: criticalCount > 0 ? "rgba(244, 63, 94, 0.15)" : "rgba(16, 185, 129, 0.15)"
    },
    {
      label: "7-Day Projected Demand",
      value: Math.round(total7dForecast).toLocaleString() + " units",
      subtext: "LightGBM v1.0.0 ML Forecast",
      icon: TrendingUp,
      color: "var(--accent-indigo)",
      bg: "rgba(129, 140, 248, 0.15)"
    },
    {
      label: "Active Purchase Orders",
      value: activePOsCount,
      subtext: `${purchaseOrders.filter(p => p.status === 'PENDING').length} Pending Approval`,
      icon: ShoppingBag,
      color: "var(--accent-amber)",
      bg: "rgba(245, 158, 11, 0.15)"
    },
    {
      label: "Dynamic Safety Stock",
      value: Math.round(totalSafetyBuffer).toLocaleString() + " units",
      subtext: "95% Target Service Level Protection",
      icon: ShieldCheck,
      color: "var(--accent-emerald)",
      bg: "rgba(16, 185, 129, 0.15)"
    }
  ];

  return (
    <div className="kpi-grid">
      {kpis.map((kpi, idx) => {
        const IconComp = kpi.icon;
        return (
          <div key={idx} className="glass-card kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">{kpi.label}</span>
              <div className="kpi-icon-wrapper" style={{ background: kpi.bg, color: kpi.color }}>
                <IconComp size={20} />
              </div>
            </div>
            <div className="kpi-value" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
            <div className="kpi-subtext">{kpi.subtext}</div>
          </div>
        );
      })}
    </div>
  );
}
