import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, TrendingUp, Boxes, CheckCircle2, ArrowRight, Lock, Mail } from 'lucide-react';
import api, { setAuthToken, setCurrentUser } from '../api';

export function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@supplyiq.io');
  const [password, setPassword] = useState('password123');
  const [demoUsers, setDemoUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch demo users for 1-click preset selector
    api.getDemoUsers()
      .then(users => setDemoUsers(users))
      .catch(() => {
        // Fallback demo users if offline
        setDemoUsers([
          { role: 'ADMIN', email: 'admin@supplyiq.io', name: 'Admin Director', desc: 'Full control' },
          { role: 'MANAGER', email: 'manager@supplyiq.io', name: 'Supply Chain Manager', desc: 'PO approvals & oversight' },
          { role: 'INVENTORY_MANAGER', email: 'inventory@supplyiq.io', name: 'Inventory Specialist', desc: 'Stock & receiving' },
          { role: 'ANALYST', email: 'analyst@supplyiq.io', name: 'Data Scientist', desc: 'Forecasts & simulations' },
          { role: 'VIEWER', email: 'viewer@supplyiq.io', name: 'Executive Viewer', desc: 'Read-only dashboards' },
        ]);
      });
  }, []);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(email, password);
      setAuthToken(res.access_token);
      setCurrentUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoUser = (userEmail) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      {/* Left Hero Panel */}
      <div style={{
        flex: '1 1 55%',
        background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '60px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }} className="mobile-hide">
        {/* Glow Orb Background */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.05) 70%, transparent 100%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }} />

        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2 }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#ffffff',
            fontSize: '22px',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)'
          }}>
            S
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Supply<span style={{ color: '#818cf8' }}>IQ</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em' }}>
              AI SUPPLY CHAIN CONTROL TOWER
            </div>
          </div>
        </div>

        {/* Center Pitch */}
        <div style={{ maxWidth: '540px', zIndex: 2, margin: '40px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '20px'
          }}>
            <Sparkles size={14} />
            <span>Autonomous Demand Intelligence & Restock Engine</span>
          </div>

          <h1 style={{
            fontSize: '38px',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            marginBottom: '16px'
          }}>
            Predict Stockouts.<br />
            Optimize Reorders.<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Eliminate Working Capital Waste.
            </span>
          </h1>

          <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '32px' }}>
            Powered by Neon PostgreSQL Serverless and LightGBM machine learning with verified <b>7.86% WAPE</b> across 3+ million historical retail sales transactions.
          </p>

          {/* Proof Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>3,000,888</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Sales Records Migrated</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>92.14%</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Out-of-Time Accuracy</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ fontSize: '12px', color: '#64748b', zIndex: 2 }}>
          Enterprise Edition v2.0 • PostgreSQL + LightGBM Engine
        </div>
      </div>

      {/* Right Login Panel */}
      <div style={{
        flex: '1 1 45%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px',
        maxWidth: '540px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Sign In to SupplyIQ
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Access the Executive Control Tower & Decision Engine
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-danger-subtle)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--color-danger)',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Work Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="input-control"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <span style={{ fontSize: '12px', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                Forgot?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="input-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '14px' }}
          >
            {isLoading ? 'Authorizing...' : 'Sign In to Control Tower'}
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* 1-Click Demo Account Presets */}
        <div style={{ marginTop: '36px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Quick Demo Accounts (1-Click Login)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {demoUsers.map((user) => (
              <div
                key={user.email}
                onClick={() => selectDemoUser(user.email)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: email === user.email ? 'var(--accent-primary-subtle)' : 'var(--bg-card)',
                  border: `1px solid ${email === user.email ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {user.email} • <span style={{ color: 'var(--accent-primary)' }}>{user.role}</span>
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectDemoUser(user.email);
                  }}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
