import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Badge } from './ui/StatCard';
import { SkeletonLoader, EmptyState, Pagination } from './ui/ModalsAndLoaders';
import api from '../api';

export function TransactionsView({ selectedStore, onSelectSku }) {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 25;

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getInventoryTransactions({
        store_id: selectedStore,
        type: typeFilter,
        limit,
        offset: (page - 1) * limit
      });
      setTransactions(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load transaction ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [typeFilter, selectedStore]);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, selectedStore, page]);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-xl">Inventory Transaction Ledger</h1>
          <p className="subtitle">
            Immutable Double-Entry Style Inventory Movement History & Receipts
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-solid" style={{ marginBottom: '20px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Movement Type:</span>
        <select
          className="select-control"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Transaction Types</option>
          <option value="RECEIPT">Purchase Order Receipts</option>
          <option value="ADJUSTMENT">Manual Stock Adjustments</option>
          <option value="RESTOCK">Direct Restocks</option>
          <option value="DAMAGE">Damaged / Expired</option>
          <option value="RETURN">Customer Returns</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-solid" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '24px' }}>
            <SkeletonLoader count={8} height={40} />
          </div>
        ) : error ? (
          <EmptyState title="Unable to load transactions" message={error} icon={AlertTriangle} />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions recorded"
            message="No inventory movements match your filter criteria."
            icon={FileSpreadsheet}
          />
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Store</th>
                    <th>SKU & Product</th>
                    <th>Transaction Type</th>
                    <th>Quantity Delta</th>
                    <th>Previous Stock</th>
                    <th>Resulting Stock</th>
                    <th>Reference</th>
                    <th>Authorized By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td>Store #{tx.store_id}</td>
                      <td>
                        <span
                          style={{ color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => onSelectSku?.(tx.store_id, tx.product_id)}
                        >
                          SKU-{String(tx.product_id).padStart(3, '0')} ({tx.product_name})
                        </span>
                      </td>
                      <td>
                        <Badge variant={tx.transaction_type === 'RECEIPT' ? 'HEALTHY' : tx.transaction_type === 'DAMAGE' ? 'CRITICAL' : 'INFO'}>
                          {tx.transaction_type}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 700, color: tx.quantity_change > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change} units
                      </td>
                      <td>{tx.previous_quantity}</td>
                      <td style={{ fontWeight: 700 }}>{tx.resulting_quantity}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {tx.reference_id || tx.reference_type || 'MANUAL_OVERRIDE'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tx.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              totalItems={total}
              limit={limit}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
