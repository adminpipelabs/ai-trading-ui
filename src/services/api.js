// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'https://backend-pipelabs-dashboard-production.up.railway.app';
const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

// Helper function for API calls
async function apiCall(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// ========== TRADING BRIDGE API ==========
export const tradingBridge = {
  // Get health/status
  async getStatus() {
    return apiCall(`${TRADING_BRIDGE_URL}/`);
  },

  // Get supported exchanges
  async getSupportedExchanges() {
    return apiCall(`${TRADING_BRIDGE_URL}/connectors/supported`);
  },

  // ===== Accounts =====
  async createAccount(name) {
    return apiCall(`${TRADING_BRIDGE_URL}/accounts/create`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async getAccounts() {
    return apiCall(`${TRADING_BRIDGE_URL}/accounts`);
  },

  async getAccount(name) {
    return apiCall(`${TRADING_BRIDGE_URL}/accounts/${name}`);
  },

  // ===== Connectors =====
  async addConnector({ account, connector, apiKey, apiSecret, memo }) {
    return apiCall(`${TRADING_BRIDGE_URL}/connectors/add`, {
      method: 'POST',
      body: JSON.stringify({
        account,
        connector,
        api_key: apiKey,
        api_secret: apiSecret,
        memo,
      }),
    });
  },

  // ===== Portfolio =====
  async getPortfolio(account) {
    return apiCall(`${TRADING_BRIDGE_URL}/portfolio?account=${account}`);
  },

  async getTradeHistory(account) {
    return apiCall(`${TRADING_BRIDGE_URL}/history?account=${account}`);
  },

  // ===== Orders =====
  async getOrders(account) {
    return apiCall(`${TRADING_BRIDGE_URL}/orders?account=${account}`);
  },

  async placeOrder({ account, connector, pair, side, type, amount, price }) {
    return apiCall(`${TRADING_BRIDGE_URL}/orders/place`, {
      method: 'POST',
      body: JSON.stringify({ account, connector, pair, side, type, amount, price }),
    });
  },

  async cancelOrder({ account, connector, orderId, pair }) {
    return apiCall(`${TRADING_BRIDGE_URL}/orders/cancel`, {
      method: 'POST',
      body: JSON.stringify({ account, connector, order_id: orderId, pair }),
    });
  },

  // ===== Market Data =====
  async getPrice(connector, pair) {
    return apiCall(`${TRADING_BRIDGE_URL}/market/price?connector=${connector}&pair=${encodeURIComponent(pair)}`);
  },

  async getOrderbook(connector, pair) {
    return apiCall(`${TRADING_BRIDGE_URL}/market/orderbook?connector=${connector}&pair=${encodeURIComponent(pair)}`);
  },
};

// ========== BACKEND API (for clients, auth, etc.) ==========
export const backend = {
  // ===== Auth =====
  async login(email, password) {
    return apiCall(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(data) {
    return apiCall(`${API_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ===== Clients =====
  async getClients() {
    return apiCall(`${API_URL}/clients`);
  },

  async getClient(id) {
    return apiCall(`${API_URL}/clients/${id}`);
  },

  async createClient(data) {
    return apiCall(`${API_URL}/clients`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClient(id, data) {
    return apiCall(`${API_URL}/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteClient(id) {
    return apiCall(`${API_URL}/clients/${id}`, {
      method: 'DELETE',
    });
  },

  async sendClientInvite(id) {
    return apiCall(`${API_URL}/clients/${id}/invite`, {
      method: 'POST',
    });
  },

  // ===== Reports =====
  async getReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${API_URL}/reports?${queryString}`);
  },

  async generateReport(type, params) {
    return apiCall(`${API_URL}/reports/generate`, {
      method: 'POST',
      body: JSON.stringify({ type, ...params }),
    });
  },
};

// ========== AI CHAT API ==========
export const aiChat = {
  async sendMessage(message, context = {}) {
    return apiCall(`${API_URL}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  },
};

export default {
  tradingBridge,
  backend,
  aiChat,
};
