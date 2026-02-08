// API Configuration - ALL calls go to trading-bridge (consolidated backend)
const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';
const API_URL = TRADING_BRIDGE_URL; // Use trading-bridge for everything

// Helper function for API calls
async function apiCall(url, options = {}) {
  // Check multiple possible token keys for compatibility
  const token = localStorage.getItem('access_token') || 
                localStorage.getItem('pipelabs_token') || 
                localStorage.getItem('auth_token');
  
  // Get wallet address from localStorage for X-Wallet-Address header
  let walletAddress = null;
  try {
    const userStr = localStorage.getItem('user') || localStorage.getItem('pipelabs_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      walletAddress = user.wallet_address;
    }
  } catch (e) {
    console.warn('Failed to parse user from localStorage:', e);
  }
  
  // Build headers - match what works in curl
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(walletAddress && { 'X-Wallet-Address': walletAddress }),
    ...options.headers,
  };
  
  // Debug log for bot endpoints
  if (url.includes('/bots')) {
    console.log('🔍 API Call to /bots:', {
      url,
      method: options.method || 'GET',
      hasWalletAddress: !!walletAddress,
      walletAddress: walletAddress ? `${walletAddress.substring(0, 8)}...` : 'MISSING',
      hasToken: !!token,
      headers: Object.keys(headers)
    });
  }
  
  let response;
  try {
    // Build fetch options - explicit CORS mode for cross-origin requests
    const fetchOptions = {
      method: options.method || 'GET',
      headers: headers,
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit', // Don't send cookies (not needed for API)
      ...(options.body && { body: options.body }),
    };
    
    // Make the request
    response = await fetch(url, fetchOptions);
    
    console.log('📥 Fetch response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
  } catch (fetchError) {
    // Network error - fetch failed before getting a response
    console.error('❌ Fetch failed (network/CORS error):', {
      url,
      error: fetchError.message,
      name: fetchError.name,
      type: fetchError.type,
      stack: fetchError.stack
    });
    
    // Provide more helpful error message
    let errorMessage = 'Failed to connect to server';
    if (fetchError.message.includes('Failed to fetch') || fetchError.name === 'TypeError') {
      errorMessage = `Network error: Cannot reach ${url}\n\nPossible causes:\n- CORS blocking (check Network tab)\n- Server not responding\n- Network issue\n\nStatus: ${fetchError.type || 'unknown'}`;
    } else {
      errorMessage = `Network error: ${fetchError.message}`;
    }
    
    const networkError = new Error(errorMessage);
    networkError.isNetworkError = true;
    networkError.originalError = fetchError;
    networkError.url = url;
    throw networkError;
  }
  
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
    // Use trading-bridge for updates (PUT endpoint)
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async addClientWallet(clientId, walletAddress, chain) {
    // Add a wallet to a client
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}/wallet`, {
      method: 'PUT',
      body: JSON.stringify({
        chain: chain || (walletAddress.startsWith('0x') ? 'evm' : 'solana'),
        address: walletAddress
      }),
    });
  },

  async updateClientWallet(clientId, walletId, walletAddress, chain) {
    // Update an existing wallet
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}/wallet/${walletId}`, {
      method: 'PUT',
      body: JSON.stringify({
        chain: chain || (walletAddress.startsWith('0x') ? 'evm' : 'solana'),
        address: walletAddress
      }),
    });
  },

  async deleteClientWallet(clientId, walletId) {
    // Delete a wallet from a client
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}/wallet/${walletId}`, {
      method: 'DELETE',
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

  async getClientBalances(clientId) {
    // Get balances for a client using account_identifier (for BitMart API keys)
    return apiCall(`${TRADING_BRIDGE_URL}/api/admin/clients/${clientId}/balances`);
  },

  async addClientApiKey(clientId, data) {
    // Add connector to trading-bridge
    // Note: Only CEX connectors are supported here (api_key/api_secret)
    // DEX connectors (Uniswap, Jupiter) use wallets in bot creation, not client connectors
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
    
    // Get bots for this account - NO bot_type filter, get ALL bots
    const botsResponse = await apiCall(`${TRADING_BRIDGE_URL}/bots?account=${encodeURIComponent(account)}`);
    const bots = botsResponse.bots || [];
    
    // Debug logging - detailed
    console.log(`[getClientPairs] Client ${clientId}, Account: ${account}`);
    console.log(`  Found ${bots.length} bots from API:`, bots.map(b => ({ 
      id: b.id, 
      name: b.name, 
      bot_type: b.bot_type || 'NULL', 
      strategy: b.strategy, 
      status: b.status,
      account: b.account,
      client_id: b.client_id
    })));
    
    // Transform bots to pairs format for frontend compatibility
    // IMPORTANT: Include ALL bots regardless of bot_type value (even if NULL)
    const transformed = bots.map(bot => ({
      id: bot.id,
      client_id: clientId,
      trading_pair: bot.pair,
      bot_type: bot.bot_type || bot.strategy || 'unknown', // Use bot_type field first, fallback to strategy, then 'unknown'
      status: bot.status === 'running' ? 'active' : 'paused',
      connector: bot.connector,
      config: bot.config,
      name: bot.name,
      strategy: bot.strategy
    }));
    
    console.log(`  Transformed ${transformed.length} bots:`, transformed.map(b => ({ 
      id: b.id, 
      name: b.name, 
      bot_type: b.bot_type, 
      status: b.status 
    })));
    
    return transformed;
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

  async createBot(payload) {
    // Accept full payload - supports both CEX and DEX bots
    // CEX: { name, account, strategy, connector, pair, config }
    // DEX: { name, account, bot_type, config, wallets }
    return apiCall(`${TRADING_BRIDGE_URL}/bots/create`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async startBot(botId) {
    // Use apiCall wrapper - same as stopBot and other endpoints
    // This ensures consistent error handling, CORS, and headers
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}/start`, {
      method: 'POST',
      body: JSON.stringify({}), // Empty body for POST
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

  async updateBot(botId, payload) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Health monitoring endpoints
  async getBotHealth(botId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}/health`);
  },

  async getHealthSummary(account = null) {
    const url = account
      ? `${TRADING_BRIDGE_URL}/bots/health/summary?account=${encodeURIComponent(account)}`
      : `${TRADING_BRIDGE_URL}/bots/health/summary`;
    return apiCall(url);
  },

  // Client key management endpoints
  async getClientKeyStatus(clientId) {
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}/key-status`);
  },

  async getClientBotOptions(clientId) {
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}/bot-options`);
  },

  async setupClientBot(clientId, payload) {
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}/setup-bot`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async rotateClientKey(clientId, privateKey) {
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}/rotate-key`, {
      method: 'PUT',
      body: JSON.stringify({ private_key: privateKey }),
    });
  },

  async revokeClientKey(clientId) {
    return apiCall(`${TRADING_BRIDGE_URL}/clients/${clientId}/revoke-key`, {
      method: 'DELETE',
    });
  },

  async forceHealthCheck(botId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}/health/check`, {
      method: 'POST',
    });
  },

  async getBotBalance(botId, chain = null) {
    const endpoint = chain === 'solana'
      ? `${TRADING_BRIDGE_URL}/bots/${botId}/balance/solana`
      : `${TRADING_BRIDGE_URL}/bots/${botId}/balance`;
    return apiCall(endpoint);
  },
};

