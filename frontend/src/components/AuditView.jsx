import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Filter,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { SkeletonLoader, EmptyState, Pagination } from './ui/ModalsAndLoaders';
import api from '../api';

export function AuditView() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 25;

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAuditLogs({
        entity: entityFilter,
        limit,
        offset: (page - 1) * limit
      });
      setLogs(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, page]);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-xl">System Governance & Audit Trail</h1>
          <p className="subtitle">
            Immutable log of state mutations, PO approvals, stock adjustments, and administrative actions
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-solid" style={{ marginBottom: '20px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Entity Filter:</span>
        <select
          className="select-control"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          <option value="ALL">All System Entities</option>
          <option value="PURCHASE_ORDER">Purchase Orders</option>
          <option value="INVENTORY">Inventory Adjustments</option>
          <option value="DATABASE">Database & Migrations</option>
          <option value="USER">User Authentication & Roles</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-solid" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '24px' }}>
            <SkeletonLoader count={8} height={40} />
          </div>
        ) : error ? (
          <EmptyState title="Unable to load audit logs" message={error} icon={AlertTriangle} />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit events found"
            message="No system state mutations match your filter criteria."
            icon={ShieldCheck}
          />
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Operator Email</th>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>Entity Reference</th>
                    <th>Previous State</th>
                    <th>New State / Mutation</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.user_email}</td>
                      <td>
                        <span className="badge badge-info">{log.action}</span>
                      </td>
                      <td>{log.entity}</td>
                      <td className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>
                        {log.entity_id || '-'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {log.previous_state || 'N/A'}
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.new_state || 'Recorded'}
                      </td>
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
