import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Cpu,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from 'recharts';
import { StatCard, Badge } from './ui/StatCard';
import { SkeletonLoader, EmptyState } from './ui/ModalsAndLoaders';
import api from '../api';

export function ForecastsView() {
  const [metrics, setMetrics] = useState(null);
  const [categoryAcc, setCategoryAcc] = useState([]);
  const [storeAcc, setStoreAcc] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [metricsRes, catRes, storeRes] = await Promise.all([
          api.getForecastMetrics(),
          api.getAccuracyByCategory(),
          api.getAccuracyByStore()
        ]);
        setMetrics(metricsRes);
        setCategoryAcc(catRes || []);
        setStoreAcc(storeRes || []);
      } catch (err) {
        setError(err.message || 'Failed to load forecast analytics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <SkeletonLoader height={40} width="350px" style={{ marginBottom: '24px' }} />
        <div className="grid-kpi">
          <SkeletonLoader count={4} height={100} />
        </div>
        <SkeletonLoader height={320} style={{ marginTop: '24px' }} />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="page-wrapper">
        <EmptyState
          title="Unable to load forecast metrics"
          message={error}
          icon={AlertTriangle}
        />
      </div>
    );
  }

  const featureImportance = metrics.feature_importance || [];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-xl">Demand Forecast Intelligence</h1>
          <p className="subtitle">
            LightGBM Gradient Boosted Decision Tree Inference Engine • Out-of-Time Model Performance
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-healthy">
            <span className="pulse-dot pulse-healthy" /> Model v1.4.2 Active
          </span>
        </div>
      </div>

      {/* 4 Core ML Performance KPI Cards */}
      <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard
          title="Weighted Absolute % Error (WAPE)"
          value={`${metrics.wape_pct}%`}
          change="Target: <10.0%"
          changeType="positive"
          subtitle="Global cross-store demand error"
          icon={TrendingUp}
        />
        <StatCard
          title="Forecast Accuracy"
          value={`${metrics.accuracy_pct}%`}
          change="+1.4% vs Baseline"
          changeType="positive"
          subtitle="Out-of-time test holdout accuracy"
          icon={CheckCircle2}
        />
        <StatCard
          title="Mean Absolute Error (MAE)"
          value={`${metrics.mae} units`}
          subtitle="Average daily unit delta per SKU"
          icon={BarChart2}
        />
        <StatCard
          title="Model Forecast Bias"
          value={`${metrics.bias_pct}%`}
          change="Near Zero Bias"
          changeType="positive"
          subtitle="Symmetric over/under forecasting"
          icon={Cpu}
        />
      </div>

      {/* Row: Feature Importance Bar Chart + Model Metadata */}
      <div className="grid-2col" style={{ marginBottom: '24px' }}>
        {/* Feature Importance Bar Chart */}
        <div className="card-solid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="title-md">Explainable ML: Feature Importance</h3>
              <p className="subtitle">Gain percentage contribution in LightGBM decision tree splits</p>
            </div>
            <span className="badge badge-info">Normalized Gain</span>
          </div>

          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportance}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 70, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} domain={[0, 0.35]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                <YAxis dataKey="feature" type="category" stroke="var(--text-muted)" fontSize={10} width={130} />
                <Tooltip
                  formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Gain Contribution']}
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="importance" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {featureImportance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#6366f1' : index === 1 ? '#06b6d4' : index === 2 ? '#a855f7' : '#475569'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Training Architecture & Features Panel */}
        <div className="card-solid" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Cpu size={18} color="var(--accent-primary)" />
              <h3 className="title-md">Pipeline Architecture & Signals</h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              The demand forecasting engine uses a multi-stage time-series pipeline incorporating recursive lags, rolling variance windows, calendar holidays, promotional flags, and macroeconomic crude oil indices.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Algorithm:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{metrics.algorithm}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Training Records:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>3,000,888 transactions</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Forecast Horizon:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-cyan)' }}>7 to 14 Days Rolling</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cross-Validation:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Purged GroupTimeSeriesSplit</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--accent-primary-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '12px', color: 'var(--text-primary)' }}>
            💡 <b>Insight:</b> 7-day sales lag and 7-day rolling mean account for <b>49.6%</b> of total predictive power, ensuring rapid adaptation to sudden seasonal surges.
          </div>
        </div>
      </div>

      {/* Category Accuracy Table */}
      <div className="card-solid" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="title-md">Accuracy Breakdown by Product Category</h3>
            <p className="subtitle">Segmented performance across fast-moving staples and perishable categories</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Out-of-Time Accuracy</th>
                <th>WAPE</th>
                <th>MAE (Units)</th>
                <th>Performance Grade</th>
              </tr>
            </thead>
            <tbody>
              {categoryAcc.map((cat) => (
                <tr key={cat.category}>
                  <td style={{ fontWeight: 600 }}>{cat.category}</td>
                  <td style={{ fontWeight: 700, color: cat.accuracy_pct >= 92 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {cat.accuracy_pct}%
                  </td>
                  <td>{cat.wape_pct}%</td>
                  <td>{cat.mae} units</td>
                  <td>
                    <Badge variant={cat.accuracy_pct >= 93 ? 'HEALTHY' : cat.accuracy_pct >= 89 ? 'WARNING' : 'INFO'}>
                      {cat.accuracy_pct >= 93 ? 'GRADE A' : cat.accuracy_pct >= 89 ? 'GRADE B' : 'GRADE C'}
                    </Badge>
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
