// API Configuration - uses runtime detection
import { API_URL } from '../config/api';
const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

// Helper function for API calls
async function apiCall(url, options = {}) {
  // Check multiple possible token keys for compatibility
  const token = localStorage.getItem('access_token') || 
                localStorage.getItem('pipelabs_token') || 
                localStorage.getItem('auth_token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
    }
    const error = new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    console.error('API Error:', {
      url,
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw error;
  }
  
  return response.json();
}

// ========== ADMIN API ==========
export const adminAPI = {
  async getOverview() {
    return apiCall(`${API_URL}/api/admin/overview`);
  },

  async getClients() {
    console.log('🔗 API_URL:', API_URL);
    console.log('🔗 Calling:', `${API_URL}/api/admin/clients`);
    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('pipelabs_token') || 
                  localStorage.getItem('auth_token');
    console.log('🔑 Token present?', !!token, 'Length:', token?.length);
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
    return apiCall(`${API_URL}/api/admin/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ ...data, client_id: clientId }),
    });
  },

  async addClientApiKey(clientId, data) {
    return apiCall(`${API_URL}/api/admin/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ ...data, client_id: clientId }),
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