// ========== CLIENT API ==========
export const clientAPI = {
  async getDashboard(accountIdentifier) {
    // New optimized endpoint - gets all data in one call
    return apiCall(`${TRADING_BRIDGE_URL}/api/exchange/dashboard/${encodeURIComponent(accountIdentifier)}`);
  },

  async getPortfolio(walletAddress = null) {
    // Get wallet_address from localStorage if not provided
    if (!walletAddress) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          walletAddress = user.wallet_address;
        } catch (e) {
          console.warn('Failed to parse user from localStorage');
        }
      }
    }
    if (!walletAddress) {
      throw new Error('Wallet address is required. Please log in.');
    }
    return apiCall(`${TRADING_BRIDGE_URL}/api/clients/portfolio?wallet_address=${encodeURIComponent(walletAddress)}`);
  },

  async getBalances(walletAddress = null) {
    // Get wallet_address from localStorage if not provided
    if (!walletAddress) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          walletAddress = user.wallet_address;
        } catch (e) {
          console.warn('Failed to parse user from localStorage');
        }
      }
    }
    if (!walletAddress) {
      throw new Error('Wallet address is required. Please log in.');
    }
    return apiCall(`${TRADING_BRIDGE_URL}/api/clients/balances?wallet_address=${encodeURIComponent(walletAddress)}`);
  },

  async getTrades(tradingPair = null, limit = 100, days = 7, walletAddress = null) {
    // Get wallet_address from localStorage if not provided
    if (!walletAddress) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          walletAddress = user.wallet_address;
        } catch (e) {
          console.warn('Failed to parse user from localStorage');
        }
      }
    }
    if (!walletAddress) {
      throw new Error('Wallet address is required. Please log in.');
    }
    const params = new URLSearchParams({ 
      wallet_address: walletAddress,
      limit: limit.toString(), 
      days: days.toString() 
    });
    if (tradingPair) params.append('trading_pair', tradingPair);
    return apiCall(`${TRADING_BRIDGE_URL}/api/clients/trades?${params}`);
  },

  async getVolume(days = 7, walletAddress = null) {
    // Get wallet_address from localStorage if not provided
    if (!walletAddress) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          walletAddress = user.wallet_address;
        } catch (e) {
          console.warn('Failed to parse user from localStorage');
        }
      }
    }
    if (!walletAddress) {
      throw new Error('Wallet address is required. Please log in.');
    }
    return apiCall(`${TRADING_BRIDGE_URL}/api/clients/volume?wallet_address=${encodeURIComponent(walletAddress)}&days=${days}`);
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
