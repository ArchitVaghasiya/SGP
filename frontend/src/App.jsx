import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CommandPalette } from './components/CommandPalette';
import { LoginView } from './components/LoginView';
import { ControlTowerView } from './components/ControlTowerView';
import { InventoryView } from './components/InventoryView';
import { SKUIntelligenceView } from './components/SKUIntelligenceView';
import { ForecastsView } from './components/ForecastsView';
import { PurchaseOrdersView } from './components/PurchaseOrdersView';
import { SuppliersView } from './components/SuppliersView';
import { StoresView } from './components/StoresView';
import { AlertsView } from './components/AlertsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SimulationView } from './components/SimulationView';
import { TransactionsView } from './components/TransactionsView';
import { AuditView } from './components/AuditView';
import { UserProfileModal } from './components/UserProfileModal';
import api, { getCurrentUser, setCurrentUser, getAuthToken, setAuthToken } from './api';

export function App() {
  const [currentUser, setUser] = useState(getCurrentUser());
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedSku, setSelectedSku] = useState(null); // { storeId, productId }
  const [simTarget, setSimTarget] = useState({ storeId: 1, productId: 1 });

  const [theme, setTheme] = useState(localStorage.getItem('supplyiq_theme') || 'dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [storesList, setStoresList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('supplyiq_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Fetch initial stores and alert summary
  const loadGlobalData = async () => {
    try {
      const [storesRes, alertsRes] = await Promise.all([
        api.getStores(),
        api.getAlertsSummary()
      ]);
      setStoresList(storesRes || []);
      setUnreadAlertsCount(alertsRes?.unread_alerts || 0);
    } catch (err) {
      console.error("Failed to load global shell data:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadGlobalData();
    }
  }, [currentUser]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadGlobalData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleLoginSuccess = (user) => {
    setUser(user);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUser(null);
  };

  const handleNavigate = (viewId) => {
    setSelectedSku(null);
    setActiveView(viewId);
  };

  const handleSelectSku = (storeId, productId) => {
    setSelectedSku({ storeId, productId });
    setActiveView('sku-detail');
  };

  const handleLaunchSimulate = (storeId, productId) => {
    setSimTarget({ storeId, productId });
    setActiveView('simulations');
  };

  // If not authenticated, render LoginView
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

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
    <div className="app-container">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        unreadAlertsCount={unreadAlertsCount}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Sticky Top Bar */}
        <TopBar
          selectedStore={selectedStore}
          onSelectStore={setSelectedStore}
          storesList={storesList}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          unreadAlertsCount={unreadAlertsCount}
          onOpenNotifications={() => handleNavigate('alerts')}
          currentUser={currentUser}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onRefreshData={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* View Router */}
        {activeView === 'dashboard' && (
          <ControlTowerView
            selectedStore={selectedStore}
            onNavigate={handleNavigate}
            onSelectSku={handleSelectSku}
          />
        )}

        {activeView === 'inventory' && (
          <InventoryView
            selectedStore={selectedStore}
            onSelectSku={handleSelectSku}
          />
        )}

        {activeView === 'sku-detail' && selectedSku && (
          <SKUIntelligenceView
            storeId={selectedSku.storeId}
            productId={selectedSku.productId}
            onBack={() => setActiveView('inventory')}
            onNavigate={handleNavigate}
            onSimulate={handleLaunchSimulate}
          />
        )}

        {activeView === 'forecasts' && (
          <ForecastsView />
        )}

        {activeView === 'purchase-orders' && (
          <PurchaseOrdersView
            selectedStore={selectedStore}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'suppliers' && (
          <SuppliersView
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'stores' && (
          <StoresView
            onSelectStore={(id) => setSelectedStore(id)}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'alerts' && (
          <AlertsView
            selectedStore={selectedStore}
            onNavigate={handleNavigate}
            onSelectSku={handleSelectSku}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView
            onSelectSku={handleSelectSku}
          />
        )}

        {activeView === 'simulations' && (
          <SimulationView
            defaultStoreId={simTarget.storeId}
            defaultProductId={simTarget.productId}
          />
        )}

        {activeView === 'transactions' && (
          <TransactionsView
            selectedStore={selectedStore}
            onSelectSku={handleSelectSku}
          />
        )}

        {activeView === 'audit' && (
          <AuditView />
        )}
      </div>

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onSelectSku={handleSelectSku}
      />

      {/* User Profile & Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
