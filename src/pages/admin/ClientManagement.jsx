import React, { useState, useEffect } from 'react';
import { BotList } from '../../components/BotList';
import { EditClientModal } from './EditClientModal';
import { 
  Send, Bot, Users, Plus, ArrowLeft, Search, UserPlus, Key, Mail, Building, 
  Clock, Wallet, Edit2, Trash2, AlertCircle, CheckCircle2, X, Eye, EyeOff, 
  Activity, RefreshCw
} from 'lucide-react';
// Theme is passed as props, no need to import useTheme

// EXCHANGES constant - list of supported exchanges
const EXCHANGES = [
  // CLOB CEX (Centralized Exchanges)
  { id: 'binance', name: 'Binance', requiresMemo: false },
  { id: 'bitget', name: 'Bitget', requiresMemo: false },
  { id: 'bitmart', name: 'BitMart', requiresMemo: true },
  { id: 'derive', name: 'Derive', requiresMemo: false },
  { id: 'dydx', name: 'dYdX', requiresMemo: false },
  { id: 'gateio', name: 'Gate.io', requiresMemo: false },
  { id: 'htx', name: 'HTX (Huobi)', requiresMemo: false },
  { id: 'hyperliquid', name: 'Hyperliquid', requiresMemo: false },
  { id: 'kucoin', name: 'KuCoin', requiresMemo: true },
  { id: 'okx', name: 'OKX', requiresMemo: true },
  { id: 'xrpl', name: 'XRP Ledger', requiresMemo: false },
  { id: 'ascendex', name: 'AscendEx', requiresMemo: false },
  { id: 'bitstamp', name: 'Bitstamp', requiresMemo: false },
  { id: 'bitrue', name: 'Bitrue', requiresMemo: false },
  { id: 'bingx', name: 'BingX', requiresMemo: false },
  { id: 'bybit', name: 'Bybit', requiresMemo: false },
  { id: 'btc_markets', name: 'BTC Markets', requiresMemo: false },
  { id: 'coinbase', name: 'Coinbase', requiresMemo: false },
  { id: 'kraken', name: 'Kraken', requiresMemo: false },
  { id: 'mexc', name: 'MEXC', requiresMemo: false },
  { id: 'ndax', name: 'NDAX', requiresMemo: false },
  
  // CLOB DEX (Decentralized Exchanges)
  { id: 'vertex', name: 'Vertex', requiresMemo: false },
  
  // Gateway DEX (AMM/DEX via Gateway)
  { id: 'balancer', name: 'Balancer', requiresMemo: false },
  { id: 'cube', name: 'Cube', requiresMemo: false },
  { id: 'curve', name: 'Curve', requiresMemo: false },
  { id: 'dexalot', name: 'Dexalot', requiresMemo: false },
  { id: 'etcswap', name: 'ETCSwap', requiresMemo: false },
  { id: 'foxbit', name: 'Foxbit', requiresMemo: false },
  { id: 'injective', name: 'Injective Helix', requiresMemo: false },
  { id: 'jupiter', name: 'Jupiter', requiresMemo: false },
  { id: 'meteora', name: 'Meteora', requiresMemo: false },
  { id: 'pancakeswap', name: 'Pancakeswap', requiresMemo: false },
  { id: 'orca', name: 'Orca', requiresMemo: false },
  { id: 'raydium', name: 'Raydium', requiresMemo: false },
  { id: 'quickswap', name: 'Quickswap', requiresMemo: false },
  { id: 'sushiswap', name: 'Sushiswap', requiresMemo: false },
  { id: 'traderjoe', name: 'TraderJoe', requiresMemo: false },
  { id: 'uniswap', name: 'Uniswap', requiresMemo: false },
  { id: 'gateway', name: 'Gateway DEX', requiresMemo: false },
];

