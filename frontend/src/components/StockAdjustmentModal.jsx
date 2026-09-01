import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export function StockAdjustmentModal({ product, onClose, onSave }) {
  const [mode, setMode] = useState('add'); // 'add' or 'override'
  const [val, setVal] = useState(50);

  if (!product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericVal = parseFloat(val) || 0;
    if (mode === 'add') {
      onSave(product.store_id, product.product_id, null, numericVal);
    } else {
      onSave(product.store_id, product.product_id, numericVal, null);
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
              Adjustment Type
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={mode === 'add' ? 'button-primary' : 'button-secondary'}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setMode('add')}
              >
                + Receive Shipment
              </button>
              <button
                type="button"
                className={mode === 'override' ? 'button-primary' : 'button-secondary'}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setMode('override')}
              >
                Set Explicit Count
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              {mode === 'add' ? 'Units Received (+ quantity)' : 'New Absolute Stock Level'}
            </label>
            <input 
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="select-input"
              style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700, padding: '0.75rem' }}
              min="0"
              required
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
              Current stock: {product.current_stock} units
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button-primary">
              <Check size={16} /> Save Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
