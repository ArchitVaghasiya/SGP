import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, Line, ComposedChart, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';
import { StatCard, Badge } from './ui/StatCard';
import { SkeletonLoader, EmptyState } from './ui/ModalsAndLoaders';
import api from '../api';

export function AnalyticsView({ onSelectSku }) {
  const [abcXyz, setAbcXyz] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [matrixRes, sumRes] = await Promise.all([
          api.getAbcXyzAnalysis(),
          api.getAnalyticsSummary()
        ]);
        setAbcXyz(matrixRes);
        setSummary(sumRes);
      } catch (err) {
        setError(err.message || 'Failed to load analytics data');
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

  if (error || !abcXyz) {
    return (
      <div className="page-wrapper">
        <EmptyState title="Unable to load analytics" message={error} icon={AlertTriangle} />
      </div>
    );
  }

  const items = abcXyz.items || [];
  const matrix = abcXyz.matrix_9box || {};
  const filteredItems = selectedCell ? items.filter(i => i.matrix_class === selectedCell) : items;

  // Pareto chart data (Top 15 products)
  const paretoData = items.slice(0, 15).map(i => ({
    name: i.product_name,
    value: i.inventory_value,
    cumulative: i.cumulative_pct
  }));

  const matrixGrid = [
    { row: 'A (High Value)', cells: ['AX', 'AY', 'AZ'] },
    { row: 'B (Medium Value)', cells: ['BX', 'BY', 'BZ'] },
    { row: 'C (Low Value)', cells: ['CX', 'CY', 'CZ'] },
  ];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-xl">Supply Chain Analytics & ABC-XYZ Studio</h1>
          <p className="subtitle">
            Pareto Value Stratification • Demand Volatility Classification • 9-Box Policy Matrix
          </p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
        <StatCard
          title="Total Capital Stratified"
          value={`$${(abcXyz.total_inventory_value || 0).toLocaleString()}`}
          subtitle="Across 33 Product Families"
          icon={Layers}
        />
        <StatCard
          title="Inventory Turnover"
          value={`${summary?.inventory_turnover_ratio || 4.8}x`}
          subtitle="Annualized velocity"
          icon={TrendingUp}
        />
        <StatCard
          title="Days Sales of Inventory (DSI)"
          value={`${summary?.days_sales_of_inventory || 76} Days`}
          subtitle="Average network holding period"
          icon={BarChart3}
        />
        <StatCard
          title="Dead Stock Capital"
          value={`$${(summary?.dead_stock_value || 14200).toLocaleString()}`}
          change="At Risk"
          changeType="danger"
          subtitle="Zero velocity > 90 days"
          icon={AlertTriangle}
        />
      </div>

      {/* Row: 9-Box Matrix + Pareto Chart */}
      <div className="grid-2col" style={{ marginBottom: '24px' }}>
        {/* 9-Box Interactive Matrix */}
        <div className="card-solid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="title-md">9-Box ABC / XYZ Policy Matrix</h3>
              <p className="subtitle">Click any cell to filter SKU replenishment policies below</p>
            </div>
            {selectedCell && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCell(null)}>
                Clear Cell Filter ({selectedCell})
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(3, 1fr)', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
              <div></div>
              <div>X (Stable Demand)</div>
              <div>Y (Variable)</div>
              <div>Z (Lumpy / Erratic)</div>
            </div>

            {matrixGrid.map(rowObj => (
              <div key={rowObj.row} style={{ display: 'grid', gridTemplateColumns: '120px repeat(3, 1fr)', gap: '8px', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {rowObj.row}
                </div>
                {rowObj.cells.map(code => {
                  const isA = code.startsWith('A');
                  const isX = code.endsWith('X');
                  const isSelected = selectedCell === code;
                  const count = matrix[code] || 0;

                  return (
                    <div
                      key={code}
                      onClick={() => setSelectedCell(selectedCell === code ? null : code)}
                      style={{
                        padding: '16px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--accent-primary)' : isA && isX ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                        border: `1px solid ${isSelected ? 'var(--accent-primary)' : isA && isX ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#ffffff' : 'var(--text-primary)' }}>
                        {code}
                      </div>
                      <div style={{ fontSize: '11px', color: isSelected ? '#ffffff' : 'var(--text-muted)', marginTop: '2px' }}>
                        {count} SKUs
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '11px', color: 'var(--text-secondary)' }}>
            💡 <b>Policy Guidance:</b> <b>AX</b> products warrant automated JIT replenishment with high service levels; <b>CZ</b> products require order-on-demand or consignment policies to minimize risk.
          </div>
        </div>

        {/* Pareto Cumulative Value Curve */}
        <div className="card-solid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="title-md">Pareto Analysis (80/20 Value Stratification)</h3>
              <p className="subtitle">Inventory capital concentration by product family</p>
            </div>
            <span className="badge badge-healthy">Class A = 75% Capital</span>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--color-warning)" domain={[0, 100]} fontSize={10} tickFormatter={val => `${val}%`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Inventory Value ($)" />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} name="Cumulative %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filtered SKU Table */}
      <div className="card-solid" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="title-md">Classified Product Portfolio ({filteredItems.length} Products)</h3>
            <p className="subtitle">{selectedCell ? `Showing items in Cell ${selectedCell}` : 'All categorized products'}</p>
          </div>
        </div>

        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Family</th>
                <th>Category Value ($)</th>
                <th>Cumulative %</th>
                <th>Demand Volatility (CV)</th>
                <th>ABC Tier</th>
                <th>XYZ Tier</th>
                <th>9-Box Class</th>
                <th>Suggested Replenishment Policy</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.product_id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectSku?.(1, item.product_id)}
                >
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {item.sku}
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                  <td style={{ fontWeight: 700 }}>${item.inventory_value?.toLocaleString()}</td>
                  <td>{item.cumulative_pct}%</td>
                  <td style={{ fontWeight: 600 }}>{item.cv?.toFixed(2)}</td>
                  <td>
                    <Badge variant={item.abc_class === 'A' ? 'HEALTHY' : item.abc_class === 'B' ? 'WARNING' : 'NEUTRAL'}>
                      Class {item.abc_class}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={item.xyz_class === 'X' ? 'INFO' : item.xyz_class === 'Y' ? 'WARNING' : 'CRITICAL'}>
                      Class {item.xyz_class}
                    </Badge>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {item.matrix_class}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {item.matrix_class === 'AX' ? 'Automated High-Frequency Restock' :
                     item.matrix_class === 'AY' ? 'Buffer against seasonal peaks' :
                     item.matrix_class === 'AZ' ? 'Targeted safety stock reviews' :
                     item.matrix_class === 'BX' ? 'Standard periodic replenishment' :
                     item.matrix_class === 'BY' ? 'Dynamic safety buffer' :
                     item.matrix_class === 'BZ' ? 'Supplier consignment buffer' :
                     item.matrix_class === 'CX' ? 'Bulk order quarterly' :
                     item.matrix_class === 'CY' ? 'Low stock alert triggers' :
                     'Strict pull / order-on-demand'}
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
