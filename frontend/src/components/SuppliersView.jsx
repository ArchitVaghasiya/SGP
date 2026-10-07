import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Package
} from 'lucide-react';
import { Badge } from './ui/StatCard';
import { Drawer, SkeletonLoader, EmptyState } from './ui/ModalsAndLoaders';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import api from '../api';

export function SuppliersView({ onNavigate }) {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.getSuppliers();
        setSuppliers(res || []);
      } catch (err) {
        setError(err.message || 'Failed to load suppliers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const handleOpenScorecard = async (sup) => {
    setSelectedSupplier(sup);
    setIsScorecardOpen(true);
    try {
      const sc = await api.getSupplierScorecard(sup.id);
      setScorecard(sc);
    } catch {
      setScorecard(null);
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <SkeletonLoader height={40} width="300px" style={{ marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <SkeletonLoader count={6} height={180} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <EmptyState title="Unable to load suppliers" message={error} icon={AlertTriangle} />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-xl">Supplier Performance Hub</h1>
          <p className="subtitle">
            Vendor Scorecards, Reliability Ratings & Lead-Time Performance
          </p>
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="card-interactive"
            onClick={() => handleOpenScorecard(s)}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' }}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</h3>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.code} • {s.category}</span>
                  </div>
                </div>
                <span className="badge badge-healthy" style={{ fontSize: '11px' }}>
                  Grade {s.health_grade}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', margin: '14px 0', fontSize: '12px' }}>
                <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>On-Time Delivery</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-success)', marginTop: '2px' }}>
                    {s.on_time_pct}%
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Lead Time</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {s.lead_time_days} Days
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reliability Score</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }}>
                    {s.reliability_score}%
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Min Order Qty</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {s.min_order_qty} units
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>{s.products_count} linked SKUs</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                View Scorecard <ChevronRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Scorecard Drawer */}
      {selectedSupplier && (
        <Drawer
          isOpen={isScorecardOpen}
          onClose={() => setIsScorecardOpen(false)}
          title={`Scorecard: ${selectedSupplier.name}`}
          subtitle={`${selectedSupplier.code} • Contact: ${selectedSupplier.contact_name}`}
          width="540px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Score Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reliability</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
                  {selectedSupplier.reliability_score}%
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On-Time</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-cyan)', marginTop: '4px' }}>
                  {selectedSupplier.on_time_pct}%
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lead Time</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {selectedSupplier.lead_time_days}d
                </div>
              </div>
            </div>

            {/* Performance Trend Chart */}
            <div className="card-solid">
              <h4 className="title-md" style={{ marginBottom: '12px' }}>Monthly Fulfillment Performance</h4>
              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scorecard?.monthly_performance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis domain={[85, 100]} stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="on_time" stroke="#10b981" strokeWidth={2} name="On-Time %" />
                    <Line type="monotone" dataKey="fill_rate" stroke="#6366f1" strokeWidth={2} name="Fill Rate %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Contact Details */}
            <div className="card-solid">
              <h4 className="title-md" style={{ marginBottom: '10px' }}>Vendor Contact Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Mail size={14} color="var(--accent-primary)" />
                  <span>{selectedSupplier.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Phone size={14} color="var(--accent-primary)" />
                  <span>{selectedSupplier.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
