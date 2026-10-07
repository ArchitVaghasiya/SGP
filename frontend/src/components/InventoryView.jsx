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
  Sliders
} from 'lucide-react';
import { Badge } from './ui/StatCard';
import { SkeletonLoader, EmptyState, Pagination } from './ui/ModalsAndLoaders';
import { StockAdjustmentModal } from './StockAdjustmentModal';
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

  return (
    <div className="page-wrapper">
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
                  {items.map((item) => (
                    <tr
                      key={`${item.store_id}-${item.product_id}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelectSku?.(item.store_id, item.product_id)}
                    >
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {item.sku}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                      <td>Store #{item.store_id}</td>
                      <td style={{ fontWeight: 700 }}>{item.current_stock}</td>
                      <td>{item.safety_buffer}</td>
                      <td>{item.lead_time_days} days</td>
                      <td>${item.unit_price?.toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>${item.inventory_value?.toLocaleString()}</td>
                      <td>
                        <Badge variant={item.risk_level || item.status || 'HEALTHY'}>
                          {item.risk_level || item.status || 'HEALTHY'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdjustmentTarget(item);
                          }}
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
}
