import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card" style={{ padding: '1rem', border: '1px solid var(--border-glow)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{data.name}</h4>
        <div style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>
          Shortfall: {data.shortfall} units
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
          Current Stock: {data.current_stock}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          7D Demand: {data.predicted_demand_7d}
        </div>
      </div>
    );
  }
  return null;
};

export function GlobalShortfallsChart({ inventory }) {
  const shortfalls = inventory.filter(item => item.status === 'CRITICAL' || item.status === 'WARNING');
  
  if (shortfalls.length === 0) {
    return (
      <div className="glass-card section-card" style={{ flex: 1, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>All Stock is Healthy!</h2>
          <p style={{ color: 'var(--text-muted)' }}>No critical shortfalls detected in the current inventory.</p>
        </div>
      </div>
    );
  }

  const data = shortfalls.map(item => {
    // Calculate precise shortfall if it's not provided natively
    const shortfallAmt = item.shortfall > 0 
      ? item.shortfall 
      : Math.max(0, (item.predicted_demand_7d + item.safety_buffer) - item.current_stock);
      
    return {
      name: item.family || item.sku,
      shortfall: shortfallAmt,
      status: item.status,
      current_stock: item.current_stock,
      predicted_demand_7d: item.predicted_demand_7d
    };
  }).sort((a, b) => b.shortfall - a.shortfall); // Sort by highest shortfall

  const rawTotalShortfall = data.reduce((sum, item) => sum + item.shortfall, 0);
  const totalShortfall = Number(rawTotalShortfall.toFixed(3));

  return (
    <div className="glass-card section-card" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="section-header" style={{ borderBottom: 'none', marginBottom: '0' }}>
        <div className="section-title">
          <span style={{ fontSize: '1.2rem' }}>Store Shortfalls</span>
          <span className="status-badge badge-critical" style={{ marginLeft: '0.5rem' }}>
            Management by Exception
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Shortfall Units</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-rose)' }}>
            {totalShortfall.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
          </div>
        </div>
      </div>
      
      <div style={{ height: '400px', width: '95%', margin: '1rem auto 0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="var(--text-muted)" 
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="var(--text-muted)" 
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-card-hover)' }} />
            <Bar 
              dataKey="shortfall" 
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.status === 'CRITICAL' ? 'var(--accent-rose)' : 'var(--accent-amber)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
