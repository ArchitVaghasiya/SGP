import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  Filter,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Badge } from './ui/StatCard';
import { SkeletonLoader, EmptyState, Pagination } from './ui/ModalsAndLoaders';
import api from '../api';

export function AlertsView({ selectedStore, onNavigate, onSelectSku }) {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 25;

  const fetchAlerts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.getAlertsList({
          severity: severityFilter,
          status: statusFilter,
          store_id: selectedStore,
          limit,
          offset: (page - 1) * limit
        }),
        api.getAlertsSummary()
      ]);
      setAlerts(listRes.items || []);
      setTotal(listRes.total || 0);
      setSummary(sumRes);
    } catch (err) {
      setError(err.message || 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [severityFilter, statusFilter, selectedStore]);

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter, selectedStore, page]);

  const handleAcknowledge = async (id) => {
    try {
      await api.acknowledgeAlert(id);
      fetchAlerts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.resolveAlert(id);
      fetchAlerts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleBulkAcknowledge = async () => {
    try {
      await api.bulkAcknowledgeAlerts({ all_unread: true });
      fetchAlerts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-xl">Operational Alert Center</h1>
          <p className="subtitle">
            Autonomous anomaly detection, stockout alerts & procurement triggers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleBulkAcknowledge}>
            <CheckCheck size={14} /> Acknowledge All Unread
          </button>
        </div>
      </div>

      {/* Severity Summary Pills */}
      {summary && (
        <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '20px' }}>
          <div className="card-solid" style={{ borderLeft: '4px solid var(--color-danger)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>Critical Unread</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {summary.critical_unread || 0}
            </div>
          </div>
          <div className="card-solid" style={{ borderLeft: '4px solid var(--color-warning)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase' }}>High Priority</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {summary.high_unread || 0}
            </div>
          </div>
          <div className="card-solid" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Medium Priority</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {summary.medium_unread || 0}
            </div>
          </div>
          <div className="card-solid" style={{ borderLeft: '4px solid var(--color-success)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>Total Alerts Logged</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {summary.total_alerts || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card-solid" style={{ marginBottom: '20px', padding: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Severity:</span>
          <select
            className="select-control"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
          <select
            className="select-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="UNREAD">Unread</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="card-solid" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '24px' }}>
            <SkeletonLoader count={6} height={40} />
          </div>
        ) : error ? (
          <EmptyState title="Failed to load alerts" message={error} icon={AlertTriangle} />
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No alerts found"
            message="No alerts currently match your criteria."
            icon={CheckCircle2}
          />
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Alert Title</th>
                    <th>Store & SKU</th>
                    <th>Message Details</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((al) => (
                    <tr key={al.id}>
                      <td>
                        <Badge variant={al.severity}>{al.severity}</Badge>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {al.title}
                      </td>
                      <td>
                        <span
                          style={{ color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => onSelectSku?.(al.store_id, al.product_id)}
                        >
                          {al.sku} ({al.product_name})
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{al.store_name}</div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '350px' }}>
                        {al.message}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{al.status}</span>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(al.created_at).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {al.status === 'UNREAD' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleAcknowledge(al.id)}
                            >
                              Ack
                            </button>
                          )}
                          {al.status !== 'RESOLVED' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleResolve(al.id)}
                            >
                              Resolve
                            </button>
                          )}
                        </div>
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
