import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KPIDashboard } from './components/KPIDashboard';
import { InventoryMatrix } from './components/InventoryMatrix';
import { ForecastVisualizer } from './components/ForecastVisualizer';
import { PurchaseOrdersManager } from './components/PurchaseOrdersManager';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { RestockEvaluationModal } from './components/RestockEvaluationModal';
import { SplashScreen } from './components/SplashScreen';
import Dock from './components/Dock';
import { GlobalShortfallsChart } from './components/GlobalShortfallsChart';
import { BarChart2, RefreshCw, Sun, Moon, Package } from 'lucide-react';

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
  const [selectedProductId, setSelectedProductId] = useState(null); // Default to null for global view
  const [forecast, setForecast] = useState(null);
  
  const [showSplash, setShowSplash] = useState(true);
  
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
        // Do NOT select the first product automatically to show global view first
        setSelectedProductId(null);
        setForecast(null);
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

  const dockItems = [
    { 
      icon: <BarChart2 size={22} />, 
      label: 'Global Shortfalls', 
      onClick: () => { setSelectedProductId(null); setForecast(null); }
    },
    { 
      icon: <RefreshCw size={22} className={isEvaluating ? "animate-spin" : ""} />, 
      label: 'Run AI Engine', 
      onClick: handleRunRestockEngine 
    },
    { 
      icon: <Package size={22} />, 
      label: 'Purchase Orders', 
      onClick: () => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); } 
    },
    { 
      icon: theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />, 
      label: 'Toggle Theme', 
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark') 
    },
  ];

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
      {/* Header Bar */}
      <Navbar
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        stores={stores}
        backendStatus={backendStatus}
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
          {selectedProductId && forecast && selectedProductObj ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => { setSelectedProductId(null); setForecast(null); }}
                className="button-secondary"
                style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                Close Forecast
              </button>
              <ForecastVisualizer forecast={forecast} product={selectedProductObj} />
            </div>
          ) : (
            <GlobalShortfallsChart inventory={inventory} />
          )}
          <PurchaseOrdersManager
            purchaseOrders={purchaseOrders}
            products={products}
            onUpdatePOStatus={handleUpdatePOStatus}
          />
        </div>
      </div>

      <Dock 
        items={dockItems} 
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
      />

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
