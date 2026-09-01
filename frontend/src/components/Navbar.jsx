import React from 'react';
import { Package, RefreshCw, Sun, Moon, Cpu, Server } from 'lucide-react';

export function Navbar({ 
  selectedStore, 
  setSelectedStore, 
  stores, 
  onRunRestock, 
  isEvaluating, 
  backendStatus, 
  theme, 
  setTheme 
}) {
  return (
    <header className="header-bar">
      <div className="brand-title">
        <div className="brand-icon">
          <Package size={24} />
        </div>
        <div className="brand-text">
          <h1>AutoStock AI</h1>
          <p>Supply Chain Restock & Stockout Prevention Engine</p>
        </div>
      </div>

      <div className="controls-group">
        {/* Backend Status indicator */}
        <div 
          title={backendStatus.isOnline ? "FastAPI Live Backend Connected" : "Operating in Demo Mode (Mock API)"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            background: backendStatus.isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: backendStatus.isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: backendStatus.isOnline ? '#34d399' : '#fbbf24'
          }}
        >
          <Server size={14} />
          <span>{backendStatus.isOnline ? 'FastAPI Live' : 'Demo Mode'}</span>
          <span className="pulse-dot" style={{ background: backendStatus.isOnline ? '#10b981' : '#f59e0b' }}></span>
        </div>

        {/* Store Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Store:</span>
          <select 
            className="select-input" 
            value={selectedStore} 
            onChange={(e) => setSelectedStore(Number(e.target.value))}
          >
            {stores.map(s => (
              <option key={s.store_id} value={s.store_id}>
                Store #{s.store_id} - {s.city} ({s.state})
              </option>
            ))}
          </select>
        </div>

        {/* Action Button: Evaluate Restock */}
        <button 
          className="button-primary"
          onClick={onRunRestock}
          disabled={isEvaluating}
        >
          <RefreshCw size={16} className={isEvaluating ? "animate-spin" : ""} />
          <span>{isEvaluating ? "Evaluating ML Forecasts..." : "Run Restock Engine"}</span>
        </button>

        {/* Theme Toggle */}
        <button 
          className="button-secondary"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Light/Dark Theme"
          style={{ padding: '0.6rem' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
