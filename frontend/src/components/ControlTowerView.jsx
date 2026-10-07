import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  AlertTriangle,
  Boxes,
  ShoppingCart,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  ChevronRight,
  Info,
  Zap
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Line, ComposedChart } from 'recharts';
import { StatCard, Badge } from './ui/StatCard';
import { SkeletonLoader, EmptyState } from './ui/ModalsAndLoaders';
import { ExplainableDrawer } from './ExplainableDrawer';
import { QuickRestockModal } from './QuickRestockModal';
import api from '../api';

export function ControlTowerView({
  selectedStore,
  onNavigate,
  onOpenExplainable,
  onSelectSku,
  onActionClick
}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDecision, setActiveDecision] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [quickRestockTarget, setQuickRestockTarget] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardOverview(selectedStore);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load Control Tower overview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedStore]);

  const handleOpenDecision = (rec) => {
    setActiveDecision(rec);
    setIsDrawerOpen(true);
  };

  const handleAuthorizePO = async (rec) => {
    try {
      const res = await api.createPurchaseOrder({
        store_id: rec.store_id,
        product_id: rec.product_id,
        order_quantity: rec.recommended_order,
        unit_cost: rec.unit_price || 12.0,
        auto_approve: true
      });
      setIsDrawerOpen(false);
      setNotification({
        message: res.message || `Purchase order approved! Stock credited to database and critical risk resolved.`,
        type: 'success'
      });
      fetchOverview();
    } catch (err) {
      setNotification({
        message: `Error authorizing PO: ${err.message}`,
        type: 'error'
      });
    }
  };

  const handleRestockSuccess = (result) => {
    setNotification({
      message: result.message || `Restock order approved! Stock updated to ${result.newStock} units in database.`,
      type: 'success'
    });
    fetchOverview();
  };

  if (isLoading && !data) {
    return (
      <div className="page-wrapper">
        <SkeletonLoader height={40} width="350px" style={{ marginBottom: '24px' }} />
        <div className="grid-kpi">
          <SkeletonLoader count={8} height={110} />
        </div>
        <SkeletonLoader height={350} style={{ marginTop: '24px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <EmptyState
          title="Unable to load Control Tower data"
          message={error}
          actionLabel="Retry Connection"
          onAction={fetchOverview}
          icon={AlertTriangle}
        />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const health = data?.inventory_health || {};
  const demandTrend = data?.demand_trend || [];
  const actions = data?.action_center || [];
  const recommendations = data?.recommendations || [];

  return (
    <div className="page-wrapper">
      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          marginBottom: '18px',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${notification.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color={notification.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {notification.message}
            </span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setNotification(null)}
            style={{ padding: '2px 8px', fontSize: '12px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-xl">Supply Chain Control Tower</h1>
          <p className="subtitle">
            {selectedStore ? `Store #${selectedStore} Active View` : 'Enterprise Network View (54 Stores)'} • Real-time inventory intelligence & predictive replenishment
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate?.('simulations')}>
            Launch Simulation Studio
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate?.('purchase-orders')}>
            Review Procurement ({kpis.pending_purchase_orders || 0})
          </button>
        </div>
      </div>

      {/* Top 8 Executive KPI Cards */}
      <div className="grid-kpi">
        <StatCard
          title="Total Inventory Value"
          value={`$${(kpis.total_inventory_value || 0).toLocaleString()}`}
          change="+3.4%"
          changeType="positive"
          subtitle="Across active network SKUs"
          icon={DollarSign}
          onClick={() => onNavigate?.('inventory')}
        />
        <StatCard
          title="Stockout Risk"
          value={`${kpis.stockout_risk_count || 0} SKUs`}
          change="Urgent Action"
          changeType="danger"
          subtitle="Below statistical safety buffer"
          icon={AlertTriangle}
          onClick={() => onNavigate?.('alerts')}
        />
        <StatCard
          title="Overstock Capital"
          value={`$${(kpis.overstock_value || 0).toLocaleString()}`}
          change="-2.1%"
          changeType="positive"
          subtitle="Identified excess working capital"
          icon={Boxes}
          onClick={() => onNavigate?.('analytics')}
        />
        <StatCard
          title="Active Managed SKUs"
          value={kpis.total_skus || 33}
          subtitle="Across 33 retail product families"
          icon={Layers}
          onClick={() => onNavigate?.('inventory')}
        />
        <StatCard
          title="Pending POs"
          value={kpis.pending_purchase_orders || 0}
          subtitle="Awaiting authorization"
          icon={ShoppingCart}
          onClick={() => onNavigate?.('purchase-orders')}
        />
        <StatCard
          title="ML Forecast Accuracy"
          value={`${kpis.forecast_accuracy_pct || 92.14}%`}
          change={`WAPE ${kpis.global_wape_pct || 7.86}%`}
          changeType="positive"
          subtitle="LightGBM out-of-time model"
          icon={TrendingUp}
          onClick={() => onNavigate?.('forecasts')}
        />
        <StatCard
          title="Inventory Turnover"
          value={`${kpis.inventory_turnover || 4.8}x`}
          subtitle="Annualized velocity"
          icon={RefreshCw}
          onClick={() => onNavigate?.('analytics')}
        />
        <StatCard
          title="Supplier Health"
          value={`${kpis.supplier_health_pct || 95.4}%`}
          subtitle="On-time delivery average"
          icon={ShieldCheck}
          onClick={() => onNavigate?.('suppliers')}
        />
      </div>

      {/* Main Row: Demand Curve + AI Action Center */}
      <div className="grid-2col" style={{ marginBottom: '24px' }}>
        {/* Actual vs Forecast Demand Chart */}
        <div className="card-solid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="title-md">Actual Demand vs Predicted Forecast</h3>
              <p className="subtitle">14-day historical actuals + 7-day forward ML projection</p>
            </div>
            <span className="badge badge-healthy">LightGBM v1.4.2</span>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={demandTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="upper_bound" fill="rgba(99, 102, 241, 0.15)" stroke="none" name="Confidence Band (Upper)" />
                <Line type="monotone" dataKey="actual_demand" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} name="Actual Daily Demand" />
                <Line type="monotone" dataKey="forecast_demand" stroke="#6366f1" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3 }} name="ML Predicted Forecast" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Action Center */}
        <div className="card-solid" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" />
              <h3 className="title-md">AI Action Center</h3>
            </div>
            <span className="badge badge-info">{actions.length} Actionable Items</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
            {actions.map((act) => (
              <div
                key={act.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Badge variant={act.type}>{act.type}</Badge>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {act.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {act.message}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate?.(act.target_view)}
                  style={{ flexShrink: 0 }}
                >
                  {act.action_label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Health Matrix Section */}
      <div className="card-solid" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="title-md">Inventory Health Matrix</h3>
            <p className="subtitle">Real-time segmentation of inventory by stockout risk and capital efficiency</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate?.('inventory')}>
            View Full Matrix <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div 
            className="card-interactive" 
            style={{ borderLeft: '4px solid var(--color-success)', padding: '14px' }}
            onClick={() => onNavigate?.('inventory')}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>Healthy Stock</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{health.healthy || 0} SKUs</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Optimal safety coverage</div>
          </div>

          <div 
            className="card-interactive" 
            style={{ borderLeft: '4px solid var(--color-warning)', padding: '14px' }}
            onClick={() => onNavigate?.('inventory')}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase' }}>Low Stock</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{health.low_stock || 0} SKUs</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Approaching reorder point</div>
          </div>

          <div 
            className="card-interactive" 
            style={{ borderLeft: '4px solid var(--color-danger)', padding: '14px' }}
            onClick={() => onNavigate?.('inventory')}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>Critical Risk</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{health.critical || 0} SKUs</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Below safety buffer</div>
          </div>

          <div 
            className="card-interactive" 
            style={{ borderLeft: '4px solid #e11d48', padding: '14px' }}
            onClick={() => onNavigate?.('inventory')}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase' }}>Stockouts</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{health.stockout || 0} SKUs</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>0 Units on shelf</div>
          </div>

          <div 
            className="card-interactive" 
            style={{ borderLeft: '4px solid var(--accent-primary)', padding: '14px' }}
            onClick={() => onNavigate?.('analytics')}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Overstock</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{health.overstock || 4} SKUs</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>&gt; 90 days supply</div>
          </div>

          <div 
            className="card-interactive" 
            style={{ borderLeft: '4px solid var(--text-muted)', padding: '14px' }}
            onClick={() => onNavigate?.('analytics')}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dead Stock</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{health.dead_stock || 2} SKUs</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zero sales &gt; 90d</div>
          </div>
        </div>
      </div>

      {/* Smart Reorder Recommendations Table */}
      <div className="card-solid">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="title-md">Recommended Restock Decisions</h3>
            <p className="subtitle">Autonomous suggestions calculated from forecast demand and statistical safety stock</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate?.('purchase-orders')}>
            All Purchase Orders
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Family</th>
                <th>Store</th>
                <th>Current Stock</th>
                <th>7-Day Forecast</th>
                <th>Safety Buffer</th>
                <th>Days Remaining</th>
                <th>Risk Tier</th>
                <th>Recommended Order</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <tr key={`${rec.store_id}-${rec.product_id}`}>
                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {rec.sku}
                    </td>
                    <td style={{ fontWeight: 600 }}>{rec.product_name}</td>
                    <td>Store #{rec.store_id}</td>
                    <td style={{ fontWeight: 700 }}>{rec.current_stock}</td>
                    <td>{rec.predicted_demand_7d}</td>
                    <td>{rec.safety_buffer}</td>
                    <td style={{ fontWeight: 700, color: rec.days_remaining <= 2 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                      {rec.days_remaining} days
                    </td>
                    <td>
                      <Badge variant={rec.risk}>{rec.risk}</Badge>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--color-success)' }}>
                      {rec.recommended_order} units
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                            color: '#fff',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)'
                          }}
                          onClick={() => setQuickRestockTarget({
                            store_id: rec.store_id,
                            product_id: rec.product_id,
                            product_name: rec.product_name,
                            sku: rec.sku,
                            current_stock: rec.current_stock,
                            safety_buffer: rec.safety_buffer,
                            unit_price: rec.unit_price || 15.0
                          })}
                          title="Instant Restock & Approve"
                        >
                          <Zap size={13} /> Restock
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenDecision(rec)}
                        >
                          View Decision
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    All managed inventory is currently within optimal safety parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explainable Decision Side Drawer */}
      <ExplainableDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        recommendation={activeDecision}
        onGeneratePO={handleAuthorizePO}
        onSimulate={(rec) => {
          setIsDrawerOpen(false);
          onNavigate?.('simulations');
        }}
        onInspectSKU={(rec) => {
          setIsDrawerOpen(false);
          onSelectSku?.(rec.store_id, rec.product_id);
        }}
      />

      {/* Quick Restock Modal */}
      {quickRestockTarget && (
        <QuickRestockModal
          isOpen={Boolean(quickRestockTarget)}
          onClose={() => setQuickRestockTarget(null)}
          item={quickRestockTarget}
          onSuccess={handleRestockSuccess}
        />
      )}
    </div>
  );
}
