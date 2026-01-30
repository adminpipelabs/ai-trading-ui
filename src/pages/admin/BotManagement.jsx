import React, { useState, useEffect, useMemo } from 'react';
import { BotList } from '../../components/BotList';
import EditBotModal from '../../components/EditBotModal';
import { Bot, Plus, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function BotManagement({ theme, isDark, onBack, activeChain = "all", setActiveChain }) {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [editingBot, setEditingBot] = useState(null);
  const [newBot, setNewBot] = useState({
    name: '',
    account: '',
    chain: 'solana', // 'solana', 'polygon', 'arbitrum', 'base', 'ethereum'
    strategy: 'spread',
    connector: 'bitmart',
    pair: 'SHARP/USDT',
    bid_spread: 0.003,
    ask_spread: 0.003,
    order_amount: 1000,
    // DEX fields
    bot_type: 'volume', // 'volume' or 'spread'
    wallet_address: '',
    private_key: '',
    base_mint: '',
    quote_mint: 'So11111111111111111111111111111111111111112', // SOL default
    // Volume bot config
    daily_volume_usd: 10000,
    min_trade_usd: 100,
    max_trade_usd: 500,
    interval_min_minutes: 15,
    interval_max_minutes: 45,
    randomize: true,
    slippage_pct: 0.5,
    // Spread bot config
    spread_pct: 0.5,
    order_size_usd: 500,
    refresh_seconds: 30,
    expire_hours: 1
  });

  // Helper functions - use useMemo to make them reactive
  const isDEX = useMemo(() => ['jupiter', 'raydium', 'uniswap'].includes(newBot.connector), [newBot.connector]);
  const isSolana = useMemo(() => newBot.chain === 'solana' || ['jupiter', 'raydium'].includes(newBot.connector), [newBot.chain, newBot.connector]);
  const isEVM = useMemo(() => ['polygon', 'arbitrum', 'base', 'ethereum'].includes(newBot.chain), [newBot.chain]);

  const fetchBots = async () => {
    // Get user info outside try block so it's available in catch
    const userStr = localStorage.getItem('user') || localStorage.getItem('pipelabs_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRole = user?.role;
    
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Check if user is logged in
      const walletAddress = user?.wallet_address;
      const token = localStorage.getItem('access_token') || localStorage.getItem('pipelabs_token');
      
      console.log('🔍 Fetching bots - Role:', userRole, 'Wallet address:', walletAddress ? `${walletAddress.substring(0, 8)}...` : 'NOT FOUND');
      console.log('🔍 Token present:', token ? 'YES' : 'NO');
      
      // Admin users should be able to see all bots even without wallet address
      // The backend should check JWT token role
      if (!token) {
        setError('Please log in to view bots.');
        setLoading(false);
        return;
      }
      
      const { tradingBridge } = await import('../../services/api');
      
      // Try admin endpoint first if admin, fallback to regular endpoint
      let data;
      if (userRole === 'admin') {
        try {
          // Try admin-specific endpoint if it exists
          const { adminAPI } = await import('../../services/api');
          // For now, use regular endpoint - backend should handle admin via JWT
          data = await tradingBridge.getBots();
        } catch (adminErr) {
          // Fallback to regular endpoint
          console.log('Admin endpoint failed, trying regular endpoint:', adminErr);
          data = await tradingBridge.getBots();
        }
      } else {
        // Client users need wallet address
        if (!walletAddress) {
          setError('Please log in to view bots. Your wallet address is required.');
          setLoading(false);
          return;
        }
        data = await tradingBridge.getBots();
      }
      
      // Handle both {bots: [...]} and [...] response formats
      const botsList = Array.isArray(data) ? data : (data.bots || []);
      setBots(botsList);
      console.log('✅ Loaded bots:', botsList.length, botsList);
    } catch (err) {
      console.error('❌ Failed to fetch bots:', err);
      console.error('Error details:', err.message, err.status, err.data);
      
      // More helpful error message
      if (err.message?.includes('X-Wallet-Address') || err.status === 401) {
        const currentUserRole = user?.role; // Get role again for error handling
        if (currentUserRole === 'admin') {
          setError('Backend authentication error. Admin should be able to view all bots. Please check backend logs. If this persists, try logging out and back in.');
        } else {
          setError('Authentication error: Please refresh the page and log in again.');
        }
      } else {
        setError(err.message || 'Failed to load bots');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartBot = async (botId) => {
    try {
      const { tradingBridge } = await import('../../services/api');
      await tradingBridge.startBot(botId);
      fetchBots(); // Refresh list
    } catch (err) {
      console.error('Failed to start bot:', err);
      alert(`Failed to start bot: ${err.message}`);
    }
  };

  const handleStopBot = async (botId) => {
    try {
      const { tradingBridge } = await import('../../services/api');
      await tradingBridge.stopBot(botId);
      fetchBots(); // Refresh list
    } catch (err) {
      console.error('Failed to stop bot:', err);
      alert(`Failed to stop bot: ${err.message}`);
    }
  };

  const handleCreateBot = async (e) => {
    e.preventDefault();
    try {
      const { tradingBridge } = await import('../../services/api');
      
      // Recompute helpers at submit time (not render time)
      const isDEXConnector = ['jupiter', 'raydium', 'uniswap'].includes(newBot.connector);
      
      // Validate DEX fields if DEX connector
      if (isDEXConnector) {
        // Validate required DEX fields
        if (!newBot.wallet_address || !newBot.private_key || !newBot.base_mint) {
          alert('Please fill in all required DEX fields: wallet address, private key, and base token.');
          return;
        }
        
        // Validate wallet address format based on chain
        if (isSolanaChain) {
          if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(newBot.wallet_address)) {
            alert('Invalid Solana wallet address. Must be 32-44 base58 characters.');
            return;
          }
        } else {
          // EVM address validation (0x followed by 40 hex characters)
          if (!/^0x[a-fA-F0-9]{40}$/.test(newBot.wallet_address)) {
            alert('Invalid EVM wallet address. Must be 0x followed by 40 hex characters.');
            return;
          }
        }
        
        // Validate token address format based on chain
        if (isSolanaChain) {
          if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(newBot.base_mint)) {
            alert('Invalid base token mint address. Must be 32-44 base58 characters.');
            return;
          }
        } else {
          // EVM address validation
          if (!/^0x[a-fA-F0-9]{40}$/.test(newBot.base_mint)) {
            alert('Invalid base token address. Must be 0x followed by 40 hex characters.');
            return;
          }
          // Validate quote token if provided (not using default)
          if (newBot.quote_mint && !/^0x[a-fA-F0-9]{40}$/.test(newBot.quote_mint)) {
            alert('Invalid quote token address. Must be 0x followed by 40 hex characters.');
            return;
          }
        }
        
        // Validate bot type specific fields
        if (newBot.bot_type === 'volume') {
          // Volume bot validation
          if (!newBot.daily_volume_usd || parseFloat(newBot.daily_volume_usd) < 100) {
            alert('Daily volume target must be at least $100.');
            return;
          }
          if (!newBot.min_trade_usd || !newBot.max_trade_usd) {
            alert('Please specify min and max trade sizes.');
            return;
          }
          if (parseFloat(newBot.max_trade_usd) <= parseFloat(newBot.min_trade_usd)) {
            alert('Max trade size must be greater than min trade size.');
            return;
          }
          if (!newBot.interval_min_minutes || !newBot.interval_max_minutes) {
            alert('Please specify min and max intervals.');
            return;
          }
          if (parseFloat(newBot.interval_max_minutes) <= parseFloat(newBot.interval_min_minutes)) {
            alert('Max interval must be greater than min interval.');
            return;
          }
        } else if (newBot.bot_type === 'spread') {
          // Spread bot validation
          if (!newBot.spread_pct || parseFloat(newBot.spread_pct) < 0.1) {
            alert('Spread must be at least 0.1%.');
            return;
          }
          if (!newBot.order_size_usd || parseFloat(newBot.order_size_usd) < 10) {
            alert('Order size must be at least $10.');
            return;
          }
          if (!newBot.refresh_seconds || parseFloat(newBot.refresh_seconds) < 10) {
            alert('Refresh interval must be at least 10 seconds.');
            return;
          }
        }
      } else {
        // Validate CEX fields
        if (!newBot.pair || !newBot.strategy) {
          alert('Please fill in all required CEX fields: trading pair and strategy.');
          return;
        }
      }
      
      // Validate account is selected
      if (!newBot.account) {
        alert('Please select a client account.');
        return;
      }
      
      // Format payload based on connector type
      let payload;
      
      // Debug: Log the account value
      console.log('🔍 Creating bot with account:', newBot.account);
      console.log('🔍 Available clients:', clients.map(c => ({ name: c.name, account_identifier: c.account_identifier })));
      
      // Ensure we're using account_identifier, not name
      const selectedClient = clients.find(c => c.account_identifier === newBot.account || c.name === newBot.account);
      const accountToUse = selectedClient ? selectedClient.account_identifier : newBot.account;
      
      if (!accountToUse) {
        alert('Invalid account selected. Please select a client from the dropdown.');
        return;
      }
      
      console.log('✅ Using account_identifier:', accountToUse);
      console.log('📦 Full payload will be sent with account:', accountToUse);
      
      if (isDEXConnector) {
        // DEX bot payload
        const baseConfig = {
          chain: newBot.chain || 'solana', // Include chain in config
        };
        
        if (isSolanaChain) {
          // Solana config uses mint addresses
          baseConfig.base_mint = newBot.base_mint;
          baseConfig.quote_mint = newBot.quote_mint;
        } else {
          // EVM config uses token addresses
          baseConfig.base_token = newBot.base_mint;
          baseConfig.quote_token = newBot.quote_mint || (newBot.chain === 'polygon' 
            ? '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' // USDC Polygon
            : '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'); // USDC Arbitrum/Base
        }
        
        payload = {
          name: newBot.name,
          account: accountToUse,
          bot_type: newBot.bot_type, // 'volume' or 'spread'
          connector: newBot.connector, // Include connector for consistency
          config: newBot.bot_type === 'volume' ? {
            ...baseConfig,
            daily_volume_usd: parseFloat(newBot.daily_volume_usd),
            min_trade_usd: parseFloat(newBot.min_trade_usd),
            max_trade_usd: parseFloat(newBot.max_trade_usd),
            interval_min_seconds: parseFloat(newBot.interval_min_minutes) * 60,
            interval_max_seconds: parseFloat(newBot.interval_max_minutes) * 60,
            slippage_bps: parseFloat(newBot.slippage_pct) * 100
          } : {
            ...baseConfig,
            spread_bps: parseFloat(newBot.spread_pct) * 100,
            order_size_usd: parseFloat(newBot.order_size_usd),
            refresh_seconds: parseFloat(newBot.refresh_seconds),
            expire_seconds: parseFloat(newBot.expire_hours) * 3600
          },
          wallets: [{
            address: newBot.wallet_address,
            private_key: newBot.private_key
          }]
        };
      } else {
        // CEX bot payload (existing format)
        payload = {
          name: newBot.name,
          account: accountToUse,
          strategy: newBot.strategy,
          connector: newBot.connector,
          pair: newBot.pair,
          config: {
            bid_spread: parseFloat(newBot.bid_spread),
            ask_spread: parseFloat(newBot.ask_spread),
            order_amount: parseFloat(newBot.order_amount)
          }
        };
      }
      
      // Final validation - ensure account_identifier format
      if (!payload.account.startsWith('client_')) {
        console.warn('⚠️ Account does not start with "client_":', payload.account);
        // Try to find and fix it
        const fixedClient = clients.find(c => c.name === payload.account);
        if (fixedClient && fixedClient.account_identifier) {
          console.log('✅ Fixed account from', payload.account, 'to', fixedClient.account_identifier);
          payload.account = fixedClient.account_identifier;
        }
      }
      
      console.log('📤 Sending bot creation payload:', JSON.stringify(payload, null, 2));
      
      // Show loading state
      setError(null);
      
      const result = await tradingBridge.createBot(payload);
      
      // Success - show confirmation
      alert(`✅ Bot "${newBot.name}" created successfully!${result.id ? `\nBot ID: ${result.id}` : ''}\n\nYou can now start the bot from the bot list.`);
      
      setShowCreateBot(false);
      // Reset form
      setNewBot({
        name: '',
        account: clients.length > 0 ? clients[0].account_identifier : '',
        strategy: 'spread',
        connector: 'bitmart',
        pair: 'SHARP/USDT',
        bid_spread: 0.003,
        ask_spread: 0.003,
        order_amount: 1000,
        chain: 'solana',
        bot_type: 'volume',
        wallet_address: '',
        private_key: '',
        base_mint: '',
        quote_mint: 'So11111111111111111111111111111111111111112',
        daily_volume_usd: 10000,
        min_trade_usd: 100,
        max_trade_usd: 500,
        interval_min_minutes: 15,
        interval_max_minutes: 45,
        randomize: true,
        slippage_pct: 0.5,
        spread_pct: 0.5,
        order_size_usd: 500,
        refresh_seconds: 30,
        expire_hours: 1
      });
      setShowPrivateKey(false);
      
      // Wait a moment for backend to process, then refresh list
      setTimeout(() => {
        fetchBots();
      }, 1000);
    } catch (err) {
      console.error('Failed to create bot:', err);
      const errorMessage = err.message || err.data?.detail || err.detail || 'Unknown error';
      setError(errorMessage);
      alert(`❌ Failed to create bot:\n\n${errorMessage}\n\nPlease check:\n- All required fields are filled\n- Wallet address format is correct\n- You are logged in`);
    }
  };

  // Load clients for account dropdown
  useEffect(() => {
    const loadClients = async () => {
      try {
        setClientsLoading(true);
        const { adminAPI } = await import('../../services/api');
        const data = await adminAPI.getClients();
        // Transform to include account_identifier
        const transformedClients = (data || []).map(client => ({
          id: client.id,
          name: client.name,
          account_identifier: client.account_identifier || `client_${client.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`
        }));
        setClients(transformedClients);
        // Set default account if available
        if (transformedClients.length > 0 && !newBot.account) {
          setNewBot(prev => ({ ...prev, account: transformedClients[0].account_identifier }));
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
        setClients([]);
      } finally {
        setClientsLoading(false);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    fetchBots();
    // Refresh every 10 seconds
    const interval = setInterval(fetchBots, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: theme.textPrimary }}>Bot Management</h1>
        <p className="text-sm" style={{ color: theme.textMuted }}>Create and manage your trading bots</p>
      </div>

      <div className="mb-6">
        <button 
          onClick={() => setShowCreateBot(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: theme.accent, color: 'white' }}>
          <Plus size={18} />Create Bot
        </button>
      </div>

      {/* Create Bot Modal */}
      {showCreateBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl p-6 rounded-xl my-8" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: theme.textPrimary }}>Create New Bot</h2>
              <button onClick={() => setShowCreateBot(false)} className="p-1 rounded" style={{ color: theme.textMuted }}>
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b' }}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              </div>
            )}
            <form onSubmit={handleCreateBot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Bot Name</label>
                <input
                  type="text"
                  value={newBot.name}
                  onChange={(e) => setNewBot({...newBot, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                  placeholder="e.g., Sharp Spread Bot"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Account (Client)</label>
                {clientsLoading ? (
                  <div className="px-3 py-2 text-sm" style={{ color: theme.textMuted }}>Loading clients...</div>
                ) : clients.length === 0 ? (
                  <div className="px-3 py-2 text-sm rounded-lg" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                    ⚠️ No clients found. Please create a client first.
                  </div>
                ) : (
                  <select
                    value={newBot.account}
                    onChange={(e) => setNewBot({...newBot, account: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                    required
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.account_identifier}>
                        {client.name} ({client.account_identifier})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Chain Selection - Show for DEX bots */}
              {['jupiter', 'raydium', 'uniswap'].includes(newBot.connector) && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Chain</label>
                  <select
                    value={newBot.chain}
                    onChange={(e) => {
                      const chain = e.target.value;
                      setNewBot(prev => ({
                        ...prev,
                        chain,
                        // Auto-set connector based on chain
                        connector: chain === 'solana' ? 'jupiter' : 'uniswap',
                        // Reset token addresses when switching chains
                        base_mint: '',
                        quote_mint: chain === 'solana' 
                          ? 'So11111111111111111111111111111111111111112' // SOL
                          : (chain === 'polygon' 
                            ? '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' // USDC Polygon
                            : '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'), // USDC Arbitrum/Base
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                    required
                  >
                    <option value="solana">◎ Solana</option>
                    <option value="polygon">⟠ Polygon</option>
                    <option value="arbitrum">⟠ Arbitrum</option>
                    <option value="base">⟠ Base</option>
                    <option value="ethereum">⟠ Ethereum</option>
                  </select>
                </div>
              )}
              
              {/* Connector - Always visible */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Connector</label>
                <select
                  value={newBot.connector}
                  onChange={(e) => {
                    const connector = e.target.value;
                    setNewBot({...newBot, connector});
                    // Reset DEX-specific fields when switching to CEX
                    if (!['jupiter', 'raydium', 'uniswap'].includes(connector)) {
                      setNewBot(prev => ({
                        ...prev,
                        connector,
                        pair: prev.pair || 'SHARP/USDT',
                        strategy: prev.strategy || 'spread'
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                >
                  <optgroup label="CEX">
                    <option value="bitmart">BitMart</option>
                    <option value="binance">Binance</option>
                    <option value="kucoin">KuCoin</option>
                  </optgroup>
                  {newBot.chain === 'solana' && (
                    <optgroup label="DEX (Solana)">
                      <option value="jupiter">Jupiter</option>
                      <option value="raydium" disabled>Raydium (Coming Soon)</option>
                    </optgroup>
                  )}
                  {isEVM && (
                    <optgroup label="DEX (EVM)">
                      <option value="uniswap">Uniswap</option>
                    </optgroup>
                  )}
                </select>
              </div>

              {/* CEX Fields - Show only when CEX connector selected */}
              {!['jupiter', 'raydium', 'uniswap'].includes(newBot.connector) && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Strategy</label>
                    <select
                      value={newBot.strategy}
                      onChange={(e) => setNewBot({...newBot, strategy: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                    >
                      <option value="spread">Spread Trading</option>
                      <option value="volume">Volume Trading</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Trading Pair</label>
                    <input
                      type="text"
                      value={newBot.pair}
                      onChange={(e) => setNewBot({...newBot, pair: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      placeholder="SHARP/USDT"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Bid Spread</label>
                      <input
                        type="number"
                        step="0.001"
                        value={newBot.bid_spread}
                        onChange={(e) => setNewBot({...newBot, bid_spread: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Ask Spread</label>
                      <input
                        type="number"
                        step="0.001"
                        value={newBot.ask_spread}
                        onChange={(e) => setNewBot({...newBot, ask_spread: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Order Amount</label>
                    <input
                      type="number"
                      value={newBot.order_amount}
                      onChange={(e) => setNewBot({...newBot, order_amount: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      required
                    />
                  </div>
                </>
              )}

              {/* DEX Fields - Show only when DEX connector selected */}
              {['jupiter', 'raydium', 'uniswap'].includes(newBot.connector) && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Bot Type</label>
                    <select
                      value={newBot.bot_type}
                      onChange={(e) => setNewBot({...newBot, bot_type: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                    >
                      <option value="volume">Volume Generation</option>
                      <option value="spread">Market Making (Spread)</option>
                    </select>
                  </div>

                  {/* Wallet Configuration */}
                  <div className="pt-2 border-t" style={{ borderColor: theme.border }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>Wallet Configuration</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Trading Wallet Address</label>
                        <input
                          type="text"
                          value={newBot.wallet_address}
                          onChange={(e) => setNewBot({...newBot, wallet_address: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                          style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                          placeholder={isSolana 
                            ? "BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
                            : "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}
                          required
                        />
                        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                          {isSolana 
                            ? "Solana wallet address (base58)"
                            : "EVM wallet address (0x...)"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Private Key</label>
                        <div className="relative">
                          <input
                            type={showPrivateKey ? "text" : "password"}
                            value={newBot.private_key}
                            onChange={(e) => setNewBot({...newBot, private_key: e.target.value})}
                            className="w-full px-3 py-2 pr-10 rounded-lg text-sm font-mono"
                            style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            placeholder="Base58 encoded private key"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                            style={{ color: theme.textMuted }}
                          >
                            {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                          🔒 Encrypted and stored securely
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Token Configuration */}
                  <div className="pt-2 border-t" style={{ borderColor: theme.border }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>Token Configuration</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>
                          {isSolana ? 'Base Token Mint Address' : 'Base Token Address'}
                        </label>
                        <input
                          type="text"
                          value={newBot.base_mint}
                          onChange={(e) => setNewBot({...newBot, base_mint: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                          style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                          placeholder={isSolana 
                            ? "HZG1RVn4zcRM7zEFEVGYPGoPzPAWAj2AAdvQivfmLYNK"
                            : "0xb36b62929762acf8a9cc27ecebf6d353ebb48244"}
                          required
                        />
                        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                          {isSolana 
                            ? "Solana token mint address (base58)"
                            : "EVM token contract address (0x...)"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>
                          {isSolana ? 'Quote Token Mint' : 'Quote Token Address'}
                        </label>
                        {isSolana ? (
                          <select
                            value={newBot.quote_mint}
                            onChange={(e) => setNewBot({...newBot, quote_mint: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            required
                          >
                            <option value="So11111111111111111111111111111111111111112">SOL</option>
                            <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={newBot.quote_mint}
                            onChange={(e) => setNewBot({...newBot, quote_mint: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                            style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            placeholder={newBot.chain === 'polygon' 
                              ? "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
                              : "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"}
                            required
                          />
                        )}
                        {!isSolana && (
                          <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                            Default: USDC for {newBot.chain}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Volume Bot Config */}
                  {newBot.bot_type === 'volume' && (
                    <div className="pt-2 border-t" style={{ borderColor: theme.border }}>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>Volume Settings</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Daily Volume Target (USD)</label>
                          <input
                            type="number"
                            value={newBot.daily_volume_usd}
                            onChange={(e) => setNewBot({...newBot, daily_volume_usd: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            min="100"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Min Trade (USD)</label>
                            <input
                              type="number"
                              value={newBot.min_trade_usd}
                              onChange={(e) => setNewBot({...newBot, min_trade_usd: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                              min="10"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Max Trade (USD)</label>
                            <input
                              type="number"
                              value={newBot.max_trade_usd}
                              onChange={(e) => setNewBot({...newBot, max_trade_usd: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                              min="10"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Min Interval (min)</label>
                            <input
                              type="number"
                              value={newBot.interval_min_minutes}
                              onChange={(e) => setNewBot({...newBot, interval_min_minutes: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                              min="1"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Max Interval (min)</label>
                            <input
                              type="number"
                              value={newBot.interval_max_minutes}
                              onChange={(e) => setNewBot({...newBot, interval_max_minutes: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                              min="1"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Slippage Tolerance (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={newBot.slippage_pct}
                            onChange={(e) => setNewBot({...newBot, slippage_pct: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            min="0.1"
                            max="5"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spread Bot Config */}
                  {newBot.bot_type === 'spread' && (
                    <div className="pt-2 border-t" style={{ borderColor: theme.border }}>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>Spread Settings</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Spread (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={newBot.spread_pct}
                            onChange={(e) => setNewBot({...newBot, spread_pct: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            min="0.1"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Order Size (USD per side)</label>
                          <input
                            type="number"
                            value={newBot.order_size_usd}
                            onChange={(e) => setNewBot({...newBot, order_size_usd: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            min="10"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Refresh Interval (seconds)</label>
                          <input
                            type="number"
                            value={newBot.refresh_seconds}
                            onChange={(e) => setNewBot({...newBot, refresh_seconds: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            min="10"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Order Expiry (hours)</label>
                          <input
                            type="number"
                            value={newBot.expire_hours}
                            onChange={(e) => setNewBot({...newBot, expire_hours: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            min="0.5"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateBot(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: theme.bgSecondary, color: theme.textSecondary }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: theme.positive }}
                >
                  Create Bot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chain Filter */}
      <div className="mb-6 flex gap-2" style={{ background: theme.bgCard, padding: 4, borderRadius: 8, border: `1px solid ${theme.border}` }}>
        {[
          { id: "all", label: "All Chains" },
          { id: "evm", label: "⟠ EVM" },
          { id: "solana", label: "◎ Solana" },
        ].map(c => (
          <button
            key={c.id}
            onClick={() => setActiveChain && setActiveChain(c.id)}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              background: activeChain === c.id ? theme.accent : "transparent",
              color: activeChain === c.id ? "white" : theme.textMuted
            }}
          >{c.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: theme.textMuted }}>Loading bots...</div>
      ) : error ? (
        <div className="p-12 rounded-xl text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: theme.negative }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>Error loading bots</h3>
          <p style={{ color: theme.textMuted }}>{error}</p>
          <button onClick={fetchBots} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: theme.accent, color: 'white' }}>
            Retry
          </button>
        </div>
      ) : bots.length === 0 ? (
        <div className="p-12 rounded-xl text-center" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          <Bot size={48} className="mx-auto mb-4" style={{ opacity: 0.5, color: theme.textMuted }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>No bots yet</h3>
          <p style={{ color: theme.textMuted }}>Create your first trading bot to get started</p>
        </div>
      ) : (
        <div className="rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, padding: '16px' }}>
          <BotList account={null} readOnly={false} activeChain={activeChain} onEditBot={(bot) => {
            setEditingBot(bot);
          }} />
        </div>
      )}
      
      {/* Edit Bot Modal */}
      <EditBotModal
        bot={editingBot}
        isOpen={!!editingBot}
        onClose={() => setEditingBot(null)}
        onSave={async (botId, payload) => {
          try {
            const { tradingBridge } = await import('../../services/api');
            await tradingBridge.updateBot(botId, payload);
            alert(`Bot "${payload.name}" updated successfully.`);
            fetchBots(); // Refresh bot list
          } catch (err) {
            console.error("Failed to update bot", err);
            throw new Error(err.message || 'Failed to update bot');
          }
        }}
      />
    </div>
  );
}
