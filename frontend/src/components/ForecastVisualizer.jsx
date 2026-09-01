import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { LineChart, Cpu, Calendar, Target } from 'lucide-react';

export function ForecastVisualizer({ forecast, product }) {
  if (!forecast || !product) {
    return (
      <div className="glass-card section-card" style={{ height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Select a SKU family to load demand forecast curve.</p>
      </div>
    );
  }

  const chartData = forecast.daily_forecast.map(item => ({
    date: item.date.slice(5), // MM-DD
    fullDate: item.date,
    predicted: item.predicted_sales,
    upperBound: Math.round(item.predicted_sales * 1.15 * 10) / 10,
    lowerBound: Math.round(item.predicted_sales * 0.85 * 10) / 10
  }));

  return (
    <div className="glass-card section-card">
      <div className="section-header">
        <div className="section-title">
          <LineChart size={20} color="var(--accent-indigo)" />
          <span>7-Day Demand Forecast: {product.family}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
          <Cpu size={14} />
          <span>{forecast.model_version}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Target size={13} color="var(--accent-indigo)" /> Total 7-Day Predicted Demand
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-indigo)', marginTop: '0.2rem' }}>
            {forecast.predicted_demand_7d.toLocaleString()} units
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={13} color="var(--accent-emerald)" /> Avg Daily Run-Rate
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
            {Math.round(forecast.predicted_demand_7d / 7).toLocaleString()} units/day
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 260, marginTop: '0.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={12} tickLine={false} />
            <YAxis stroke="var(--text-dim)" fontSize={12} tickLine={false} />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(15, 23, 42, 0.95)', 
                borderColor: 'var(--border-color)', 
                borderRadius: '8px', 
                color: '#fff',
                fontSize: '0.82rem'
              }}
              formatter={(val) => [`${val} units`, 'Predicted Demand']}
            />
            <Area 
              type="monotone" 
              dataKey="predicted" 
              stroke="#818cf8" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorPredicted)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
