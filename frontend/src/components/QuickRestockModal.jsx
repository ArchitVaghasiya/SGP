import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  ShoppingCart,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Package,
  TrendingDown,
  CheckCircle2,
  Clock,
  DollarSign
} from 'lucide-react';
import { Modal } from './ui/ModalsAndLoaders';
import api from '../api';

export function QuickRestockModal({
  isOpen,
  onClose,
  item, // { store_id, product_id, product_name, sku, current_stock, safety_buffer, unit_price, lead_time_days, supplier_name }
  onSuccess
}) {
  if (!item) return null;

  const storeId = item.store_id || 1;
  const productId = item.product_id || 1;
  const prodName = item.product_name || item.family || `Product #${productId}`;
  const skuLabel = item.sku || `SKU-${String(productId).padStart(3, '0')}`;
  const currentStock = Number(item.current_stock) || 0;
  const safetyBuffer = Number(item.safety_buffer) || 50;
  const unitPrice = Number(item.unit_price) || 15.0;
  const leadTime = item.lead_time_days || 7;

  // Calculate smart reorder recommendation
  const shortfall = Math.max(0, Math.round((safetyBuffer * 1.5) - currentStock));
  const suggestedQty = Math.max(50, Math.round((safetyBuffer * 2.0) - currentStock));

  const [orderQty, setOrderQty] = useState(suggestedQty);
  const [unitCost, setUnitCost] = useState(unitPrice);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setOrderQty(suggestedQty);
    setUnitCost(unitPrice);
    setError(null);
  }, [item]);

  const totalCost = (Number(orderQty) || 0) * (Number(unitCost) || 0);
  const projectedStock = currentStock + (Number(orderQty) || 0);

  const handleSubmit = async (autoApprove = false) => {
    if (!orderQty || Number(orderQty) <= 0) {
      setError('Please enter a valid order quantity (> 0).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.createPurchaseOrder({
        store_id: Number(storeId),
        product_id: Number(productId),
        order_quantity: Number(orderQty),
        unit_cost: Number(unitCost),
        auto_approve: autoApprove
      });

      if (onSuccess) {
        onSuccess({
          ...res,
          store_id: storeId,
          product_id: productId,
          addedQty: Number(orderQty),
          newStock: res.new_stock ?? projectedStock,
          autoApprove
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process restock request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Direct Product Restock Request"
      subtitle={`Instant Procurement & Stock Replenishment for ${skuLabel}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Product Identity Banner */}
        <div style={{
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '14px' }}>
                {skuLabel}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>
                {prodName}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Store #{storeId} • Supplier Lead Time: {leadTime} Days
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Current Status
            </span>
            <div style={{ marginTop: '2px' }}>
              <span className={`badge ${currentStock < safetyBuffer ? 'badge-critical' : 'badge-healthy'}`}>
                {currentStock < safetyBuffer ? 'CRITICAL RISK' : 'NORMAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Deficit & Replenishment Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div className="card-solid" style={{ padding: '12px', textAlign: 'center', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On-Hand Stock</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: currentStock < safetyBuffer ? 'var(--color-danger)' : 'var(--text-primary)', marginTop: '2px' }}>
              {currentStock} units
            </div>
          </div>

          <div className="card-solid" style={{ padding: '12px', textAlign: 'center', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Safety Buffer</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }}>
              {safetyBuffer} units
            </div>
          </div>

          <div className="card-solid" style={{ padding: '12px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-success)' }}>Projected Stock</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-success)', marginTop: '2px' }}>
              {projectedStock} units
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Restock Order Quantity (Units)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="input-control"
              style={{ width: '100%', fontSize: '15px', fontWeight: 700 }}
              value={orderQty}
              onChange={(e) => setOrderQty(e.target.value)}
              required
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              AI suggested: <strong style={{ color: 'var(--color-success)' }}>{suggestedQty} units</strong>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Unit Cost ($)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.01"
              className="input-control"
              style={{ width: '100%', fontSize: '15px', fontWeight: 700 }}
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              required
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Standard catalog price
            </div>
          </div>
        </div>

        {/* Total Cost Valuation */}
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Total Procurement Value:
            </span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-primary)' }}>
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
          {/* 1-Click Instant Approve Button */}
          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
          >
            <Zap size={18} />
            {isSubmitting ? 'Processing Restock...' : '⚡ Instant Restock & Approve (Direct DB Commit)'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
            >
              <ShoppingCart size={15} />
              Submit PO (Pending Approval)
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
