import { BalanceButton } from "../components/BalanceButton";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { SpreadOrderButton } from "../components/SpreadOrderButton";
import { VolumeOrderButton } from "../components/VolumeOrderButton";
import { BotList } from "../components/BotList";
import React, { useState, useRef, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  Send, Bot, User, TrendingUp, Wallet, Activity, Users, Plus, BarChart3, 
  Settings, LogOut, ChevronRight, Sparkles, ArrowUpRight, Mail, Lock, 
  Eye, EyeOff, Shield, Moon, Sun, X, Check, ChevronDown, Key, Building,
  Copy, RefreshCw, AlertCircle, CheckCircle2, Trash2, Edit2, Search,
  MoreVertical, ExternalLink, Clock, Filter, Download, UserPlus, ArrowLeft,
  Coins, MessageSquare
} from 'lucide-react';
// All API calls use trading-bridge directly
const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

// ========== THEME CONTEXT ==========
const ThemeContext = createContext();

const themes = {
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgCard: '#ffffff',
    bgCardHover: '#f1f5f9',
    bgInput: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    accent: '#0d9488',
    accentLight: 'rgba(13, 148, 136, 0.1)',
    positive: '#10b981',
    negative: '#ef4444',
    warning: '#f59e0b',
    shadow: '0 1px 3px rgba(0,0,0,0.08)',
    shadowLg: '0 4px 20px rgba(0,0,0,0.08)',
    shadowXl: '0 25px 50px rgba(0,0,0,0.15)',
    logoBg: '#0f172a',
  },
  dark: {
    bgPrimary: '#0a0f1a',
    bgSecondary: '#111827',
    bgCard: 'rgba(255,255,255,0.03)',
    bgCardHover: 'rgba(255,255,255,0.06)',
    bgInput: 'rgba(255,255,255,0.05)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(255,255,255,0.1)',
    accent: '#5eead4',
    accentLight: 'rgba(94, 234, 212, 0.15)',
    positive: '#10b981',
    negative: '#ef4444',
    warning: '#f59e0b',
    shadow: 'none',
    shadowLg: '0 4px 20px rgba(0,0,0,0.3)',
    shadowXl: '0 25px 50px rgba(0,0,0,0.5)',
    logoBg: '#1e293b',
  }
};

// Supported exchanges - All Hummingbot connectors
// Source: https://hummingbot.org/exchanges/
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

// ========== CHAIN BADGE COMPONENT ==========
const ChainBadge = ({ chain }) => (
  <span style={{
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    background: chain === "solana" ? "#9945FF20" : "#627EEA20",
    color: chain === "solana" ? "#9945FF" : "#627EEA",
    display: "inline-flex",
    alignItems: "center",
    gap: 4
  }}>
    {chain === "solana" ? "◎" : "⟠"} {chain?.toUpperCase() || "EVM"}
  </span>
);

// Mock client data
const MOCK_CLIENTS = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john@acmecrypto.com',
    company: 'Acme Crypto',
    phone: '+1 555-0123',
    status: 'active',
    createdAt: '2025-12-15T10:00:00Z',
    lastActive: '2026-01-21T14:30:00Z',
    connectors: [
      { id: 1, exchange: 'bitmart', label: 'Main Account', apiKey: 'd8550cca6914e2b2...' },
      { id: 2, exchange: 'binance', label: 'Trading', apiKey: 'abc123def456...' }
    ],
    tokens: ['SHARP/USDT', 'BTC/USDT', 'ETH/USDT'],
    balance: '$245,000',
    pnl: '+$12,450',
    pnlPercent: '+5.4%'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah@tokenventures.io',
    company: 'Token Ventures',
    phone: '+1 555-0456',
    status: 'active',
    createdAt: '2026-01-05T09:00:00Z',
    lastActive: '2026-01-21T12:15:00Z',
    connectors: [
      { id: 3, exchange: 'kucoin', label: 'Primary', apiKey: 'kc789xyz...' }
    ],
    tokens: ['SHARP/USDT', 'SOL/USDT'],
    balance: '$89,500',
    pnl: '+$3,200',
    pnlPercent: '+3.7%'
  },
  {
    id: 3,
    name: 'Michael Chen',
    email: 'mchen@defifund.co',
    company: 'DeFi Fund',
    phone: '+1 555-0789',
    status: 'invited',
    createdAt: '2026-01-20T16:00:00Z',
    lastActive: null,
    connectors: [
      { id: 4, exchange: 'bitmart', label: 'Trading Account', apiKey: 'bm456abc...' }
    ],
    tokens: ['SHARP/USDT'],
    balance: '$0',
    pnl: '$0',
    pnlPercent: '0%'
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily@blockassets.com',
    company: 'Block Assets',
    phone: '+1 555-0321',
    status: 'inactive',
    createdAt: '2025-11-10T11:00:00Z',
    lastActive: '2025-12-28T09:45:00Z',
    connectors: [],
    tokens: ['BTC/USDT'],
    balance: '$15,000',
    pnl: '-$500',
    pnlPercent: '-3.2%'
  }
];

// ========== CLIENT MANAGEMENT PAGE ==========
function ClientManagement({ onBack, onAddClient, clients, setClients }) {
  const { theme, isDark } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showApiKeysModal, setShowApiKeysModal] = useState(null);
  const [showPairsModal, setShowPairsModal] = useState(null);
  const [showBotsModal, setShowBotsModal] = useState(null);

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

  const handleDelete = (clientId) => {
    setClients(clients.filter(c => c.id !== clientId));
    setShowDeleteConfirm(null);
    setSelectedClient(null);
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
        const { adminAPI } = await import('../services/api');
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
      const { adminAPI } = await import('../services/api');
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
      const { adminAPI } = await import('../services/api');
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
                <div className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                  Contact Info
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Wallet size={14} style={{ color: theme.textMuted }} />
                    <span className="font-mono text-xs" style={{ color: theme.textPrimary }}>
                      {selectedClient.wallet_address || selectedClient.email || 'No wallet'}
                    </span>
                  </div>
                  {selectedClient.email && selectedClient.wallet_address && (
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

              {/* Performance */}
              <div>
                <div className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                  Performance
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: theme.bgSecondary }}>
                    <div className="text-xs" style={{ color: theme.textMuted }}>Balance</div>
                    <div className="text-lg font-semibold" style={{ color: theme.textPrimary }}>{selectedClient.balance}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: theme.bgSecondary }}>
                    <div className="text-xs" style={{ color: theme.textMuted }}>P&L</div>
                    <div className="text-lg font-semibold" style={{ color: selectedClient.pnlPercent.startsWith('+') ? theme.positive : selectedClient.pnlPercent.startsWith('-') ? theme.negative : theme.textPrimary }}>
                      {selectedClient.pnl}
                      <span className="text-xs ml-1">{selectedClient.pnlPercent}</span>
                    </div>
                  </div>
                </div>
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
        const { adminAPI } = await import('../services/api');
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
        const { adminAPI } = await import('../services/api');
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
        const { adminAPI } = await import('../services/api');
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
    </div>
  );
}

