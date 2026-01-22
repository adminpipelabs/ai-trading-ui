/**
 * API Service for AI Trading Platform
 */

const API_URL = process.env.REACT_APP_API_URL || 'https://backend-pipelabs-dashboard-production.up.railway.app';

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Agent/Chat API
 */
export const agentAPI = {
  async sendMessage(message, context = {}) {
    return apiCall('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message,
        ...context
      })
    });
  },

  async getHistory(limit = 50) {
    return apiCall(`/api/agent/history?limit=${limit}`);
  },

  async clearHistory() {
    return apiCall('/api/agent/history', { method: 'DELETE' });
  }
};

/**
 * Portfolio API
 */
export const portfolioAPI = {
  async getOverview() {
    return apiCall('/api/portfolio/overview');
  },

  async getBalances() {
    return apiCall('/api/portfolio/balances');
  },

  async getTokens() {
    return apiCall('/api/portfolio/tokens');
  }
};

/**
 * Trading API
 */
export const tradingAPI = {
  async getOrders(status = 'all') {
    return apiCall(`/api/trading/orders?status=${status}`);
  },

  async getTradeHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/trading/history?${query}`);
  },

  async placeOrder(order) {
    return apiCall('/api/trading/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
  },

  async cancelOrder(orderId) {
    return apiCall(`/api/trading/orders/${orderId}`, {
      method: 'DELETE'
    });
  }
};

/**
 * Bots API
 */
export const botsAPI = {
  async getAll() {
    return apiCall('/api/bots');
  },

  async getStatus(botId) {
    return apiCall(`/api/bots/${botId}/status`);
  },

  async start(botId) {
    return apiCall(`/api/bots/${botId}/start`, { method: 'POST' });
  },

  async stop(botId) {
    return apiCall(`/api/bots/${botId}/stop`, { method: 'POST' });
  },

  async create(config) {
    return apiCall('/api/bots', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }
};

/**
 * Reports API
 */
export const reportsAPI = {
  async getPnL(period = '7d') {
    return apiCall(`/api/reports/pnl?period=${period}`);
  },

  async getVolume(period = '7d') {
    return apiCall(`/api/reports/volume?period=${period}`);
  },

  async downloadCSV(type, params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/reports/export/${type}?${query}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    return response.blob();
  }
};

/**
 * Admin API
 */
export const adminAPI = {
  async getClients() {
    return apiCall('/api/admin/clients');
  },

  async getClient(clientId) {
    return apiCall(`/api/admin/clients/${clientId}`);
  },

  async createClient(data) {
    return apiCall('/api/admin/clients', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateClient(clientId, data) {
    return apiCall(`/api/admin/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async getGlobalMetrics() {
    return apiCall('/api/admin/metrics');
  },

  async getAllBots() {
    return apiCall('/api/admin/bots');
  }
};

/**
 * Saved Prompts API
 */
export const promptsAPI = {
  async getAll() {
    return apiCall('/api/prompts');
  },

  async save(prompt) {
    return apiCall('/api/prompts', {
      method: 'POST',
      body: JSON.stringify(prompt)
    });
  },

  async delete(promptId) {
    return apiCall(`/api/prompts/${promptId}`, { method: 'DELETE' });
  }
};

export default {
  agent: agentAPI,
  portfolio: portfolioAPI,
  trading: tradingAPI,
  bots: botsAPI,
  reports: reportsAPI,
  admin: adminAPI,
  prompts: promptsAPI
};
