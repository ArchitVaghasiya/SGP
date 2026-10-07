import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  ShoppingCart,
  Building2,
  Store,
  Bell,
  BarChart3,
  SlidersHorizontal,
  FileSpreadsheet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Control Tower', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory Matrix', icon: Boxes },
  { id: 'forecasts', label: 'Demand Forecasts', icon: TrendingUp },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'suppliers', label: 'Supplier Hub', icon: Building2 },
  { id: 'stores', label: 'Store Network', icon: Store },
  { id: 'alerts', label: 'Alert Center', icon: Bell, hasBadge: true },
  { id: 'analytics', label: 'ABC / XYZ Analytics', icon: BarChart3 },
  { id: 'simulations', label: 'What-If Studio', icon: SlidersHorizontal },
  { id: 'transactions', label: 'Transaction Ledger', icon: FileSpreadsheet },
  { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, role: ['ADMIN', 'MANAGER'] },
];

export function Sidebar({
  activeView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  unreadAlertsCount = 0,
  currentUser,
  onOpenProfile,
  onLogout
}) {
  return (
    <aside style={{
      width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: isCollapsed ? '16px 12px' : '20px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        height: 'var(--topbar-height)',
        boxSizing: 'border-box'
      }}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#ffffff',
              fontSize: '16px',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
            }}>
              S
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                Supply<span style={{ color: 'var(--accent-primary)' }}>IQ</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                AI CONTROL TOWER
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#ffffff',
            fontSize: '16px'
          }}>
            S
          </div>
        )}

        <button
          className="btn btn-ghost btn-icon"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ padding: '4px', color: 'var(--text-muted)' }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{
        flex: 1,
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto'
      }}>
        {NAV_ITEMS.map((item) => {
          // Check role permissions if applicable
          if (item.role && (!currentUser || !item.role.includes(currentUser.role))) {
            return null;
          }

          const isActive = activeView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isCollapsed ? '10px 0' : '10px 14px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? 'var(--accent-primary-subtle)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                width: '100%',
                textAlign: 'left'
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} style={{ flexShrink: 0, color: isActive ? 'var(--accent-primary)' : 'inherit' }} />
              
              {!isCollapsed && (
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              )}

              {item.hasBadge && unreadAlertsCount > 0 && (
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: 'var(--color-danger)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  marginLeft: 'auto'
                }}>
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Area */}
      <div style={{
        padding: isCollapsed ? '12px 6px' : '14px 14px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-primary)'
      }}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', overflow: 'hidden' }}
              onClick={onOpenProfile}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                flexShrink: 0
              }}>
                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.full_name || 'Guest Operator'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {currentUser?.role || 'VIEWER'}
                </div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={onLogout}
              title="Sign Out"
              style={{ padding: '6px', color: 'var(--text-muted)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={onLogout}
              title="Sign Out"
              style={{ padding: '8px', color: 'var(--text-muted)' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
