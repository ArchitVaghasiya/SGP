// API Service layer with live FastAPI endpoint integration and fallback mock data

const API_BASE_URL = 'http://localhost:8000';

// Realistic mock dataset for stores and product families
const STORES = [
  { store_id: 1, city: 'Quito', state: 'Pichincha', store_type: 'A', cluster: 1 },
  { store_id: 2, city: 'Guayaquil', state: 'Guayas', store_type: 'B', cluster: 2 },
  { store_id: 3, city: 'Cuenca', state: 'Azuay', store_type: 'C', cluster: 3 },
  { store_id: 4, city: 'Santo Domingo', state: 'Santo Domingo', store_type: 'D', cluster: 1 },
  { store_id: 5, city: 'Ambato', state: 'Tungurahua', store_type: 'A', cluster: 2 }
];

const PRODUCTS = [
  { product_id: 1, family: 'BEVERAGES', perishable: false, class_id: 1000 },
  { product_id: 2, family: 'GROCERY I', perishable: false, class_id: 1001 },
  { product_id: 3, family: 'CLEANING', perishable: false, class_id: 1002 },
  { product_id: 4, family: 'BREAD/BAKERY', perishable: true, class_id: 1003 },
  { product_id: 5, family: 'POULTRY', perishable: true, class_id: 1004 },
  { product_id: 6, family: 'MEATS', perishable: true, class_id: 1005 },
  { product_id: 7, family: 'AUTOMOTIVE', perishable: false, class_id: 1006 },
  { product_id: 8, family: 'BABY CARE', perishable: false, class_id: 1007 },
  { product_id: 9, family: 'BOOKS', perishable: false, class_id: 1008 },
  { product_id: 10, family: 'HARDWARE', perishable: false, class_id: 1009 }
];

let mockInventory = [
  { store_id: 1, product_id: 1, current_stock: 45.0, safety_buffer: 120.0, lead_time_days: 7, service_level: 0.95, last_updated: '2026-09-01T10:00:00Z' },
  { store_id: 1, product_id: 2, current_stock: 850.0, safety_buffer: 350.0, lead_time_days: 7, service_level: 0.95, last_updated: '2026-09-01T10:00:00Z' },
  { store_id: 1, product_id: 3, current_stock: 220.0, safety_buffer: 200.0, lead_time_days: 7, service_level: 0.95, last_updated: '2026-09-01T10:00:00Z' },
  { store_id: 1, product_id: 4, current_stock: 30.0, safety_buffer: 180.0, lead_time_days: 5, service_level: 0.98, last_updated: '2026-09-01T10:00:00Z' },
  { store_id: 1, product_id: 5, current_stock: 90.0, safety_buffer: 240.0, lead_time_days: 7, service_level: 0.95, last_updated: '2026-09-01T10:00:00Z' },
  { store_id: 1, product_id: 6, current_stock: 310.0, safety_buffer: 210.0, lead_time_days: 7, service_level: 0.95, last_updated: '2026-09-01T10:00:00Z' },
  { store_id: 1, product_id: 7, current_stock: 15.0, safety_buffer: 45.0, lead_time_days: 10, service_level: 0.90, last_updated: '2026-09-01T10:00:00Z' },
  { store_id: 1, product_id: 8, current_stock: 140.0, safety_buffer: 90.0, lead_time_days: 7, service_level: 0.95, last_updated: '2026-09-01T10:00:00Z' },
  { store_id: 2, product_id: 1, current_stock: 620.0, safety_buffer: 300.0, lead_time_days: 7, service_level: 0.95, last_updated: '2026-09-01T10:00:00Z' },
  { store_id: 2, product_id: 4, current_stock: 25.0, safety_buffer: 190.0, lead_time_days: 5, service_level: 0.98, last_updated: '2026-09-01T10:00:00Z' }
];

