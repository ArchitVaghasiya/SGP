import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export function RestockEvaluationModal({ evaluationResult, onClose }) {
  if (!evaluationResult) return null;

  const { store_id, evaluated_products_count, restock_orders_generated_count, generated_purchase_orders, evaluations } = evaluationResult;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck color="var(--accent-emerald)" size={22} />
              <span>Restock Engine Evaluation Report</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Store #{store_id} • Dynamic Statistical Safety Stock Assessment
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Products Evaluated</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{evaluated_products_count} SKUs</div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>New POs Generated</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: restock_orders_generated_count > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
              {restock_orders_generated_count} Orders
            </div>
          </div>
        </div>

        <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem' }}>Evaluation Details per Product</h4>

        <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Stock</th>
                <th>7D Forecast</th>
                <th>Safety Buffer</th>
                <th>Shortfall</th>
                <th>Restock Action</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev) => (
                <tr key={ev.product_id}>
                  <td>Product #{ev.product_id}</td>
                  <td>{ev.current_stock}</td>
                  <td>{ev.predicted_demand_7d}</td>
                  <td>{ev.safety_buffer}</td>
                  <td style={{ color: ev.shortfall > 0 ? 'var(--accent-rose)' : 'var(--text-main)', fontWeight: 700 }}>
                    {ev.shortfall > 0 ? `-${ev.shortfall}` : '0'}
                  </td>
                  <td>
                    {ev.restock_needed ? (
                      <span className="status-badge badge-warning">
                        <AlertTriangle size={12} /> PO +{ev.order_quantity}
                      </span>
                    ) : (
                      <span className="status-badge badge-healthy">
                        <CheckCircle2 size={12} /> Stocked
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="button-primary" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
