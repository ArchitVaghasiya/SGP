import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = '580px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 20px', 
          borderBottom: '1px solid var(--border-subtle)' 
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Drawer({ isOpen, onClose, title, subtitle, children, width = '520px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-content" style={{ maxWidth: width }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          padding: '20px 24px', 
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{subtitle}</p>}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </>
  );
}

export function SkeletonLoader({ height = 24, width = '100%', count = 1, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width }}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton" 
          style={{ height: `${height}px`, width: '100%', ...style }} 
        />
      ))}
    </div>
  );
}

export function EmptyState({ title = 'No records found', message = 'No data matching your current filters.', actionLabel, onAction, icon: Icon }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '48px 24px', 
      textAlign: 'center',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border-card)',
      margin: '16px 0'
    }}>
      {Icon && (
        <div style={{ 
          padding: '12px', 
          borderRadius: '50%', 
          background: 'var(--bg-elevated)', 
          color: 'var(--text-muted)',
          marginBottom: '12px'
        }}>
          <Icon size={32} />
        </div>
      )}
      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: actionLabel ? '16px' : '0' }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, limit }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '12px 16px', 
      borderTop: '1px solid var(--border-subtle)',
      fontSize: '13px',
      color: 'var(--text-secondary)'
    }}>
      <span>
        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} entries
      </span>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button 
          className="btn btn-secondary btn-sm" 
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: 600 }}>
          Page {currentPage} of {totalPages}
        </span>
        <button 
          className="btn btn-secondary btn-sm" 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
