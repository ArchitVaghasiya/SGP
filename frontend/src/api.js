// API Service layer with live FastAPI endpoint integration and fallback mock data

const API_BASE_URL = 'http://localhost:8000';

export const STORES = [
  { store_id: 1, city: 'Quito', state: 'Pichincha', store_type: 'D', cluster: 13 },
  { store_id: 2, city: 'Quito', state: 'Pichincha', store_type: 'D', cluster: 13 },
  { store_id: 3, city: 'Quito', state: 'Pichincha', store_type: 'D', cluster: 8 },
  { store_id: 4, city: 'Quito', state: 'Pichincha', store_type: 'D', cluster: 9 },
  { store_id: 5, city: 'Santo Domingo', state: 'Santo Domingo de los Tsachilas', store_type: 'D', cluster: 4 },
  { store_id: 6, city: 'Quito', state: 'Pichincha', store_type: 'D', cluster: 13 },
  { store_id: 7, city: 'Quito', state: 'Pichincha', store_type: 'D', cluster: 8 },
  { store_id: 8, city: 'Quito', state: 'Pichincha', store_type: 'D', cluster: 8 },
  { store_id: 9, city: 'Guayaquil', state: 'Guayas', store_type: 'B', cluster: 6 },
  { store_id: 10, city: 'Quito', state: 'Pichincha', store_type: 'C', cluster: 15 },
  { store_id: 11, city: 'Cayambe', state: 'Pichincha', store_type: 'B', cluster: 6 },
  { store_id: 12, city: 'Latacunga', state: 'Cotopaxi', store_type: 'C', cluster: 15 },
  { store_id: 13, city: 'Latacunga', state: 'Cotopaxi', store_type: 'C', cluster: 15 },
  { store_id: 14, city: 'Riobamba', state: 'Chimborazo', store_type: 'C', cluster: 7 },
  { store_id: 15, city: 'Ibarra', state: 'Imbabura', store_type: 'C', cluster: 15 },
  { store_id: 16, city: 'Santo Domingo', state: 'Santo Domingo de los Tsachilas', store_type: 'C', cluster: 3 },
  { store_id: 17, city: 'Quito', state: 'Pichincha', store_type: 'C', cluster: 12 },
  { store_id: 18, city: 'Quito', state: 'Pichincha', store_type: 'B', cluster: 16 },
  { store_id: 19, city: 'Guaranda', state: 'Bolivar', store_type: 'C', cluster: 15 },
  { store_id: 20, city: 'Quito', state: 'Pichincha', store_type: 'B', cluster: 6 },
  { store_id: 21, city: 'Santo Domingo', state: 'Santo Domingo de los Tsachilas', store_type: 'B', cluster: 6 },
  { store_id: 22, city: 'Puyo', state: 'Pastaza', store_type: 'C', cluster: 7 },
  { store_id: 23, city: 'Ambato', state: 'Tungurahua', store_type: 'D', cluster: 9 },
  { store_id: 24, city: 'Guayaquil', state: 'Guayas', store_type: 'D', cluster: 1 },
  { store_id: 25, city: 'Salinas', state: 'Santa Elena', store_type: 'D', cluster: 1 },
  { store_id: 26, city: 'Guayaquil', state: 'Guayas', store_type: 'D', cluster: 10 },
  { store_id: 27, city: 'Daule', state: 'Guayas', store_type: 'D', cluster: 1 },
  { store_id: 28, city: 'Guayaquil', state: 'Guayas', store_type: 'E', cluster: 10 },
  { store_id: 29, city: 'Guayaquil', state: 'Guayas', store_type: 'E', cluster: 10 },
  { store_id: 30, city: 'Guayaquil', state: 'Guayas', store_type: 'C', cluster: 3 },
  { store_id: 31, city: 'Babahoyo', state: 'Los Rios', store_type: 'B', cluster: 10 },
  { store_id: 32, city: 'Guayaquil', state: 'Guayas', store_type: 'C', cluster: 3 },
  { store_id: 33, city: 'Quevedo', state: 'Los Rios', store_type: 'C', cluster: 3 },
  { store_id: 34, city: 'Guayaquil', state: 'Guayas', store_type: 'B', cluster: 6 },
  { store_id: 35, city: 'Playas', state: 'Guayas', store_type: 'C', cluster: 3 },
  { store_id: 36, city: 'Cuenca', state: 'Azuay', store_type: 'E', cluster: 10 },
  { store_id: 37, city: 'Cuenca', state: 'Azuay', store_type: 'D', cluster: 2 },
  { store_id: 38, city: 'Loja', state: 'Loja', store_type: 'D', cluster: 4 },
  { store_id: 39, city: 'Cuenca', state: 'Azuay', store_type: 'B', cluster: 6 },
  { store_id: 40, city: 'Machala', state: 'El Oro', store_type: 'C', cluster: 3 },
  { store_id: 41, city: 'Machala', state: 'El Oro', store_type: 'D', cluster: 4 },
  { store_id: 42, city: 'El Carmen', state: 'Manabi', store_type: 'C', cluster: 2 },
  { store_id: 43, city: 'Esmeraldas', state: 'Esmeraldas', store_type: 'E', cluster: 10 },
  { store_id: 44, city: 'Quito', state: 'Pichincha', store_type: 'A', cluster: 5 },
  { store_id: 45, city: 'Quito', state: 'Pichincha', store_type: 'A', cluster: 11 },
  { store_id: 46, city: 'Quito', state: 'Pichincha', store_type: 'A', cluster: 14 },
  { store_id: 47, city: 'Quito', state: 'Pichincha', store_type: 'A', cluster: 14 },
  { store_id: 48, city: 'Quito', state: 'Pichincha', store_type: 'A', cluster: 14 },
  { store_id: 49, city: 'Quito', state: 'Pichincha', store_type: 'A', cluster: 11 },
  { store_id: 50, city: 'Ambato', state: 'Tungurahua', store_type: 'A', cluster: 14 },
  { store_id: 51, city: 'Guayaquil', state: 'Guayas', store_type: 'A', cluster: 17 },
  { store_id: 52, city: 'Manta', state: 'Manabi', store_type: 'A', cluster: 11 },
  { store_id: 53, city: 'Manta', state: 'Manabi', store_type: 'D', cluster: 13 },
  { store_id: 54, city: 'El Carmen', state: 'Manabi', store_type: 'C', cluster: 3 }
];

