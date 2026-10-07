import React from 'react';
import { Modal } from './ui/ModalsAndLoaders';
import { User, Shield, Mail, Sun, Moon, LogOut } from 'lucide-react';
import { Badge } from './ui/StatCard';

export function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  theme,
  onToggleTheme,
  onLogout
}) {
  if (!currentUser) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile & Settings"
      maxWidth="480px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--accent-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '18px'
          }}>
            {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {currentUser.full_name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Mail size={12} /> {currentUser.email}
            </div>
          </div>
          <Badge variant="info">{currentUser.role}</Badge>
        </div>

        {/* Role Permissions Card */}
        <div className="card-solid">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield size={16} color="var(--accent-primary)" />
            <h4 className="title-md">Role & Authorizations</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {currentUser.role === 'ADMIN' ? 'Full administrative access across all stores, simulations, user management, and PO approvals.' :
             currentUser.role === 'MANAGER' ? 'Supply chain management access with authority to approve and transmit purchase orders.' :
             currentUser.role === 'INVENTORY_MANAGER' ? 'Inventory operations access for cycle count adjustments and warehouse receipts.' :
             currentUser.role === 'ANALYST' ? 'Data science and forecast modeling access with simulation sandbox authorization.' :
             'Read-only access to Executive Control Tower and summary dashboards.'}
          </p>
        </div>

        {/* Theme Setting */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Interface Theme</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Currently {theme === 'dark' ? 'Dark Command Center' : 'Clean Light Mode'}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Sign Out Button */}
        <button
          className="btn btn-danger"
          style={{ width: '100%', padding: '10px' }}
          onClick={() => {
            onClose();
            onLogout();
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </Modal>
  );
}
