const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Auth token helper
export function getAuthToken() {
  return localStorage.getItem("supplyiq_token");
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("supplyiq_token", token);
  } else {
    localStorage.removeItem("supplyiq_token");
  }
}

export function getCurrentUser() {
  const user = localStorage.getItem("supplyiq_user");
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem("supplyiq_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("supplyiq_user");
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: res.statusText }));
      const error = new Error(errData.detail || `API request failed with status ${res.status}`);
      error.status = res.status;
      error.data = errData;
      throw error;
    }
    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${options.method || "GET"} ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => request("/auth/me"),
  getDemoUsers: () => request("/auth/demo-users"),

  // Control Tower Dashboard
  getDashboardOverview: (storeId) =>
    request(`/dashboard/overview${storeId ? `?store_id=${storeId}` : ""}`),

  // Inventory Management
  getInventoryList: (params = {}) => {
    const query = new URLSearchParams();
    if (params.store_id) query.append("store_id", params.store_id);
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.category && params.category !== "ALL") query.append("category", params.category);
    if (params.search) query.append("search", params.search);
    if (params.limit) query.append("limit", params.limit);
    if (params.offset) query.append("offset", params.offset);
    return request(`/inventory/list?${query.toString()}`);
  },

  getSKUDetail: (storeId, productId) =>
    request(`/inventory/sku/${storeId}/${productId}`),

  updateInventoryStock: (payload) =>
    request("/inventory/update", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getInventoryTransactions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.store_id) query.append("store_id", params.store_id);
    if (params.product_id) query.append("product_id", params.product_id);
    if (params.type && params.type !== "ALL") query.append("transaction_type", params.type);
    if (params.limit) query.append("limit", params.limit);
    if (params.offset) query.append("offset", params.offset);
    return request(`/inventory/transactions?${query.toString()}`);
  },

  // Demand Forecasting
  getForecastMetrics: () => request("/forecast/metrics"),
  getAccuracyByCategory: () => request("/forecast/accuracy-by-category"),
  getAccuracyByStore: () => request("/forecast/accuracy-by-store"),
  getSKUForecastDetail: (storeId, productId) =>
    request(`/forecast/sku/${storeId}/${productId}`),
  getRawForecast: (storeId, productId) =>
    request(`/forecast/${storeId}/${productId}`),

  // Restock Engine & Decision Evaluation
  evaluateRestock: (storeId = 1, serviceLevel = 0.95, bufferMethod = "statistical") =>
    request(`/restock/evaluate?store_id=${storeId}&service_level=${serviceLevel}&buffer_method=${bufferMethod}`),

  // Purchase Orders & Procurement
  getPurchaseOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.store_id) query.append("store_id", params.store_id);
    if (params.limit) query.append("limit", params.limit);
    if (params.offset) query.append("offset", params.offset);
    return request(`/purchase-orders/list?${query.toString()}`);
  },

  getPurchaseOrderDetail: (poId) => request(`/purchase-orders/${poId}`),

  createPurchaseOrder: (payload) =>
    request("/purchase-orders/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  approvePurchaseOrder: (poId) =>
    request(`/purchase-orders/${poId}/approve`, { method: "POST" }),

  sendPurchaseOrder: (poId) =>
    request(`/purchase-orders/${poId}/send`, { method: "POST" }),

  receivePurchaseOrder: (poId) =>
    request(`/purchase-orders/${poId}/receive`, { method: "POST" }),

  cancelPurchaseOrder: (poId) =>
    request(`/purchase-orders/${poId}/cancel`, { method: "POST" }),

  // Suppliers & Scorecards
  getSuppliers: () => request("/suppliers/list"),
  getSupplierDetail: (supplierId) => request(`/suppliers/${supplierId}`),
  getSupplierScorecard: (supplierId) => request(`/suppliers/${supplierId}/scorecard`),

  // Store Network
  getStores: () => request("/stores/list"),
  getStoresComparison: () => request("/stores/compare"),
  getStoreSummary: (storeId) => request(`/stores/${storeId}/summary`),

  // Operational Alerts
  getAlertsSummary: () => request("/alerts/summary"),
  getAlertsList: (params = {}) => {
    const query = new URLSearchParams();
    if (params.severity && params.severity !== "ALL") query.append("severity", params.severity);
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.store_id) query.append("store_id", params.store_id);
    if (params.limit) query.append("limit", params.limit);
    if (params.offset) query.append("offset", params.offset);
    return request(`/alerts/list?${query.toString()}`);
  },

  acknowledgeAlert: (alertId) =>
    request(`/alerts/${alertId}/acknowledge`, { method: "POST" }),

  resolveAlert: (alertId) =>
    request(`/alerts/${alertId}/resolve`, { method: "POST" }),

  bulkAcknowledgeAlerts: (payload) =>
    request("/alerts/bulk-acknowledge", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Analytics & Matrix
  getAbcXyzAnalysis: () => request("/analytics/abc-xyz"),
  getAnalyticsSummary: () => request("/analytics/summary"),

  // Scenario Simulations
  runSimulation: (payload) =>
    request("/simulations/run", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Governance Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.entity && params.entity !== "ALL") query.append("entity", params.entity);
    if (params.limit) query.append("limit", params.limit);
    if (params.offset) query.append("offset", params.offset);
    return request(`/audit/logs?${query.toString()}`);
  },

  // Global Search
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),

  // Health
  getHealth: () => request("/health"),
};

export default api;
