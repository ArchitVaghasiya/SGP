import React from 'react';

export function Badge({ variant = 'info', children, className = '' }) {
  const text = children || variant || 'INFO';
  const v = (variant || 'info').toString().toLowerCase().replace(/_/g, '-');
  const variantClass = `badge-${v}`;
  return (
    <span className={`badge ${variantClass} ${className}`}>
      {text}
    </span>
  );
}

export function StatCard({ title, value, change, changeType = 'positive', subtitle, icon: Icon, onClick, tooltip }) {
  return (
    <div 
      className={`card-solid ${onClick ? 'card-interactive' : ''}`}
      onClick={onClick}
      title={tooltip}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {Icon && (
          <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' }}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {change && (
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            color: changeType === 'positive' ? 'var(--color-success)' : changeType === 'danger' ? 'var(--color-danger)' : 'var(--text-muted)' 
          }}>
            {change}
          </span>
        )}
      </div>
      {subtitle && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