let mockPurchaseOrders = [
  {
    po_id: 101,
    store_id: 1,
    product_id: 1,
    order_quantity: 475.0,
    predicted_demand_7d: 400.0,
    current_stock: 45.0,
    safety_buffer: 120.0,
    shortfall: 475.0,
    status: 'PENDING',
    created_at: '2026-09-01T08:30:00Z'
  },
  {
    po_id: 102,
    store_id: 1,
    product_id: 4,
    order_quantity: 340.0,
    predicted_demand_7d: 190.0,
    current_stock: 30.0,
    safety_buffer: 180.0,
    shortfall: 340.0,
    status: 'APPROVED',
    created_at: '2026-08-31T14:15:00Z'
  },
  {
    po_id: 103,
    store_id: 2,
    product_id: 4,
    order_quantity: 355.0,
    predicted_demand_7d: 190.0,
    current_stock: 25.0,
    safety_buffer: 190.0,
    shortfall: 355.0,
    status: 'FULFILLED',
    created_at: '2026-08-30T09:00:00Z'
  }
];

export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { isOnline: true, data };
    }
  } catch (err) {
    // Backend offline fallback
  }
  return { isOnline: false, data: { status: 'offline', version: '1.0.0 (Demo Mode)' } };
}

export async function getStores() {
  return STORES;
}

export async function getProducts() {
  return PRODUCTS;
}

export async function get7DayForecast(storeId = 1, productId = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/forecast/7day?store_id=${storeId}&product_id=${productId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fallback mock forecast
  }

  const prod = PRODUCTS.find(p => p.product_id === productId) || PRODUCTS[0];
  const baseDemand = prod.perishable ? 35 : (productId === 1 ? 60 : 40);

  const dates = [];
  const today = new Date();
  let total7d = 0;
  const daily = [];

  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const factor = isWeekend ? 1.35 : 0.95;
    const noise = 0.9 + Math.random() * 0.2;
    const sales = Math.round(baseDemand * factor * noise * 10) / 10;
    total7d += sales;

    daily.push({
      date: d.toISOString().split('T')[0],
      predicted_sales: sales
    });
  }

  return {
    store_id: storeId,
    product_id: productId,
    predicted_demand_7d: Math.round(total7d * 100) / 100,
    daily_forecast: daily,
    model_version: 'v1.0.0 (LightGBM)'
  };
}

