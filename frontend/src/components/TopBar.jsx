import React from 'react';
import { Search, Bell, Sun, Moon, MapPin, RefreshCw, Sparkles, User, Shield } from 'lucide-react';

export function TopBar({
  selectedStore,
  onSelectStore,
  storesList = [],
  onOpenSearch,
  theme,
  onToggleTheme,
  unreadAlertsCount = 0,
  onOpenNotifications,
  currentUser,
  onOpenProfile,
  onRefreshData,
  isRefreshing
}) {
  return (
    <header style={{
      height: 'var(--topbar-height)',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Left: Store Selector & Global Search trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={16} style={{ color: 'var(--accent-primary)' }} />
          <select
            className="select-control"
            value={selectedStore || ''}
            onChange={(e) => onSelectStore(e.target.value ? Number(e.target.value) : null)}
            style={{ fontWeight: 600, minWidth: '170px' }}
          >
            <option value="">All Network Stores (54)</option>
            {storesList.map((s) => (
              <option key={s.store_id} value={s.store_id}>
                Store #{s.store_id} — {s.city} ({s.store_type})
              </option>
            ))}
          </select>
        </div>

        {/* Global Search Prompt / Shortcut */}
        <button
          onClick={onOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-card)',
            color: 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            cursor: 'pointer',
            minWidth: '220px'
          }}
          className="mobile-hide"
        >
          <Search size={14} />
          <span>Quick search SKUs, POs...</span>
          <kbd style={{
            marginLeft: 'auto',
            padding: '2px 6px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--text-secondary)'
          }}>
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Refresh, Theme, Alerts, User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* ML Status Indicator */}
        <div className="mobile-hide" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-success-subtle)',
          color: 'var(--color-success)',
          fontSize: '11px',
          fontWeight: 700
        }}>
          <span className="pulse-dot pulse-healthy" />
          <span>LightGBM Online (WAPE 7.86%)</span>
        </div>

        {/* Refresh button */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={onRefreshData}
          title="Refresh Data"
          disabled={isRefreshing}
          style={{ color: 'var(--text-secondary)' }}
        >
          <RefreshCw size={16} className={isRefreshing ? 'skeleton' : ''} />
        </button>

        {/* Theme Toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{ color: 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification Bell */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={onOpenNotifications}
          title="Operational Alerts"
          style={{ position: 'relative', color: 'var(--text-secondary)' }}
        >
          <Bell size={18} />
          {unreadAlertsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-danger)'
            }} />
          )}
        </button>

        {/* User Pill */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer'
          }}
          onClick={onOpenProfile}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--accent-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '11px'
          }}>
            {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }} className="mobile-hide">
            {currentUser?.full_name?.split(' ')[0] || 'User'}
          </span>
          <span className="badge badge-info" style={{ fontSize: '9px', padding: '1px 6px' }}>
            {currentUser?.role || 'VIEWER'}
          </span>
        </div>
      </div>
    </header>
  );
}
