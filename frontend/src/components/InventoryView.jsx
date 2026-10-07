import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowUpDown,
  ChevronRight,
  Sliders,
  Zap,
  CheckCircle2,
  PackagePlus
} from 'lucide-react';
import { Badge } from './ui/StatCard';
import { SkeletonLoader, EmptyState, Pagination } from './ui/ModalsAndLoaders';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { QuickRestockModal } from './QuickRestockModal';
import api from '../api';

export function InventoryView({
  selectedStore,
  onSelectSku,
  onOpenAdjustment
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 25;

  const [categories, setCategories] = useState([]);
  const [adjustmentTarget, setAdjustmentTarget] = useState(null);
  const [quickRestockTarget, setQuickRestockTarget] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getInventoryList({
        store_id: selectedStore,
        status: statusFilter,
        category: categoryFilter,
        search,
        limit,
        offset: (page - 1) * limit
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
      if (res.categories) setCategories(res.categories);
    } catch (err) {
      setError(err.message || 'Failed to load inventory records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [selectedStore, statusFilter, categoryFilter, search]);

  useEffect(() => {
    fetchInventory();
  }, [selectedStore, statusFilter, categoryFilter, search, page]);

  const handleExportCSV = () => {
    if (!items.length) return;
    const headers = ["SKU", "Product", "Store", "Current Stock", "Safety Buffer", "Lead Time Days", "Unit Price", "Total Value", "Risk"];
    const rows = items.map(i => [
      i.sku,
      `"${i.product_name}"`,
      i.store_id,
      i.current_stock,
      i.safety_buffer,
      i.lead_time_days,
      i.unit_price,
      i.inventory_value,
      i.risk_level
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `supplyiq_inventory_${selectedStore || 'network'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusPills = [
    { id: 'ALL', label: 'All Inventory' },
    { id: 'CRITICAL', label: 'Critical' },
    { id: 'LOW_STOCK', label: 'Low Stock' },
    { id: 'HEALTHY', label: 'Healthy' },
    { id: 'STOCKOUT', label: 'Stockouts' },
    { id: 'OVERSTOCK', label: 'Overstock' }
  ];

  const handleRestockSuccess = (result) => {
    // Optimistically update item in table
    setItems(prevItems => prevItems.map(it => {
      if (it.store_id === result.store_id && it.product_id === result.product_id) {
        const updatedStock = result.newStock;
        const sBuff = it.safety_buffer;
        let newStatus = 'HEALTHY';
        if (updatedStock <= 0) newStatus = 'STOCKOUT';
        else if (updatedStock < sBuff) newStatus = 'CRITICAL';
        else if (updatedStock < sBuff * 1.5) newStatus = 'LOW_STOCK';
        
        return {
          ...it,
          current_stock: updatedStock,
          status: newStatus,
          risk_level: newStatus,
          inventory_value: Math.round(updatedStock * it.unit_price)
        };
      }
      return it;
    }));

    setNotification({
      message: result.message || `Restock order completed! Stock updated to ${result.newStock} units in PostgreSQL database.`,
      type: 'success'
    });

    // Background sync
    setTimeout(() => {
      fetchInventory();
    }, 1200);
  };

  return (
    <div className="page-wrapper">
      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          marginBottom: '18px',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${notification.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color={notification.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {notification.message}
            </span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setNotification(null)}
            style={{ padding: '2px 8px', fontSize: '12px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-xl">Inventory Intelligence Matrix</h1>
          <p className="subtitle">
            {selectedStore ? `Store #${selectedStore} Stock Ledger` : 'Network-wide SKU Catalog (1,782 records)'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setAdjustmentTarget({ store_id: selectedStore || 1, product_id: 1 })}>
            <Plus size={14} /> Adjust Stock
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-solid" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <input
              type="text"
              placeholder="Search by SKU or product family..."
              className="input-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="select-control"
              style={{ width: '100%' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories (33)</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Health Status Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {statusPills.map(pill => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${statusFilter === pill.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                background: statusFilter === pill.id ? 'var(--accent-primary-subtle)' : 'var(--bg-input)',
                color: statusFilter === pill.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="card-solid" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '24px' }}>
            <SkeletonLoader count={8} height={40} />
          </div>
        ) : error ? (
          <EmptyState
            title="Failed to load inventory"
            message={error}
            actionLabel="Retry"
            onAction={fetchInventory}
            icon={AlertTriangle}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No inventory records found"
            message="No products match the selected filters."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearch('');
              setStatusFilter('ALL');
              setCategoryFilter('ALL');
            }}
          />
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Family</th>
                    <th>Store</th>
                    <th>Current Stock</th>
                    <th>Safety Buffer</th>
                    <th>Lead Time</th>
                    <th>Unit Price</th>
                    <th>Inventory Value</th>
                    <th>Risk Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isCritical = ['CRITICAL', 'LOW_STOCK', 'STOCKOUT'].includes(item.risk_level || item.status);
                    return (
                      <tr
                        key={`${item.store_id}-${item.product_id}`}
                        style={{
                          cursor: 'pointer',
                          background: item.risk_level === 'CRITICAL' ? 'rgba(244, 63, 94, 0.04)' : undefined
                        }}
                        onClick={() => onSelectSku?.(item.store_id, item.product_id)}
                      >
                        <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                          {item.sku}
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                        <td>Store #{item.store_id}</td>
                        <td style={{ fontWeight: 700, color: isCritical ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                          {item.current_stock}
                        </td>
                        <td>{item.safety_buffer}</td>
                        <td>{item.lead_time_days} days</td>
                        <td>${item.unit_price?.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>${item.inventory_value?.toLocaleString()}</td>
                        <td>
                          <Badge variant={item.risk_level || item.status || 'HEALTHY'}>
                            {item.risk_level || item.status || 'HEALTHY'}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {/* Direct 1-Click Quick Restock Button */}
                            <button
                              className="btn btn-sm"
                              style={{
                                background: isCritical ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'var(--accent-primary-subtle)',
                                color: isCritical ? '#fff' : 'var(--accent-primary)',
                                border: isCritical ? 'none' : '1px solid var(--accent-primary)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-sm)',
                                boxShadow: isCritical ? '0 2px 8px rgba(244, 63, 94, 0.3)' : 'none'
                              }}
                              onClick={() => setQuickRestockTarget(item)}
                              title="Request Restock & Generate PO"
                            >
                              <Zap size={13} />
                              {isCritical ? 'Restock' : 'Order PO'}
                            </button>

                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setAdjustmentTarget(item)}
                            >
                              Adjust
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              totalItems={total}
              limit={limit}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {adjustmentTarget && (
        <StockAdjustmentModal
          isOpen={Boolean(adjustmentTarget)}
          onClose={() => setAdjustmentTarget(null)}
          storeId={adjustmentTarget.store_id || selectedStore || 1}
          productId={adjustmentTarget.product_id || 1}
          skuName={adjustmentTarget.product_name}
          currentStock={adjustmentTarget.current_stock || 0}
          onSuccess={() => {
            setAdjustmentTarget(null);
            fetchInventory();
          }}
        />
      )}

      {/* 1-Click Direct Quick Restock Modal */}
      {quickRestockTarget && (
        <QuickRestockModal
          isOpen={Boolean(quickRestockTarget)}
          onClose={() => setQuickRestockTarget(null)}
          item={quickRestockTarget}
          onSuccess={handleRestockSuccess}
        />
      )}
    </div>
  );
}