export async function evaluateRestock(storeId = 1, strategyType = 'statistical') {
  try {
    const res = await fetch(`${API_BASE_URL}/restock/evaluate?store_id=${storeId}&strategy_type=${strategyType}`, {
      method: 'POST'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fallback mock evaluation
  }

  const storeItems = mockInventory.filter(i => i.store_id === storeId);
  const evaluations = [];
  const generatedOrders = [];

  for (const inv of storeItems) {
    const forecast = await get7DayForecast(storeId, inv.product_id);
    const pred7d = forecast.predicted_demand_7d;
    const buffer = Math.round(pred7d * 0.45 * 100) / 100;
    inv.safety_buffer = buffer;

    const required = pred7d + buffer;
    const needed = inv.current_stock < required;
    const shortfall = needed ? Math.round((required - inv.current_stock) * 100) / 100 : 0;
    const orderQty = shortfall;

    evaluations.push({
      product_id: inv.product_id,
      current_stock: inv.current_stock,
      predicted_demand_7d: pred7d,
      safety_buffer: buffer,
      shortfall: shortfall,
      restock_needed: needed,
      order_quantity: orderQty
    });

    if (needed) {
      const existing = mockPurchaseOrders.find(po => po.store_id === storeId && po.product_id === inv.product_id && po.status === 'PENDING');
      if (!existing) {
        const newPo = {
          po_id: mockPurchaseOrders.length + 101,
          store_id: storeId,
          product_id: inv.product_id,
          order_quantity: orderQty,
          predicted_demand_7d: pred7d,
          current_stock: inv.current_stock,
          safety_buffer: buffer,
          shortfall: shortfall,
          status: 'PENDING',
          created_at: new Date().toISOString()
        };
        mockPurchaseOrders.unshift(newPo);
        generatedOrders.push(newPo);
      }
    }
  }

  return {
    store_id: storeId,
    evaluated_products_count: evaluations.length,
    restock_orders_generated_count: generatedOrders.length,
    generated_purchase_orders: generatedOrders,
    evaluations: evaluations
  };
}

export async function updateStock(storeId, productId, overrideStock = null, stockChange = null) {
  try {
    const payload = { store_id: storeId, product_id: productId };
    if (overrideStock !== null) payload.override_stock = overrideStock;
    if (stockChange !== null) payload.stock_change = stockChange;

    const res = await fetch(`${API_BASE_URL}/inventory/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fallback mock update
  }

  let item = mockInventory.find(i => i.store_id === storeId && i.product_id === productId);
  if (!item) {
    item = { store_id: storeId, product_id: productId, current_stock: 100, safety_buffer: 50, lead_time_days: 7, service_level: 0.95 };
    mockInventory.push(item);
  }

  const prev = item.current_stock;
  let newStock = prev;
  if (overrideStock !== null) newStock = Math.max(0, overrideStock);
  else if (stockChange !== null) newStock = Math.max(0, prev + stockChange);

  item.current_stock = newStock;
  item.last_updated = new Date().toISOString();

  return {
    store_id: storeId,
    product_id: productId,
    previous_stock: prev,
    new_stock: newStock,
    message: `Stock updated successfully from ${prev} to ${newStock}`
  };
}

export async function getPurchaseOrders(storeId = null, status = null) {
  try {
    let url = `${API_BASE_URL}/restock/orders`;
    const params = [];
    if (storeId) params.push(`store_id=${storeId}`);
    if (status) params.push(`status=${status}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fallback
  }

  return mockPurchaseOrders.filter(po => {
    if (storeId && po.store_id !== storeId) return false;
    if (status && po.status !== status) return false;
    return true;
  });
}

export async function updatePOStatus(poId, newStatus) {
  const po = mockPurchaseOrders.find(p => p.po_id === poId);
  if (po) {
    po.status = newStatus;

    if (newStatus === 'FULFILLED') {
      // Automatically credit inventory stock
      await updateStock(po.store_id, po.product_id, null, po.order_quantity);
    }
  }
  return po;
}

export async function getInventory(storeId = 1) {
  const result = [];
  for (const prod of PRODUCTS) {
    let inv = mockInventory.find(i => i.store_id === storeId && i.product_id === prod.product_id);
    if (!inv) {
      inv = {
        store_id: storeId,
        product_id: prod.product_id,
        current_stock: Math.floor(Math.random() * 200) + 20,
        safety_buffer: Math.floor(Math.random() * 150) + 50,
        lead_time_days: 7,
        service_level: 0.95,
        last_updated: new Date().toISOString()
      };
      mockInventory.push(inv);
    }
    
    // Quick forecast calculation for summary UI
    const est7dDemand = Math.round((prod.perishable ? 220 : 380) * (0.8 + (prod.product_id % 3) * 0.2));
    const requiredStock = est7dDemand + inv.safety_buffer;
    const shortfall = inv.current_stock < requiredStock ? Math.round(requiredStock - inv.current_stock) : 0;

    let status = 'HEALTHY';
    if (inv.current_stock < inv.safety_buffer) {
      status = 'CRITICAL';
    } else if (inv.current_stock < requiredStock) {
      status = 'WARNING';
    }

    result.push({
      ...prod,
      current_stock: inv.current_stock,
      safety_buffer: inv.safety_buffer,
      lead_time_days: inv.lead_time_days,
      service_level: inv.service_level,
      predicted_demand_7d: est7dDemand,
      shortfall: shortfall,
      status: status,
      last_updated: inv.last_updated
    });
  }
  return result;
}