// ========== CLIENT MANAGEMENT PAGE ==========
export default function ClientManagement({ onBack, onAddClient, clients, setClients, theme, isDark }) {
  // theme and isDark passed as props
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showApiKeysModal, setShowApiKeysModal] = useState(null);
  const [showPairsModal, setShowPairsModal] = useState(null);
  const [showBotsModal, setShowBotsModal] = useState(null);
  const [clientKeyStatuses, setClientKeyStatuses] = useState({});
  const [clientBalances, setClientBalances] = useState({}); // Store balances for each client
  const [loadingBalances, setLoadingBalances] = useState(false);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (client.wallet_address && client.wallet_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         client.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'Active' },
      invited: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', text: 'Invited' },
      inactive: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Inactive' }
    };
    const s = styles[status] || styles.inactive;
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
        {s.text}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDelete = async (clientId) => {
    console.log(`🗑️ Attempting to delete client: ${clientId}`);
    try {
      const { adminAPI } = await import('../../services/api');
      
      // Actually delete from backend database first
      console.log(`📡 Calling DELETE /clients/${clientId}`);
      const result = await adminAPI.deleteClient(clientId);
      console.log(`📥 Delete response:`, result);
      
      // Verify deletion was successful
      if (!result || (result.status !== 'deleted' && !result.client_id)) {
        console.error('❌ Invalid delete response:', result);
        throw new Error('Delete request did not return success confirmation');
      }
      
      // Only update UI after successful backend deletion
      setShowDeleteConfirm(null);
      
      // If deleted client was selected, clear selection
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
      
      // Reload clients from backend to ensure consistency
      console.log(`🔄 Reloading clients list...`);
      const data = await adminAPI.getClients();
      console.log(`📋 Reloaded ${data?.length || 0} clients`);
      
      const transformedClients = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        wallet_address: c.wallet_address,
        wallet_type: c.wallet_type || 'EVM',
        company: c.settings?.contactPerson || '',
        phone: c.settings?.telegramId || '',
        status: c.status || 'active',
        createdAt: c.created_at,
        connectors: c.connectors || c.exchanges || [],
        tokens: c.tokens || (c.tradingPair ? [c.tradingPair] : []),
        pairs: c.pairs || [],
        balance: '$0',
        pnl: '$0',
        pnlPercent: '0%'
      }));
      setClients(transformedClients);
      
      console.log(`✅ Successfully deleted and reloaded clients. Client ${clientId} should be gone.`);
    } catch (error) {
      console.error('❌ Failed to delete client:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      // Show detailed error message
      const errorMsg = error.message || error.detail || error.data?.detail || 'Unknown error occurred';
      alert(`Failed to delete client: ${errorMsg}\n\nPlease check the browser console (F12) for details.`);
      // Don't update UI if deletion failed
      setShowDeleteConfirm(null);
    }
  };

  const handleResendInvite = (client) => {
    alert(`Invitation resent to ${client.email}`);
  };

  const handleManageApiKeys = (client) => {
    setShowApiKeysModal(client);
  };

  const handleManagePairs = (client) => {
    setShowPairsModal(client);
  };

  const handleManageBots = (client) => {
    setShowBotsModal(client);
  };

  // Fetch balances when a client is selected
  // Use account_identifier (for BitMart API keys) instead of wallet_address
  useEffect(() => {
    const fetchClientBalances = async () => {
      if (!selectedClient?.id) return;
      
      setLoadingBalances(true);
      try {
        const { adminAPI } = await import('../../services/api');
        // Use admin endpoint that fetches by client_id (uses account_identifier + connectors)
        const balanceData = await adminAPI.getClientBalances(selectedClient.id);
        const balances = Array.isArray(balanceData?.balances) ? balanceData.balances : [];
        
        // Calculate USD values for USDT/USDC
        const balancesWithUsd = balances.map(b => ({
          ...b,
          usd_value: (b.asset === 'USDT' || b.asset === 'USDC') ? (b.total || 0) : 0
        }));
        
        setClientBalances(prev => ({
          ...prev,
          [selectedClient.id]: balancesWithUsd
        }));
      } catch (error) {
        console.error('Failed to fetch balances:', error);
        setClientBalances(prev => ({
          ...prev,
          [selectedClient.id]: []
        }));
      } finally {
        setLoadingBalances(false);
      }
    };

    if (selectedClient) {
      fetchClientBalances();
    }
  }, [selectedClient?.id]);

  // Fetch key status for all clients
  useEffect(() => {
    const fetchKeyStatuses = async () => {
      const statuses = {};
      for (const client of clients) {
        try {
          const { tradingBridge } = await import('../../services/api');
          const status = await tradingBridge.getClientKeyStatus(client.id);
          statuses[client.id] = status;
        } catch (error) {
          console.error(`Failed to fetch key status for client ${client.id}:`, error);
          statuses[client.id] = { has_key: false };
        }
      }
      setClientKeyStatuses(statuses);
    };
    if (clients.length > 0) {
      fetchKeyStatuses();
    }
  }, [clients]);

  const [showSendOrderModal, setShowSendOrderModal] = useState(null);

  const handleSendOrder = (client) => {
    setShowSendOrderModal(client);
  };

  const handleRemovePair = async (client, pairToken) => {
    if (!window.window.confirm(`Remove trading pair ${pairToken}?`)) return;
    try {
      // Find the pair ID from client.pairs
      const pair = client.pairs?.find(p => p.trading_pair === pairToken);
      if (pair) {
        const { adminAPI } = await import('../../services/api');
        await adminAPI.deletePair(pair.id);
        // Reload clients
        const data = await adminAPI.getClients();
        const transformedClients = (data || []).map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          wallet_address: c.wallet_address,
          wallet_type: c.wallet_type || 'EVM',
          company: c.settings?.contactPerson || '',
          phone: c.settings?.telegramId || '',
          status: c.status || 'active',
          createdAt: c.created_at,
          connectors: c.connectors || c.exchanges || [],
          tokens: c.tokens || (c.tradingPair ? [c.tradingPair] : []),
          pairs: c.pairs || [],
          balance: '$0',
          pnl: '$0',
          pnlPercent: '0%'
        }));
        setClients(transformedClients);
        if (selectedClient?.id === client.id) {
          setSelectedClient(transformedClients.find(c => c.id === client.id));
        }
      }
    } catch (error) {
      console.error('Failed to remove pair:', error);
      alert('Failed to remove trading pair');
    }
  };

  const handleToggleBot = async (client, pair) => {
    const newStatus = pair.status === 'active' ? 'paused' : 'active';
    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.updatePair(pair.id, { status: newStatus });
      // Reload clients
      const data = await adminAPI.getClients();
      const transformedClients = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        wallet_address: c.wallet_address,
        wallet_type: c.wallet_type || 'EVM',
        company: c.settings?.contactPerson || '',
        phone: c.settings?.telegramId || '',
        status: c.status || 'active',
        createdAt: c.created_at,
        connectors: c.connectors || c.exchanges || [],
        tokens: c.tokens || (c.tradingPair ? [c.tradingPair] : []),
        pairs: c.pairs || [],
        balance: '$0',
        pnl: '$0',
        pnlPercent: '0%'
      }));
      setClients(transformedClients);
      if (selectedClient?.id === client.id) {
        setSelectedClient(transformedClients.find(c => c.id === client.id));
      }
    } catch (error) {
      console.error('Failed to toggle bot:', error);
      alert('Failed to update bot status');
    }
  };

  const handleRemoveBot = async (client, botId) => {
    if (!window.confirm('Delete this bot?')) return;
    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.deletePair(botId);
      // Reload clients
      const data = await adminAPI.getClients();
      const transformedClients = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        wallet_address: c.wallet_address,
        wallet_type: c.wallet_type || 'EVM',
        company: c.settings?.contactPerson || '',
        phone: c.settings?.telegramId || '',
        status: c.status || 'active',
        createdAt: c.created_at,
        connectors: c.connectors || c.exchanges || [],
        tokens: c.tokens || (c.tradingPair ? [c.tradingPair] : []),
        pairs: c.pairs || [],
        balance: '$0',
        pnl: '$0',
        pnlPercent: '0%'
      }));
      setClients(transformedClients);
      if (selectedClient?.id === client.id) {
        setSelectedClient(transformedClients.find(c => c.id === client.id));
      }
    } catch (error) {
      console.error('Failed to remove bot:', error);
      alert('Failed to delete bot');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg transition-all hover:bg-gray-100"
            style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>Client Management</h1>
            <p className="text-sm" style={{ color: theme.textMuted }}>{clients.length} total clients</p>
          </div>
        </div>
        <button 
          onClick={onAddClient}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{ background: theme.accent, color: 'white' }}
        >
          <UserPlus size={18} />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none transition-all"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'invited', 'inactive'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize"
              style={{ 
                background: statusFilter === status ? theme.accent : theme.bgCard,
                color: statusFilter === status ? 'white' : theme.textSecondary,
                border: `1px solid ${statusFilter === status ? theme.accent : theme.border}`
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Client List & Detail Split View */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Client List */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-2">
            {filteredClients.map(client => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="p-4 rounded-xl transition-all cursor-pointer"
                style={{ 
                  background: selectedClient?.id === client.id ? theme.accentLight : theme.bgCard,
                  border: `1px solid ${selectedClient?.id === client.id ? theme.accent : theme.border}`,
                  boxShadow: theme.shadow
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold"
                      style={{ background: theme.accent, color: 'white' }}
                    >
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: theme.textPrimary }}>{client.name}</div>
                      <div className="text-xs font-mono" style={{ color: theme.textMuted }}>
                        {client.wallet_address ? `${client.wallet_address.slice(0, 6)}...${client.wallet_address.slice(-4)}` : client.email || 'No wallet'}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(client.status)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span style={{ color: theme.textMuted }}>
                      <span style={{ color: theme.textSecondary }}>{client.connectors.length}</span> exchanges
                    </span>
                    <span style={{ color: theme.textMuted }}>
                      <span style={{ color: theme.textSecondary }}>{client.tokens.length}</span> tokens
                    </span>
                    {clientKeyStatuses[client.id] && (
                      <span style={{ color: theme.textMuted }}>
                        {clientKeyStatuses[client.id].has_key ? (
                          <span style={{ color: theme.positive }}>
                            ✅ Key ({clientKeyStatuses[client.id].key_added_by || 'unknown'})
                          </span>
                        ) : (
                          <span style={{ color: theme.textMuted }}>⬜ No key</span>
                        )}
                      </span>
                    )}
                  </div>
                  <span style={{ color: client.pnlPercent.startsWith('+') ? theme.positive : client.pnlPercent.startsWith('-') ? theme.negative : theme.textMuted }}>
                    {client.pnl}
                  </span>
                </div>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div className="text-center py-12" style={{ color: theme.textMuted }}>
                <Users size={40} className="mx-auto mb-3 opacity-50" />
                <p>No clients found</p>
              </div>
            )}
          </div>
        </div>

        {/* Client Detail Panel */}
        {selectedClient ? (
          <div 
            className="w-96 rounded-xl overflow-hidden flex flex-col"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, boxShadow: theme.shadowLg }}
          >
            {/* Detail Header */}
            <div className="p-5 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold"
                    style={{ background: theme.accent, color: 'white' }}
                  >
                    {selectedClient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: theme.textPrimary }}>{selectedClient.name}</div>
                    <div className="text-sm" style={{ color: theme.textMuted }}>{selectedClient.company}</div>
                  </div>
                </div>
                {getStatusBadge(selectedClient.status)}
              </div>
              
              {/* Quick Actions Bar */}
              <div className="mb-4 p-3 rounded-lg" style={{ background: theme.bgSecondary }}>
                <div className="text-xs font-semibold uppercase mb-2" style={{ color: theme.textMuted }}>Quick Actions</div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleManageApiKeys(selectedClient)}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                    style={{ background: theme.accent, color: 'white' }}
                  >
                    <Key size={14} /> API Keys
                  </button>
                  <button 
                    onClick={() => handleManagePairs(selectedClient)}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                    style={{ background: theme.accent, color: 'white' }}
                  >
                    <Plus size={14} /> Add Pair
                  </button>
                  <button 
                    onClick={() => handleManageBots(selectedClient)}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                    style={{ background: theme.accent, color: 'white' }}
                  >
                    <Bot size={14} /> Add Bot
                  </button>
                  <button 
                    onClick={() => handleSendOrder(selectedClient)}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                    style={{ background: theme.positive, color: 'white' }}
                  >
                    <Send size={14} /> Send Order
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowEditModal(selectedClient)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: theme.bgSecondary, color: theme.textSecondary, border: `1px solid ${theme.border}` }}
                >
                  <Edit2 size={14} /> Edit
                </button>
                {selectedClient.status === 'invited' && (
                  <button 
                    onClick={() => handleResendInvite(selectedClient)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: theme.accentLight, color: theme.accent }}
                  >
                    <Mail size={14} /> Resend
                  </button>
                )}
                <button 
                  onClick={() => setShowDeleteConfirm(selectedClient)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: theme.negative }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Contact Info */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold uppercase" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                    Contact Info
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {/* Primary Wallet (Login Wallet) */}
                  <div className="flex items-center gap-3">
                    <Wallet size={14} style={{ color: theme.textMuted }} />
                    <span className="font-mono text-xs flex-1" style={{ color: theme.textPrimary }}>
                      {selectedClient.wallet_address || selectedClient.wallets?.[0]?.address || 'No wallet'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: theme.accentLight, color: theme.accent }}>
                      Primary
                    </span>
                  </div>
                  
                  {/* Additional Wallets */}
                  {selectedClient.wallets && selectedClient.wallets.length > 1 && (
                    <div className="space-y-1.5 mt-2">
                      {selectedClient.wallets.slice(1).map((wallet, idx) => (
                        <div key={wallet.id || idx} className="flex items-center gap-3 pl-5">
                          <Wallet size={12} style={{ color: theme.textMuted }} />
                          <span className="font-mono text-xs flex-1" style={{ color: theme.textSecondary }}>
                            {wallet.address}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                            {wallet.chain || 'unknown'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedClient.email && (
                    <div className="flex items-center gap-3">
                      <Mail size={14} style={{ color: theme.textMuted }} />
                      <span style={{ color: theme.textMuted }}>{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div className="flex items-center gap-3">
                      <Building size={14} style={{ color: theme.textMuted }} />
                      <span style={{ color: theme.textPrimary }}>{selectedClient.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Clock size={14} style={{ color: theme.textMuted }} />
                    <span style={{ color: theme.textMuted }}>
                      Joined {formatDate(selectedClient.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trading Key Status */}
              {clientKeyStatuses[selectedClient.id] && (
                <div>
                  <div className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                    Trading Key
                  </div>
                  <div className="space-y-2 text-sm">
                    {clientKeyStatuses[selectedClient.id].has_key ? (
                      <>
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={14} style={{ color: theme.positive }} />
                          <span style={{ color: theme.textPrimary }}>
                            ✅ Connected by {clientKeyStatuses[selectedClient.id].key_added_by || 'unknown'}
                          </span>
                        </div>
                        {clientKeyStatuses[selectedClient.id].key_connected_at && (
                          <div className="flex items-center gap-3">
                            <Clock size={14} style={{ color: theme.textMuted }} />
                            <span style={{ color: theme.textMuted }}>
                              Connected {formatDate(clientKeyStatuses[selectedClient.id].key_connected_at)}
                            </span>
                          </div>
                        )}
                        {clientKeyStatuses[selectedClient.id].wallet_address && (
                          <div className="flex items-center gap-3">
                            <Wallet size={14} style={{ color: theme.textMuted }} />
                            <span className="font-mono text-xs" style={{ color: theme.textPrimary }}>
                              {clientKeyStatuses[selectedClient.id].wallet_address}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2 py-1 rounded" style={{ background: theme.bgSecondary, color: theme.textSecondary }}>
                            {clientKeyStatuses[selectedClient.id].chain || 'solana'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 rounded-xl text-center" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                        ⬜ No trading key connected
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance */}
              <div>
                <div className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                  Performance
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-xl" style={{ background: theme.bgSecondary }}>
                    <div className="text-xs" style={{ color: theme.textMuted }}>Total Balance</div>
                    {loadingBalances ? (
                      <div className="text-sm" style={{ color: theme.textMuted }}>Loading...</div>
                    ) : (() => {
                      const balances = clientBalances[selectedClient.id] || [];
                      const totalUsd = balances.reduce((sum, b) => sum + (b.usd_value || 0), 0);
                      return (
                        <div className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                          ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: theme.bgSecondary }}>
                    <div className="text-xs" style={{ color: theme.textMuted }}>P&L</div>
                    <div className="text-lg font-semibold" style={{ color: selectedClient.pnlPercent.startsWith('+') ? theme.positive : selectedClient.pnlPercent.startsWith('-') ? theme.negative : theme.textPrimary }}>
                      {selectedClient.pnl}
                      <span className="text-xs ml-1">{selectedClient.pnlPercent}</span>
                    </div>
                  </div>
                </div>
                
                {/* Individual Token Balances */}
                {(() => {
                  const balances = clientBalances[selectedClient.id] || [];
                  const nonZeroBalances = balances.filter(b => b.total > 0);
                  
                  if (loadingBalances) {
                    return (
                      <div className="p-3 rounded-xl text-sm" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                        Loading balances...
                      </div>
                    );
                  }
                  
                  if (nonZeroBalances.length === 0) {
                    return (
                      <div className="p-3 rounded-xl text-sm" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                        No balances found. Connect exchange API keys to view balances.
                      </div>
                    );
                  }
                  
                  return (
                    <div className="p-3 rounded-xl" style={{ background: theme.bgSecondary }}>
                      <div className="text-xs font-semibold uppercase mb-2" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                        Tokens
                      </div>
                      <div className="space-y-2">
                        {nonZeroBalances.map((balance, idx) => {
                          const decimals = balance.asset === 'USDT' || balance.asset === 'USDC' ? 2 : 8;
                          return (
                            <div key={`${balance.exchange}-${balance.asset}-${idx}`} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium" style={{ color: theme.textPrimary }}>
                                  {balance.total.toLocaleString('en-US', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: decimals
                                  })}
                                </span>
                                <span style={{ color: theme.textMuted }}>{balance.asset}</span>
                              </div>
                              {balance.usd_value > 0 && (
                                <span className="text-xs" style={{ color: theme.textMuted }}>
                                  ${balance.usd_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Exchanges */}
              <div>
                <div className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                  Exchanges ({selectedClient.connectors.length})
                </div>
                {selectedClient.connectors.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClient.connectors.map(conn => (
                      <div key={conn.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: theme.bgSecondary }}>
                        <Key size={14} style={{ color: theme.accent }} />
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                            {EXCHANGES.find(e => e.id === conn.exchange)?.name}
                          </div>
                          <div className="text-xs" style={{ color: theme.textMuted }}>{conn.label}</div>
                        </div>
                        <CheckCircle2 size={14} style={{ color: theme.positive }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm p-3 rounded-xl text-center" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                    No exchanges configured
                  </div>
                )}
              </div>

              {/* Trading Pairs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold uppercase" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                    Trading Pairs ({selectedClient.pairs?.length || 0})
                </div>
                  <button 
                    onClick={() => handleManagePairs(selectedClient)}
                    className="px-2 py-1 text-xs rounded-lg transition-all"
                    style={{ background: theme.accentLight, color: theme.accent }}
                  >
                    <Plus size={12} className="inline mr-1" /> Add Pair
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedClient.pairs && selectedClient.pairs.length > 0 ? (
                    selectedClient.pairs.map((pair, i) => (
                      <div key={pair.id || i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                            {pair.trading_pair} on {EXCHANGES.find(e => e.id === pair.exchange)?.name || pair.exchange}
                          </div>
                          <div className="text-xs flex items-center gap-2 mt-1" style={{ color: theme.textMuted }}>
                            <span>{pair.bot_type || 'both'}</span>
                            <span>•</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              pair.status === 'active' ? 'bg-green-100 text-green-700' : 
                              pair.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {pair.status || 'paused'}
                    </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleManagePairs(selectedClient)}
                          className="p-1.5 rounded-lg hover:opacity-70"
                          style={{ color: theme.accent }}
                          title="Manage"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs p-3 rounded-xl text-center" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                      No trading pairs configured. Click "Add Pair" to create one.
                    </div>
                  )}
                </div>
              </div>

              {/* Bots */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold uppercase" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                    Running Bots
                  </div>
                  <button 
                    onClick={() => handleManageBots(selectedClient)}
                    className="px-2 py-1 text-xs rounded-lg transition-all font-medium"
                    style={{ background: theme.accent, color: 'white' }}
                  >
                    <Plus size={12} className="inline mr-1" /> Add Bot
                  </button>
                </div>
                {(() => {
                  // Get account_identifier from client - try multiple sources
                  const accountIdentifier = selectedClient.account_identifier || 
                    (selectedClient.wallet_address ? 
                      `client_${selectedClient.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}` : 
                      null);
                  
                  if (!accountIdentifier) {
                    return (
                      <div className="text-xs p-3 rounded-xl text-center" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                        No account identifier found for this client
                      </div>
                    );
                  }
                  
                  return <BotList account={accountIdentifier} />;
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="w-96 rounded-xl flex items-center justify-center"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <div className="text-center" style={{ color: theme.textMuted }}>
              <Users size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select a client to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative w-full max-w-md p-6 rounded-2xl" style={{ background: theme.bgPrimary, boxShadow: theme.shadowXl }}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertCircle size={24} style={{ color: theme.negative }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>Delete Client?</h3>
              <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
                Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: theme.bgSecondary, color: theme.textSecondary }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(showDeleteConfirm.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ background: theme.negative }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Order Modal */}
      {showSendOrderModal && (
        <SendOrderModal
          client={showSendOrderModal}
          onClose={() => setShowSendOrderModal(null)}
          theme={theme}
        />
      )}

      {/* API Keys Management Modal */}
      {showApiKeysModal && <ApiKeysModal client={showApiKeysModal} onClose={() => setShowApiKeysModal(null)} onUpdate={async () => {
        const { adminAPI } = await import('../../services/api');
        const data = await adminAPI.getClients();
        const transformedClients = (data || []).map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          wallet_address: c.wallet_address,
          wallet_type: c.wallet_type || 'EVM',
          company: c.settings?.contactPerson || '',
          phone: c.settings?.telegramId || '',
          status: c.status || 'active',
          createdAt: c.created_at,
          connectors: c.connectors || c.exchanges || [],
          tokens: c.tokens || (c.tradingPair ? [c.tradingPair] : []),
          pairs: c.pairs || [],
          balance: '$0',
          pnl: '$0',
          pnlPercent: '0%'
        }));
        setClients(transformedClients);
        if (selectedClient?.id === showApiKeysModal.id) {
          setSelectedClient(transformedClients.find(c => c.id === showApiKeysModal.id));
        }
      }} theme={theme} />}

      {/* Trading Pairs Management Modal */}
      {showPairsModal && <PairsModal client={showPairsModal} onClose={() => setShowPairsModal(null)} onUpdate={async () => {
        const { adminAPI } = await import('../../services/api');
        const data = await adminAPI.getClients();
        const transformedClients = (data || []).map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          wallet_address: c.wallet_address,
          wallet_type: c.wallet_type || 'EVM',
          company: c.settings?.contactPerson || '',
          phone: c.settings?.telegramId || '',
          status: c.status || 'active',
          createdAt: c.created_at,
          connectors: c.connectors || c.exchanges || [],
          tokens: c.tokens || (c.tradingPair ? [c.tradingPair] : []),
          pairs: c.pairs || [],
          balance: '$0',
          pnl: '$0',
          pnlPercent: '0%'
        }));
        setClients(transformedClients);
        if (selectedClient?.id === showPairsModal.id) {
          setSelectedClient(transformedClients.find(c => c.id === showPairsModal.id));
        }
      }} theme={theme} />}

      {/* Bots Management Modal */}
      {showBotsModal && <BotsModal client={showBotsModal} onClose={() => setShowBotsModal(null)} onUpdate={async () => {
        const { adminAPI } = await import('../../services/api');
        const data = await adminAPI.getClients();
        const transformedClients = (data || []).map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          wallet_address: c.wallet_address,
          wallet_type: c.wallet_type || 'EVM',
          company: c.settings?.contactPerson || '',
          phone: c.settings?.telegramId || '',
          status: c.status || 'active',
          createdAt: c.created_at,
          connectors: c.connectors || c.exchanges || [],
          tokens: c.tokens || (c.tradingPair ? [c.tradingPair] : []),
          pairs: c.pairs || [],
          balance: '$0',
          pnl: '$0',
          pnlPercent: '0%'
        }));
        setClients(transformedClients);
        if (selectedClient?.id === showBotsModal.id) {
          setSelectedClient(transformedClients.find(c => c.id === showBotsModal.id));
        }
      }} theme={theme} />}

      {showEditModal && <EditClientModal client={showEditModal} onClose={() => setShowEditModal(null)} onUpdate={async () => {
        const { adminAPI } = await import('../../services/api');
        const data = await adminAPI.getClients();
        const transformedClients = (data || []).map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          wallet_address: c.wallet_address,
          account_identifier: c.account_identifier,
          status: c.status || 'active',
          connectors: c.connectors || [],
          wallets: c.wallets || [],
          pairs: [],
          bots: [],
          balance: '$0',
          pnl: '$0',
          pnlPercent: '0%',
          createdAt: c.created_at
        }));
        setClients(transformedClients);
        if (selectedClient?.id === showEditModal.id) {
          setSelectedClient(transformedClients.find(c => c.id === showEditModal.id));
        }
      }} theme={theme} />}
    </div>
  );
}
function ApiKeysModal({ client, onClose, onUpdate, theme }) {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    exchange: 'bitmart',
    api_key: '',
    api_secret: '',
    passphrase: '',
    label: '',
    is_testnet: false
  });

  useEffect(() => {
    loadApiKeys();
  }, [client]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const { adminAPI } = await import('../../services/api');
      const keys = await adminAPI.getClientApiKeys(client.id);
      setApiKeys(keys || []);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.addClientApiKey(client.id, formData);
      setFormData({ exchange: 'bitmart', api_key: '', api_secret: '', passphrase: '', label: '', is_testnet: false });
      setShowAdd(false);
      await loadApiKeys();
      await onUpdate();
    } catch (error) {
      console.error('Failed to add API key:', error);
      alert('Failed to add API key: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (keyId) => {
    if (!window.confirm('Delete this API key?')) return;
    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.deleteClientApiKey(client.id, keyId);
      await loadApiKeys();
      await onUpdate();
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl" style={{ background: theme.bgPrimary, boxShadow: theme.shadowXl }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>API Keys - {client.name}</h2>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              CEX connectors only (Bitmart, Binance, etc.). DEX connectors (Uniswap, Jupiter) are configured when creating bots.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: theme.textMuted }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: theme.textMuted }}>Loading...</div>
        ) : (
          <>
            <div className="mb-4">
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: theme.accent, color: 'white' }}
              >
                <Plus size={16} /> Add API Key
              </button>
            </div>

            {showAdd && (
              <div className="mb-6 p-4 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>Add New API Key</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Exchange</label>
                    <select
                      value={formData.exchange}
                      onChange={e => setFormData({ ...formData, exchange: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      required
                    >
                      <option value="">Select exchange</option>
                      {/* Only show CEX exchanges - DEX connectors (Uniswap, Jupiter) use wallets in bot creation */}
                      {EXCHANGES.filter(ex => !['uniswap', 'jupiter', 'raydium'].includes(ex.id)).map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Label (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Main Account"
                      value={formData.label}
                      onChange={e => setFormData({ ...formData, label: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>API Key *</label>
                    <input
                      type="text"
                      placeholder="Enter API Key"
                      value={formData.api_key}
                      onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>API Secret *</label>
                    <input
                      type="password"
                      placeholder="Enter API Secret"
                      value={formData.api_secret}
                      onChange={e => setFormData({ ...formData, api_secret: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      required
                    />
                  </div>
                  {/* Note: DEX connectors (Uniswap, Jupiter) are not added here - they use wallets in bot creation */}
                  {['uniswap', 'jupiter', 'raydium'].includes(formData.exchange) && (
                    <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}>
                      ⚠️ <strong>Note:</strong> DEX connectors (Uniswap, Jupiter, Raydium) are not configured here. 
                      Instead, provide wallet address and private key when creating a bot in Bot Management.
                    </div>
                  )}
                  {EXCHANGES.find(e => e.id === formData.exchange)?.requiresMemo && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Memo/Passphrase</label>
                      <input
                        type="text"
                        placeholder="Enter memo or passphrase"
                        value={formData.passphrase}
                        onChange={e => setFormData({ ...formData, passphrase: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-sm" style={{ color: theme.textSecondary }}>
                    <input
                      type="checkbox"
                      checked={formData.is_testnet}
                      onChange={e => setFormData({ ...formData, is_testnet: e.target.checked })}
                    />
                    Testnet / Sandbox
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: theme.accent, color: 'white' }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAdd(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: theme.bgSecondary, color: theme.textSecondary }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>No API keys configured</div>
              ) : (
                apiKeys.map(key => (
                  <div key={key.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                        {EXCHANGES.find(e => e.id === key.exchange)?.name || key.exchange}
                        {key.label && <span className="ml-2 text-xs" style={{ color: theme.textMuted }}>({key.label})</span>}
                      </div>
                      <div className="text-xs mt-1 font-mono" style={{ color: theme.textMuted }}>{key.api_key_preview}</div>
                      <div className="flex items-center gap-2 mt-2">
                        {key.is_active && <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Active</span>}
                        {key.is_testnet && <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>Testnet</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="p-2 rounded-lg"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: theme.negative }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function PairsModal({ client, onClose, onUpdate, theme }) {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [clientConnectors, setClientConnectors] = useState(client.connectors || []);
  const [formData, setFormData] = useState({
    exchange: client.connectors?.[0]?.exchange || 'bitmart',
    trading_pair: '',
  });

  useEffect(() => {
    loadPairs();
    loadClientConnectors();
  }, [client]);

  const loadClientConnectors = async () => {
    try {
      const { adminAPI } = await import('../../services/api');
      const apiKeys = await adminAPI.getClientApiKeys(client.id);
      // Transform API keys to connectors format
      const connectors = (apiKeys || [])
        .filter(key => key.is_active)
        .map(key => ({
          id: key.id,
          exchange: key.exchange,
          label: key.label || `${key.exchange} Account`,
          is_testnet: key.is_testnet,
          is_active: key.is_active
        }));
      setClientConnectors(connectors);
      if (connectors.length > 0 && !formData.exchange) {
        setFormData({ ...formData, exchange: connectors[0].exchange });
      }
    } catch (error) {
      console.error('Failed to load connectors:', error);
      setClientConnectors(client.connectors || []);
    }
  };

  const loadPairs = async () => {
    try {
      setLoading(true);
      const { adminAPI } = await import('../../services/api');
      const data = await adminAPI.getClientPairs(client.id);
      setPairs(data || []);
    } catch (error) {
      console.error('Failed to load pairs:', error);
      setPairs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.trading_pair) {
      alert('Please enter a trading pair (e.g., SHARP/USDT)');
      return;
    }
    if (!formData.exchange) {
      alert('Please select an exchange');
      return;
    }
    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.createPair(client.id, {
        exchange: formData.exchange,
        trading_pair: formData.trading_pair.toUpperCase().replace(/\s+/g, ''),
        bot_type: 'both'
      });
      setFormData({ 
        exchange: clientConnectors.length > 0 ? clientConnectors[0].exchange : '', 
        trading_pair: '' 
      });
      setShowAdd(false);
      await loadPairs();
      await onUpdate();
    } catch (error) {
      console.error('Failed to add pair:', error);
      const errorMsg = error.message || error.detail || 'Unknown error';
      alert('Failed to add trading pair: ' + errorMsg);
    }
  };

  const handleDelete = async (pairId) => {
    if (!window.confirm('Delete this trading pair?')) return;
    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.deletePair(pairId);
      await loadPairs();
      await onUpdate();
    } catch (error) {
      console.error('Failed to delete pair:', error);
      alert('Failed to delete trading pair');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl" style={{ background: theme.bgPrimary, boxShadow: theme.shadowXl }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>Trading Pairs - {client.name}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: theme.textMuted }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: theme.textMuted }}>Loading...</div>
        ) : (
          <>
            <div className="mb-4">
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: theme.accent, color: 'white' }}
              >
                <Plus size={16} /> Add Trading Pair
              </button>
            </div>

            {showAdd && (
              <div className="mb-6 p-4 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>Add New Trading Pair</h3>
                <div className="space-y-3">
                  {clientConnectors.length === 0 ? (
                    <div className="text-sm p-3 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      ⚠️ No exchanges configured. Add an API key first.
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Exchange</label>
                        <select
                          value={formData.exchange}
                          onChange={e => setFormData({ ...formData, exchange: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                          required
                        >
                          <option value="">Select exchange</option>
                          {clientConnectors.map(conn => (
                            <option key={conn.id} value={conn.exchange}>
                              {EXCHANGES.find(e => e.id === conn.exchange)?.name || conn.exchange}
                            </option>
                          ))}
                        </select>
          </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Trading Pair</label>
                        <input
                          type="text"
                          placeholder="e.g., SHARP/USDT"
                          value={formData.trading_pair}
                          onChange={e => setFormData({ ...formData, trading_pair: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                          required
                        />
        </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleAdd}
                          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                          style={{ background: theme.accent, color: 'white' }}
                        >
                          Add Pair
                        </button>
                        <button
                          onClick={() => setShowAdd(false)}
                          className="px-4 py-2 rounded-lg text-sm font-medium"
                          style={{ background: theme.bgSecondary, color: theme.textSecondary }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {pairs.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>No trading pairs configured</div>
              ) : (
                pairs.map(pair => (
                  <div key={pair.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                        {pair.trading_pair} on {EXCHANGES.find(e => e.id === pair.exchange)?.name || pair.exchange}
              </div>
                      <div className="text-xs mt-1" style={{ color: theme.textMuted }}>
                        Bot Type: {pair.bot_type} • Status: {pair.status}
                    </div>
                  </div>
                    <button
                      onClick={() => handleDelete(pair.id)}
                      className="p-2 rounded-lg"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: theme.negative }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
                      </div>
          </>
        )}
      </div>
    </div>
  );
}
function SendOrderModal({ client, onClose, theme }) {
  const [clientConnectors, setClientConnectors] = useState(client.connectors || []);
  const [formData, setFormData] = useState({
    exchange: client.connectors?.[0]?.exchange || '',
    trading_pair: '',
    order_type: 'market', // 'market' or 'limit'
    side: 'buy', // 'buy' or 'sell'
    quantity: '',
    price: '', // Only for limit orders
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadClientConnectors();
  }, [client]);

  const loadClientConnectors = async () => {
    try {
      const { adminAPI } = await import('../../services/api');
      const apiKeys = await adminAPI.getClientApiKeys(client.id);
      // Transform API keys to connectors format
      const connectors = (apiKeys || [])
        .filter(key => key.is_active)
        .map(key => ({
          id: key.id,
          exchange: key.exchange,
          label: key.label || `${key.exchange} Account`,
          is_testnet: key.is_testnet,
          is_active: key.is_active
        }));
      setClientConnectors(connectors);
      if (connectors.length > 0 && !formData.exchange) {
        setFormData({ ...formData, exchange: connectors[0].exchange });
      }
    } catch (error) {
      console.error('Failed to load connectors:', error);
      setClientConnectors(client.connectors || []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.exchange || !formData.trading_pair || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }
    if (formData.order_type === 'limit' && !formData.price) {
      alert('Please enter a price for limit orders');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Call trading bridge API to execute order
      alert(`Order would be sent:\nExchange: ${formData.exchange}\nPair: ${formData.trading_pair}\nType: ${formData.order_type}\nSide: ${formData.side}\nQuantity: ${formData.quantity}${formData.order_type === 'limit' ? `\nPrice: ${formData.price}` : ''}\n\nThis will connect to the trading bridge to execute the order.`);
      onClose();
    } catch (error) {
      console.error('Failed to send order:', error);
      alert('Failed to send order: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="relative w-full max-w-md p-6 rounded-2xl" style={{ background: theme.bgPrimary, boxShadow: theme.shadowXl }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>Send Order - {client.name}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: theme.textMuted }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Exchange</label>
            <select
              value={formData.exchange}
              onChange={e => setFormData({ ...formData, exchange: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
              required
            >
              <option value="">Select exchange</option>
              {clientConnectors.map(conn => (
                <option key={conn.id} value={conn.exchange}>
                  {EXCHANGES.find(e => e.id === conn.exchange)?.name || conn.exchange}
                </option>
              ))}
            </select>
            {clientConnectors.length === 0 && (
              <div className="text-xs p-2 rounded-lg mt-2" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                ⚠️ No active API keys found. Add an API key first.
                  </div>
                )}
              </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Trading Pair</label>
            <input
              type="text"
              placeholder="e.g., SHARP/USDT"
              value={formData.trading_pair}
              onChange={e => setFormData({ ...formData, trading_pair: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
              required
            />
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Order Type</label>
              <select
                value={formData.order_type}
                onChange={e => setFormData({ ...formData, order_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Side</label>
              <select
                value={formData.side}
                onChange={e => setFormData({ ...formData, side: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Quantity</label>
            <input
              type="number"
              step="0.00000001"
              placeholder="0.00"
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
              required
            />
          </div>

          {formData.order_type === 'limit' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Price</label>
              <input
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: theme.bgSecondary, color: theme.textSecondary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: theme.positive, opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? 'Sending...' : 'Send Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function BotsModal({ client, onClose, onUpdate, theme }) {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [clientConnectors, setClientConnectors] = useState(client.connectors || []);
  const [formData, setFormData] = useState({
    connector: 'bitmart', // CEX connector or 'jupiter'/'uniswap' for DEX
    chain: 'solana', // For DEX: solana, polygon, arbitrum, base, ethereum
    exchange: client.connectors?.[0]?.exchange || 'bitmart', // CEX exchange (legacy)
    trading_pair: '', // CEX pair
    bot_type: 'both', // CEX bot type
    spread_target: 0.3,
    volume_target_daily: 10000,
    // DEX fields
    wallet_address: '',
    private_key: '',
    base_mint: '',
    quote_mint: 'So11111111111111111111111111111111111111112', // SOL default
    bot_type_dex: 'volume', // volume or spread
    daily_volume_usd: 5000,
    min_trade_usd: 10,
    max_trade_usd: 25,
    interval_min_minutes: 15, // Minimum wait time between trades (minutes)
    interval_max_minutes: 45, // Maximum wait time between trades (minutes)
  });

  useEffect(() => {
    loadBots();
    loadClientConnectors();
  }, [client]);

  const loadClientConnectors = async () => {
    try {
      const { adminAPI } = await import('../../services/api');
      const apiKeys = await adminAPI.getClientApiKeys(client.id);
      // Transform API keys to connectors format
      const connectors = (apiKeys || [])
        .filter(key => key.is_active)
        .map(key => ({
          id: key.id,
          exchange: key.exchange,
          label: key.label || `${key.exchange} Account`,
          is_testnet: key.is_testnet,
          is_active: key.is_active
        }));
      setClientConnectors(connectors);
      if (connectors.length > 0 && !formData.exchange) {
        setFormData({ ...formData, exchange: connectors[0].exchange });
      }
    } catch (error) {
      console.error('Failed to load connectors:', error);
      setClientConnectors(client.connectors || []);
    }
  };

  const loadBots = async () => {
    try {
      setLoading(true);
      const { adminAPI } = await import('../../services/api');
      const data = await adminAPI.getClientPairs(client.id);
      setPairs(data || []);
    } catch (error) {
      console.error('Failed to load bots:', error);
      setPairs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const isDEX = ['jupiter', 'uniswap', 'raydium'].includes(formData.connector);
    
    // Validation
    if (!isDEX && !formData.trading_pair) {
      alert('Please enter a trading pair');
      return;
    }
    if (isDEX && !formData.wallet_address) {
      alert('Please enter wallet address');
      return;
    }
    if (isDEX && !formData.private_key) {
      alert('Please enter private key');
      return;
    }
    if (isDEX && !formData.base_mint) {
      alert('Please enter base token address');
      return;
    }
    
    try {
      const { tradingBridge, adminAPI } = await import('../../services/api');
      const clientData = await adminAPI.getClient(client.id);
      const account = clientData.account_identifier || `client_${client.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      
      if (isDEX) {
        // Create DEX bot
        const payload = {
          name: `${client.name} ${formData.connector} ${formData.bot_type_dex}`,
          account: account,
          bot_type: formData.bot_type_dex,
          connector: formData.connector,
          chain: formData.chain,
          config: {
            base_mint: formData.base_mint,
            quote_mint: formData.quote_mint,
            daily_volume_usd: formData.daily_volume_usd || 5000,
            min_trade_usd: formData.min_trade_usd || 10,
            max_trade_usd: formData.max_trade_usd || 25,
            interval_min_seconds: (formData.interval_min_minutes || 15) * 60,
            interval_max_seconds: (formData.interval_max_minutes || 45) * 60,
            slippage_bps: 50,
            ...(formData.bot_type_dex === 'spread' && {
              spread_bps: formData.spread_target * 100,
              order_size_usd: formData.volume_target_daily || 500,
              refresh_seconds: 30,
            }),
          },
          wallets: [{
            address: formData.wallet_address,
            private_key: formData.private_key,
          }],
        };
        await tradingBridge.createBot(payload);
      } else {
        // Create CEX bot (legacy)
        await adminAPI.createPair(client.id, {
          exchange: formData.exchange,
          trading_pair: formData.trading_pair.toUpperCase(),
          bot_type: formData.bot_type,
          spread_target: formData.spread_target,
          volume_target_daily: formData.volume_target_daily,
        });
      }
      
      // Reset form
      setFormData({
        connector: 'bitmart',
        chain: 'solana',
        exchange: client.connectors?.[0]?.exchange || 'bitmart',
        trading_pair: '',
        bot_type: 'both',
        spread_target: 0.3,
        volume_target_daily: 10000,
        wallet_address: '',
        private_key: '',
        base_mint: '',
        quote_mint: 'So11111111111111111111111111111111111111112',
        bot_type_dex: 'volume',
        daily_volume_usd: 5000,
        min_trade_usd: 10,
        max_trade_usd: 25,
        interval_min_minutes: 15,
        interval_max_minutes: 45,
      });
      setShowAdd(false);
      await loadBots();
      await onUpdate();
    } catch (error) {
      console.error('Failed to add bot:', error);
      alert('Failed to add bot: ' + (error.message || 'Unknown error'));
    }
  };

  const handleToggle = async (pair) => {
    const newStatus = pair.status === 'active' ? 'paused' : 'active';
    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.updatePair(pair.id, { status: newStatus });
      await loadBots();
      await onUpdate();
    } catch (error) {
      console.error('Failed to toggle bot:', error);
      alert('Failed to update bot status');
    }
  };

  const handleDelete = async (pairId) => {
    if (!window.confirm('Delete this bot?')) return;
    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.deletePair(pairId);
      await loadBots();
      await onUpdate();
    } catch (error) {
      console.error('Failed to delete bot:', error);
      alert('Failed to delete bot');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl" style={{ background: theme.bgPrimary, boxShadow: theme.shadowXl }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>Bots - {client.name}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: theme.textMuted }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: theme.textMuted }}>Loading...</div>
        ) : (
          <>
            <div className="mb-4">
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: theme.accent, color: 'white' }}
              >
                <Plus size={16} /> Add Bot
              </button>
            </div>

            {showAdd && (
              <div className="mb-6 p-4 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>Create New Bot</h3>
                <div className="space-y-3">
                  {/* Connector Selection */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Connector</label>
                    <select
                      value={formData.connector}
                      onChange={e => {
                        const connector = e.target.value;
                        const isDEX = ['jupiter', 'uniswap', 'raydium'].includes(connector);
                        setFormData(prev => ({
                          ...prev,
                          connector,
                          chain: connector === 'uniswap' ? 'polygon' : (connector === 'jupiter' ? 'solana' : prev.chain),
                          exchange: !isDEX && clientConnectors.length > 0 ? clientConnectors[0].exchange : prev.exchange,
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                    >
                      <optgroup label="CEX">
                        {clientConnectors.map(conn => (
                          <option key={conn.id} value={conn.exchange}>
                            {EXCHANGES.find(e => e.id === conn.exchange)?.name || conn.exchange}
                          </option>
                        ))}
                        {clientConnectors.length === 0 && (
                          <>
                            <option value="bitmart">BitMart</option>
                            <option value="binance">Binance</option>
                            <option value="kucoin">KuCoin</option>
                          </>
                        )}
                      </optgroup>
                      <optgroup label="DEX (Solana)">
                        <option value="jupiter">Jupiter</option>
                      </optgroup>
                      <optgroup label="DEX (EVM)">
                        <option value="uniswap">Uniswap</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Chain Selection - Show for DEX */}
                  {['jupiter', 'uniswap', 'raydium'].includes(formData.connector) && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Chain</label>
                      <select
                        value={formData.chain}
                        onChange={e => {
                          const chain = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            chain,
                            connector: chain === 'solana' ? 'jupiter' : 'uniswap',
                            quote_mint: chain === 'solana' 
                              ? 'So11111111111111111111111111111111111111112'
                              : (chain === 'polygon' 
                                ? '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
                                : '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      >
                        <option value="solana">◎ Solana</option>
                        <option value="polygon">⟠ Polygon</option>
                        <option value="arbitrum">⟠ Arbitrum</option>
                        <option value="base">⟠ Base</option>
                        <option value="ethereum">⟠ Ethereum</option>
                      </select>
                    </div>
                  )}

                  {/* CEX Fields */}
                  {!['jupiter', 'uniswap', 'raydium'].includes(formData.connector) && (
                    <>
                      <input
                        type="text"
                        placeholder="Trading Pair (e.g., SHARP/USDT)"
                        value={formData.trading_pair}
                        onChange={e => setFormData({ ...formData, trading_pair: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      />
                      <select
                        value={formData.bot_type}
                        onChange={e => setFormData({ ...formData, bot_type: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      >
                        <option value="market_maker">Market Maker</option>
                        <option value="volume_generator">Volume Generator</option>
                        <option value="both">Both</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Spread Target (%)"
                        value={formData.spread_target}
                        onChange={e => setFormData({ ...formData, spread_target: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      />
                      <input
                        type="number"
                        step="100"
                        placeholder="Daily Volume Target (USD)"
                        value={formData.volume_target_daily}
                        onChange={e => setFormData({ ...formData, volume_target_daily: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      />
                    </>
                  )}

                  {/* DEX Fields */}
                  {['jupiter', 'uniswap', 'raydium'].includes(formData.connector) && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Bot Type</label>
                        <select
                          value={formData.bot_type_dex}
                          onChange={e => setFormData({ ...formData, bot_type_dex: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                        >
                          <option value="volume">Volume Generation</option>
                          <option value="spread">Market Making (Spread)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Wallet Address</label>
                        <input
                          type="text"
                          value={formData.wallet_address}
                          onChange={e => setFormData({ ...formData, wallet_address: e.target.value })}
                          placeholder={formData.chain === 'solana' ? 'BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV' : '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'}
                          className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
                          style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Private Key</label>
                        <div className="relative">
                          <input
                            type={showPrivateKey ? "text" : "password"}
                            value={formData.private_key}
                            onChange={e => setFormData({ ...formData, private_key: e.target.value })}
                            placeholder="Base58 encoded private key"
                            className="w-full px-3 py-2 pr-10 rounded-lg text-sm font-mono outline-none"
                            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
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
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>
                          {formData.chain === 'solana' ? 'Base Token Mint' : 'Base Token Address'}
                        </label>
                        <input
                          type="text"
                          value={formData.base_mint}
                          onChange={e => setFormData({ ...formData, base_mint: e.target.value })}
                          placeholder={formData.chain === 'solana' ? 'HZG1RVn4zcRM7zEFEVGYPGoPzPAWAj2AAdvQivfmLYNK' : '0xb36b62929762acf8a9cc27ecebf6d353ebb48244'}
                          className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
                          style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>
                          {formData.chain === 'solana' ? 'Quote Token Mint' : 'Quote Token Address'}
                        </label>
                        {formData.chain === 'solana' ? (
                          <select
                            value={formData.quote_mint}
                            onChange={e => setFormData({ ...formData, quote_mint: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                          >
                            <option value="So11111111111111111111111111111111111111112">SOL</option>
                            <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData.quote_mint}
                            onChange={e => setFormData({ ...formData, quote_mint: e.target.value })}
                            placeholder="0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
                            className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
                            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                          />
                        )}
                      </div>
                      {formData.bot_type_dex === 'volume' && (
                        <>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Daily Volume Target (USD)</label>
                            <input
                              type="number"
                              placeholder="e.g., 3000"
                              value={formData.daily_volume_usd}
                              onChange={e => setFormData({ ...formData, daily_volume_usd: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            />
                            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                              Total trading volume per 24 hours. Bot will trade until this target is reached.
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Min Trade Size (USD)</label>
                              <input
                                type="number"
                                placeholder="e.g., 20"
                                value={formData.min_trade_usd}
                                onChange={e => setFormData({ ...formData, min_trade_usd: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                              />
                              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                                Minimum per trade
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Max Trade Size (USD)</label>
                              <input
                                type="number"
                                placeholder="e.g., 25"
                                value={formData.max_trade_usd}
                                onChange={e => setFormData({ ...formData, max_trade_usd: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                              />
                              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                                Maximum per trade
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Min Interval (minutes)</label>
                              <input
                                type="number"
                                placeholder="e.g., 15"
                                value={formData.interval_min_minutes}
                                onChange={e => setFormData({ ...formData, interval_min_minutes: parseFloat(e.target.value) || 15 })}
                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                              />
                              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                                Min wait between trades
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Max Interval (minutes)</label>
                              <input
                                type="number"
                                placeholder="e.g., 45"
                                value={formData.interval_max_minutes}
                                onChange={e => setFormData({ ...formData, interval_max_minutes: parseFloat(e.target.value) || 45 })}
                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                              />
                              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                                Max wait between trades
                              </p>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg text-xs" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6' }}>
                            ℹ️ <strong>How it works:</strong> Bot randomly sizes each trade between Min and Max, alternating buy/sell. Waits a random time between Min and Max Interval between trades. Continues until Daily Volume Target is reached (spread over 24 hours).
                          </div>
                        </>
                      )}
                      {formData.bot_type_dex === 'spread' && (
                        <>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Spread Target (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 0.3"
                              value={formData.spread_target}
                              onChange={e => setFormData({ ...formData, spread_target: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            />
                            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                              Target spread between bid and ask orders (e.g., 0.3% = $0.30 spread on $100 order)
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Order Size (USD)</label>
                            <input
                              type="number"
                              placeholder="e.g., 500"
                              value={formData.volume_target_daily}
                              onChange={e => setFormData({ ...formData, volume_target_daily: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                            />
                            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                              Size of each limit order placed on both sides (bid and ask)
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAdd}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: theme.accent, color: 'white' }}
                    >
                      Create Bot
                    </button>
                    <button
                      onClick={() => setShowAdd(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: theme.bgSecondary, color: theme.textSecondary }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {pairs.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>No bots configured</div>
              ) : (
                pairs.map(pair => {
                  // Check if this is a DEX bot (has connector instead of exchange)
                  const isDEX = pair.connector && ['jupiter', 'uniswap', 'raydium'].includes(pair.connector);
                  const displayName = isDEX 
                    ? `${pair.name || `${pair.connector} ${pair.bot_type || 'bot'}`}`
                    : `${pair.trading_pair || 'Unknown'} on ${EXCHANGES.find(e => e.id === pair.exchange)?.name || pair.exchange || 'Unknown'}`;
                  const connectorDisplay = isDEX
                    ? `${pair.connector === 'uniswap' ? 'Uniswap' : pair.connector === 'jupiter' ? 'Jupiter' : pair.connector}${pair.chain ? ` (${pair.chain})` : ''}`
                    : EXCHANGES.find(e => e.id === pair.exchange)?.name || pair.exchange || 'Unknown';
                  
                  return (
                  <div key={pair.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                        {displayName}
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-3" style={{ color: theme.textMuted }}>
                        <span>{pair.bot_type || pair.strategy || 'N/A'}</span>
                        <span>•</span>
                        <span>{connectorDisplay}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          pair.status === 'active' ? 'bg-green-100 text-green-700' : 
                          pair.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {pair.status || 'inactive'}
                        </span>
                        {pair.spread_target && <span>• Spread: {pair.spread_target}%</span>}
                        {pair.volume_target_daily && <span>• Volume: ${pair.volume_target_daily.toLocaleString()}/day</span>}
                        {pair.config?.daily_volume_usd && <span>• Target: ${pair.config.daily_volume_usd.toLocaleString()}/day</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(pair)}
                        className="p-2 rounded-lg"
                        style={{ background: pair.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: pair.status === 'active' ? theme.negative : theme.positive }}
                        title={pair.status === 'active' ? 'Pause' : 'Start'}
                      >
                        {pair.status === 'active' ? <Activity size={16} /> : <CheckCircle2 size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(pair.id)}
                        className="p-2 rounded-lg"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: theme.negative }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ========== ADD CLIENT MODAL ==========
export function AddClientModal({ isOpen, onClose, onSave, theme, isDark }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const [exchangeError, setExchangeError] = useState('');
  
  const [clientData, setClientData] = useState({ name: '', wallet_address: '', email: '', company: '', phone: '' });
  const [connectors, setConnectors] = useState([]);
  const [currentConnector, setCurrentConnector] = useState({ exchange: '', apiKey: '', apiSecret: '', memo: '', label: '' });
  const [tokens, setTokens] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setStep(1);
    setClientData({ name: '', wallet_address: '', email: '', company: '', phone: '' });
    setConnectors([]);
    setCurrentConnector({ exchange: '', apiKey: '', apiSecret: '', memo: '', label: '' });
    setTokens('');
    setNotes('');
    setShowSuccess(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const addConnector = () => {
    // Validate required fields
    if (!currentConnector.exchange) {
      setExchangeError('Please select an exchange');
      setTimeout(() => setExchangeError(''), 3000);
      return;
    }
    if (!currentConnector.apiKey) {
      setExchangeError('Please enter an API key');
      setTimeout(() => setExchangeError(''), 3000);
      return;
    }
    if (!currentConnector.apiSecret) {
      setExchangeError('Please enter an API secret');
      setTimeout(() => setExchangeError(''), 3000);
      return;
    }
    
    // Add connector
    const exchangeName = EXCHANGES.find(e => e.id === currentConnector.exchange)?.name || currentConnector.exchange;
      setConnectors([...connectors, { ...currentConnector, id: Date.now() }]);
      setCurrentConnector({ exchange: '', apiKey: '', apiSecret: '', memo: '', label: '' });
    
    // Show success message
    setExchangeSuccess(true);
    setExchangeError('');
    setTimeout(() => setExchangeSuccess(false), 3000);
  };

  const removeConnector = (id) => setConnectors(connectors.filter(c => c.id !== id));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Import API URL from config (handles runtime detection)
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        alert('No authentication token found. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      
      // Validate wallet address format
      // Validate wallet address (EVM or Solana)
      const isEVM = clientData.wallet_address.match(/^0x[a-fA-F0-9]{40}$/);
      const isSolana = clientData.wallet_address.length >= 32 && clientData.wallet_address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(clientData.wallet_address);
      
      if (!clientData.wallet_address || (!isEVM && !isSolana)) {
        alert('Please enter a valid wallet address:\n- EVM: 0x followed by 40 hex characters\n- Solana: 32-44 base58 characters');
        setIsSubmitting(false);
        return;
      }
      
      // Import adminAPI
      const { adminAPI } = await import('../../services/api');
      
      // Determine wallet type for API call
      const walletType = isEVM ? 'evm' : 'solana';
      
      console.log('Creating client with:', {
        name: clientData.name,
        wallet_address: clientData.wallet_address,
        wallet_type: walletType,
        email: clientData.email
      });
      
      // Use adminAPI.createClient() which handles the transformation and calls /clients/create
      const newClient = await adminAPI.createClient({
        name: clientData.name,
        wallet_address: clientData.wallet_address,
        wallet_type: walletType, // 'evm' or 'solana' (will be lowercased by adminAPI if needed)
        account_identifier: `client_${clientData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`
      });
      
      console.log('✅ Client created successfully:', newClient);
      
      // If connectors were added, add them via connectors endpoint
      if (connectors.length > 0 && newClient.id) {
        const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';
        for (const connector of connectors) {
          try {
            // Add connector to client via PUT endpoint
            await fetch(`${TRADING_BRIDGE_URL}/clients/${newClient.id}/connector`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: connector.exchange,
                api_key: connector.apiKey,
                api_secret: connector.apiSecret,
                memo: connector.memo || null
              })
            });
            console.log(`✅ Added connector: ${connector.exchange}`);
          } catch (err) {
            console.error(`Failed to add connector ${connector.exchange}:`, err);
          }
        }
      }
    
      onSave?.(newClient);
      setIsSubmitting(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Client creation error:', error);
      const errorMessage = error?.message || error?.detail || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Failed to create client';
      alert(`Error: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  const selectedExchange = EXCHANGES.find(e => e.id === currentConnector.exchange);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={handleClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl"
           style={{ background: theme.bgPrimary, boxShadow: theme.shadowXl, border: `1px solid ${theme.border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.border }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>
              {showSuccess ? 'Client Added!' : 'Add New Client'}
            </h2>
            {!showSuccess && (
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                Step {step} of 3 — {step === 1 ? 'Client Info' : step === 2 ? 'Exchange Setup' : 'Review & Invite'}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg transition-all" style={{ color: theme.textMuted }}><X size={20} /></button>
        </div>

        {/* Progress */}
        {!showSuccess && (
          <div className="px-6 pt-4">
            <div className="flex gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className="h-1 flex-1 rounded-full transition-all" style={{ background: s <= step ? theme.accent : theme.border }} />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: theme.accentLight, color: theme.accent }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>Client Created!</h3>
              <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
                Client <strong>{clientData.name}</strong> has been created with wallet address:
                <br />
                <strong className="font-mono text-xs">{clientData.wallet_address}</strong>
                <br /><br />
                They can now log in using their wallet.
              </p>
              <button onClick={handleClose} className="px-6 py-2.5 rounded-xl font-medium" style={{ background: theme.accent, color: 'white' }}>Done</button>
            </div>
          ) : (
            <>
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Full Name *</label>
                      <input type="text" value={clientData.name} onChange={e => setClientData({ ...clientData, name: e.target.value })} placeholder="John Smith"
                             className="w-full py-3 px-4 rounded-xl text-sm outline-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
                      Wallet Address (EVM) *
                      <span className="ml-2 text-xs font-normal" style={{ color: theme.textMuted }}>(Client will login with this wallet)</span>
                    </label>
                    <div className="relative">
                      <Wallet size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
                      <input type="text" value={clientData.wallet_address} onChange={e => setClientData({ ...clientData, wallet_address: e.target.value })} placeholder="0x..."
                             className="w-full py-3 pl-11 pr-4 rounded-xl text-sm outline-none font-mono" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: theme.textMuted }}>Enter the client's Ethereum wallet address (MetaMask, Phantom, etc.)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Email Address (Optional)</label>
                      <input type="email" value={clientData.email} onChange={e => setClientData({ ...clientData, email: e.target.value })} placeholder="john@company.com"
                             className="w-full py-3 px-4 rounded-xl text-sm outline-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                      <p className="text-xs mt-1.5" style={{ color: theme.textMuted }}>For notifications only</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Company</label>
                      <input type="text" value={clientData.company} onChange={e => setClientData({ ...clientData, company: e.target.value })} placeholder="Company Inc."
                             className="w-full py-3 px-4 rounded-xl text-sm outline-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                    </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Phone</label>
                      <input type="tel" value={clientData.phone} onChange={e => setClientData({ ...clientData, phone: e.target.value })} placeholder="+1 (555) 000-0000"
                             className="w-full py-3 px-4 rounded-xl text-sm outline-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Assigned Tokens</label>
                    <input type="text" value={tokens} onChange={e => setTokens(e.target.value)} placeholder="SHARP/USDT, BTC/USDT, ETH/USDT"
                           className="w-full py-3 px-4 rounded-xl text-sm outline-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                    <p className="text-xs mt-1.5" style={{ color: theme.textMuted }}>Comma-separated list of trading pairs this client can view</p>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  {connectors.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: theme.textSecondary }}>Configured Exchanges</label>
                      {connectors.map(conn => (
                        <div key={conn.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.accentLight, color: theme.accent }}><Key size={16} /></div>
                            <div>
                              <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>{EXCHANGES.find(e => e.id === conn.exchange)?.name}</div>
                              <div className="text-xs" style={{ color: theme.textMuted }}>{conn.label || `API Key: ${conn.apiKey.slice(0, 8)}...`}</div>
                            </div>
                          </div>
                          <button onClick={() => removeConnector(conn.id)} className="p-2 rounded-lg" style={{ color: theme.negative }}><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 rounded-xl space-y-4" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                    <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>Add Exchange Connection</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Exchange *</label>
                        <select value={currentConnector.exchange} onChange={e => setCurrentConnector({ ...currentConnector, exchange: e.target.value })}
                                className="w-full py-2.5 px-3 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                                style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, color: theme.textPrimary }}>
                          <option value="">Select exchange...</option>
                          {EXCHANGES.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Label</label>
                        <input type="text" value={currentConnector.label} onChange={e => setCurrentConnector({ ...currentConnector, label: e.target.value })} placeholder="Main Account"
                               className="w-full py-2.5 px-3 rounded-lg text-sm outline-none" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>API Key *</label>
                      <input type="text" value={currentConnector.apiKey} onChange={e => setCurrentConnector({ ...currentConnector, apiKey: e.target.value })} placeholder="Enter API key"
                             className="w-full py-2.5 px-3 rounded-lg text-sm outline-none font-mono" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>API Secret *</label>
                      <div className="relative">
                        <input type={showApiSecret ? 'text' : 'password'} value={currentConnector.apiSecret} onChange={e => setCurrentConnector({ ...currentConnector, apiSecret: e.target.value })} placeholder="Enter API secret"
                               className="w-full py-2.5 px-3 pr-10 rounded-lg text-sm outline-none font-mono" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                        <button type="button" onClick={() => setShowApiSecret(!showApiSecret)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }}>
                          {showApiSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    {selectedExchange?.requiresMemo && (
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Memo / Passphrase</label>
                        <input type="text" value={currentConnector.memo} onChange={e => setCurrentConnector({ ...currentConnector, memo: e.target.value })} placeholder="Enter memo"
                               className="w-full py-2.5 px-3 rounded-lg text-sm outline-none font-mono" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                      </div>
                    )}
                    <button onClick={addConnector} disabled={!currentConnector.exchange || !currentConnector.apiKey || !currentConnector.apiSecret}
                            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ background: theme.accent, color: 'white' }}>
                      <Plus size={16} />Add Exchange
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold" style={{ background: theme.accent, color: 'white' }}>
                        {clientData.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: theme.textPrimary }}>{clientData.name}</div>
                        <div className="text-sm font-mono" style={{ color: theme.textMuted }}>{clientData.wallet_address || 'No wallet address'}</div>
                        {clientData.email && <div className="text-xs mt-1" style={{ color: theme.textMuted }}>{clientData.email}</div>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs uppercase font-medium mb-1" style={{ color: theme.textMuted }}>Company</div>
                        <div style={{ color: theme.textPrimary }}>{clientData.company || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase font-medium mb-1" style={{ color: theme.textMuted }}>Exchanges</div>
                        <div style={{ color: theme.textPrimary }}>{connectors.length} configured</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Assigned Tokens</div>
                    <div className="flex flex-wrap gap-2">
                      {tokens ? tokens.split(',').map((token, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: theme.bgSecondary, color: theme.textPrimary, border: `1px solid ${theme.border}` }}>{token.trim()}</span>
                      )) : <span className="text-sm" style={{ color: theme.textMuted }}>No tokens assigned</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Internal Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." rows={3}
                              className="w-full py-3 px-4 rounded-xl text-sm outline-none resize-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: theme.accentLight }}>
                    <div className="flex items-center gap-2 mb-2"><Wallet size={16} style={{ color: theme.accent }} /><span className="text-sm font-medium" style={{ color: theme.accent }}>Wallet Authentication</span></div>
                    <p className="text-xs" style={{ color: theme.textSecondary }}>
                      The client will log in using their wallet address: <strong className="font-mono">{clientData.wallet_address}</strong>
                      <br />
                      They'll connect their wallet and sign a message to authenticate (no password needed).
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!showSuccess && (
          <div className="flex items-center justify-between p-6 border-t" style={{ borderColor: theme.border }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : handleClose()} className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()} disabled={(step === 1 && (!clientData.name || !clientData.wallet_address)) || isSubmitting}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2" style={{ background: theme.accent, color: 'white' }}>
              {isSubmitting ? <><RefreshCw size={16} className="animate-spin" />Sending...</> : step === 3 ? <><Send size={16} />Send Invite</> : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
