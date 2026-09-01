import React, { useState } from 'react';
import { Layers, Search, Filter, LineChart, Edit3, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export function InventoryMatrix({ 
  inventory, 
  onSelectProductForForecast, 
  onOpenAdjustModal,
  selectedProductId 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.family.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="glass-card section-card">
      <div className="section-header">
        <div className="section-title">
          <Layers size={20} color="var(--accent-cyan)" />
          <span>Store Inventory & Safety Stock Matrix</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--text-dim)' }} />
            <input 
              type="text"
              placeholder="Search SKU family..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="select-input"
              style={{ paddingLeft: '2rem', width: '180px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              className="select-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.82rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="CRITICAL">Critical Shortfall</option>
              <option value="WARNING">Low Buffer Warning</option>
              <option value="HEALTHY">Healthy Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product Family</th>
              <th>Current Stock</th>
              <th>Safety Stock Buffer</th>
              <th>7-Day ML Forecast</th>
              <th>Stock Status & Shortfall</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  No SKUs match the selected filters.
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => {
                const requiredStock = item.predicted_demand_7d + item.safety_buffer;
                const fillPct = Math.min(100, Math.round((item.current_stock / requiredStock) * 100));
                
                let fillColor = "var(--accent-emerald)";
                if (item.status === 'CRITICAL') fillColor = "var(--accent-rose)";
                else if (item.status === 'WARNING') fillColor = "var(--accent-amber)";

                const isSelected = selectedProductId === item.product_id;

                return (
                  <tr 
                    key={item.product_id}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--accent-cyan)' : '3px solid transparent'
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{item.family}</span>
                        {item.perishable && (
                          <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
                            Perishable
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>SKU #{item.product_id} • Class {item.class_id}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{item.current_stock.toLocaleString()}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Lead Time: {item.lead_time_days} days</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {item.safety_buffer.toLocaleString()} units
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                        SL {(item.service_level * 100).toFixed(0)}% (Z=1.645)
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--accent-indigo)' }}>
                        {item.predicted_demand_7d.toLocaleString()} units
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>LightGBM Forecast</div>
                    </td>

                    <td style={{ minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        {item.status === 'CRITICAL' && (
                          <span className="status-badge badge-critical">
                            <ShieldAlert size={12} /> Shortfall -{item.shortfall}
                          </span>
                        )}
                        {item.status === 'WARNING' && (
                          <span className="status-badge badge-warning">
                            <AlertTriangle size={12} /> Low Buffer
                          </span>
                        )}
                        {item.status === 'HEALTHY' && (
                          <span className="status-badge badge-healthy">
                            <CheckCircle size={12} /> Healthy Stock
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {fillPct}%
                        </span>
                      </div>
                      <div className="progress-track">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${fillPct}%`, background: fillColor }} 
                        />
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          className="button-secondary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                          title="View 7-Day Forecast Curve"
                          onClick={() => onSelectProductForForecast(item.product_id)}
                        >
                          <LineChart size={14} color="var(--accent-cyan)" />
                          <span>Forecast</span>
                        </button>

                        <button
                          className="button-secondary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                          title="Adjust Stock Level"
                          onClick={() => onOpenAdjustModal(item)}
                        >
                          <Edit3 size={14} color="var(--accent-amber)" />
                          <span>Adjust</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
