// API Configuration - uses runtime detection
import { API_URL } from '../config/api';
const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

// Helper function for API calls
async function apiCall(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// ========== ADMIN API ==========
export const adminAPI = {
  async getOverview() {
    return apiCall(`${API_URL}/api/admin/overview`);
  },

  async getClients() {
    return apiCall(`${API_URL}/api/admin/clients`);
  },

  async getClient(clientId) {
    return apiCall(`${API_URL}/api/admin/clients/${clientId}`);
  },

  async createClient(data) {
    return apiCall(`${API_URL}/api/admin/clients`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClient(clientId, data) {
    return apiCall(`${API_URL}/api/admin/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteClient(clientId) {
    return apiCall(`${API_URL}/api/admin/clients/${clientId}`, {
      method: 'DELETE',
    });
  },

  async getClientApiKeys(clientId) {
    return apiCall(`${API_URL}/api/admin/clients/${clientId}/api-keys`);
  },

  async addClientApiKey(clientId, data) {
    return apiCall(`${API_URL}/api/admin/clients/${clientId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteClientApiKey(clientId, keyId) {
    return apiCall(`${API_URL}/api/admin/clients/${clientId}/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  },

  async sendInvite(clientId) {
    return apiCall(`${API_URL}/api/admin/clients/${clientId}/invite`, {
      method: 'POST',
    });
  },
};

// ========== TRADING BRIDGE API ==========
export const tradingBridge = {
  async getStatus() {
    return apiCall(`${TRADING_BRIDGE_URL}/`);
  },

  async getSupportedExchanges() {
    return apiCall(`${TRADING_BRIDGE_URL}/connectors/supported`);
  },

  async addConnector({ account, connector, apiKey, apiSecret, memo }) {
    return apiCall(`${TRADING_BRIDGE_URL}/connectors/add`, {
      method: 'POST',
      body: JSON.stringify({ account, connector, api_key: apiKey, api_secret: apiSecret, memo }),
    });
  },

  async getPortfolio(account) {
    return apiCall(`${TRADING_BRIDGE_URL}/portfolio?account=${account}`);
  },

  async getPrice(connector, pair) {
    return apiCall(`${TRADING_BRIDGE_URL}/market/price?connector=${connector}&pair=${encodeURIComponent(pair)}`);
  },
};

export default { adminAPI, tradingBridge };
