import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KPIDashboard } from './components/KPIDashboard';
import { InventoryMatrix } from './components/InventoryMatrix';
import { ForecastVisualizer } from './components/ForecastVisualizer';
import { PurchaseOrdersManager } from './components/PurchaseOrdersManager';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { RestockEvaluationModal } from './components/RestockEvaluationModal';

import {
  checkBackendHealth,
  getStores,
  getProducts,
  getInventory,
  get7DayForecast,
  evaluateRestock,
  updateStock,
  getPurchaseOrders,
  updatePOStatus
} from './api';

export default function App() {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState(1);
  const [inventory, setInventory] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(1);
  const [forecast, setForecast] = useState(null);
  
  const [theme, setTheme] = useState('dark');
  const [backendStatus, setBackendStatus] = useState({ isOnline: false });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [adjustModalProduct, setAdjustModalProduct] = useState(null);

  // Sync theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load stores, products, and check backend health on mount
  useEffect(() => {
    async function init() {
      const health = await checkBackendHealth();
      setBackendStatus(health);

      const storeList = await getStores();
      setStores(storeList);

      const prodList = await getProducts();
      setProducts(prodList);
    }
    init();
  }, []);

  // Fetch store inventory, purchase orders, and default forecast when store changes
  useEffect(() => {
    async function loadStoreData() {
      const invData = await getInventory(selectedStore);
      setInventory(invData);

      const poData = await getPurchaseOrders(selectedStore);
      setPurchaseOrders(poData);

      if (invData.length > 0) {
        const firstProdId = invData[0].product_id;
        setSelectedProductId(firstProdId);
        const fc = await get7DayForecast(selectedStore, firstProdId);
        setForecast(fc);
      }
    }
    loadStoreData();
  }, [selectedStore]);

  // Fetch forecast when user selects a product
  const handleSelectProductForForecast = async (productId) => {
    setSelectedProductId(productId);
    const fc = await get7DayForecast(selectedStore, productId);
    setForecast(fc);
  };

  // Run Restock Evaluation Engine
  const handleRunRestockEngine = async () => {
    setIsEvaluating(true);
    try {
      const res = await evaluateRestock(selectedStore, 'statistical');
      setEvaluationResult(res);

      const updatedInv = await getInventory(selectedStore);
      setInventory(updatedInv);

      const updatedPOs = await getPurchaseOrders(selectedStore);
      setPurchaseOrders(updatedPOs);
    } catch (e) {
      console.error("Restock evaluation error:", e);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Adjust stock level
  const handleSaveStockAdjustment = async (storeId, productId, overrideStock, stockChange) => {
    const targetStoreId = storeId || selectedStore;
    await updateStock(targetStoreId, productId, overrideStock, stockChange);

    const updatedInv = await getInventory(targetStoreId);
    setInventory(updatedInv);

    const updatedPOs = await getPurchaseOrders(targetStoreId);
    setPurchaseOrders(updatedPOs);

    setSelectedProductId(productId);
    const fc = await get7DayForecast(targetStoreId, productId);
    setForecast(fc);
  };

  // Update PO status (Approve / Fulfill)
  const handleUpdatePOStatus = async (poId, newStatus) => {
    await updatePOStatus(poId, newStatus);

    const updatedPOs = await getPurchaseOrders(selectedStore);
    setPurchaseOrders(updatedPOs);

    const updatedInv = await getInventory(selectedStore);
    setInventory(updatedInv);
  };

  const selectedProductObj = inventory.find(p => p.product_id === selectedProductId) || products.find(p => p.product_id === selectedProductId) || products[0];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
      {/* Header Bar */}
      <Navbar
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        stores={stores}
        onRunRestock={handleRunRestockEngine}
        isEvaluating={isEvaluating}
        backendStatus={backendStatus}
        theme={theme}
        setTheme={setTheme}
      />

      {/* KPI Cards */}
      <KPIDashboard inventory={inventory} purchaseOrders={purchaseOrders} />

      {/* Main Dashboard Workspace */}
      <div className="dashboard-workspace">
        {/* Left Column: Inventory Matrix Table */}
        <InventoryMatrix
          inventory={inventory}
          onSelectProductForForecast={handleSelectProductForForecast}
          onOpenAdjustModal={(prod) => setAdjustModalProduct(prod)}
          selectedProductId={selectedProductId}
        />

        {/* Right Column: 7-Day Forecast & PO Manager */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <ForecastVisualizer forecast={forecast} product={selectedProductObj} />
          <PurchaseOrdersManager
            purchaseOrders={purchaseOrders}
            products={products}
            onUpdatePOStatus={handleUpdatePOStatus}
          />
        </div>
      </div>

      {/* Modals */}
      {adjustModalProduct && (
        <StockAdjustmentModal
          product={adjustModalProduct}
          onClose={() => setAdjustModalProduct(null)}
          onSave={handleSaveStockAdjustment}
        />
      )}

      {evaluationResult && (
        <RestockEvaluationModal
          evaluationResult={evaluationResult}
          onClose={() => setEvaluationResult(null)}
        />
      )}
    </div>
  );
}
