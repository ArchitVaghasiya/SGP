import React, { useState } from 'react';
import { Layers, Search, Filter, LineChart, Edit3, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import AnimatedList from './AnimatedList';

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

  const renderInventoryItem = (item, index, isSelected) => {
    const requiredStock = item.predicted_demand_7d + item.safety_buffer;
    const fillPct = Math.min(100, Math.round((item.current_stock / requiredStock) * 100));
    
    let fillColor = "var(--accent-emerald)";
    if (item.status === 'CRITICAL') fillColor = "var(--accent-rose)";
    else if (item.status === 'WARNING') fillColor = "var(--accent-amber)";

    // Make it look like a list card
    return (
      <div 
        className={`item ${isSelected ? 'selected' : ''}`}
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr 1fr',
          gap: '1rem',
          alignItems: 'center',
          borderLeft: isSelected ? '3px solid var(--accent-cyan)' : '3px solid transparent'
        }}
      >
        <div>
          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{item.family}</span>
            {item.perishable && (
              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
                Perishable
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>SKU #{item.product_id} • Class {item.class_id}</div>
        </div>

        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>{item.current_stock.toLocaleString()}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Lead Time: {item.lead_time_days}</div>
        </div>

        <div>
          <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
            {item.safety_buffer.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Buffer</div>
        </div>

        <div>
          <div style={{ fontWeight: 700, color: 'var(--accent-indigo)' }}>
            {item.predicted_demand_7d.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>7D ML Forecast</div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            {item.status === 'CRITICAL' && (
              <span className="status-badge badge-critical" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
                <ShieldAlert size={10} /> -{item.shortfall}
              </span>
            )}
            {item.status === 'WARNING' && (
              <span className="status-badge badge-warning" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
                <AlertTriangle size={10} /> Low
              </span>
            )}
            {item.status === 'HEALTHY' && (
              <span className="status-badge badge-healthy" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
                <CheckCircle size={10} /> Healthy
              </span>
            )}
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {fillPct}%
            </span>
          </div>
          <div className="progress-track" style={{ height: '5px' }}>
            <div className="progress-fill" style={{ width: `${fillPct}%`, background: fillColor }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
          <button
            className="button-secondary"
            style={{ padding: '0.4rem', fontSize: '0.78rem' }}
            title="View 7-Day Forecast Curve"
            onClick={(e) => { e.stopPropagation(); onSelectProductForForecast(item.product_id); }}
          >
            <LineChart size={14} color="var(--accent-cyan)" />
          </button>
          <button
            className="button-secondary"
            style={{ padding: '0.4rem', fontSize: '0.78rem' }}
            title="Adjust Stock Level"
            onClick={(e) => { e.stopPropagation(); onOpenAdjustModal(item); }}
          >
            <Edit3 size={14} color="var(--accent-amber)" />
          </button>
        </div>
      </div>
    );
  };

  const initialIndex = filteredInventory.findIndex(item => item.product_id === selectedProductId);

  return (
    <div className="glass-card section-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr 1fr', 
        gap: '1rem', 
        padding: '0 16px 10px',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        color: 'var(--text-dim)'
      }}>
        <div>Product Family</div>
        <div>Current Stock</div>
        <div>Buffer</div>
        <div>Forecast</div>
        <div>Status</div>
        <div style={{ textAlign: 'right' }}>Actions</div>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: '400px' }}>
        {filteredInventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
            No SKUs match the selected filters.
          </div>
        ) : (
          <AnimatedList
            items={filteredInventory}
            onItemSelect={(item) => onSelectProductForForecast(item.product_id)}
            renderItem={renderInventoryItem}
            initialSelectedIndex={initialIndex !== -1 ? initialIndex : 0}
            showGradients={true}
          />
        )}
      </div>
    </div>
  );
}
