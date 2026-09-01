import React from 'react';
import { ShoppingBag, CheckCircle2, Truck, Clock, XCircle } from 'lucide-react';

export function PurchaseOrdersManager({ 
  purchaseOrders, 
  products, 
  onUpdatePOStatus 
}) {
  const getProductName = (prodId) => {
    const p = products.find(prod => prod.product_id === prodId);
    return p ? p.family : `Product #${prodId}`;
  };

  return (
    <div className="glass-card section-card">
      <div className="section-header">
        <div className="section-title">
          <ShoppingBag size={20} color="var(--accent-amber)" />
          <span>Autonomous Purchase Orders Queue</span>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          {purchaseOrders.length} Total Orders
        </span>
      </div>

      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>PO ID</th>
              <th>Product Family</th>
              <th>Order Qty</th>
              <th>7D Demand / Stock</th>
              <th>Status</th>
              <th>Action Workflow</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  No purchase orders generated yet. Run the Restock Engine to trigger shortfall evaluations.
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => (
                <tr key={po.po_id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>PO #{po.po_id}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {po.created_at ? new Date(po.created_at).toLocaleDateString() : 'Today'}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700 }}>{getProductName(po.product_id)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Store #{po.store_id}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: '0.98rem' }}>
                      +{po.order_quantity.toLocaleString()} units
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Demand: </span>
                      <strong style={{ color: 'var(--accent-indigo)' }}>{po.predicted_demand_7d}</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Current Stock: {po.current_stock}
                    </div>
                  </td>

                  <td>
                    {po.status === 'PENDING' && (
                      <span className="status-badge badge-pending">
                        <Clock size={12} /> Pending Approval
                      </span>
                    )}
                    {po.status === 'APPROVED' && (
                      <span className="status-badge badge-approved">
                        <Truck size={12} /> Approved
                      </span>
                    )}
                    {po.status === 'FULFILLED' && (
                      <span className="status-badge badge-fulfilled">
                        <CheckCircle2 size={12} /> Stock Credited
                      </span>
                    )}
                    {po.status === 'CANCELLED' && (
                      <span className="status-badge badge-critical">
                        <XCircle size={12} /> Cancelled
                      </span>
                    )}
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {po.status === 'PENDING' && (
                        <button
                          className="button-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          onClick={() => onUpdatePOStatus(po.po_id, 'APPROVED')}
                        >
                          Approve PO
                        </button>
                      )}

                      {po.status === 'APPROVED' && (
                        <button
                          className="button-primary"
                          style={{ 
                            padding: '0.35rem 0.65rem', 
                            fontSize: '0.78rem',
                            background: 'linear-gradient(135deg, #059669, #10b981)'
                          }}
                          onClick={() => onUpdatePOStatus(po.po_id, 'FULFILLED')}
                        >
                          Fulfill & Receive
                        </button>
                      )}

                      {po.status === 'FULFILLED' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                          Complete
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
