import React, { useState } from 'react';
import { X, Check, Plus, Minus, Edit3 } from 'lucide-react';

export function StockAdjustmentModal({ product, onClose, onSave }) {
  const [mode, setMode] = useState('add'); // 'add', 'remove', or 'override'
  const [val, setVal] = useState(50);

  if (!product) return null;

  const numericVal = parseFloat(val) || 0;
  const currentStock = parseFloat(product.current_stock) || 0;
  const storeId = product.store_id || 1;

  let calculatedNewStock = currentStock;
  if (mode === 'add') {
    calculatedNewStock = currentStock + Math.abs(numericVal);
  } else if (mode === 'remove') {
    calculatedNewStock = Math.max(0, currentStock - Math.abs(numericVal));
  } else if (mode === 'override') {
    calculatedNewStock = Math.max(0, numericVal);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'add') {
      onSave(storeId, product.product_id, null, Math.abs(numericVal));
    } else if (mode === 'remove') {
      onSave(storeId, product.product_id, null, -Math.abs(numericVal));
    } else {
      onSave(storeId, product.product_id, Math.max(0, numericVal), null);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Adjust Stock Level</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{product.family} (SKU #{product.product_id})</p>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Adjustment Action
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
              <button
                type="button"
                className={mode === 'add' ? 'button-primary' : 'button-secondary'}
                style={{ 
                  justifyContent: 'center', 
                  fontSize: '0.78rem',
                  padding: '0.5rem 0.25rem',
                  background: mode === 'add' ? '#10b981' : undefined,
                  borderColor: mode === 'add' ? '#059669' : undefined
                }}
                onClick={() => setMode('add')}
              >
                <Plus size={14} /> Add Stock
              </button>
              <button
                type="button"
                className={mode === 'remove' ? 'button-primary' : 'button-secondary'}
                style={{ 
                  justifyContent: 'center', 
                  fontSize: '0.78rem',
                  padding: '0.5rem 0.25rem',
                  background: mode === 'remove' ? '#f43f5e' : undefined,
                  borderColor: mode === 'remove' ? '#e11d48' : undefined
                }}
                onClick={() => setMode('remove')}
              >
                <Minus size={14} /> Remove Stock
              </button>
              <button
                type="button"
                className={mode === 'override' ? 'button-primary' : 'button-secondary'}
                style={{ 
                  justifyContent: 'center', 
                  fontSize: '0.78rem',
                  padding: '0.5rem 0.25rem',
                  background: mode === 'override' ? '#0ea5e9' : undefined,
                  borderColor: mode === 'override' ? '#0284c7' : undefined
                }}
                onClick={() => setMode('override')}
              >
                <Edit3 size={14} /> Set Count
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              {mode === 'add' && 'Units Received (+ quantity to add)'}
              {mode === 'remove' && 'Units Removed / Sold (- quantity to deduct)'}
              {mode === 'override' && 'New Absolute Stock Level (set exact count)'}
            </label>
            <input 
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="select-input"
              style={{ width: '100%', fontSize: '1.15rem', fontWeight: 800, padding: '0.75rem' }}
              min="0"
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              <span>Current stock: <strong>{currentStock}</strong> units</span>
              <span>New stock will be: <strong style={{ color: mode === 'remove' ? '#fb7185' : '#34d399' }}>{calculatedNewStock}</strong> units</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="button-primary"
              style={{
                background: mode === 'remove' ? '#f43f5e' : (mode === 'add' ? '#10b981' : undefined)
              }}
            >
              <Check size={16} /> Save Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
