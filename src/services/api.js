// API Configuration - ALL calls go to trading-bridge (consolidated backend)
const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';
const API_URL = TRADING_BRIDGE_URL; // Use trading-bridge for everything

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
// CONSOLIDATED: All client management now uses trading-bridge
export const adminAPI = {
  async getOverview() {
    // Use trading-bridge for overview
    return apiCall(`${TRADING_BRIDGE_URL}/api/admin/overview`);
  },

  async getClients() {
    // Use trading-bridge for client list
    const response = await apiCall(`${TRADING_BRIDGE_URL}/clients`);
    // trading-bridge returns {"clients": [...]}, extract array
    return Array.isArray(response) ? response : (response.clients || []);
  },

  async getClient(clientId) {
    // Use trading-bridge for client details
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}`);
  },

  async createClient(data) {
    // Transform frontend format to trading-bridge format
    const wallets = data.wallet_address ? [{
      chain: data.wallet_type?.toLowerCase() || (data.wallet_address.startsWith('0x') ? 'evm' : 'solana'),
      address: data.wallet_address
    }] : [];
    
    const requestBody = {
      name: data.name,
      account_identifier: data.account_identifier || `client_${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
      wallets: wallets,
      connectors: [] // Will be added separately via addClientApiKey
    };
    
    const response = await apiCall(`${TRADING_BRIDGE_URL}/clients/create`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    return response;
  },

  async updateClient(clientId, data) {
    // Use trading-bridge for updates
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteClient(clientId) {
    // Use trading-bridge for deletion
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}`, {
      method: 'DELETE',
    });
  },

  async getClientApiKeys(clientId) {
    // Get connectors from trading-bridge
    const client = await apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}`);
    return client.connectors || [];
  },

  async addClientApiKey(clientId, data) {
    // Add connector to trading-bridge
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}/connector`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.exchange || data.name,
        api_key: data.apiKey || data.api_key,
        api_secret: data.apiSecret || data.api_secret,
        memo: data.memo || null
      }),
    });
  },

  async deleteClientApiKey(clientId, keyId) {
    // trading-bridge doesn't have delete connector endpoint yet
    // For now, return success (connector deletion can be added later)
    console.warn('Connector deletion not yet implemented in trading-bridge');
    return { success: true };
  },

  async sendInvite(clientId) {
    // Use trading-bridge for invites
    return apiCall(`${TRADING_BRIDGE_URL}/api/admin/clients/${clientId}/invite`, {
      method: 'POST',
    });
  },

  // Trading Pairs / Bots - Use trading-bridge bots endpoints
  async getClientPairs(clientId) {
    // Get client's account_identifier first
    const client = await apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}`);
    const account = client.account_identifier;
    
    // Get bots for this account
    const botsResponse = await apiCall(`${TRADING_BRIDGE_URL}/bots?account=${encodeURIComponent(account)}`);
    const bots = botsResponse.bots || [];
    
    // Transform bots to pairs format for frontend compatibility
    return bots.map(bot => ({
      id: bot.id,
      client_id: clientId,
      trading_pair: bot.pair,
      bot_type: bot.strategy,
      status: bot.status === 'running' ? 'active' : 'paused',
      connector: bot.connector,
      config: bot.config
    }));
  },

  async createPair(clientId, data) {
    // Get client's account_identifier
    const client = await apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}`);
    const account = client.account_identifier;
    
    // Create bot via trading-bridge
    return apiCall(`${TRADING_BRIDGE_URL}/bots/create`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name || `${data.trading_pair}_${data.bot_type}`,
        account: account,
        strategy: data.bot_type || 'spread',
        connector: data.connector || 'bitmart',
        pair: data.trading_pair,
        config: data.config || {}
      }),
    });
  },

  async updatePair(pairId, data) {
    // Update bot status via trading-bridge
    if (data.status === 'active') {
      return apiCall(`${TRADING_BRIDGE_URL}/bots/${pairId}/start`, {
        method: 'POST',
      });
    } else if (data.status === 'paused') {
      return apiCall(`${TRADING_BRIDGE_URL}/bots/${pairId}/stop`, {
        method: 'POST',
      });
    }
    return { success: true };
  },

  async deletePair(pairId) {
    // Delete bot via trading-bridge
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${pairId}`, {
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

  async getBots(account = null) {
    const url = account ? `${TRADING_BRIDGE_URL}/bots?account=${encodeURIComponent(account)}` : `${TRADING_BRIDGE_URL}/bots`;
    return apiCall(url);
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
    return apiCall(`${TRADING_BRIDGE_URL}/api/clients/portfolio`);
  },

  async getBalances() {
    return apiCall(`${TRADING_BRIDGE_URL}/api/clients/balances`);
  },

  async getTrades(tradingPair = null, limit = 100, days = 7) {
    const params = new URLSearchParams({ limit: limit.toString(), days: days.toString() });
    if (tradingPair) params.append('trading_pair', tradingPair);
    return apiCall(`${TRADING_BRIDGE_URL}/api/clients/trades?${params}`);
  },

  async getVolume(days = 7) {
    return apiCall(`${TRADING_BRIDGE_URL}/api/clients/volume?days=${days}`);
  },

  async getClientByWallet(walletAddress) {
    // Use trading-bridge endpoint for wallet-to-account mapping
    const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';
    return apiCall(`${TRADING_BRIDGE_URL}/clients/by-wallet/${encodeURIComponent(walletAddress)}`);
  },

  async generateReport(format = 'json', days = 30) {
    const url = `${TRADING_BRIDGE_URL}/api/clients/report?format=${format}&days=${days}`;
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
