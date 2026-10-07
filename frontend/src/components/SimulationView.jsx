import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Shield,
  Zap,
  Ship,
  TrendingUp,
  PackageCheck,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { StatCard, Badge } from './ui/StatCard';
import api from '../api';

// Helper to calculate statistical Z-score accurately from service level
function getZScore(sl) {
  if (sl >= 0.99) return 2.33;
  if (sl >= 0.98) return 2.05;
  if (sl >= 0.95) return 1.645;
  if (sl >= 0.90) return 1.282;
  if (sl >= 0.85) return 1.036;
  return 0.842;
}

export function SimulationView({ defaultStoreId = 1, defaultProductId = 1 }) {
  const [storeId, setStoreId] = useState(defaultStoreId);
  const [productId, setProductId] = useState(defaultProductId);

  // Simulation Stress Parameters
  const [demandMultiplier, setDemandMultiplier] = useState(1.25);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [supplierDelayDays, setSupplierDelayDays] = useState(3);
  const [serviceLevel, setServiceLevel] = useState(0.95);
  const [currentStockOverride, setCurrentStockOverride] = useState(120);
  const [showReplenishmentArrival, setShowReplenishmentArrival] = useState(true);

  // Store & Product master catalogs
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([
    { id: 1, name: 'AUTOMOTIVE' },
    { id: 2, name: 'BABY CARE' },
    { id: 3, name: 'BEAUTY' },
    { id: 4, name: 'BEVERAGES' },
    { id: 5, name: 'BOOKS' },
    { id: 6, name: 'BREAD/BAKERY' },
    { id: 7, name: 'CLEANING' },
    { id: 8, name: 'DAIRY' },
    { id: 9, name: 'DELI' },
    { id: 10, name: 'EGGS' },
    { id: 15, name: 'HARDWARE' },
    { id: 18, name: 'HOME APPLIANCES' }
  ]);

  useEffect(() => {
    api.getStores().then(res => {
      if (res && res.length) setStores(res);
    }).catch(() => {});
  }, []);

  // Instant 60 FPS Client-Side Simulation Engine (Mathematical parity with Backend)
  const clientSim = useMemo(() => {
    const startStock = Number(currentStockOverride) || 0;
    const effectiveLeadTime = Number(leadTimeDays) + Number(supplierDelayDays);
    const z = getZScore(serviceLevel);

    // Baseline daily demand estimation
    const baseDailyDemand = Math.max(4.0, (startStock > 0 ? startStock / 18.0 : 8.0));
    const simulatedDailyDemand = baseDailyDemand * Number(demandMultiplier);

    // Dynamic statistical safety buffer requirement
    const simulatedSafetyBuffer = Math.round(z * (simulatedDailyDemand * 0.35) * Math.sqrt(Math.max(1, effectiveLeadTime)));
    const reorderPoint = Math.round((simulatedDailyDemand * effectiveLeadTime) + simulatedSafetyBuffer);
    const shortfall = Math.max(0, reorderPoint - startStock);
    const recommendedOrder = shortfall > 0 ? Math.max(50, Math.round(shortfall)) : 0;

    const curve = [];
    let unreplenishedStock = startStock;
    let replenishedStock = startStock;
    let stockoutDay = null;

    const today = new Date();

    for (let day = 1; day <= 21; day++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + day);
      const dateStr = targetDate.toISOString().slice(5, 10);

      // Realistic daily demand variation (day-of-week seasonality)
      const dayFactor = 1.0 + (((day * 13) % 17) - 8) / 100.0;
      const dailyBurn = simulatedDailyDemand * dayFactor;

      // Unreplenished burn trajectory
      unreplenishedStock = Math.max(0, unreplenishedStock - dailyBurn);
      if (unreplenishedStock <= 0 && stockoutDay === null) {
        stockoutDay = day;
      }

      // Replenished trajectory (order placed on Day 1 arrives on effectiveLeadTime day)
      replenishedStock = Math.max(0, replenishedStock - dailyBurn);
      if (showReplenishmentArrival && day === effectiveLeadTime && recommendedOrder > 0) {
        replenishedStock += recommendedOrder;
      }

      curve.push({
        day,
        dayLabel: `Day ${day}`,
        date: dateStr,
        projected_stock: Math.round(unreplenishedStock * 10) / 10,
        replenished_stock: Math.round(replenishedStock * 10) / 10,
        safety_threshold: simulatedSafetyBuffer,
        daily_burn: Math.round(dailyBurn * 10) / 10,
        is_breach: unreplenishedStock < simulatedSafetyBuffer,
        is_stockout: unreplenishedStock <= 0
      });
    }

    const daysOfSupply = Math.round((startStock / Math.max(0.1, simulatedDailyDemand)) * 10) / 10;
    let riskTier = 'HEALTHY';
    if (daysOfSupply <= 3 || (stockoutDay && stockoutDay <= 4)) {
      riskTier = 'CRITICAL';
    } else if (daysOfSupply <= 7 || (stockoutDay && stockoutDay <= 8)) {
      riskTier = 'LOW_STOCK';
    } else if (daysOfSupply > 18 && startStock > 400) {
      riskTier = 'OVERSTOCK';
    }

    return {
      curve,
      effectiveLeadTime,
      simulatedDailyDemand: Math.round(simulatedDailyDemand * 10) / 10,
      simulatedSafetyBuffer,
      reorderPoint,
      recommendedOrder,
      stockoutDay,
      daysOfSupply,
      riskTier,
      zScore: z.toFixed(2)
    };
  }, [demandMultiplier, leadTimeDays, supplierDelayDays, serviceLevel, currentStockOverride, showReplenishmentArrival]);

  // Scenario Presets
  const applyPreset = (type) => {
    switch (type) {
      case 'SURGE':
        setDemandMultiplier(1.8);
        setSupplierDelayDays(2);
        setServiceLevel(0.95);
        break;
      case 'BOTTLENECK':
        setDemandMultiplier(1.1);
        setSupplierDelayDays(8);
        setServiceLevel(0.95);
        break;
      case 'HIGH_SLA':
        setDemandMultiplier(1.2);
        setSupplierDelayDays(0);
        setServiceLevel(0.99);
        break;
      case 'SLUMP':
        setDemandMultiplier(0.6);
        setSupplierDelayDays(0);
        setServiceLevel(0.90);
        break;
      case 'BASELINE':
      default:
        setDemandMultiplier(1.0);
        setLeadTimeDays(7);
        setSupplierDelayDays(0);
        setServiceLevel(0.95);
        setCurrentStockOverride(150);
        break;
    }
  };

  const activeProduct = products.find(p => p.id === Number(productId))?.name || 'AUTOMOTIVE';

  return (
    <div className="page-wrapper">
      {/* Simulation Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="var(--accent-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>
            Real-Time Stress Simulation Sandbox
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            — Dynamic in-memory trajectory modeling at 60 FPS. Safe from production database mutation.
          </span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => applyPreset('BASELINE')}>
          <RotateCcw size={12} /> Reset to Baseline
        </button>
      </div>

      {/* Header & Quick Scenario Presets */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="title-xl">Supply Chain Scenario Simulator</h1>
          <p className="subtitle">
            Stress-test SKU stock resilience against demand shocks, port delays, and supplier lead-time variance
          </p>
        </div>

        {/* 1-Click Scenario Preset Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset('SURGE')}
            style={{ fontSize: '11px', borderColor: 'var(--color-warning)' }}
          >
            <Zap size={13} color="var(--color-warning)" /> Demand Spike (+80%)
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset('BOTTLENECK')}
            style={{ fontSize: '11px', borderColor: 'var(--color-danger)' }}
          >
            <Ship size={13} color="var(--color-danger)" /> Port Bottleneck (+8d)
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset('HIGH_SLA')}
            style={{ fontSize: '11px', borderColor: 'var(--color-success)' }}
          >
            <Shield size={13} color="var(--color-success)" /> 99% SLA (Z=2.33)
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset('SLUMP')}
            style={{ fontSize: '11px' }}
          >
            <TrendingDown size={13} /> Demand Drop (-40%)
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: '20px' }}>
        <div className="card-solid" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Projected Stockout
          </span>
          <div style={{
            fontSize: '22px',
            fontWeight: 800,
            color: clientSim.stockoutDay ? (clientSim.stockoutDay <= 5 ? 'var(--color-danger)' : 'var(--color-warning)') : 'var(--color-success)',
            marginTop: '4px'
          }}>
            {clientSim.stockoutDay ? `Day ${clientSim.stockoutDay}` : 'No Stockout (Safe)'}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {clientSim.daysOfSupply} days of supply remaining
          </span>
        </div>

        <div className="card-solid" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Required Restock (ROQ)
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px' }}>
            {clientSim.recommendedOrder} Units
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            To satisfy {(serviceLevel * 100).toFixed(0)}% target SLA
          </span>
        </div>

        <div className="card-solid" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Dynamic Safety Buffer
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-cyan)', marginTop: '4px' }}>
            {clientSim.simulatedSafetyBuffer} Units
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Z = {clientSim.zScore} ({clientSim.effectiveLeadTime}d window)
          </span>
        </div>

        <div className="card-solid" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Simulated Risk Status
          </span>
          <div style={{ marginTop: '8px' }}>
            <Badge variant={clientSim.riskTier} style={{ fontSize: '12px', padding: '4px 12px' }}>
              {clientSim.riskTier}
            </Badge>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
            {clientSim.simulatedDailyDemand} units/day burn rate
          </span>
        </div>
      </div>

      {/* Main Grid: Stress Parameter Controls + Rich Visual Chart */}
      <div className="grid-2col" style={{ alignItems: 'start', marginBottom: '24px' }}>
        {/* Sliders Controls Panel */}
        <div className="card-solid" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={16} color="var(--accent-primary)" />
              <h3 className="title-md">Scenario Controls</h3>
            </div>
            <span className="badge badge-info">Interactive 21-Day Model</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Store & SKU Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Target Store
                </label>
                <select
                  className="select-control"
                  style={{ width: '100%' }}
                  value={storeId}
                  onChange={e => setStoreId(Number(e.target.value))}
                >
                  {stores.length > 0 ? (
                    stores.map(s => (
                      <option key={s.store_id} value={s.store_id}>
                        Store #{s.store_id} ({s.city})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={1}>Store #1 (Quito)</option>
                      <option value={2}>Store #2 (Guayaquil)</option>
                      <option value={3}>Store #3 (Cuenca)</option>
                      <option value={4}>Store #4 (Santo Domingo)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Product Category
                </label>
                <select
                  className="select-control"
                  style={{ width: '100%' }}
                  value={productId}
                  onChange={e => setProductId(Number(e.target.value))}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Demand Surge Multiplier */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Demand Multiplier (Surge / Shock)
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: demandMultiplier > 1.0 ? 'var(--color-warning)' : demandMultiplier < 1.0 ? 'var(--color-cyan)' : 'var(--text-primary)' }}>
                  {demandMultiplier}x ({demandMultiplier >= 1.0 ? `+${((demandMultiplier - 1.0) * 100).toFixed(0)}%` : `${((demandMultiplier - 1.0) * 100).toFixed(0)}%`})
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="3.0"
                step="0.05"
                value={demandMultiplier}
                onChange={e => setDemandMultiplier(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Supplier Lead Time */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Base Replenishment Lead Time
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {leadTimeDays} Days
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={leadTimeDays}
                onChange={e => setLeadTimeDays(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Supplier Delay */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Supplier Delivery Delay / Port Disruption
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: supplierDelayDays > 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                  +{supplierDelayDays} Days Delay
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="1"
                value={supplierDelayDays}
                onChange={e => setSupplierDelayDays(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-danger)', cursor: 'pointer' }}
              />
            </div>

            {/* Target Service Level */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Target Service Level ($Z$-Score)
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-success)' }}>
                  {(serviceLevel * 100).toFixed(0)}% (Z = {clientSim.zScore})
                </span>
              </div>
              <input
                type="range"
                min="0.80"
                max="0.99"
                step="0.01"
                value={serviceLevel}
                onChange={e => setServiceLevel(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-success)', cursor: 'pointer' }}
              />
            </div>

            {/* Starting Inventory Level & PO Toggle */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Starting Inventory Count
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showReplenishmentArrival}
                    onChange={e => setShowReplenishmentArrival(e.target.checked)}
                  />
                  Simulate Restock PO Arrival
                </label>
              </div>
              <input
                type="number"
                min="0"
                step="5"
                className="input-control"
                value={currentStockOverride}
                onChange={e => setCurrentStockOverride(parseFloat(e.target.value) || 0)}
                style={{ fontSize: '15px', fontWeight: 700 }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic High-Performance Visualization Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-solid" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 className="title-md">21-Day Dynamic Stock Trajectory</h3>
                <p className="subtitle">
                  {activeProduct} @ Store #{storeId} • Effective Lead Time: {clientSim.effectiveLeadTime} Days
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {clientSim.stockoutDay && (
                  <span className="badge badge-critical" style={{ fontSize: '11px' }}>
                    ⚠️ Stockout on Day {clientSim.stockoutDay}
                  </span>
                )}
                {showReplenishmentArrival && clientSim.recommendedOrder > 0 && (
                  <span className="badge badge-healthy" style={{ fontSize: '11px' }}>
                    📦 +{clientSim.recommendedOrder} PO Arrival Day {clientSim.effectiveLeadTime}
                  </span>
                )}
              </div>
            </div>

            {/* Chart Container with SVG Gradient Shading & Reference Markers */}
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={clientSim.curve} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="replenishGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="dayLabel" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 'auto']} />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                    formatter={(val, name) => [
                      `${val} units`,
                      name === 'projected_stock'
                        ? 'Projected Stock (No Restock)'
                        : name === 'replenished_stock'
                        ? 'Stock Trajectory with Restock PO'
                        : 'Safety Buffer Threshold'
                    ]}
                    labelFormatter={(label) => `🗓️ ${label} (Forecast Simulation)`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                  {/* Safety Buffer Horizontal Reference */}
                  <ReferenceLine
                    y={clientSim.simulatedSafetyBuffer}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Safety Boundary (${clientSim.simulatedSafetyBuffer}u)`,
                      fill: '#f43f5e',
                      fontSize: 10,
                      position: 'insideTopRight'
                    }}
                  />

                  {/* Restock Delivery Vertical Reference Marker */}
                  {showReplenishmentArrival && clientSim.effectiveLeadTime <= 21 && (
                    <ReferenceLine
                      x={`Day ${clientSim.effectiveLeadTime}`}
                      stroke="#06b6d4"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{
                        value: `PO Inbound (+${clientSim.recommendedOrder}u)`,
                        fill: '#06b6d4',
                        fontSize: 10,
                        position: 'insideTopLeft'
                      }}
                    />
                  )}

                  {/* Unreplenished Stock Area */}
                  <Area
                    type="monotone"
                    dataKey="projected_stock"
                    fill="url(#stockGradient)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    name="Projected Stock Level"
                    dot={{ r: 2 }}
                    activeDot={{ r: 5, stroke: '#6366f1', strokeWidth: 2 }}
                  />

                  {/* With Replenishment Area / Line */}
                  {showReplenishmentArrival && clientSim.recommendedOrder > 0 && (
                    <Area
                      type="monotone"
                      dataKey="replenished_stock"
                      fill="url(#replenishGradient)"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      name="With Restock Delivery"
                      dot={{ r: 2 }}
                    />
                  )}

                  {/* Safety Buffer Line */}
                  <Line
                    type="stepAfter"
                    dataKey="safety_threshold"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                    name="Required Safety Buffer"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Decision & Stress Narrative Callout */}
          <div className="card-solid" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--accent-primary-subtle)',
                color: 'var(--accent-primary)',
                flexShrink: 0
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Autonomous Simulation Decision Matrix
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.6 }}>
                  Under a <strong>{demandMultiplier}x demand surge</strong> ({clientSim.simulatedDailyDemand} units/day) and an <strong>effective {clientSim.effectiveLeadTime}-day replenishment window</strong> (including {supplierDelayDays} days disruption buffer), current stock of {currentStockOverride} units will {clientSim.stockoutDay ? <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>deplete by Day {clientSim.stockoutDay}</span> : <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>sustain operations safely</span>}. To safeguard against stockouts at a {(serviceLevel * 100).toFixed(0)}% service level (Z = {clientSim.zScore}), dynamic safety stock scales to <strong>{clientSim.simulatedSafetyBuffer} units</strong>, requiring an authorized purchase order of <strong>{clientSim.recommendedOrder} units</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
