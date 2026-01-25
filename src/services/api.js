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

  async deleteClientApiKey(clientId, keyId) {
    return apiCall(`${API_URL}/api/admin/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  },

  async sendInvite(clientId) {
    return apiCall(`${API_URL}/api/admin/clients/${clientId}/invite`, {
      method: 'POST',
    });
  },

  // Trading Pairs / Bots
  async getClientPairs(clientId) {
    return apiCall(`${API_URL}/api/admin/clients/${clientId}/pairs`);
  },

  async createPair(clientId, data) {
    return apiCall(`${API_URL}/api/admin/clients/${clientId}/pairs`, {
      method: 'POST',
      body: JSON.stringify({ ...data, client_id: clientId }),
    });
  },

  async updatePair(pairId, data) {
    return apiCall(`${API_URL}/api/admin/pairs/${pairId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deletePair(pairId) {
    return apiCall(`${API_URL}/api/admin/pairs/${pairId}`, {
      method: 'DELETE',
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

  async getBots() {
    return apiCall(`${TRADING_BRIDGE_URL}/bots`);
  },

  async createBot({ name, account, strategy, connector, pair, config }) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/create`, {
      method: 'POST',
      body: JSON.stringify({ name, account, strategy, connector, pair, config }),
    });
  },

  async startBot(botId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}/start`, {
      method: 'POST',
    });
  },

  async stopBot(botId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}/stop`, {
      method: 'POST',
    });
  },

  async deleteBot(botId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}`, {
      method: 'DELETE',
    });
  },
};

// ========== CLIENT API ==========
export const clientAPI = {
  async getPortfolio() {
    return apiCall(`${API_URL}/api/clients/portfolio`);
  },

  async getBalances() {
    return apiCall(`${API_URL}/api/clients/balances`);
  },

  async getTrades(tradingPair = null, limit = 100, days = 7) {
    const params = new URLSearchParams({ limit: limit.toString(), days: days.toString() });
    if (tradingPair) params.append('trading_pair', tradingPair);
    return apiCall(`${API_URL}/api/clients/trades?${params}`);
  },

  async getVolume(days = 7) {
    return apiCall(`${API_URL}/api/clients/volume?days=${days}`);
  },

  async generateReport(format = 'json', days = 30) {
    const url = `${API_URL}/api/clients/report?format=${format}&days=${days}`;
    if (format === 'csv') {
      // For CSV, download the file
      const token = localStorage.getItem('access_token') || 
                    localStorage.getItem('pipelabs_token') || 
                    localStorage.getItem('auth_token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to generate report');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `trading_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      return { success: true };
    }
    return apiCall(url);
  },
};

export default { adminAPI, tradingBridge, clientAPI };
