import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Boxes,
  DollarSign
} from 'lucide-react';
import { Badge } from './ui/StatCard';
import { SkeletonLoader, EmptyState } from './ui/ModalsAndLoaders';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import api from '../api';

export function StoresView({
  onSelectStore,
  onNavigate
}) {
  const [stores, setStores] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [storeRes, benchRes] = await Promise.all([
          api.getStores(),
          api.getStoresComparison()
        ]);
        setStores(storeRes || []);
        setBenchmarks(benchRes || []);
      } catch (err) {
        setError(err.message || 'Failed to load store data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, []);

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <SkeletonLoader height={40} width="300px" style={{ marginBottom: '24px' }} />
        <SkeletonLoader height={280} style={{ marginBottom: '24px' }} />
        <SkeletonLoader count={8} height={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <EmptyState title="Unable to load store network" message={error} icon={AlertTriangle} />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-xl">Store Network Benchmarking</h1>
          <p className="subtitle">
            54 Retail Store Locations • Multi-Cluster Inventory & Forecast Distribution
          </p>
        </div>
      </div>

      {/* Cross-Store Stock Comparison Chart */}
      <div className="card-solid" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="title-md">Store Stock & Velocity Comparison</h3>
            <p className="subtitle">On-hand stock levels vs daily sales velocity across sample stores</p>
          </div>
          <span className="badge badge-info">Top 10 Stores Sample</span>
        </div>

        <div style={{ height: '280px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benchmarks} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="city" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="total_stock" fill="#6366f1" radius={[4, 4, 0, 0]} name="On-Hand Inventory (Units)" />
              <Bar dataKey="sales_velocity_daily" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Daily Sales Run-Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Store Table */}
      <div className="card-solid" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Store ID</th>
                <th>City</th>
                <th>State</th>
                <th>Type</th>
                <th>Cluster</th>
                <th>Total Inventory Value</th>
                <th>Stockout Risks</th>
                <th>Forecast Accuracy</th>
                <th>Turnover</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr
                  key={s.store_id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    onSelectStore?.(s.store_id);
                    onNavigate?.('dashboard');
                  }}
                >
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                    Store #{s.store_id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.city}</td>
                  <td>{s.state}</td>
                  <td><span className="badge badge-neutral">{s.store_type}</span></td>
                  <td>Cluster {s.cluster}</td>
                  <td style={{ fontWeight: 700 }}>${s.total_inventory_value?.toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: (s.stockouts_count + s.critical_count) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {s.stockouts_count + s.critical_count} SKUs
                  </td>
                  <td>{s.forecast_accuracy_pct}%</td>
                  <td>{s.inventory_turnover}x</td>
                  <td>
                    <Badge variant={s.health_status}>{s.health_status}</Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStore?.(s.store_id);
                        onNavigate?.('dashboard');
                      }}
                    >
                      Inspect <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
