import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { LineChart, Cpu, Calendar, Target, TrendingUp, ShieldAlert } from 'lucide-react';

export function ForecastVisualizer({ forecast, product }) {
  if (!forecast || !product) {
    return (
      <div className="glass-card section-card" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <LineChart size={36} color="var(--text-dim)" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Select a SKU family to load demand forecast curve.</p>
      </div>
    );
  }

  const chartData = (forecast.daily_forecast || []).map(item => {
    const d = new Date(item.date);
    const dayName = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const pred = Math.round((item.predicted_sales || 0) * 10) / 10;
    const upper = Math.round(pred * 1.15 * 10) / 10;
    const lower = Math.round(pred * 0.85 * 10) / 10;

    return {
      date: item.date.slice(5), // MM-DD
      dayName: dayName,
      fullDate: item.date,
      predicted: pred,
      upperBound: upper,
      lowerBound: lower,
      band: [lower, upper]
    };
  });

  const totalDemand = forecast.predicted_demand_7d || 0;
  const avgRunRate = Math.round(totalDemand / 7);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          color: '#fff',
          fontSize: '0.82rem',
          minWidth: '190px'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem' }}>
            📅 {data.dayName ? `${data.dayName}, ` : ''}{data.fullDate}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', margin: '0.25rem 0' }}>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>Predicted Demand:</span>
            <strong style={{ fontSize: '1rem', color: '#818cf8' }}>{data.predicted.toLocaleString()} units</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', margin: '0.2rem 0', fontSize: '0.75rem', color: '#cbd5e1' }}>
            <span>Upper Bound (+15%):</span>
            <span>{data.upperBound.toLocaleString()} units</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', margin: '0.2rem 0', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>Lower Bound (-15%):</span>
            <span>{data.lowerBound.toLocaleString()} units</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card section-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <div className="section-title">
          <LineChart size={20} color="var(--accent-indigo)" />
          <span>7-Day Demand Forecast: <strong>{product.family}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <Cpu size={14} />
          <span>{forecast.model_version || 'v1.0.0 (LightGBM)'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Target size={13} color="var(--accent-indigo)" /> Total 7-Day Predicted Demand
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-indigo)', marginTop: '0.2rem' }}>
            {totalDemand.toLocaleString()} units
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={13} color="var(--accent-emerald)" /> Avg Daily Run-Rate
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
            {avgRunRate.toLocaleString()} units/day
          </div>
        </div>
      </div>

      <div style={{ width: '100%', minHeight: '280px', height: '280px', marginTop: '0.25rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.55}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="var(--text-dim)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={{ stroke: 'var(--border-color)' }}
              tickFormatter={(val, idx) => {
                const item = chartData[idx];
                return item && item.dayName ? `${item.dayName} (${val})` : val;
              }}
            />
            <YAxis 
              stroke="var(--text-dim)" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(val) => Math.round(val).toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Confidence Interval Band Area */}
            <Area 
              type="monotone" 
              dataKey="upperBound" 
              stroke="none" 
              fillOpacity={1} 
              fill="url(#colorConfidence)" 
              name="Confidence Interval (+15%)"
            />

            {/* Main Predicted Curve */}
            <Area 
              type="monotone" 
              dataKey="predicted" 
              stroke="#818cf8" 
              strokeWidth={3.5} 
              fillOpacity={1} 
              fill="url(#colorPredicted)" 
              dot={{ r: 5, fill: '#818cf8', stroke: '#1e1b4b', strokeWidth: 2 }}
              activeDot={{ r: 8, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
              name="Predicted Sales"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }}></span>
          <span>LightGBM ML Demand Curve</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '12px', height: '8px', borderRadius: '2px', background: 'rgba(56, 189, 248, 0.3)', display: 'inline-block', border: '1px stroke #38bdf8' }}></span>
          <span>85% - 115% Uncertainty Band</span>
        </div>
      </div>
    </div>
  );
}

