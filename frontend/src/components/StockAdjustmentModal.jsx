import React, { useState, useEffect } from 'react';
import { Modal } from './ui/ModalsAndLoaders';
import { PlusCircle, MinusCircle, Target, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api, { getCurrentUser } from '../api';

export function StockAdjustmentModal({
  isOpen,
  onClose,
  storeId = 1,
  productId = 1,
  currentStock = 0,
  skuName = '',
  onSuccess
}) {
  // Mode: 'ADD' | 'REMOVE' | 'SET'
  const [mode, setMode] = useState('ADD');
  const [amount, setAmount] = useState(10);
  const [exactStock, setExactStock] = useState(currentStock);
  const [reason, setReason] = useState('RESTOCK');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setExactStock(currentStock);
    if (mode === 'ADD') {
      setReason('RESTOCK');
    } else if (mode === 'REMOVE') {
      setReason('DAMAGE');
    } else {
      setReason('ADJUSTMENT');
    }
  }, [isOpen, currentStock, mode]);

  const currentUser = getCurrentUser();

  // Calculate resulting stock and delta based on active mode
  let delta = 0;
  let resultingStock = Number(currentStock);

  if (mode === 'ADD') {
    delta = Math.max(0, Number(amount) || 0);
    resultingStock = Number(currentStock) + delta;
  } else if (mode === 'REMOVE') {
    const deduct = Math.max(0, Number(amount) || 0);
    delta = -Math.min(Number(currentStock), deduct);
    resultingStock = Math.max(0, Number(currentStock) - deduct);
  } else {
    resultingStock = Math.max(0, Number(exactStock) || 0);
    delta = resultingStock - Number(currentStock);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        store_id: Number(storeId),
        product_id: Number(productId),
        reason: reason,
        notes: notes || `Stock ${mode === 'ADD' ? 'added' : mode === 'REMOVE' ? 'deducted' : 'set'} by ${currentUser?.full_name || 'Admin'} (${delta >= 0 ? '+' : ''}${delta} units)`,
        updated_by: currentUser?.email || 'admin@supplyiq.io'
      };

      if (mode === 'SET') {
        payload.override_stock = resultingStock;
        payload.new_stock = resultingStock;
      } else {
        payload.stock_change = delta;
      }

      await api.updateInventoryStock(payload);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to update stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [5, 10, 25, 50, 100, 250];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Inventory Stock"
      maxWidth="540px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-danger-subtle)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--color-danger)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Target SKU Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '12px'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Target SKU: </span>
            <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              SKU-{String(productId).padStart(3, '0')} {skuName ? `(${skuName})` : ''}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Location: </span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Store #{storeId}</span>
          </div>
        </div>

        {/* Mode Selector Tabs (Add / Remove / Set Exact) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => setMode('ADD')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'ADD' ? 'var(--color-success-subtle)' : 'transparent',
              color: mode === 'ADD' ? 'var(--color-success)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <PlusCircle size={15} /> Add Stock (+)
          </button>

          <button
            type="button"
            onClick={() => setMode('REMOVE')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'REMOVE' ? 'var(--color-danger-subtle)' : 'transparent',
              color: mode === 'REMOVE' ? 'var(--color-danger)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <MinusCircle size={15} /> Remove Stock (-)
          </button>

          <button
            type="button"
            onClick={() => setMode('SET')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'SET' ? 'var(--accent-primary-subtle)' : 'transparent',
              color: mode === 'SET' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Target size={15} /> Set Exact Count (=)
          </button>
        </div>

        {/* Real-Time Stock Calculation Visualizer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '12px',
          padding: '14px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-card)',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Stock</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {currentStock}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              background: delta > 0 ? 'var(--color-success-subtle)' : delta < 0 ? 'var(--color-danger-subtle)' : 'var(--bg-elevated)',
              color: delta > 0 ? 'var(--color-success)' : delta < 0 ? 'var(--color-danger)' : 'var(--text-muted)'
            }}>
              {delta >= 0 ? `+${delta}` : delta}
            </span>
            <ArrowRight size={18} color="var(--text-muted)" style={{ marginTop: '2px' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resulting Stock</div>
            <div style={{
              fontSize: '22px',
              fontWeight: 800,
              color: resultingStock <= 0 ? 'var(--color-danger)' : 'var(--color-success)',
              marginTop: '2px'
            }}>
              {resultingStock}
            </div>
          </div>
        </div>

        {/* Quantity Input with Quick Selector Pills */}
        {mode === 'SET' ? (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Exact On-Shelf Physical Count
            </label>
            <input
              type="number"
              min="0"
              step="1"
              required
              className="input-control"
              value={exactStock}
              onChange={(e) => setExactStock(e.target.value)}
              style={{ fontSize: '16px', fontWeight: 700 }}
            />
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Quantity to {mode === 'ADD' ? 'Add to Stock' : 'Deduct from Stock'}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              className="input-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}
            />

            {/* Quick Increment Buttons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {quickAmounts.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${Number(amount) === val ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: Number(amount) === val ? 'var(--accent-primary-subtle)' : 'var(--bg-input)',
                    color: Number(amount) === val ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {mode === 'ADD' ? `+${val}` : `-${val}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reason / Category Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Adjustment Reason / Category
          </label>
          <select
            className="select-control"
            style={{ width: '100%' }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {mode === 'ADD' && (
              <>
                <option value="RESTOCK">Direct Inbound Restock</option>
                <option value="RETURN">Customer Return / Restock</option>
                <option value="TRANSFER_IN">Inter-store Inbound Transfer</option>
                <option value="ADJUSTMENT">Inventory Surplus / Found Stock</option>
              </>
            )}
            {mode === 'REMOVE' && (
              <>
                <option value="DAMAGE">Damaged / Broken Goods</option>
                <option value="EXPIRED">Expired Perishable Goods</option>
                <option value="SHRINKAGE">Theft / Unaccounted Shrinkage</option>
                <option value="TRANSFER_OUT">Inter-store Outbound Transfer</option>
                <option value="ADJUSTMENT">Inventory Deficit Adjustment</option>
              </>
            )}
            {mode === 'SET' && (
              <>
                <option value="AUDIT_COUNT">Physical Cycle Count / Audit</option>
                <option value="RECONCILIATION">Monthly Ledger Reconciliation</option>
                <option value="ADJUSTMENT">Manual Stock Override</option>
              </>
            )}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Audit Notes (Optional)
          </label>
          <input
            type="text"
            className="input-control"
            placeholder="e.g., Physical count verified by store manager"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={`btn ${mode === 'REMOVE' ? 'btn-danger' : 'btn-primary'} btn-sm`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recording Ledger Transaction...' : mode === 'ADD' ? 'Confirm Stock Addition' : mode === 'REMOVE' ? 'Confirm Stock Deduction' : 'Commit Exact Count'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
