import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  XCircle,
  Send,
  PackageCheck,
  Clock,
  Download,
  AlertTriangle,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Badge } from './ui/StatCard';
import { Modal, Drawer, SkeletonLoader, EmptyState, Pagination } from './ui/ModalsAndLoaders';
import api, { getCurrentUser } from '../api';

export function PurchaseOrdersView({
  selectedStore,
  onNavigate
}) {
  const [orders, setOrders] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedPO, setSelectedPO] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New PO Request Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    store_id: selectedStore || 1,
    product_id: 1,
    order_quantity: 100,
    unit_cost: 15.00
  });
  const [notification, setNotification] = useState(null);
  const [productsList, setProductsList] = useState([]);

  const currentUser = getCurrentUser();

  useEffect(() => {
    // Load product list for selection dropdown
    api.getInventoryList({ limit: 50 }).then(res => {
      if (res && res.items) {
        const uniqueProds = [];
        const map = new Set();
        res.items.forEach(it => {
          if (!map.has(it.product_id)) {
            map.add(it.product_id);
            uniqueProds.push({ product_id: it.product_id, name: it.product_name, sku: it.sku, unit_price: it.unit_price });
          }
        });
        setProductsList(uniqueProds);
      }
    }).catch(err => console.log('Products load info:', err));
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getPurchaseOrders({
        status: activeTab,
        store_id: selectedStore,
        limit,
        offset: (page - 1) * limit
      });
      setOrders(res.items || []);
      setTotal(res.total || 0);
      if (res.status_counts) setStatusCounts(res.status_counts);
    } catch (err) {
      setError(err.message || 'Failed to load purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedStore]);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, selectedStore, page]);

  const handleCreatePO = async (e, autoApprove = false) => {
    if (e) e.preventDefault();
    setActionLoading(true);
    const storeId = Number(createForm.store_id);
    const productId = Number(createForm.product_id);
    const orderQty = Number(createForm.order_quantity);
    const unitCost = Number(createForm.unit_cost) || 12.0;
    const totalCost = orderQty * unitCost;

    const prod = productsList.find(p => p.product_id === productId);
    const prodName = prod?.name || `Product #${productId}`;

    try {
      const res = await api.createPurchaseOrder({
        store_id: storeId,
        product_id: productId,
        order_quantity: orderQty,
        unit_cost: unitCost,
        auto_approve: autoApprove
      });

      const newPoItem = {
        po_id: res.po_id,
        po_number: res.po_number,
        store_id: storeId,
        store_name: `Store #${storeId}`,
        product_id: productId,
        product_name: prodName,
        category: prodName,
        supplier_id: 1,
        supplier_name: "Pichincha Foods Ltd.",
        order_quantity: orderQty,
        unit_cost: unitCost,
        total_cost: totalCost,
        current_stock: res.new_stock || 100,
        safety_buffer: 50,
        predicted_demand_7d: 75,
        status: res.status || (autoApprove ? "APPROVED" : "PENDING"),
        expected_delivery_date: "Standard (5d)",
        created_by: currentUser?.full_name || "Specialist",
        created_at: new Date().toISOString()
      };

      // Optimistic update
      setOrders(prev => [newPoItem, ...prev]);
      setStatusCounts(prev => ({
        ...prev,
        ALL: (prev.ALL || 0) + 1,
        [newPoItem.status]: (prev[newPoItem.status] || 0) + 1
      }));
      setTotal(prev => prev + 1);

      setNotification({
        message: res.message || (autoApprove ? `Purchase order ${res.po_number} created and approved! Stock credited to PostgreSQL DB.` : `Purchase order ${res.po_number} submitted!`),
        type: 'success'
      });
      setIsCreateModalOpen(false);
      setActiveTab(autoApprove ? 'APPROVED' : 'PENDING');
      
      setTimeout(fetchOrders, 800);
    } catch (err) {
      setNotification({
        message: `Failed to request purchase order: ${err.message}`,
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (poId) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.po_id === poId ? { ...o, status: 'APPROVED' } : o));
    setStatusCounts(prev => ({
      ...prev,
      PENDING: Math.max(0, (prev.PENDING || 1) - 1),
      APPROVED: (prev.APPROVED || 0) + 1
    }));
    setActionLoading(true);

    try {
      const res = await api.approvePurchaseOrder(poId);
      setNotification({
        message: res.message || 'Purchase order approved! Quantity reflected in inventory and critical risk resolved.',
        type: 'success'
      });
      if (selectedPO && selectedPO.po_id === poId) {
        setSelectedPO(prev => ({ ...prev, status: 'APPROVED' }));
      }
      setTimeout(fetchOrders, 800);
    } catch (err) {
      setNotification({
        message: `Approval error: ${err.message}`,
        type: 'error'
      });
      fetchOrders();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async (poId) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.po_id === poId ? { ...o, status: 'SENT' } : o));
    setStatusCounts(prev => ({
      ...prev,
      APPROVED: Math.max(0, (prev.APPROVED || 1) - 1),
      SENT: (prev.SENT || 0) + 1
    }));
    setActionLoading(true);

    try {
      const res = await api.sendPurchaseOrder(poId);
      setNotification({
        message: res.message || 'Order transmitted to supplier EDI gateway!',
        type: 'success'
      });
      if (selectedPO && selectedPO.po_id === poId) {
        setSelectedPO(prev => ({ ...prev, status: 'SENT' }));
      }
      setTimeout(fetchOrders, 800);
    } catch (err) {
      setNotification({ message: `Transmission error: ${err.message}`, type: 'error' });
      fetchOrders();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = async (poId) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.po_id === poId ? { ...o, status: 'RECEIVED' } : o));
    setStatusCounts(prev => ({
      ...prev,
      SENT: Math.max(0, (prev.SENT || 1) - 1),
      RECEIVED: (prev.RECEIVED || 0) + 1
    }));
    setActionLoading(true);

    try {
      const res = await api.receivePurchaseOrder(poId);
      setNotification({
        message: res.message || 'Inventory received and updated in database ledger!',
        type: 'success'
      });
      if (selectedPO && selectedPO.po_id === poId) {
        setSelectedPO(prev => ({ ...prev, status: 'RECEIVED' }));
      }
      setTimeout(fetchOrders, 800);
    } catch (err) {
      setNotification({ message: `Receiving error: ${err.message}`, type: 'error' });
      fetchOrders();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (poId) => {
    if (!window.confirm("Are you sure you want to cancel this purchase order?")) return;
    setOrders(prev => prev.map(o => o.po_id === poId ? { ...o, status: 'CANCELLED' } : o));
    setActionLoading(true);

    try {
      const res = await api.cancelPurchaseOrder(poId);
      setNotification({
        message: res.message || 'Purchase order cancelled.',
        type: 'info'
      });
      if (selectedPO && selectedPO.po_id === poId) {
        setSelectedPO(prev => ({ ...prev, status: 'CANCELLED' }));
      }
      setTimeout(fetchOrders, 800);
    } catch (err) {
      setNotification({ message: `Cancellation error: ${err.message}`, type: 'error' });
      fetchOrders();
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: 'ALL', label: 'All Orders', count: statusCounts.ALL || total },
    { id: 'PENDING', label: 'Pending Approval', count: statusCounts.PENDING || 0 },
    { id: 'APPROVED', label: 'Approved', count: statusCounts.APPROVED || 0 },
    { id: 'SENT', label: 'Transmitted (In Transit)', count: statusCounts.SENT || 0 },
    { id: 'RECEIVED', label: 'Received / Fulfilled', count: statusCounts.RECEIVED || 0 },
    { id: 'CANCELLED', label: 'Cancelled', count: statusCounts.CANCELLED || 0 },
  ];

  return (
    <div className="page-wrapper">
      {/* Dynamic Toast / Status Banner */}
      {notification && (
        <div style={{
          marginBottom: '20px',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : notification.type === 'error' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          border: `1px solid ${notification.type === 'success' ? 'var(--color-success)' : notification.type === 'error' ? 'var(--color-danger)' : 'var(--accent-primary)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {notification.type === 'success' ? (
              <CheckCircle2 size={18} color="var(--color-success)" />
            ) : notification.type === 'error' ? (
              <AlertTriangle size={18} color="var(--color-danger)" />
            ) : (
              <CheckCircle2 size={18} color="var(--accent-primary)" />
            )}
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
          <h1 className="title-xl">Procurement & Purchase Orders</h1>
          <p className="subtitle">
            {selectedStore ? `Store #${selectedStore} Procurement Workspace` : 'Network Procurement & Supplier Order Pipeline'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate?.('transactions')}>
            View Transaction Ledger
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={14} /> Request Restock / New PO
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent-primary)' : 'transparent'}`,
              background: 'transparent',
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              padding: '1px 6px',
              borderRadius: '10px',
              background: activeTab === tab.id ? 'var(--accent-primary-subtle)' : 'var(--bg-elevated)',
              fontSize: '11px',
              fontWeight: 700
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="card-solid" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '24px' }}>
            <SkeletonLoader count={6} height={40} />
          </div>
        ) : error ? (
          <EmptyState
            title="Unable to load purchase orders"
            message={error}
            actionLabel="Retry"
            onAction={fetchOrders}
            icon={AlertTriangle}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            title={`No ${activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} purchase orders`}
            message="No orders matching the current filter."
            icon={ShoppingCart}
          />
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Supplier</th>
                    <th>Store</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Total Cost</th>
                    <th>Status</th>
                    <th>Expected Delivery</th>
                    <th style={{ textAlign: 'right' }}>Workflow Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((po) => (
                    <tr
                      key={po.po_id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedPO(po);
                        setIsDetailOpen(true);
                      }}
                    >
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {po.po_number}
                      </td>
                      <td style={{ fontWeight: 600 }}>{po.supplier_name}</td>
                      <td>Store #{po.store_id}</td>
                      <td>{po.product_name}</td>
                      <td style={{ fontWeight: 700 }}>{po.order_quantity} units</td>
                      <td style={{ fontWeight: 700 }}>${po.total_cost?.toLocaleString()}</td>
                      <td>
                        <Badge variant={po.status}>{po.status}</Badge>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {po.expected_delivery_date || 'Standard (5d)'}
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {po.status === 'PENDING' && (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={actionLoading}
                              onClick={() => handleApprove(po.po_id)}
                              title="Approve Purchase Order"
                            >
                              <Check size={14} /> Approve
                            </button>
                          )}

                          {po.status === 'APPROVED' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={actionLoading}
                              onClick={() => handleSend(po.po_id)}
                              title="Transmit to Supplier"
                            >
                              <Send size={14} /> Send EDI
                            </button>
                          )}

                          {po.status === 'SENT' && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ background: 'var(--color-success)' }}
                              disabled={actionLoading}
                              onClick={() => handleReceive(po.po_id)}
                              title="Confirm Goods Inward Reception"
                            >
                              <PackageCheck size={14} /> Receive Goods
                            </button>
                          )}

                          {['PENDING', 'APPROVED'].includes(po.status) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-danger)' }}
                              disabled={actionLoading}
                              onClick={() => handleCancel(po.po_id)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
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

      {/* Detailed PO Drawer */}
      {selectedPO && (
        <Drawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Purchase Order ${selectedPO.po_number}`}
          subtitle={`Created by ${selectedPO.created_by} • Store #${selectedPO.store_id}`}
          width="540px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Status & Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={selectedPO.status}>{selectedPO.status}</Badge>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Value</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ${selectedPO.total_cost?.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Line Items Details */}
            <div className="card-solid">
              <h4 className="title-md" style={{ marginBottom: '12px' }}>Line Items</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>{selectedPO.product_name}</span>
                <span>{selectedPO.order_quantity} units @ ${selectedPO.unit_cost?.toFixed(2)}/unit</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Supplier: {selectedPO.supplier_name}</span>
                <span>Delivery: {selectedPO.expected_delivery_date || '5 Business Days'}</span>
              </div>
            </div>

            {/* Procurement Lifecycle State Machine Visualizer */}
            <div className="card-solid">
              <h4 className="title-md" style={{ marginBottom: '14px' }}>Order Progression Timeline</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="var(--color-success)" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>1. PO Generated (AI Engine / Specialist)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shortfall evaluation triggered order generation</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {['APPROVED', 'SENT', 'RECEIVED'].includes(selectedPO.status) ? (
                    <CheckCircle2 size={18} color="var(--color-success)" />
                  ) : (
                    <Clock size={18} color="var(--text-muted)" />
                  )}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>2. Management Authorization</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Budget clearance and vendor quota confirmation</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {['SENT', 'RECEIVED'].includes(selectedPO.status) ? (
                    <CheckCircle2 size={18} color="var(--color-success)" />
                  ) : (
                    <Clock size={18} color="var(--text-muted)" />
                  )}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>3. Supplier Transmission (EDI)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>In-transit dispatch tracking</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {selectedPO.status === 'RECEIVED' ? (
                    <CheckCircle2 size={18} color="var(--color-success)" />
                  ) : (
                    <Clock size={18} color="var(--text-muted)" />
                  )}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>4. Goods Received & Ledger Updated</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stock increment committed to inventory ledger</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedPO.status === 'PENDING' && (
                <button
                  className="btn btn-primary"
                  disabled={actionLoading}
                  onClick={() => handleApprove(selectedPO.po_id)}
                >
                  <Check size={16} /> Authorize Order Approval
                </button>
              )}

              {selectedPO.status === 'APPROVED' && (
                <button
                  className="btn btn-primary"
                  disabled={actionLoading}
                  onClick={() => handleSend(selectedPO.po_id)}
                >
                  <Send size={16} /> Send to Supplier EDI Gateway
                </button>
              )}

              {selectedPO.status === 'SENT' && (
                <button
                  className="btn btn-primary"
                  style={{ background: 'var(--color-success)' }}
                  disabled={actionLoading}
                  onClick={() => handleReceive(selectedPO.po_id)}
                >
                  <PackageCheck size={16} /> Receive Goods & Update Inventory Ledger
                </button>
              )}
            </div>
          </div>
        </Drawer>
      )}

      {/* New Purchase Order / Request Restock Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Submit Restock / Purchase Order Request"
          subtitle="Generate a new procurement order to replenish store inventory"
        >
          <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Target Store
              </label>
              <select
                className="select-control"
                style={{ width: '100%' }}
                value={createForm.store_id}
                onChange={(e) => setCreateForm(prev => ({ ...prev, store_id: Number(e.target.value) }))}
                required
              >
                {[...Array(54)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Store #{i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Product SKU / Family
              </label>
              <select
                className="select-control"
                style={{ width: '100%' }}
                value={createForm.product_id}
                onChange={(e) => {
                  const pid = Number(e.target.value);
                  const prod = productsList.find(p => p.product_id === pid);
                  setCreateForm(prev => ({
                    ...prev,
                    product_id: pid,
                    unit_cost: prod?.unit_price || 15.00
                  }));
                }}
                required
              >
                {productsList.length > 0 ? (
                  productsList.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.sku} - {p.name}
                    </option>
                  ))
                ) : (
                  [...Array(33)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      SKU-{String(i + 1).padStart(3, '0')} - Product #{i + 1}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Order Quantity (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="input-control"
                  style={{ width: '100%' }}
                  value={createForm.order_quantity}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, order_quantity: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Unit Cost ($)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.01"
                  className="input-control"
                  style={{ width: '100%' }}
                  value={createForm.unit_cost}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, unit_cost: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Calculated Total Value:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                ${((Number(createForm.order_quantity) || 0) * (Number(createForm.unit_cost) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                  padding: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
                disabled={actionLoading}
                onClick={(e) => handleCreatePO(e, true)}
              >
                <Zap size={16} />
                {actionLoading ? 'Processing...' : '⚡ Create & Instant Approve (Credit Stock to DB)'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={actionLoading}
                  onClick={(e) => handleCreatePO(e, false)}
                >
                  <ShoppingCart size={15} />
                  Submit Request (Pending Approval)
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