// ========== API KEYS MODAL ==========
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
      const { adminAPI } = await import('../services/api');
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
      const { adminAPI } = await import('../services/api');
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
      const { adminAPI } = await import('../services/api');
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
          <h2 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>API Keys - {client.name}</h2>
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
                      {EXCHANGES.map(ex => (
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

// ========== TRADING PAIRS MODAL ==========
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
      const { adminAPI } = await import('../services/api');
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
      const { adminAPI } = await import('../services/api');
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
      const { adminAPI } = await import('../services/api');
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
      const { adminAPI } = await import('../services/api');
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

// ========== SEND ORDER MODAL ==========
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
      const { adminAPI } = await import('../services/api');
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

// ========== BOTS MODAL ==========
function BotsModal({ client, onClose, onUpdate, theme }) {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [clientConnectors, setClientConnectors] = useState(client.connectors || []);
  const [formData, setFormData] = useState({
    exchange: client.connectors?.[0]?.exchange || 'bitmart',
    trading_pair: '',
    bot_type: 'both',
    spread_target: 0.3,
    volume_target_daily: 10000,
  });

  useEffect(() => {
    loadBots();
    loadClientConnectors();
  }, [client]);

  const loadClientConnectors = async () => {
    try {
      const { adminAPI } = await import('../services/api');
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
      const { adminAPI } = await import('../services/api');
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
    if (!formData.trading_pair) {
      alert('Please enter a trading pair');
      return;
    }
    try {
      const { adminAPI } = await import('../services/api');
      await adminAPI.createPair(client.id, {
        exchange: formData.exchange,
        trading_pair: formData.trading_pair.toUpperCase(),
        bot_type: formData.bot_type,
        spread_target: formData.spread_target,
        volume_target_daily: formData.volume_target_daily,
      });
      setFormData({
        exchange: client.connectors?.[0]?.exchange || 'bitmart',
        trading_pair: '',
        bot_type: 'both',
        spread_target: 0.3,
        volume_target_daily: 10000,
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
      const { adminAPI } = await import('../services/api');
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
      const { adminAPI } = await import('../services/api');
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
                  {clientConnectors.length === 0 ? (
                    <div className="text-sm p-3 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      ⚠️ No exchanges configured. Add an API key first.
                    </div>
                  ) : (
                    <>
                      <select
                        value={formData.exchange}
                        onChange={e => setFormData({ ...formData, exchange: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      >
                        {clientConnectors.map(conn => (
                          <option key={conn.id} value={conn.exchange}>
                            {EXCHANGES.find(e => e.id === conn.exchange)?.name || conn.exchange}
                          </option>
                        ))}
                      </select>
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
                      <div className="flex gap-2">
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
                    </>
                  )}
              </div>
            </div>
          )}

            <div className="space-y-2">
              {pairs.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>No bots configured</div>
              ) : (
                pairs.map(pair => (
                  <div key={pair.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                        {pair.trading_pair} on {EXCHANGES.find(e => e.id === pair.exchange)?.name || pair.exchange}
        </div>
                      <div className="text-xs mt-1 flex items-center gap-3" style={{ color: theme.textMuted }}>
                        <span>{pair.bot_type}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          pair.status === 'active' ? 'bg-green-100 text-green-700' : 
                          pair.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {pair.status}
                        </span>
                        {pair.spread_target && <span>• Spread: {pair.spread_target}%</span>}
                        {pair.volume_target_daily && <span>• Volume: ${pair.volume_target_daily.toLocaleString()}/day</span>}
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
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ========== CLIENT DASHBOARD (View for clients) ==========
function ClientDashboard({ user, theme, isDark }) {
  const [balances, setBalances] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades] = useState([]);
  const [volume, setVolume] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'balances', 'trades', 'reports'
  const [reportDays, setReportDays] = useState(30);
  const [clientAccount, setClientAccount] = useState(null);

  // Load real data from API
  useEffect(() => {
    loadClientData();
    // Refresh every 30 seconds
    const interval = setInterval(loadClientData, 30000);
    return () => clearInterval(interval);
  }, [user?.wallet_address]); // Re-load when wallet address changes

  const loadClientData = async () => {
    try {
      setLoadingData(true);
      const { clientAPI } = await import('../services/api');
      
      // Get client account identifier from backend using wallet address
      let accountIdentifier = null;
      if (user?.wallet_address) {
        try {
          const clientInfo = await clientAPI.getClientByWallet(user.wallet_address);
          if (clientInfo?.account_identifier) {
            accountIdentifier = clientInfo.account_identifier;
            setClientAccount(accountIdentifier);
            console.log('✅ Found client account identifier:', accountIdentifier);
          }
        } catch (e) {
          console.error('Failed to get client account identifier:', e);
          // Fallback: try to use wallet address hash if endpoint fails
          const walletHash = user.wallet_address.slice(2, 10).toLowerCase();
          accountIdentifier = `client_${walletHash}`;
          setClientAccount(accountIdentifier);
        }
      }
      
      // Use new optimized dashboard endpoint (one call gets everything)
      if (accountIdentifier) {
        try {
          console.log('📡 Calling dashboard endpoint with account:', accountIdentifier);
          const dashboardData = await clientAPI.getDashboard(accountIdentifier);
          console.log('✅ Dashboard data received:', dashboardData);
          
          // Transform dashboard response to match existing state structure
          setPortfolio({
            total_pnl: dashboardData.pnl?.total || 0,
            active_bots: dashboardData.bots?.active || 0,
            total_bots: dashboardData.bots?.total || 0
          });
          setBalances(dashboardData.balance?.balances || []);
          setTrades(dashboardData.recent_trades || []);
          setVolume({
            total_volume: dashboardData.volume?.traded || 0,
            trade_count: dashboardData.volume?.trade_count || 0
          });
          console.log('✅ State updated - balances:', dashboardData.balance?.balances?.length, 'trades:', dashboardData.recent_trades?.length);
        } catch (error) {
          console.error('❌ Failed to load dashboard data:', error);
          // Fallback to individual calls if dashboard endpoint fails
          const [portfolioData, balancesData, tradesData, volumeData] = await Promise.all([
            clientAPI.getPortfolio(user?.wallet_address).catch(() => null),
            clientAPI.getBalances(user?.wallet_address).catch(() => []),
            clientAPI.getTrades(null, 100, 7, user?.wallet_address).catch(() => []),
            clientAPI.getVolume(7, user?.wallet_address).catch(() => null),
          ]);
          setPortfolio(portfolioData);
          setBalances(balancesData || []);
          setTrades(tradesData || []);
          setVolume(volumeData);
        }
      } else {
        console.warn('⚠️ No account identifier - using individual endpoints');
        // No account identifier yet, use individual calls
        const [portfolioData, balancesData, tradesData, volumeData] = await Promise.all([
          clientAPI.getPortfolio(user?.wallet_address).catch(() => null),
          clientAPI.getBalances(user?.wallet_address).catch(() => []),
          clientAPI.getTrades(null, 100, 7, user?.wallet_address).catch(() => []),
          clientAPI.getVolume(7, user?.wallet_address).catch(() => null),
        ]);
        setPortfolio(portfolioData);
        setBalances(balancesData || []);
        setTrades(tradesData || []);
        setVolume(volumeData);
      }
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleGenerateReport = async (format = 'json', days = 30) => {
    try {
      const { clientAPI } = await import('../services/api');
      if (format === 'csv') {
        await clientAPI.generateReport('csv', days);
        alert('Report downloaded successfully!');
      } else {
        const report = await clientAPI.generateReport(format, days);
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trading_report_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report: ' + (error.message || 'Unknown error'));
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    if (!value && value !== 0) return '0';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Calculate total balance
  const totalBalance = balances.reduce((sum, b) => sum + (b.usd_value || 0), 0);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="max-w-7xl w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: theme.textPrimary }}>Dashboard</h1>
            <p className="text-sm" style={{ color: theme.textMuted }}>Your trading portfolio and performance</p>
          </div>
          <button
            onClick={() => handleGenerateReport('csv', reportDays)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: theme.accent, color: 'white' }}
          >
            <Download size={16} /> Generate Report
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: theme.border }}>
          {['overview', 'balances', 'trades', 'reports'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-sm font-medium border-b-2 transition-all capitalize"
              style={{
                borderColor: activeTab === tab ? theme.accent : 'transparent',
                color: activeTab === tab ? theme.accent : theme.textMuted
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div className="text-center py-12" style={{ color: theme.textMuted }}>
            <Activity size={32} className="mx-auto mb-3 animate-spin" />
            <p>Loading your data...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <div className="text-xs font-semibold uppercase mb-2" style={{ color: theme.textMuted }}>Total Balance</div>
                    <div className="text-2xl font-bold mb-1" style={{ color: theme.textPrimary }}>
                      {formatCurrency(totalBalance)}
                    </div>
                    <div className="text-xs" style={{ color: theme.textMuted }}>{balances.length} exchanges</div>
                  </div>
                  <div className="p-5 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <div className="text-xs font-semibold uppercase mb-2" style={{ color: theme.textMuted }}>P&L (7d)</div>
                    <div className={`text-2xl font-bold mb-1 ${portfolio?.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {portfolio?.total_pnl >= 0 ? '+' : ''}{formatCurrency(portfolio?.total_pnl || 0)}
                    </div>
                    <div className="text-xs" style={{ color: theme.textMuted }}>All pairs</div>
                  </div>
                  <div className="p-5 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <div className="text-xs font-semibold uppercase mb-2" style={{ color: theme.textMuted }}>Volume (7d)</div>
                    <div className="text-2xl font-bold mb-1" style={{ color: theme.textPrimary }}>
                      {formatCurrency(volume?.total_volume || 0)}
                    </div>
                    <div className="text-xs" style={{ color: theme.textMuted }}>{volume?.trade_count || 0} trades</div>
                  </div>
                </div>

                {/* Active Bots */}
                {portfolio && (
                  <div className="p-5 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Active Bots</div>
                      <div className="text-xs" style={{ color: theme.textMuted }}>
                        {portfolio.active_bots} / {portfolio.total_bots}
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: theme.bgSecondary }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${portfolio.total_bots > 0 ? (portfolio.active_bots / portfolio.total_bots) * 100 : 0}%`,
                          background: theme.accent
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Bot List */}
                <div className="p-5 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                  <div className="text-sm font-semibold mb-4" style={{ color: theme.textPrimary }}>My Bots</div>
                  {loadingData && !clientAccount ? (
                    <div className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>
                      Loading account...
                    </div>
                  ) : clientAccount ? (
                    <BotList account={clientAccount} />
                  ) : (
                    <div className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>
                      No account linked. Please contact support.
                    </div>
                  )}
                </div>

                {/* Recent Trades */}
                <div className="p-5 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                  <div className="text-sm font-semibold mb-4" style={{ color: theme.textPrimary }}>Recent Trades</div>
                  {trades.length > 0 ? (
                    <div className="space-y-2">
                      {trades.slice(0, 5).map((trade, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: theme.bgSecondary }}>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${trade.side === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                              <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>{trade.trading_pair}</div>
                              <div className="text-xs" style={{ color: theme.textMuted }}>{formatDate(trade.timestamp)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                              {trade.side.toUpperCase()} {formatNumber(trade.amount, 4)}
                            </div>
                            <div className="text-xs" style={{ color: theme.textMuted }}>
                              @ {formatCurrency(trade.price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>No trades yet</div>
                  )}
                </div>
              </div>
            )}

            {/* Balances Tab */}
            {activeTab === 'balances' && (
              <div className="space-y-4">
                {balances.length > 0 ? (
                  balances.map((balance, i) => (
                    <div key={i} className="p-5 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{balance.exchange}</div>
                        {balance.usd_value && (
                          <div className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                            {formatCurrency(balance.usd_value)}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-xs mb-1" style={{ color: theme.textMuted }}>Asset</div>
                          <div className="font-medium" style={{ color: theme.textPrimary }}>{balance.asset}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-1" style={{ color: theme.textMuted }}>Available</div>
                          <div className="font-medium" style={{ color: theme.textPrimary }}>{formatNumber(balance.free, 8)}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-1" style={{ color: theme.textMuted }}>Total</div>
                          <div className="font-medium" style={{ color: theme.textPrimary }}>{formatNumber(balance.total, 8)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-sm" style={{ color: theme.textMuted }}>
                    <Wallet size={40} className="mx-auto mb-3 opacity-50" />
                    <p>No balances found. Make sure API keys are configured.</p>
                  </div>
                )}
              </div>
            )}

            {/* Trades Tab */}
            {activeTab === 'trades' && (
              <div className="p-5 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <div className="text-sm font-semibold mb-4" style={{ color: theme.textPrimary }}>Trade History</div>
                {trades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: theme.border }}>
                          <th className="text-left py-2" style={{ color: theme.textMuted }}>Time</th>
                          <th className="text-left py-2" style={{ color: theme.textMuted }}>Exchange</th>
                          <th className="text-left py-2" style={{ color: theme.textMuted }}>Pair</th>
                          <th className="text-left py-2" style={{ color: theme.textMuted }}>Side</th>
                          <th className="text-right py-2" style={{ color: theme.textMuted }}>Price</th>
                          <th className="text-right py-2" style={{ color: theme.textMuted }}>Amount</th>
                          <th className="text-right py-2" style={{ color: theme.textMuted }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map((trade, i) => (
                          <tr key={i} className="border-b" style={{ borderColor: theme.border }}>
                            <td className="py-3" style={{ color: theme.textSecondary }}>{formatDate(trade.timestamp)}</td>
                            <td className="py-3" style={{ color: theme.textSecondary }}>{trade.exchange}</td>
                            <td className="py-3 font-medium" style={{ color: theme.textPrimary }}>{trade.trading_pair}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                trade.side === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {trade.side.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 text-right" style={{ color: theme.textPrimary }}>{formatCurrency(trade.price)}</td>
                            <td className="py-3 text-right" style={{ color: theme.textPrimary }}>{formatNumber(trade.amount, 8)}</td>
                            <td className="py-3 text-right font-medium" style={{ color: theme.textPrimary }}>
                              {formatCurrency(trade.price * trade.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-sm" style={{ color: theme.textMuted }}>
                    <Activity size={40} className="mx-auto mb-3 opacity-50" />
                    <p>No trades found</p>
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="p-5 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <div className="text-sm font-semibold mb-4" style={{ color: theme.textPrimary }}>Generate Trading Report</div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: theme.textSecondary }}>Period (days)</label>
                    <select
                      value={reportDays}
                      onChange={e => setReportDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                    >
                      <option value={7}>Last 7 days</option>
                      <option value={30}>Last 30 days</option>
                      <option value={90}>Last 90 days</option>
                      <option value={365}>Last year</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleGenerateReport('json', reportDays)}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: theme.accent, color: 'white' }}
                    >
                      Download JSON
                    </button>
                    <button
                      onClick={() => handleGenerateReport('csv', reportDays)}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: theme.accent, color: 'white' }}
                    >
                      Download CSV
          </button>
        </div>
                  <div className="text-xs p-3 rounded-lg" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                    Reports include: balances, trade history, volume statistics, and P&L data for the selected period.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ========== ADD CLIENT MODAL ==========
function AddClientModal({ isOpen, onClose, onSave }) {
  const { theme, isDark } = useContext(ThemeContext);
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
      const { adminAPI } = await import('../services/api');
      
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

// ========== LOGIN PAGE ==========
function Login({ onLogin }) {
  const { theme, isDark } = useContext(ThemeContext);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletType, setWalletType] = useState(null); // 'evm' or 'solana'

  const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

  const detectWallets = () => {
    const wallets = { evm: null, solana: null };
    
    if (window.ethereum) {
      if (window.ethereum.isMetaMask) wallets.evm = { name: 'MetaMask', provider: window.ethereum };
      else if (window.ethereum.isCoinbaseWallet) wallets.evm = { name: 'Coinbase Wallet', provider: window.ethereum };
      else if (window.ethereum.isTrust) wallets.evm = { name: 'Trust Wallet', provider: window.ethereum };
      else wallets.evm = { name: 'Ethereum Wallet', provider: window.ethereum };
    }
    
    if (window.solana && window.solana.isPhantom) {
      wallets.solana = { name: 'Phantom', provider: window.solana };
    }
    
    return wallets;
  };

  const connectEVM = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    setWalletType('evm');

    try {
      const { BrowserProvider } = await import('ethers');
      const wallets = detectWallets();
      
      if (!wallets.evm) {
        setError('No EVM wallet detected. Please install MetaMask, Coinbase Wallet, or another EVM-compatible wallet.');
        setLoading(false);
        return;
      }

      setStatus(`Connecting to ${wallets.evm.name}...`);
      
      const provider = new BrowserProvider(wallets.evm.provider);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }

      const walletAddress = accounts[0];
      
      setStatus('Getting authentication message...');
      const nonceRes = await fetch(`${TRADING_BRIDGE_URL}/auth/message/${walletAddress}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!nonceRes.ok) {
        const errorText = await nonceRes.text();
        throw new Error(`Failed to get authentication message: ${nonceRes.status} ${errorText}`);
      }

      const nonceData = await nonceRes.json();
      const message = nonceData.message;

      setStatus('Please sign the message in your wallet...');
      const signer = await provider.getSigner();
      let signature;
      try {
        signature = await signer.signMessage(message);
      } catch (signError) {
        if (signError?.code === 'ACTION_REJECTED' || signError?.reason === 'rejected' || signError?.message?.includes('rejected')) {
          setError('Signature cancelled. Please try again and approve the signature in your wallet.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw signError;
      }

      await verifyAndLogin(walletAddress, message, signature);

    } catch (e) {
      setError(e.message || 'Failed to connect EVM wallet');
      setStatus('');
      setLoading(false);
    }
  };

  const connectSolana = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    setWalletType('solana');

    try {
      const wallets = detectWallets();
      
      if (!wallets.solana) {
        setError('No Solana wallet detected. Please install Phantom wallet.');
        setLoading(false);
        return;
      }

      setStatus(`Connecting to ${wallets.solana.name}...`);
      
      let response;
      try {
        response = await window.solana.connect();
      } catch (connectError) {
        if (connectError.code === 4001) {
          setError('Connection cancelled. Please try again and approve the connection in Phantom.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to connect: ${connectError.message}`);
      }

      const walletAddress = response.publicKey.toString();
      
      setStatus('Getting authentication message...');
      const nonceRes = await fetch(`${TRADING_BRIDGE_URL}/auth/message/${walletAddress}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!nonceRes.ok) {
        const errorText = await nonceRes.text();
        throw new Error(`Failed to get authentication message: ${nonceRes.status} ${errorText}`);
      }

      const nonceData = await nonceRes.json();
      const message = nonceData.message;

      setStatus('Please sign the message in your wallet...');
      let signature;
      try {
        // Encode message to Uint8Array for Phantom
        const encodedMessage = new TextEncoder().encode(message);
        console.log('📝 Signing message:', message);
        console.log('📝 Message bytes length:', encodedMessage.length);
        
        // Phantom signMessage API: signMessage(message: Uint8Array, display?: 'utf8' | 'hex')
        const { signature: signatureBytes } = await window.solana.signMessage(encodedMessage, "utf8");
        console.log('✅ Signature (raw bytes):', signatureBytes);
        
        // Import bs58 dynamically
        const bs58 = (await import('bs58')).default;
        signature = bs58.encode(signatureBytes);
        console.log('✅ Signature (base58):', signature);
      } catch (signError) {
        if (signError.code === 4001) {
          setError('Signature cancelled. Please try again and approve the signature in Phantom.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to sign message: ${signError.message}`);
      }

      await verifyAndLogin(walletAddress, message, signature);

    } catch (e) {
      setError(e.message || 'Failed to connect Solana wallet');
      setStatus('');
      setLoading(false);
    }
  };

  const verifyAndLogin = async (walletAddress, message, signature) => {
    setStatus('Verifying signature...');
    
    const verifyPayload = {
      wallet_address: walletAddress,
      message: message,
      signature: signature
    };
    
    console.log('🔐 Verifying signature with payload:', {
      wallet_address: walletAddress,
      message: message,
      signature: signature.substring(0, 20) + '...',
      messageLength: message.length,
      signatureLength: signature.length
    });
    
    const res = await fetch(`${TRADING_BRIDGE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyPayload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      const errorMessage = errorData.detail || 'Login failed';
      
      if (errorMessage.includes('not registered') || errorMessage.includes('Wallet address not registered')) {
        throw new Error(
          `Wallet address not registered.\n\n` +
          `Please contact your admin to create your account with this wallet address:\n` +
          `${walletAddress}\n\n` +
          `Once your wallet is registered, you can log in.`
        );
      }
      
      throw new Error(errorMessage);
    }

    const data = await res.json();

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    const userData = {
      email: data.user?.email,
      wallet_address: data.user?.wallet_address || walletAddress,
      role: data.user?.role || data.role || 'client',
      id: data.user?.id
    };
    
    console.log('Login response:', data);
    console.log('User role:', userData.role);
    
    onLogin(userData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300" 
         style={{ background: isDark ? '#0a0f1a' : 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)', fontFamily: "'Inter', sans-serif" }}>
      {!isDark && <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`, backgroundSize: '48px 48px' }} />}
      {isDark && <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 20% 20%, rgba(94, 234, 212, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(45, 212, 191, 0.08) 0%, transparent 50%)` }} />}
      
      <div className="relative w-full max-w-md p-10 mx-4 rounded-2xl transition-all duration-300"
           style={{ background: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff', border: `1px solid ${theme.border}`, boxShadow: isDark ? '0 25px 50px rgba(0,0,0,0.4)' : '0 25px 50px rgba(0,0,0,0.1)' }}>
        <div className="text-center mb-9">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-white text-2xl" style={{ background: theme.logoBg, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>P</div>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: theme.textPrimary }}>Pipe Labs</h1>
          <p className="text-sm" style={{ color: theme.textMuted }}>AI-Powered Trading Platform</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 p-4 rounded-xl text-sm" 
               style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
            <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{error}</p>
            </div>
        )}

        {/* Status Message */}
        {status && !error && (
          <div className="mb-5 p-3 rounded-xl text-sm text-center" 
               style={{ background: theme.accentLight, color: theme.accent }}>
            {status}
          </div>
        )}

        {/* TWO BUTTONS - EVM AND SOLANA */}
        <div className="flex gap-3 mb-4">
          <button 
            onClick={connectEVM} 
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl text-white font-semibold transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ 
              background: loading && walletType === 'evm' ? '#4b5563' : 'linear-gradient(135deg, #627eea 0%, #764ba2 100%)', 
              boxShadow: loading ? 'none' : '0 4px 16px rgba(98, 126, 234, 0.4)' 
            }}>
            <span>⟠</span>
            <span>{loading && walletType === 'evm' ? 'Connecting...' : 'Connect EVM Wallet'}</span>
          </button>

          <button 
            onClick={connectSolana} 
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl text-white font-semibold transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ 
              background: loading && walletType === 'solana' ? '#4b5563' : 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)', 
              boxShadow: loading ? 'none' : '0 4px 16px rgba(153, 69, 255, 0.4)' 
            }}>
            <span>◎</span>
            <span>{loading && walletType === 'solana' ? 'Connecting...' : 'Connect Solana Wallet'}</span>
          </button>
        </div>

        {/* Supported Wallets Info */}
        <div className="mt-6 text-center">
          <p className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>Supported Wallets:</p>
          <div className="text-xs" style={{ color: theme.textMuted }}>
            <p><strong>EVM:</strong> MetaMask • Coinbase Wallet • Trust Wallet</p>
            <p><strong>Solana:</strong> Phantom</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-xl text-xs" 
             style={{ background: theme.accentLight, border: `1px solid ${theme.border}`, color: theme.textSecondary }}>
          <p className="font-semibold mb-2" style={{ color: theme.accent }}>ℹ️ How it works:</p>
          <p className="mb-1">1. Click "Connect EVM Wallet" or "Connect Solana Wallet"</p>
          <p className="mb-1">2. Approve the connection request</p>
          <p className="mb-1">3. Sign the authentication message (no gas fees)</p>
          <p className="mt-2 font-semibold" style={{ color: theme.accent }}>Note: Your wallet address must be registered by an admin.</p>
        </div>
      </div>
    </div>
  );
}

// ========== METRIC CARD ==========
function MetricCard({ icon, label, value, subvalue, positive, onClick }) {
  const { theme } = useContext(ThemeContext);
  return (
    <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
         style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: theme.accentLight, color: theme.accent }}>{icon}</div>
      <div className="flex-1">
        <div className="text-xs font-medium" style={{ color: theme.textMuted }}>{label}</div>
        <div className="text-base font-semibold flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
          {value}
          {subvalue && <span className="text-xs font-medium" style={{ color: positive ? theme.positive : theme.negative }}>{subvalue}</span>}
        </div>
      </div>
      {onClick && <ChevronRight size={16} style={{ color: theme.textMuted }} />}
    </div>
  );
}

// ========== MESSAGE ==========
function Message({ message, theme, isDark }) {
  return (
    <div className="flex gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
           style={{ background: message.role === 'assistant' ? theme.accentLight : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: message.role === 'assistant' ? theme.accent : 'white' }}>
        {message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
      </div>
      <div className="flex-1 p-4 rounded-2xl text-sm leading-relaxed"
           style={{ background: message.role === 'assistant' ? theme.bgCard : (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'), border: `1px solid ${message.role === 'assistant' ? theme.border : 'rgba(99, 102, 241, 0.2)'}`, color: theme.textSecondary }}>
        {message.content}
        {message.data?.type === 'price' && (
          <div className="mt-3 p-4 rounded-xl" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold" style={{ color: theme.textPrimary }}>{message.data.pair}</span>
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: theme.positive }}><ArrowUpRight size={14} />{message.data.change}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: theme.textPrimary }}>{message.data.price}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== BOT MANAGEMENT VIEW ==========
function BotManagementView({ theme, isDark, onBack, activeChain = "all", setActiveChain }) {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [newBot, setNewBot] = useState({
    name: '',
    account: '',
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
  const isSolana = useMemo(() => ['jupiter', 'raydium'].includes(newBot.connector), [newBot.connector]);

  const fetchBots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Check if user is logged in
      const userStr = localStorage.getItem('user') || localStorage.getItem('pipelabs_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const walletAddress = user?.wallet_address;
      const userRole = user?.role;
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
      
      const { tradingBridge } = await import('../services/api');
      
      // Try admin endpoint first if admin, fallback to regular endpoint
      let data;
      if (userRole === 'admin') {
        try {
          // Try admin-specific endpoint if it exists
          const { adminAPI } = await import('../services/api');
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
        if (userRole === 'admin') {
          setError('Backend authentication error. Admin should be able to view all bots. Please check backend logs.');
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
      const { tradingBridge } = await import('../services/api');
      await tradingBridge.startBot(botId);
      fetchBots(); // Refresh list
    } catch (err) {
      console.error('Failed to start bot:', err);
      alert(`Failed to start bot: ${err.message}`);
    }
  };

  const handleStopBot = async (botId) => {
    try {
      const { tradingBridge } = await import('../services/api');
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
      const { tradingBridge } = await import('../services/api');
      
      // Recompute helpers at submit time (not render time)
      const isDEXConnector = ['jupiter', 'raydium', 'uniswap'].includes(newBot.connector);
      
      // Validate DEX fields if DEX connector
      if (isDEXConnector) {
        // Validate required DEX fields
        if (!newBot.wallet_address || !newBot.private_key || !newBot.base_mint) {
          alert('Please fill in all required DEX fields: wallet address, private key, and base token.');
          return;
        }
        
        // Validate Solana wallet address format
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(newBot.wallet_address)) {
          alert('Invalid Solana wallet address. Must be 32-44 base58 characters.');
          return;
        }
        
        // Validate token mint format
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(newBot.base_mint)) {
          alert('Invalid base token mint address. Must be 32-44 base58 characters.');
          return;
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
        payload = {
          name: newBot.name,
          account: accountToUse,
          bot_type: newBot.bot_type, // 'volume' or 'spread'
          connector: newBot.connector, // Include connector for consistency
          config: newBot.bot_type === 'volume' ? {
            base_mint: newBot.base_mint,
            quote_mint: newBot.quote_mint,
            daily_volume_usd: parseFloat(newBot.daily_volume_usd),
            min_trade_usd: parseFloat(newBot.min_trade_usd),
            max_trade_usd: parseFloat(newBot.max_trade_usd),
            interval_min_seconds: parseFloat(newBot.interval_min_minutes) * 60,
            interval_max_seconds: parseFloat(newBot.interval_max_minutes) * 60,
            slippage_bps: parseFloat(newBot.slippage_pct) * 100
          } : {
            base_mint: newBot.base_mint,
            quote_mint: newBot.quote_mint,
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
        const { adminAPI } = await import('../services/api');
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
                  <optgroup label="DEX (Solana)">
                    <option value="jupiter">Jupiter</option>
                    <option value="raydium" disabled>Raydium (Coming Soon)</option>
                  </optgroup>
                  <optgroup label="DEX (EVM)">
                    <option value="uniswap" disabled>Uniswap (Coming Soon)</option>
                  </optgroup>
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
                          placeholder="BrLyvX5p7HYXsc94AQXXNUfe7zbCYriDfUT1p3DafuCV"
                          required
                        />
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
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Base Token (Your Token)</label>
                        <input
                          type="text"
                          value={newBot.base_mint}
                          onChange={(e) => setNewBot({...newBot, base_mint: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                          style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                          placeholder="HZG1RVn4zcRM7zEFEVGYPGoPzPAWAj2AAdvQivfmLYNK"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>Quote Token</label>
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
        <div className="space-y-4">
          {bots
            .filter(bot => {
              // Determine chain from connector/exchange
              const chain = bot.connector === 'jupiter' || bot.exchange === 'jupiter' ? 'solana' : 'evm';
              return activeChain === "all" || chain === activeChain;
            })
            .map(bot => {
              // Determine chain for badge
              const botChain = bot.chain || (bot.connector === 'jupiter' || bot.exchange === 'jupiter' ? 'solana' : 'evm');
              return (
            <div key={bot.id} className="p-4 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold" style={{ color: theme.textPrimary }}>{bot.name || bot.id}</h3>
                    <ChainBadge chain={botChain} />
                  </div>
                  <p className="text-sm" style={{ color: theme.textMuted }}>
                    {bot.strategy} • {bot.connector} • {bot.pair}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    bot.status === 'running' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                  }`}>
                    {bot.status || 'stopped'}
                  </span>
                  {bot.status === 'running' ? (
                    <button onClick={() => handleStopBot(bot.id)} className="px-3 py-1 rounded text-sm"
                            style={{ background: theme.negative, color: 'white' }}>
                      Stop
                    </button>
                  ) : (
                    <button onClick={() => handleStartBot(bot.id)} className="px-3 py-1 rounded text-sm"
                            style={{ background: theme.positive, color: 'white' }}>
                      Start
                    </button>
                  )}
                </div>
              </div>
            </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ========== ADMIN DASHBOARD ==========
function AdminDashboard({ user, onLogout, theme, isDark, toggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Welcome back. I can help you manage clients, monitor bots, and analyze performance across your platform." }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showClientManagement, setShowClientManagement] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [bots, setBots] = useState([]);
  const messagesEndRef = useRef(null);
  
  // Wallet connection state
  const [evmWallet, setEvmWallet] = useState(null);
  const [solanaWallet, setSolanaWallet] = useState(null);
  const [activeChain, setActiveChain] = useState("all"); // "all" | "evm" | "solana"
  
  // Check if we're on /bots or /admin/bots route (HashRouter uses pathname)
  const isBotManagement = location.pathname === '/bots' || location.pathname === '/admin/bots';
  
  // Sync client management view with route
  useEffect(() => {
    if (location.pathname === '/admin/clients') {
      setShowClientManagement(true);
    } else if (location.pathname === '/' || location.pathname === '/admin') {
      setShowClientManagement(false);
    }
  }, [location.pathname]);
  
  // Debug: log location changes
  useEffect(() => {
    console.log('Location changed:', { pathname: location.pathname, hash: location.hash, isBotManagement });
  }, [location.pathname, location.hash, isBotManagement]);
  
  // Load clients from API
  useEffect(() => {
    const loadClients = async () => {
      try {
        setClientsLoading(true);
        console.log('🔄 Loading clients...');
        const { adminAPI } = await import('../services/api');
        console.log('📡 Calling adminAPI.getClients()...');
        const data = await adminAPI.getClients();
        console.log('📦 Raw API response:', data);
        console.log('📊 Response type:', typeof data, 'Is array?', Array.isArray(data), 'Length:', data?.length);
        
        // Transform API response to match expected format
        const transformedClients = (data || []).map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          wallet_address: client.wallet_address,
          wallet_type: client.wallet_type || 'EVM',
          account_identifier: client.account_identifier || `client_${client.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
          company: client.settings?.contactPerson || '',
          phone: client.settings?.telegramId || '',
          status: client.status || 'active',
          createdAt: client.created_at,
          connectors: client.connectors || client.exchanges || [], // Use connectors/exchanges from API
          tokens: client.tokens || (client.tradingPair ? [client.tradingPair] : []), // Use tokens from API
          pairs: client.pairs || [], // Trading pairs/bots
          balance: '$0',
          pnl: '$0',
          pnlPercent: '0%'
        }));
        
        setClients(transformedClients);
        console.log('✅ Loaded clients from API:', transformedClients.length, transformedClients);
      } catch (error) {
        console.error('❌ Failed to load clients:', error);
        console.error('Error details:', error.message, error.stack);
        console.error('Full error object:', error);
        
        // Silently fail - show empty state without alert popup
        // Error is logged to console for debugging
        setClients([]);
      } finally {
        setClientsLoading(false);
      }
    };
    
    loadClients();
  }, []);

  // Load bots from API for metrics
  useEffect(() => {
    const loadBots = async () => {
      try {
        const { tradingBridge } = await import('../services/api');
        const data = await tradingBridge.getBots();
        const botsList = Array.isArray(data) ? data : (data.bots || []);
        setBots(botsList);
      } catch (error) {
        console.error('Failed to load bots for metrics:', error);
        setBots([]);
      }
    };
    
    loadBots();
  }, []);

  // Wallet connection handlers
  const connectEVMWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setEvmWallet(accounts[0]);
      localStorage.setItem('evm_wallet', accounts[0]);
    } catch (error) {
      console.error('EVM connection error:', error);
      if (error.code !== 4001) { // Don't alert on user rejection
        alert('Failed to connect wallet');
      }
    }
  };

  const connectSolanaWallet = async () => {
    // Check for Phantom wallet
    if (window.solana && window.solana.isPhantom) {
      try {
        const resp = await window.solana.connect();
        const address = resp.publicKey.toString();
        setSolanaWallet(address);
        localStorage.setItem('solana_wallet', address);
      } catch (error) {
        // User rejected connection
        if (error.code === 4001) {
          console.log('User rejected Phantom connection');
        } else {
          console.error('Solana connection error:', error);
          alert('Failed to connect Phantom wallet');
        }
      }
    } else {
      // Open Phantom install page
      const install = window.confirm('Phantom wallet not found. Open Phantom website to install?');
      if (install) {
        window.open('https://phantom.app/', '_blank');
      }
    }
  };

  // Load wallets on mount
  useEffect(() => {
    const savedEvm = localStorage.getItem('evm_wallet');
    const savedSolana = localStorage.getItem('solana_wallet');
    if (savedEvm) setEvmWallet(savedEvm);
    if (savedSolana) setSolanaWallet(savedSolana);
  }, []);

  const metrics = { clients: clients.length, volume: '$2.4M', pnl: '+$45,230', pnlPct: '+12.5%', bots: bots?.filter(b => b.status === 'running').length || 0 };
  const quickPrompts = ["Show all client balances", "Global P&L this week", "List active bots", "SHARP/USDT price"];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const userInput = input;
    setInput('');
    setIsLoading(true);
    
    try {
      // Call trading-bridge chat API
      const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';
      const token = localStorage.getItem('access_token') || 
                    localStorage.getItem('pipelabs_token') || 
                    localStorage.getItem('auth_token');
      
      const response = await fetch(`${TRADING_BRIDGE_URL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: userInput,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(errorData.detail || `Chat API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle response from Claude MCP via backend
      // Response format: { response: string, actions_taken: array }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'No response received',
        data: data.actions_taken ? { type: 'agent_response', actions: data.actions_taken } : null
      }]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback: If chat API doesn't exist, use direct API calls
      const lowerInput = userInput.toLowerCase();
      const isBalanceQuery = lowerInput.includes('balance') || 
                            lowerInput.includes('how much') || 
                            lowerInput.includes('what is the balance');
      
      if (isBalanceQuery && error.message.includes('404') || error.message.includes('Chat API')) {
        // Fallback to direct balance fetch
        try {
          const { getBalance } = await import('../lib/trading');
          const account = lowerInput.includes('client_sharp_2') ? 'client_sharp_2' : 'client_sharp';
          const balanceData = await getBalance(account);
          const bitmartBalances = balanceData.balances?.bitmart || {};
          
          if (Object.keys(bitmartBalances).length > 0) {
            let balanceText = `**${account} Balance (BitMart):**\n\n`;
            if (bitmartBalances.SHARP) {
              const sharp = bitmartBalances.SHARP;
              balanceText += `**SHARP:** ${(sharp.total || 0).toFixed(8)} (${(sharp.free || 0).toFixed(8)} free)\n`;
            }
            if (bitmartBalances.USDT) {
              const usdt = bitmartBalances.USDT;
              balanceText += `**USDT:** $${(usdt.total || 0).toFixed(2)} ($${(usdt.free || 0).toFixed(2)} free)\n`;
            }
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: balanceText,
              data: { type: 'balance', account, balances: balanceData }
            }]);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
        }
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure the chat API endpoint is configured.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (newClient) => {
    // Reload clients from API after adding
    try {
      const { adminAPI } = await import('../services/api');
      const data = await adminAPI.getClients();
      
      // Transform API response
      const transformedClients = (data || []).map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        wallet_address: client.wallet_address,
        wallet_type: client.wallet_type || 'EVM',
        company: client.settings?.contactPerson || '',
        phone: client.settings?.telegramId || '',
        status: client.status || 'active',
        createdAt: client.created_at,
        connectors: [],
        tokens: client.settings?.tradingPair ? [client.settings.tradingPair] : [],
        balance: '$0',
        pnl: '$0',
        pnlPercent: '0%'
      }));
      
      setClients(transformedClients);
    } catch (error) {
      console.error('Failed to reload clients:', error);
      // Add new client to existing list as fallback
      setClients([...clients, newClient]);
    }
  };

  // Render sidebar component (reusable)
  const renderSidebar = (activeView) => (
    <aside className="w-64 flex flex-col p-5" style={{ background: theme.bgPrimary, borderRight: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: theme.logoBg }}>P</div>
          <span className="font-bold text-sm" style={{ color: theme.textPrimary }}>Pipe Labs</span>
        </div>
        <span className="text-xs font-semibold uppercase px-2 py-1 rounded" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>Admin</span>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.1em' }}>Overview</h3>
        <MetricCard icon={<Users size={16} />} label="Clients" value={metrics.clients} onClick={() => navigate('/admin/clients')} />
        <MetricCard icon={<BarChart3 size={16} />} label="Volume (7d)" value={metrics.volume} />
        <MetricCard icon={<TrendingUp size={16} />} label="P&L (7d)" value={metrics.pnl} subvalue={metrics.pnlPct} positive />
        <MetricCard icon={<Activity size={16} />} label="Active Bots" value={metrics.bots} onClick={() => navigate('/admin/bots')} />
      </div>

      <div className="flex-1">
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.1em' }}>{activeView === 'chat' ? 'Quick Actions' : 'Navigation'}</h3>
        {activeView === 'chat' && (
          <>
            <SpreadOrderButton token="SHARP" />
            <VolumeOrderButton token="SHARP" />
            <BalanceButton account="client_sharp" />
            <button onClick={() => setShowAddClient(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-2"
                    style={{ background: theme.accent, color: 'white' }}><Plus size={16} />Add Client</button>
            <button onClick={() => navigate('/admin/clients')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                    style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}><Users size={16} />Manage Clients</button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm"
                    style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}><BarChart3 size={16} />View Reports</button>
          </>
        )}
        {activeView !== 'chat' && (
          <>
            <NavLink to="/" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                    style={({ isActive }) => ({ background: isActive ? theme.accentLight : 'transparent', color: isActive ? theme.accent : theme.textSecondary, border: `1px solid ${theme.border}`, textDecoration: 'none' })}>
              <MessageSquare size={16} />AI Assistant
            </NavLink>
            <NavLink to="/admin/clients" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                    style={({ isActive }) => ({ background: isActive ? theme.accentLight : 'transparent', color: isActive ? theme.accent : theme.textSecondary, border: `1px solid ${theme.border}`, textDecoration: 'none' })}>
              <Users size={16} />Clients
            </NavLink>
            <NavLink to="/admin/bots" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                    style={({ isActive }) => ({ background: isActive ? theme.accentLight : 'transparent', color: isActive ? theme.accent : theme.textSecondary, border: `1px solid ${theme.border}`, textDecoration: 'none' })}>
              <Activity size={16} />Bots
            </NavLink>
          </>
        )}
      </div>

      <div className="pt-4 space-y-3" style={{ borderTop: `1px solid ${theme.border}` }}>
        <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm"
                style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
          <span className="flex items-center gap-2.5">{isDark ? <Moon size={16} /> : <Sun size={16} />}{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          <div className="w-9 h-5 rounded-full relative" style={{ background: isDark ? theme.accent : '#cbd5e1' }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" style={{ left: isDark ? '18px' : '2px' }} />
          </div>
        </button>
        
        {/* Wallet Connections */}
        <div className="mb-4 space-y-2">
          {/* EVM Wallet */}
          <div 
            onClick={connectEVMWallet}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              padding: "6px 12px", 
              background: evmWallet ? "#627EEA15" : theme.bgInput, 
              borderRadius: 8, 
              cursor: "pointer",
              border: evmWallet ? "1px solid #627EEA40" : `1px solid ${theme.border}`
            }}
          >
            <span>⟠</span>
            {evmWallet ? (
              <div className="flex-1">
                <div style={{ fontSize: 11, color: theme.textMuted }}>EVM</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#627EEA" }}>{evmWallet.slice(0,6)}...{evmWallet.slice(-4)}</div>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: theme.textMuted }}>Connect EVM</span>
            )}
          </div>

          {/* Solana Wallet */}
          <div 
            onClick={connectSolanaWallet}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              padding: "6px 12px", 
              background: solanaWallet ? "#9945FF15" : theme.bgInput, 
              borderRadius: 8, 
              cursor: "pointer",
              border: solanaWallet ? "1px solid #9945FF40" : `1px solid ${theme.border}`
            }}
          >
            <span>◎</span>
            {solanaWallet ? (
              <div className="flex-1">
                <div style={{ fontSize: 11, color: theme.textMuted }}>Solana</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#9945FF" }}>{solanaWallet.slice(0,4)}...{solanaWallet.slice(-4)}</div>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: theme.textMuted }}>Connect Solana</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: '#d97706' }}>A</div>
            <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>Admin User</span>
              <span className="text-xs" style={{ color: theme.textMuted }}>{user.email}</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );

  if (showClientManagement) {
    return (
      <div className="flex min-h-screen" style={{ background: theme.bgSecondary, fontFamily: "'Inter', sans-serif" }}>
        <AddClientModal isOpen={showAddClient} onClose={() => setShowAddClient(false)} onSave={handleAddClient} />
        {renderSidebar('clients')}
        <ClientManagement onBack={() => navigate('/')} onAddClient={() => setShowAddClient(true)} clients={clients} setClients={setClients} />
      </div>
    );
  }

  if (isBotManagement) {
    return (
      <div className="flex min-h-screen" style={{ background: theme.bgSecondary, fontFamily: "'Inter', sans-serif" }}>
        {renderSidebar('bots')}
        <main className="flex-1 p-6">
          <BotManagementView theme={theme} isDark={isDark} onBack={() => navigate('/')} activeChain={activeChain} setActiveChain={setActiveChain} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: theme.bgSecondary, fontFamily: "'Inter', sans-serif" }}>
      <AddClientModal isOpen={showAddClient} onClose={() => setShowAddClient(false)} onSave={handleAddClient} />
      {renderSidebar('chat')}

      <main className="flex-1 flex flex-col p-6">
        <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
          <div className="flex items-center gap-2.5 mb-6">
            <Sparkles size={20} style={{ color: theme.accent }} />
            <span className="text-lg font-semibold" style={{ color: theme.textPrimary }}>AI Trading Assistant</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 mb-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {messages.map((msg, i) => <Message key={i} message={msg} theme={theme} isDark={isDark} />)}
            {isLoading && (
              <div className="flex gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.accentLight, color: theme.accent }}><Bot size={18} /></div>
                <div className="p-4 rounded-2xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: theme.textMuted }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: theme.textMuted, animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: theme.textMuted, animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {quickPrompts.map((prompt, i) => (
              <button key={i} onClick={() => setInput(prompt)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium"
                      style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textSecondary }}>{prompt}<ChevronRight size={14} /></button>
            ))}
          </div>

          <div className="flex gap-3 p-4 rounded-2xl" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, boxShadow: theme.shadowLg }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()}
                   placeholder="Ask about balances, prices, P&L, or bots..." className="flex-1 bg-transparent text-sm outline-none" style={{ color: theme.textPrimary }} />
            <button onClick={handleSend} disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                    style={{ background: theme.accent, color: 'white' }}><Send size={18} /></button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-bounce { animation: bounce 1.4s infinite ease-in-out; }
        .animate-spin { animation: spin 1s linear infinite; }
        input::placeholder, textarea::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}

// ========== SIDEBAR (Client) ==========
function ClientSidebar({ user, theme, isDark, toggleTheme, onLogout }) {
  return (
    <aside className="w-64 flex flex-col p-5" style={{ background: theme.bgPrimary, borderRight: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: theme.logoBg }}>P</div>
          <span className="font-bold text-sm" style={{ color: theme.textPrimary }}>Pipe Labs</span>
        </div>
        <span className="text-xs font-semibold uppercase px-2 py-1 rounded" style={{ background: theme.accentLight, color: theme.accent }}>Client</span>
      </div>


      <div className="pt-4 space-y-3" style={{ borderTop: `1px solid ${theme.border}` }}>
        <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm"
                style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
          <span className="flex items-center gap-2.5">{isDark ? <Moon size={16} /> : <Sun size={16} />}{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          <div className="w-9 h-5 rounded-full relative" style={{ background: isDark ? theme.accent : '#cbd5e1' }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" style={{ left: isDark ? '18px' : '2px' }} />
          </div>
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: theme.accent }}>C</div>
            <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>Client User</span>
              <span className="text-xs" style={{ color: theme.textMuted }}>{user.email}</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}

// ========== APP ==========
export default function App() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? themes.dark : themes.light;
  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {!user ? (
        <Login onLogin={setUser} />
      ) : user.role === 'admin' ? (
        <AdminDashboard user={user} onLogout={() => setUser(null)} theme={theme} isDark={isDark} toggleTheme={toggleTheme} />
      ) : (
        <div className="flex min-h-screen" style={{ background: theme.bgSecondary, fontFamily: "'Inter', sans-serif" }}>
          <ClientSidebar user={user} theme={theme} isDark={isDark} toggleTheme={toggleTheme} onLogout={() => setUser(null)} />
          <ClientDashboard user={user} theme={theme} isDark={isDark} />
        </div>
      )}
    </ThemeContext.Provider>
  );
}
