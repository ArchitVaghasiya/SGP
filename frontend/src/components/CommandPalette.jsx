import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Boxes,
  TrendingUp,
  ShoppingCart,
  Building2,
  Store,
  Bell,
  ArrowRight,
  X,
  FileText,
  AlertTriangle
} from 'lucide-react';
import api from '../api';

export function CommandPalette({ isOpen, onClose, onNavigate, onSelectSku }) {
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live search debounce
  useEffect(() => {
    if (!query.trim()) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.search(query.trim());
        setLiveResults(res.results || []);
      } catch (err) {
        console.error("Live search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const staticNav = [
    { type: 'view', id: 'dashboard', title: 'Executive Control Tower', desc: 'Real-time KPIs & demand curve', icon: LayoutDashboard },
    { type: 'view', id: 'inventory', title: 'Inventory Matrix', desc: '1,782 SKU catalog with safety stock thresholds', icon: Boxes },
    { type: 'view', id: 'forecasts', title: 'Demand Forecast Intelligence', desc: 'LightGBM model metrics & WAPE 7.86%', icon: TrendingUp },
    { type: 'view', id: 'purchase-orders', title: 'Purchase Orders & Restock', desc: 'Procurement state machine & EDI transmission', icon: ShoppingCart },
    { type: 'view', id: 'suppliers', title: 'Supplier Hub', desc: 'Vendor scorecards & lead times', icon: Building2 },
    { type: 'view', id: 'stores', title: 'Store Network Benchmarks', desc: '54 retail stores benchmark comparison', icon: Store },
    { type: 'view', id: 'analytics', title: 'ABC / XYZ Analytics', desc: 'Pareto curve & 9-Box policy matrix', icon: TrendingUp },
    { type: 'view', id: 'simulations', title: 'What-If Simulation Studio', desc: 'Stress test demand surges & port delays', icon: Boxes },
    { type: 'view', id: 'alerts', title: 'Operational Alert Center', desc: 'Critical stockout & anomaly alerts', icon: Bell },
  ];

  const filteredNav = query.trim()
    ? staticNav.filter(item => item.title.toLowerCase().includes(query.toLowerCase()) || item.desc.toLowerCase().includes(query.toLowerCase()))
    : staticNav;

  const handleResultClick = (item) => {
    if (item.type === 'sku') {
      onSelectSku?.(item.params?.store_id || 1, item.id);
    } else if (item.target_view) {
      onNavigate(item.target_view);
    } else if (item.type === 'view') {
      onNavigate(item.id);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '640px', padding: 0, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)'
        }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search SKUs, stores, suppliers, POs, alerts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              color: 'var(--text-primary)',
              fontWeight: 500
            }}
          />
          {isSearching && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Searching...</span>}
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Results Body */}
        <div style={{ padding: '8px', maxHeight: '420px', overflowY: 'auto' }}>
          {/* Live Neon Search Matches */}
          {liveResults.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', padding: '6px 12px' }}>
                Live Database Matches ({liveResults.length})
              </div>
              {liveResults.map((item, idx) => (
                <div
                  key={`live-${idx}`}
                  onClick={() => handleResultClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ padding: '6px', borderRadius: '6px', background: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' }}>
                    {item.type === 'sku' ? <Boxes size={16} /> :
                     item.type === 'store' ? <Store size={16} /> :
                     item.type === 'supplier' ? <Building2 size={16} /> :
                     item.type === 'purchase_order' ? <ShoppingCart size={16} /> :
                     <AlertTriangle size={16} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.subtitle}
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          )}

          {/* Quick Navigation Commands */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '6px 12px' }}>
              Platform Navigation
            </div>
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleResultClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    <Icon size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                  <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyboard Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <span>Press <b>ESC</b> to close</span>
          <span><b>Ctrl + K</b> anywhere to search</span>
        </div>
      </div>
    </div>
  );
}