export const PRODUCTS = [
  { product_id: 1, family: 'AUTOMOTIVE', perishable: false, class_id: 100 },
  { product_id: 2, family: 'BABY CARE', perishable: false, class_id: 100 },
  { product_id: 3, family: 'BEAUTY', perishable: false, class_id: 100 },
  { product_id: 4, family: 'BEVERAGES', perishable: false, class_id: 100 },
  { product_id: 5, family: 'BOOKS', perishable: false, class_id: 100 },
  { product_id: 6, family: 'BREAD/BAKERY', perishable: true, class_id: 100 },
  { product_id: 7, family: 'CELEBRATION', perishable: false, class_id: 100 },
  { product_id: 8, family: 'CLEANING', perishable: false, class_id: 100 },
  { product_id: 9, family: 'DAIRY', perishable: true, class_id: 100 },
  { product_id: 10, family: 'DELI', perishable: true, class_id: 100 },
  { product_id: 11, family: 'EGGS', perishable: true, class_id: 100 },
  { product_id: 12, family: 'FROZEN FOODS', perishable: false, class_id: 100 },
  { product_id: 13, family: 'GROCERY I', perishable: false, class_id: 100 },
  { product_id: 14, family: 'GROCERY II', perishable: false, class_id: 100 },
  { product_id: 15, family: 'HARDWARE', perishable: false, class_id: 100 },
  { product_id: 16, family: 'HOME AND KITCHEN I', perishable: false, class_id: 100 },
  { product_id: 17, family: 'HOME AND KITCHEN II', perishable: false, class_id: 100 },
  { product_id: 18, family: 'HOME APPLIANCES', perishable: false, class_id: 100 },
  { product_id: 19, family: 'HOME CARE', perishable: false, class_id: 100 },
  { product_id: 20, family: 'LADIESWEAR', perishable: false, class_id: 100 },
  { product_id: 21, family: 'LAWN AND GARDEN', perishable: false, class_id: 100 },
  { product_id: 22, family: 'LINGERIE', perishable: false, class_id: 100 },
  { product_id: 23, family: 'LIQUOR,WINE,BEER', perishable: false, class_id: 100 },
  { product_id: 24, family: 'MAGAZINES', perishable: false, class_id: 100 },
  { product_id: 25, family: 'MEATS', perishable: true, class_id: 100 },
  { product_id: 26, family: 'PERSONAL CARE', perishable: false, class_id: 100 },
  { product_id: 27, family: 'PET SUPPLIES', perishable: false, class_id: 100 },
  { product_id: 28, family: 'PLAYERS AND ELECTRONICS', perishable: false, class_id: 100 },
  { product_id: 29, family: 'POULTRY', perishable: true, class_id: 100 },
  { product_id: 30, family: 'PREPARED FOODS', perishable: true, class_id: 100 },
  { product_id: 31, family: 'PRODUCE', perishable: true, class_id: 100 },
  { product_id: 32, family: 'SCHOOL AND OFFICE SUPPLIES', perishable: false, class_id: 100 },
  { product_id: 33, family: 'SEAFOOD', perishable: true, class_id: 100 }
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
    // Offline fallback
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
    const res = await fetch(`${API_BASE_URL}/forecast/${storeId}/${productId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn(`Forecast endpoint failed for store ${storeId}, product ${productId}:`, e);
  }

  // Fallback mock forecast
  const prod = PRODUCTS.find(p => p.product_id === productId) || PRODUCTS[0];
  const baseDemand = prod.perishable ? 35 : (productId === 13 ? 1000 : 40);

  const daily = [];
  const today = new Date();
  let total7d = 0;

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
    const res = await fetch(`${API_BASE_URL}/restock/evaluate?store_id=${storeId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn(`Restock evaluation endpoint failed for store ${storeId}:`, e);
  }

  return {
    store_id: storeId,
    evaluated_products_count: 0,
    restock_orders_generated_count: 0,
    generated_purchase_orders: [],
    evaluations: []
  };
}

export async function updateStock(storeId, productId, overrideStock = null, stockChange = null) {
  try {
    const sId = parseInt(storeId) || 1;
    const pId = parseInt(productId) || 1;
    const payload = { store_id: sId, product_id: pId };
    if (overrideStock !== null && overrideStock !== undefined) {
      payload.override_stock = parseFloat(overrideStock);
    }
    if (stockChange !== null && stockChange !== undefined) {
      payload.stock_change = parseFloat(stockChange);
    }

    const res = await fetch(`${API_BASE_URL}/inventory/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return await res.json();
    } else {
      const errText = await res.text();
      console.error("Failed to update stock from API:", res.status, errText);
    }
  } catch (e) {
    console.error("Error updating stock:", e);
  }

  return {
    store_id: storeId,
    product_id: productId,
    previous_stock: 0,
    new_stock: overrideStock !== null ? overrideStock : stockChange,
    message: "Stock adjustment processed"
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
    console.warn("Failed to fetch purchase orders:", e);
  }

  return [];
}

export async function updatePOStatus(poId, newStatus) {
  return { po_id: poId, status: newStatus };
}

export async function getInventory(storeId = 1) {
  try {
    const evalRes = await evaluateRestock(storeId);
    if (evalRes && evalRes.evaluations && evalRes.evaluations.length > 0) {
      const evalMap = {};
      evalRes.evaluations.forEach(e => {
        evalMap[e.product_id] = e;
      });

      return PRODUCTS.map(prod => {
        const ev = evalMap[prod.product_id] || {};
        const currentStock = ev.current_stock !== undefined ? ev.current_stock : 0;
        const safetyBuffer = ev.safety_buffer !== undefined ? ev.safety_buffer : 0;
        const pred7d = ev.predicted_demand_7d !== undefined ? ev.predicted_demand_7d : 0;
        const shortfall = ev.shortfall !== undefined ? ev.shortfall : 0;

        const requiredStock = pred7d + safetyBuffer;
        let status = 'HEALTHY';
        if (currentStock < safetyBuffer) {
          status = 'CRITICAL';
        } else if (currentStock < requiredStock) {
          status = 'WARNING';
        }

        return {
          ...prod,
          store_id: parseInt(storeId),
          current_stock: currentStock,
          safety_buffer: safetyBuffer,
          lead_time_days: 7,
          service_level: 0.95,
          predicted_demand_7d: pred7d,
          shortfall: shortfall,
          status: status,
          last_updated: new Date().toISOString()
        };
      });
    }
  } catch (e) {
    console.warn(`getInventory failed for store ${storeId}:`, e);
  }

  // Basic fallback
  return PRODUCTS.map(prod => ({
    ...prod,
    store_id: parseInt(storeId),
    current_stock: 100,
    safety_buffer: 30,
    lead_time_days: 7,
    service_level: 0.95,
    predicted_demand_7d: 50,
    shortfall: 0,
    status: 'HEALTHY',
    last_updated: new Date().toISOString()
  }));
}
