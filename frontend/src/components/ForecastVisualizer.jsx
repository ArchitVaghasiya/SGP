import React from 'react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { LineChart, Cpu, Calendar, Target, Box, AlertTriangle, ShieldCheck } from 'lucide-react';

export function ForecastVisualizer({ forecast, product }) {
  if (!forecast || !product) {
    return (
      <div className="glass-card section-card" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <LineChart size={36} color="var(--text-dim)" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Select a SKU family to load demand forecast & inventory depletion curve.</p>
      </div>
    );
  }

  const currentStock = forecast.current_stock !== undefined ? forecast.current_stock : (product.current_stock || 100);
  const safetyBuffer = forecast.safety_buffer !== undefined ? forecast.safety_buffer : (product.safety_buffer || 30);
  const totalDemand = forecast.predicted_demand_7d || 0;
  const avgRunRate = Math.round((totalDemand / 7) * 10) / 10;

  // Build daily chart data
  let cumulativeDemand = 0;
  const chartData = (forecast.daily_forecast || []).map((item, idx) => {
    const d = new Date(item.date);
    const dayName = isNaN(d.getTime()) ? `Day ${idx + 1}` : d.toLocaleDateString('en-US', { weekday: 'short' });
    const predSales = Math.round((item.predicted_sales || 0) * 10) / 10;
    cumulativeDemand += predSales;

    // Remaining stock calculation
    const remainingStock = item.projected_stock_remaining !== undefined 
      ? Math.round(item.projected_stock_remaining * 10) / 10 
      : Math.max(0, Math.round((currentStock - cumulativeDemand) * 10) / 10);

    const isRisk = item.is_stockout_risk !== undefined ? item.is_stockout_risk : remainingStock < safetyBuffer;

    return {
      date: item.date.slice(5), // MM-DD
      dayName,
      fullDate: item.date,
      predictedSales: predSales,
      projectedStock: remainingStock,
      isRisk
    };
  });

  // Determine stockout risk day if any
  const stockoutDay = chartData.find(d => d.projectedStock < safetyBuffer);
  const hasStockoutRisk = !!stockoutDay;

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
          minWidth: '210px'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem' }}>
            📅 {data.dayName ? `${data.dayName}, ` : ''}{data.fullDate}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', margin: '0.3rem 0' }}>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>Predicted Sales:</span>
            <strong style={{ fontSize: '0.95rem', color: '#818cf8' }}>{data.predictedSales.toLocaleString()} units</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', margin: '0.3rem 0' }}>
            <span style={{ color: data.isRisk ? '#f43f5e' : '#34d399', fontWeight: 600 }}>Remaining Stock:</span>
            <strong style={{ fontSize: '0.95rem', color: data.isRisk ? '#f43f5e' : '#34d399' }}>{data.projectedStock.toLocaleString()} units</strong>
          </div>
          {data.isRisk && (
            <div style={{ marginTop: '0.4rem', paddingTop: '0.3rem', borderTop: '1px dashed rgba(244, 63, 94, 0.4)', color: '#fb7185', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertTriangle size={12} /> Below Safety Buffer ({safetyBuffer} units)
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card section-card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header section */}
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <div className="section-title">
          <LineChart size={20} color="var(--accent-indigo)" />
          <span>Demand & Stock Projection: <strong>{product.family}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {hasStockoutRisk ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '0.25rem 0.65rem', borderRadius: '20px', border: '1px solid rgba(244, 63, 94, 0.3)', fontWeight: 600 }}>
              <AlertTriangle size={13} /> Stockout Warning ({stockoutDay.dayName})
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.65rem', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
              <ShieldCheck size={13} /> Stock Healthy (7+ Days)
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <Cpu size={14} />
            <span>{forecast.model_version || 'v1.0.0 (LightGBM)'}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Box size={13} color="var(--accent-cyan)" /> Current Stock On-Hand
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: hasStockoutRisk ? '#f43f5e' : '#38bdf8', marginTop: '0.15rem' }}>
            {currentStock.toLocaleString()} units
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Target size={13} color="var(--accent-indigo)" /> 7-Day Predicted Demand
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-indigo)', marginTop: '0.15rem' }}>
            {totalDemand.toLocaleString()} units
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={13} color="var(--accent-emerald)" /> Daily Run-Rate
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.15rem' }}>
            {avgRunRate.toLocaleString()} /day
          </div>
        </div>
      </div>

      {/* Dual Curve Dynamic Chart */}
      <div style={{ width: '100%', minHeight: '280px', height: '280px', marginTop: '0.25rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.45}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02}/>
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

            {/* Safety Buffer Reference Line */}
            {safetyBuffer > 0 && (
              <ReferenceLine 
                y={safetyBuffer} 
                stroke="#f59e0b" 
                strokeDasharray="4 4" 
                label={{ value: `Safety Buffer (${safetyBuffer})`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} 
              />
            )}

            {/* Daily Predicted Sales Area */}
            <Area 
              type="monotone" 
              dataKey="predictedSales" 
              stroke="#818cf8" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorDemand)" 
              dot={{ r: 4, fill: '#818cf8', stroke: '#1e1b4b', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
              name="Predicted Sales"
            />

            {/* Remaining Stock Line Curve */}
            <Line 
              type="monotone" 
              dataKey="projectedStock" 
              stroke={hasStockoutRisk ? '#f43f5e' : '#10b981'} 
              strokeWidth={3} 
              strokeDasharray="3 3"
              dot={{ r: 5, fill: hasStockoutRisk ? '#f43f5e' : '#10b981', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 8, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
              name="Projected Stock"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.75rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }}></span>
          <span>LightGBM Predicted Daily Sales</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: hasStockoutRisk ? '#f43f5e' : '#10b981', display: 'inline-block' }}></span>
          <span>Projected Remaining Stock (Depletion Curve)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '12px', height: '2px', background: '#f59e0b', display: 'inline-block' }}></span>
          <span>Safety Stock Buffer</span>
        </div>
      </div>
    </div>
  );
}

