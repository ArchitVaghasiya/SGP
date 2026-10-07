import React from 'react';
import { Drawer } from './ui/ModalsAndLoaders';
import { Badge } from './ui/StatCard';
import { Sparkles, ShoppingCart, SlidersHorizontal, ArrowDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export function ExplainableDrawer({ isOpen, onClose, recommendation, onGeneratePO, onSimulate, onInspectSKU }) {
  if (!recommendation) return null;

  const {
    sku,
    product_name,
    category,
    store_id,
    current_stock = 0,
    predicted_demand_7d = 0,
    safety_buffer = 0,
    lead_time_days = 7,
    reorder_point = 0,
    days_remaining = 0,
    risk = 'CRITICAL',
    recommended_order = 0,
    unit_price = 15.0,
    total_order_cost = 0,
    supplier_name = 'Pichincha Foods Ltd.'
  } = recommendation;

  // Expected demand during lead time
  const dailyDemand = predicted_demand_7d / 7.0;
  const leadTimeDemand = dailyDemand * lead_time_days;
  const incomingStock = 0; // Default pending inbound

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Explainable Restock Decision"
      subtitle={`${sku} • ${product_name} • Store #${store_id}`}
      width="540px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Risk Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: risk === 'CRITICAL' ? 'var(--color-danger-subtle)' : 'var(--color-warning-subtle)',
          border: `1px solid ${risk === 'CRITICAL' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color={risk === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-warning)'} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: risk === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                {risk === 'CRITICAL' ? 'Critical Stockout Imminent' : 'Inventory Approaching Reorder Boundary'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Estimated supply lasts only <b>{days_remaining} days</b> at current run-rate.
              </div>
            </div>
          </div>
          <Badge variant={risk}>{risk}</Badge>
        </div>

        {/* AI Action Box */}
        <div className="card-solid" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Engine Recommendation
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Order {recommended_order} units
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Estimated Investment: <b>${total_order_cost.toLocaleString()}</b> (Supplier: {supplier_name})
          </div>
        </div>

        {/* Visual Waterfall Explanation */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={16} color="var(--accent-primary)" />
            Decision Logic Breakdown
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>1. Current On-Hand Inventory</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified stock level in store</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{current_stock} units</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="var(--text-muted)" />
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>2. Expected Demand ({lead_time_days}d Lead Time)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LightGBM forecast velocity ~{dailyDemand.toFixed(1)} units/day</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-warning)' }}>- {leadTimeDemand.toFixed(1)} units</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="var(--text-muted)" />
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>3. Required Statistical Safety Buffer</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Calculated for 95% service level confidence</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-purple)' }}>+ {safety_buffer} units</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="var(--text-muted)" />
            </div>

            {/* Step 4: Reorder Point & Shortfall */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Reorder Point Threshold</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Safety Stock + Lead Time Demand</div>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-cyan)' }}>{reorder_point} units</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            onClick={() => onGeneratePO?.(recommendation)}
          >
            <ShoppingCart size={16} />
            Authorize Purchase Order ({recommended_order} units)
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onSimulate?.(recommendation)}
            >
              <SlidersHorizontal size={14} />
              Simulate What-If
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onInspectSKU?.(recommendation)}
            >
              Inspect SKU Detail
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
